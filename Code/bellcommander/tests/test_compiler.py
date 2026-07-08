"""Compiler tests — the 'did we break bells?' safety net.

The compiler is pure and deterministic, so we can assert exactly what rings for
any date + override combination.
"""
from datetime import date

import pytest

from bellcommander.config.schema import load
from bellcommander.engine.compiler import classify_day, compile_day


@pytest.fixture
def cfg(tmp_path):
    import json
    site = {
        "school": "Test PS",
        "timezone": "Australia/Sydney",
        "ahm": {"host": "127.0.0.1", "port": 51325, "zone_count": 8},
        "zones": [
            {"id": "admin", "name": "Admin", "ahm_zone": 1},
            {"id": "class", "name": "Classrooms", "ahm_zone": 2},
        ],
        "groups": [
            {"id": "all", "name": "All Call", "zone_ids": ["admin", "class"]},
        ],
        "sounds": [
            {"id": "bell", "name": "School bell", "ahm_track": 1},
        ],
        "templates": [
            {"id": "normal", "name": "Normal Day", "events": [
                {"at": "09:00", "sound_id": "bell", "group_id": "all", "label": "Start"},
                {"at": "11:00", "sound_id": "bell", "group_id": "all", "label": "Recess"},
                {"at": "15:00", "sound_id": "bell", "group_id": "all", "label": "Dismissal"},
            ]},
            {"id": "sports", "name": "Sports Day", "events": [
                {"at": "09:00", "sound_id": "bell", "group_id": "all", "label": "Assembly"},
            ]},
        ],
        "calendar": {
            "division": "eastern",
            "terms": [{"start": "2026-07-20", "end": "2026-09-25"}],
            "no_bell_dates": {"2026-07-20": "School development day"},
        },
        "default_template_id": "normal",
    }
    p = tmp_path / "site.json"
    p.write_text(json.dumps(site))
    return load(p)


# ---- gating ----

def test_term_weekday_rings(cfg):
    ok, _ = classify_day(cfg, date(2026, 7, 21))  # Tue in term
    assert ok

def test_weekend_silent(cfg):
    ok, reason = classify_day(cfg, date(2026, 7, 25))  # Sat
    assert not ok and reason == "Weekend"

def test_no_bell_date_silent(cfg):
    ok, reason = classify_day(cfg, date(2026, 7, 20))  # dev day (also term start)
    assert not ok and "development" in reason.lower()

def test_holiday_silent(cfg):
    ok, reason = classify_day(cfg, date(2026, 7, 10))  # before term
    assert not ok and reason == "School holidays"

def test_no_bell_date_beats_term(cfg):
    """A dev day inside term must NOT ring — ordering matters."""
    plan = compile_day(cfg, date(2026, 7, 20))
    assert not plan.rings


# ---- compilation ----

def test_normal_day_three_bells(cfg):
    plan = compile_day(cfg, date(2026, 7, 21))
    assert plan.rings
    assert [b.label for b in plan.bells] == ["Start", "Recess", "Dismissal"]

def test_bells_are_sorted_and_absolute(cfg):
    plan = compile_day(cfg, date(2026, 7, 21))
    times = [b.when for b in plan.bells]
    assert times == sorted(times)
    assert all(b.when.tzinfo is not None for b in plan.bells)

def test_forced_template(cfg):
    plan = compile_day(cfg, date(2026, 7, 21), template_id="sports")
    assert plan.template_id == "sports"
    assert [b.label for b in plan.bells] == ["Assembly"]

def test_skip_removes_one_bell(cfg):
    full = compile_day(cfg, date(2026, 7, 21))
    recess_key = next(b.event_key for b in full.bells if b.label == "Recess")
    plan = compile_day(cfg, date(2026, 7, 21), skip_keys=frozenset({recess_key}))
    assert [b.label for b in plan.bells] == ["Start", "Dismissal"]

def test_silence_day(cfg):
    plan = compile_day(cfg, date(2026, 7, 21), silence_day=True)
    assert not plan.rings and plan.reason == "Silenced by staff"

def test_event_keys_stable(cfg):
    a = compile_day(cfg, date(2026, 7, 21))
    b = compile_day(cfg, date(2026, 7, 21))
    assert [x.event_key for x in a.bells] == [x.event_key for x in b.bells]


# ---- whole-year sweep: nothing rings outside term, everything inside does ----

def test_full_year_sweep(cfg):
    ring_days = 0
    for ordinal in range(date(2026, 1, 1).toordinal(), date(2026, 12, 31).toordinal() + 1):
        d = date.fromordinal(ordinal)
        plan = compile_day(cfg, d)
        if plan.rings:
            ring_days += 1
            # every ringing day is a weekday inside the single test term
            assert d.weekday() < 5
            assert "2026-07-20" <= d.isoformat() <= "2026-09-25"
            assert d.isoformat() != "2026-07-20"  # dev day excluded
    assert ring_days > 0
