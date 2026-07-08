"""Runtime supervisor — the tick loop.

Holds ONLY the behaviours that can't be known in advance:
  * the EVAC gate (checked at fire time, every time)
  * skip-next (consumes a planned event)
  * manual ring (injected immediately)
  * music-path health / fallback (hook left for the AVIO path)

Everything clever already happened in the compiler. This loop just asks, each
second: "is anything due now, and may it ring?"

A config change or date rollover triggers recompile via reload_plan(); the seam
between compiler and loop is an event, not a gap, so mid-day edits behave
correctly.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import date, datetime
from zoneinfo import ZoneInfo

from bellcommander.config.schema import SiteConfig
from bellcommander.engine.compiler import DayPlan, PlannedBell, compile_day

log = logging.getLogger("bc.engine")


class Supervisor:
    def __init__(self, cfg: SiteConfig, driver, *, telemetry=None):
        self.cfg = cfg
        self.driver = driver
        self.telemetry = telemetry
        self.tz = ZoneInfo(cfg.timezone)

        self._plan: DayPlan | None = None
        self._fired: set[str] = set()
        self._skip: set[str] = set()
        self._silence_today = False
        self._forced_template: str | None = None
        self._evac = False
        self._running = False

    # ---- plan management ----

    def reload_plan(self, day: date | None = None) -> DayPlan:
        """Recompile the plan. Called at startup, on date rollover, and on any
        config/override change."""
        day = day or self._today()
        self._plan = compile_day(
            self.cfg,
            day,
            template_id=self._forced_template,
            skip_keys=frozenset(self._skip),
            silence_day=self._silence_today,
        )
        log.info(
            "plan compiled for %s: %s (%d bells)",
            day, self._plan.reason, len(self._plan.bells),
        )
        return self._plan

    @property
    def plan(self) -> DayPlan | None:
        return self._plan

    def next_bell(self, now: datetime | None = None) -> PlannedBell | None:
        now = now or self._now()
        if not self._plan:
            return None
        for b in self._plan.bells:
            if b.when > now and b.event_key not in self._fired:
                return b
        return None

    # ---- operator actions ----

    def skip_next(self) -> PlannedBell | None:
        nxt = self.next_bell()
        if nxt:
            self._skip.add(nxt.event_key)
            self.reload_plan()
            log.info("skip: %s", nxt.event_key)
            self._emit("skip", nxt.label, nxt.group_id, nxt.sound_id)
        return nxt

    def silence_today(self, value: bool = True) -> None:
        self._silence_today = value
        self.reload_plan()

    def force_template(self, template_id: str | None) -> None:
        self._forced_template = template_id
        self.reload_plan()

    async def manual_ring(self, sound_id: str, group_id: str) -> bool:
        """Ring immediately. Blocked while EVAC is active."""
        if self._evac:
            log.warning("manual ring blocked — EVAC active")
            return False
        await self._ring(sound_id, group_id, label="Manual ring")
        return True

    async def set_evac(self, active: bool) -> None:
        self._evac = active
        await self.driver.evac_suppress(active)
        self._emit("evac", "EVAC suppress " + ("ON" if active else "OFF"), "", "")
        log.warning("EVAC %s", "ON" if active else "OFF")

    @property
    def evac_active(self) -> bool:
        return self._evac

    # ---- the tick ----

    async def run(self) -> None:
        self._running = True
        self.reload_plan()
        current_day = self._today()
        log.info("supervisor started")
        while self._running:
            now = self._now()

            # date rollover -> fresh plan, reset one-day state
            if now.date() != current_day:
                current_day = now.date()
                self._fired.clear()
                self._skip.clear()
                self._silence_today = False
                self._forced_template = None
                self.reload_plan(current_day)

            await self._tick(now)
            await asyncio.sleep(1)

    async def _tick(self, now: datetime) -> None:
        if not self._plan:
            return
        for b in self._plan.bells:
            if b.event_key in self._fired:
                continue
            # fire within the second the bell is due
            if b.when <= now < _plus_1s(b.when):
                self._fired.add(b.event_key)
                if self._evac:
                    log.info("held (EVAC): %s", b.label)
                    self._emit("evac", b.label, b.group_id, b.sound_id)
                else:
                    await self._ring(b.sound_id, b.group_id, label=b.label)

    async def _ring(self, sound_id: str, group_id: str, *, label: str) -> None:
        sound = self.cfg.sound(sound_id)
        group = self.cfg.group(group_id)
        ahm_zones = [self.cfg.zone(zid).ahm_zone for zid in group.zone_ids]
        try:
            await self.driver.trigger_bell(sound.ahm_track, ahm_zones)
            log.info("RUNG %s -> %s (%s)", label, group.name, sound.name)
            self._emit("fire", label, group_id, sound_id)
        except Exception as e:  # noqa: BLE001
            log.error("bell FAILED %s -> %s: %s", label, group.name, e)
            self._emit("miss", label, group_id, sound_id, error=str(e))

    def _emit(self, kind, label, group_id, sound_id, **extra) -> None:
        if self.telemetry:
            self.telemetry.event(
                kind=kind, label=label, group_id=group_id, sound_id=sound_id, **extra
            )

    def stop(self) -> None:
        self._running = False

    # ---- time helpers (overridable in tests) ----
    def _now(self) -> datetime:
        return datetime.now(self.tz)

    def _today(self) -> date:
        return self._now().date()


def _plus_1s(dt: datetime) -> datetime:
    from datetime import timedelta
    return dt + timedelta(seconds=1)
