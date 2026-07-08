"""FakeAHM — a driver double for tests.

Speaks the DSPDriver interface, records every call. Lets the whole
schedule -> engine -> driver path run in CI with no hardware. Field bugs get
reproduced against this and pinned as regression tests.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BellCall:
    track: int
    zones: list[int]


@dataclass
class FakeAHM:
    connected: bool = False
    _online: bool = True
    bells: list[BellCall] = field(default_factory=list)
    mutes: list[tuple[int, bool]] = field(default_factory=list)
    evac_calls: list[bool] = field(default_factory=list)

    @property
    def online(self) -> bool:
        return self._online and self.connected

    def set_offline(self, value: bool = True) -> None:
        """Simulate the AHM dropping, to test fallback / alerting paths."""
        self._online = not value

    async def connect(self) -> None:
        self.connected = True

    async def close(self) -> None:
        self.connected = False

    async def trigger_bell(self, ahm_track: int, ahm_zones: list[int]) -> None:
        if not self.online:
            raise ConnectionError("fake AHM offline")
        self.bells.append(BellCall(ahm_track, list(ahm_zones)))

    async def set_zone_mute(self, ahm_zone: int, muted: bool) -> None:
        self.mutes.append((ahm_zone, muted))

    async def evac_suppress(self, active: bool) -> None:
        self.evac_calls.append(active)
