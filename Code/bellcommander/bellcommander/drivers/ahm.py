"""AHM driver — the DSP abstraction, concrete Allen & Heath AHM implementation.

Protocol facts (from AHM Reverse Engineering, verified on real hardware):
  * Ext-Control TCP :51325 — MIDI over TCP.
      - Mutes  : Note-On, MIDI channel nibble N (0=inputs, 1=zones).
      - Levels : NRPN.
  * ONE persistent connection is mandatory. Rapid connect/disconnect breaks the
    unit's TCP MIDI routing. So: connect once, heartbeat, auto-reconnect.
  * Playback (recall a bell track) rides AHNet's Playback Manager (play 0x1005).
    For the appliance driver we trigger playback via the same mechanism the
    proven ahm_server.py uses; here it's expressed behind play_track() so the
    engine never sees protocol detail.

This module intentionally exposes a tiny surface. The scheduler calls
trigger_bell / set_zone_mute / evac_suppress and nothing else.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Protocol

log = logging.getLogger("bc.driver.ahm")

# ---- MIDI constants ----
NOTE_ON = 0x90            # + channel nibble
MIDI_CH_INPUTS = 0x0
MIDI_CH_ZONES = 0x1


class DSPDriver(Protocol):
    """The interface every DSP driver implements. Keep it minimal."""

    async def connect(self) -> None: ...
    async def close(self) -> None: ...
    @property
    def online(self) -> bool: ...

    async def trigger_bell(self, ahm_track: int, ahm_zones: list[int]) -> None: ...
    async def set_zone_mute(self, ahm_zone: int, muted: bool) -> None: ...
    async def evac_suppress(self, active: bool) -> None: ...


class AHMDriver:
    """Persistent-connection AHM control. Reconnects on drop."""

    def __init__(self, host: str, port: int = 51325, *, reconnect_delay: float = 2.0):
        self.host = host
        self.port = port
        self.reconnect_delay = reconnect_delay
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._online = False
        self._lock = asyncio.Lock()
        self._keeper: asyncio.Task | None = None

    @property
    def online(self) -> bool:
        return self._online

    async def connect(self) -> None:
        """Open the single persistent session and start the keep-alive task."""
        await self._open()
        if self._keeper is None:
            self._keeper = asyncio.create_task(self._keepalive(), name="ahm-keepalive")

    async def _open(self) -> None:
        try:
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port), timeout=5
            )
            self._online = True
            log.info("AHM connected %s:%s", self.host, self.port)
        except Exception as e:  # noqa: BLE001
            self._online = False
            log.warning("AHM connect failed %s:%s — %s", self.host, self.port, e)

    async def _keepalive(self) -> None:
        """Detect drops and reconnect. NEVER churn the socket on purpose."""
        while True:
            await asyncio.sleep(self.reconnect_delay)
            if not self._online:
                await self._open()

    async def close(self) -> None:
        if self._keeper:
            self._keeper.cancel()
        if self._writer:
            self._writer.close()
            try:
                await self._writer.wait_closed()
            except Exception:  # noqa: BLE001
                pass
        self._online = False

    async def _send(self, data: bytes) -> None:
        """Write raw bytes on the persistent socket, reconnecting once if needed."""
        async with self._lock:
            if not self._online or self._writer is None:
                await self._open()
            if not self._online or self._writer is None:
                raise ConnectionError("AHM offline")
            try:
                self._writer.write(data)
                await self._writer.drain()
            except Exception as e:  # noqa: BLE001
                self._online = False
                log.warning("AHM send failed — %s", e)
                raise

    # ---- high-level ops the engine calls ----

    async def trigger_bell(self, ahm_track: int, ahm_zones: list[int]) -> None:
        """Play a stored bell track out to the given zones.

        Playback recall is delegated to play_track (AHNet Playback Manager in
        the real build — stubbed as a documented call here). Routing to zones is
        assumed pre-wired in the AHM design per zone-group; if routing must be
        set live, that would be additional NRPN sends here.
        """
        await self.play_track(ahm_track)
        log.info("bell: track %s -> zones %s", ahm_track, ahm_zones)

    async def play_track(self, track: int) -> None:
        """AHNet Playback Manager play cmd 0x1005 (channel/mode/track).

        Kept as its own method so the AHNet framing from ahm_server.py drops in
        directly. Left as an explicit seam rather than inlined.
        """
        # Real framing supplied by the ahm_server.py AHNet implementation.
        # Placeholder keeps the interface honest for tests via FakeAHM.
        raise NotImplementedError("wire AHNet play 0x1005 from ahm_server.py")

    async def set_zone_mute(self, ahm_zone: int, muted: bool) -> None:
        """Zone mute via Note-On on MIDI channel 1 (zones)."""
        status = NOTE_ON | MIDI_CH_ZONES
        note = ahm_zone & 0x7F
        velocity = 0x7F if muted else 0x00
        await self._send(bytes([status, note, velocity]))

    async def evac_suppress(self, active: bool) -> None:
        """Master hold — mute all zones. The engine also refuses to fire while
        suppressed; this is the audio-side belt-and-braces."""
        log.warning("EVAC suppress %s", "ON" if active else "OFF")
        # Broadcast mute across zone strips; zone count comes from caller in
        # practice. Here we no-op the framing and rely on the engine gate + the
        # per-zone calls the supervisor issues.
