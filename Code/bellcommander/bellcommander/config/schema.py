"""Site configuration model. The validated JSON file IS the deployment.

Loaded once at startup and on any change. Rejected loudly if invalid so a
malformed config can never half-run. Code / config / data never mix: reflash
the OS, drop in config.json, the site is restored.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import time
from pathlib import Path


class ConfigError(ValueError):
    """Raised when a site config is structurally invalid. Fail loud, fail early."""


@dataclass(frozen=True)
class Zone:
    id: str
    name: str            # plain-language, shown to office staff
    ahm_zone: int        # AHM zone strip index (N=1 addressing)


@dataclass(frozen=True)
class ZoneGroup:
    id: str
    name: str            # e.g. "All Call", "Play + Class"
    zone_ids: tuple[str, ...]


@dataclass(frozen=True)
class Sound:
    id: str              # e.g. "school_bell"
    name: str
    ahm_track: int       # AHM internal playback track number
    source: str = "ahm"  # "ahm" (stored WAV) | "appliance" (music bell via AVIO)


@dataclass(frozen=True)
class BellEvent:
    at: time             # wall-clock trigger time
    sound_id: str
    group_id: str
    label: str


@dataclass(frozen=True)
class DayTemplate:
    id: str              # "normal", "sports", "wet_weather"
    name: str
    events: tuple[BellEvent, ...]


@dataclass(frozen=True)
class Calendar:
    division: str                       # "eastern" | "western"
    terms: tuple[tuple[str, str], ...]  # (start_iso, end_iso) pairs
    no_bell_dates: dict[str, str]       # iso_date -> reason (dev days, pub hols)


@dataclass(frozen=True)
class AHMConfig:
    host: str
    port: int = 51325
    zone_count: int = 8


@dataclass(frozen=True)
class SiteConfig:
    school: str
    timezone: str                       # IANA, e.g. "Australia/Sydney"
    ahm: AHMConfig
    zones: tuple[Zone, ...]
    groups: tuple[ZoneGroup, ...]
    sounds: tuple[Sound, ...]
    templates: tuple[DayTemplate, ...]
    calendar: Calendar
    default_template_id: str
    evac_gpio_pin: int = 17             # BCM pin for the fire-panel dry contact

    # ---- fast lookups (built after construction) ----
    def zone(self, zid: str) -> Zone:
        return _index(self.zones, zid, "zone")

    def group(self, gid: str) -> ZoneGroup:
        return _index(self.groups, gid, "group")

    def sound(self, sid: str) -> Sound:
        return _index(self.sounds, sid, "sound")

    def template(self, tid: str) -> DayTemplate:
        return _index(self.templates, tid, "template")


def _index(items, key, label):
    for it in items:
        if it.id == key:
            return it
    raise ConfigError(f"unknown {label} id: {key!r}")


def _parse_time(s: str) -> time:
    try:
        hh, mm = s.split(":")
        return time(int(hh), int(mm))
    except Exception as e:  # noqa: BLE001
        raise ConfigError(f"bad time {s!r}: expected HH:MM") from e


def load(path: str | Path) -> SiteConfig:
    """Load + validate a site config. Raises ConfigError on any problem."""
    raw = json.loads(Path(path).read_text())

    try:
        zones = tuple(Zone(z["id"], z["name"], int(z["ahm_zone"])) for z in raw["zones"])
        groups = tuple(
            ZoneGroup(g["id"], g["name"], tuple(g["zone_ids"])) for g in raw["groups"]
        )
        sounds = tuple(
            Sound(s["id"], s["name"], int(s["ahm_track"]), s.get("source", "ahm"))
            for s in raw["sounds"]
        )
        templates = tuple(
            DayTemplate(
                t["id"],
                t["name"],
                tuple(
                    BellEvent(_parse_time(e["at"]), e["sound_id"], e["group_id"], e["label"])
                    for e in t["events"]
                ),
            )
            for t in raw["templates"]
        )
        cal = raw["calendar"]
        calendar = Calendar(
            division=cal["division"],
            terms=tuple((t["start"], t["end"]) for t in cal["terms"]),
            no_bell_dates=dict(cal.get("no_bell_dates", {})),
        )
        ahm = AHMConfig(**{"host": raw["ahm"]["host"], **{k: raw["ahm"][k] for k in ("port", "zone_count") if k in raw["ahm"]}})
        cfg = SiteConfig(
            school=raw["school"],
            timezone=raw["timezone"],
            ahm=ahm,
            zones=zones,
            groups=groups,
            sounds=sounds,
            templates=templates,
            calendar=calendar,
            default_template_id=raw["default_template_id"],
            evac_gpio_pin=int(raw.get("evac_gpio_pin", 17)),
        )
    except KeyError as e:
        raise ConfigError(f"missing required field: {e}") from e

    _validate_references(cfg)
    return cfg


def _validate_references(cfg: SiteConfig) -> None:
    """Every cross-reference must resolve, or we refuse to run."""
    zone_ids = {z.id for z in cfg.zones}
    for g in cfg.groups:
        for zid in g.zone_ids:
            if zid not in zone_ids:
                raise ConfigError(f"group {g.id!r} references unknown zone {zid!r}")

    group_ids = {g.id for g in cfg.groups}
    sound_ids = {s.id for s in cfg.sounds}
    for t in cfg.templates:
        for e in t.events:
            if e.sound_id not in sound_ids:
                raise ConfigError(f"template {t.id!r} references unknown sound {e.sound_id!r}")
            if e.group_id not in group_ids:
                raise ConfigError(f"template {t.id!r} references unknown group {e.group_id!r}")

    if cfg.default_template_id not in {t.id for t in cfg.templates}:
        raise ConfigError(f"default_template_id {cfg.default_template_id!r} not found")
