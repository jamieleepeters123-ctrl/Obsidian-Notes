"""Plan compiler — the intelligence of the scheduler.

Given a date and the site config, produce a flat, ordered list of PlannedBell
actions with absolute datetimes. All calendar gating, template selection, DST
resolution, and override application happens HERE, once — not in the live loop.

This is the piece that is exhaustively unit-tested: feed it every date and
every override combination and assert exactly what rings. "Did we break bells?"
is a CI question because of this separation.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

from bellcommander.config.schema import SiteConfig


@dataclass(frozen=True)
class PlannedBell:
    when: datetime          # absolute, tz-aware — DST already resolved
    sound_id: str
    group_id: str
    label: str
    event_key: str          # stable id for skip/dedup: f"{date}:{time}:{label}"


@dataclass(frozen=True)
class DayPlan:
    day: date
    template_id: str | None       # None = no bells today
    reason: str                   # why this plan (term/holiday/no-bell/weekend)
    bells: tuple[PlannedBell, ...]

    @property
    def rings(self) -> bool:
        return self.template_id is not None


def classify_day(cfg: SiteConfig, day: date) -> tuple[bool, str]:
    """Gating order: no-bell date -> weekend -> term calendar.

    Returns (should_ring, reason). This mirrors exactly what the calendar UI
    shows, so preview == reality.
    """
    iso = day.isoformat()

    # 1. explicit no-bell dates (dev days, public holidays) win over everything
    if iso in cfg.calendar.no_bell_dates:
        return False, cfg.calendar.no_bell_dates[iso]

    # 2. weekends
    if day.weekday() >= 5:  # 5=Sat, 6=Sun
        return False, "Weekend"

    # 3. inside a term?
    for start, end in cfg.calendar.terms:
        if start <= iso <= end:
            return True, f"Term day ({start}..{end})"

    return False, "School holidays"


def compile_day(
    cfg: SiteConfig,
    day: date,
    *,
    template_id: str | None = None,
    skip_keys: frozenset[str] = frozenset(),
    silence_day: bool = False,
) -> DayPlan:
    """Compile one day's plan.

    Overrides:
      - template_id : force a specific day template (Sports Day, Wet Weather)
      - skip_keys   : event_keys marked "skip next" by staff
      - silence_day : one-off "no bells today"
    """
    tz = ZoneInfo(cfg.timezone)

    if silence_day:
        return DayPlan(day, None, "Silenced by staff", ())

    should_ring, reason = classify_day(cfg, day)
    if not should_ring:
        return DayPlan(day, None, reason, ())

    tid = template_id or cfg.default_template_id
    template = cfg.template(tid)

    bells: list[PlannedBell] = []
    for ev in template.events:
        key = f"{day.isoformat()}:{ev.at.strftime('%H:%M')}:{ev.label}"
        if key in skip_keys:
            continue
        # DST resolved here: naive wall-clock -> tz-aware absolute
        when = datetime.combine(day, ev.at, tzinfo=tz)
        bells.append(
            PlannedBell(
                when=when,
                sound_id=ev.sound_id,
                group_id=ev.group_id,
                label=ev.label,
                event_key=key,
            )
        )

    bells.sort(key=lambda b: b.when)
    return DayPlan(day, tid, reason, tuple(bells))
