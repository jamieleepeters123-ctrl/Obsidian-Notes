"""Supervisor tests — runtime behaviour via FakeAHM with injected time."""
import json
from datetime import date, datetime
from zoneinfo import ZoneInfo

import pytest

from bellcommander.config.schema import load
from bellcommander.drivers.fake import FakeAHM
from bellcommander.engine.supervisor import Supervisor

TZ = ZoneInfo("Australia/Sydney")


@pytest.fixture
def cfg(tmp_path):
    site = {
        "school": "Test PS", "timezone": "Australia/Sydney",
        "ahm": {"host": "127.0.0.1"},
        "zones": [{"id": "all_z", "name": "All", "ahm_zone": 1}],
        "groups": [{"id": "all", "name": "All Call", "zone_ids": ["all_z"]}],
        "sounds": [{"id": "bell", "name": "Bell", "ahm_track": 3}],
        "templates": [{"id": "normal", "name": "Normal", "events": [
            {"at": "09:00", "sound_id": "bell", "group_id": "all", "label": "Start"},
            {"at": "11:00", "sound_id": "bell", "group_id": "all", "label": "Recess"},
        ]}],
        "calendar": {"division": "eastern",
                     "terms": [{"start": "2026-07-20", "end": "2026-09-25"}],
                     "no_bell_dates": {}},
        "default_template_id": "normal",
    }
    p = tmp_path / "s.json"; p.write_text(json.dumps(site))
    return load(p)


class ClockSupervisor(Supervisor):
    """Supervisor with a settable clock for deterministic tick tests."""
    now_dt = datetime(2026, 7, 21, 8, 0, tzinfo=TZ)
    def _now(self): return self.now_dt
    def _today(self): return self.now_dt.date()


@pytest.mark.asyncio
async def test_bell_fires_at_time(cfg):
    drv = FakeAHM(); await drv.connect()
    sup = ClockSupervisor(cfg, drv)
    sup.reload_plan(date(2026, 7, 21))

    sup.now_dt = datetime(2026, 7, 21, 9, 0, 0, tzinfo=TZ)
    await sup._tick(sup.now_dt)
    assert len(drv.bells) == 1
    assert drv.bells[0].track == 3

@pytest.mark.asyncio
async def test_bell_fires_once_only(cfg):
    drv = FakeAHM(); await drv.connect()
    sup = ClockSupervisor(cfg, drv); sup.reload_plan(date(2026, 7, 21))
    sup.now_dt = datetime(2026, 7, 21, 9, 0, 0, tzinfo=TZ)
    await sup._tick(sup.now_dt)
    await sup._tick(sup.now_dt)  # same second again
    assert len(drv.bells) == 1

@pytest.mark.asyncio
async def test_evac_holds_bell(cfg):
    drv = FakeAHM(); await drv.connect()
    sup = ClockSupervisor(cfg, drv); sup.reload_plan(date(2026, 7, 21))
    await sup.set_evac(True)
    sup.now_dt = datetime(2026, 7, 21, 9, 0, 0, tzinfo=TZ)
    await sup._tick(sup.now_dt)
    assert len(drv.bells) == 0  # held, nothing rang

@pytest.mark.asyncio
async def test_manual_ring_blocked_during_evac(cfg):
    drv = FakeAHM(); await drv.connect()
    sup = ClockSupervisor(cfg, drv); sup.reload_plan(date(2026, 7, 21))
    await sup.set_evac(True)
    ok = await sup.manual_ring("bell", "all")
    assert ok is False and len(drv.bells) == 0

@pytest.mark.asyncio
async def test_manual_ring_works_normally(cfg):
    drv = FakeAHM(); await drv.connect()
    sup = ClockSupervisor(cfg, drv); sup.reload_plan(date(2026, 7, 21))
    ok = await sup.manual_ring("bell", "all")
    assert ok is True and len(drv.bells) == 1

@pytest.mark.asyncio
async def test_skip_next(cfg):
    drv = FakeAHM(); await drv.connect()
    sup = ClockSupervisor(cfg, drv)
    sup.now_dt = datetime(2026, 7, 21, 8, 0, tzinfo=TZ)
    sup.reload_plan(date(2026, 7, 21))
    skipped = sup.skip_next()
    assert skipped.label == "Start"
    # advance past 09:00 — the skipped bell must not fire
    sup.now_dt = datetime(2026, 7, 21, 9, 0, 0, tzinfo=TZ)
    await sup._tick(sup.now_dt)
    assert len(drv.bells) == 0
    # but 11:00 still fires
    sup.now_dt = datetime(2026, 7, 21, 11, 0, 0, tzinfo=TZ)
    await sup._tick(sup.now_dt)
    assert len(drv.bells) == 1

@pytest.mark.asyncio
async def test_bell_failure_emits_miss(cfg):
    drv = FakeAHM(); await drv.connect()
    events = []
    class Tel:
        def event(self, **kw): events.append(kw)
    sup = ClockSupervisor(cfg, drv, telemetry=Tel()); sup.reload_plan(date(2026, 7, 21))
    drv.set_offline(True)  # AHM drops
    sup.now_dt = datetime(2026, 7, 21, 9, 0, 0, tzinfo=TZ)
    await sup._tick(sup.now_dt)
    assert any(e["kind"] == "miss" for e in events)
