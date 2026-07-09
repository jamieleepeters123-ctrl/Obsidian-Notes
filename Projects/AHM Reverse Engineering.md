# AHM Reverse Engineering

Allen & Heath AHM-16 protocol work — documented + proprietary protocols, now powering a live web control panel.

## Live system: AHM web control panel

- **UI**: http://192.168.1.42:8080 (WebSocket :8765) — Docker container `ahm-meter` on the [[PiFace Kiosk]] Pi, host networking, auto-restart
- **AHM unit**: BNS-AHM-16, firmware V1.61, at 192.168.1.168 (**office deployment** as of 2026-07-07 — Pi + AHM now racked at the BNS office; confirm IP set static)
- **Office AHM unit**: 172.16.200.127 — Beyond Bell office bench (distinct from the home bench AHM at 192.168.1.168), reached over the Sophos VPN (confirmed online 2026-07-07: TCP :51325 open, no SSH/web). See [[Beyond Bell Commander]]
- **Source**: `C:\Users\jamie.peters\Documents\ahm-meter\` (`ahm_server.py` + `ahm_ui.html` + Docker files)
- **Full byte-level docs**: `Desktop\Beyond Bell Commander\AHM\AHM-Control-Documentation.md`

### Features
- 16 input strips: calibrated meters (−60…+18 dB, peak hold), faders, real mutes, channel names
- 8 zone strips: faders, mutes, names (A/B/C/D Block Internal/External)
- Click-to-rename any input/zone — writes back to the AHM, shows in System Manager
- Media player: track list from unit, play/stop, once/repeat/all/repeat-all, Mono 1/2/Stereo destination
- AHM OFFLINE detection (status pill + meters blank within ~2 s)

## Protocol findings

**Ext-Control (TCP 51325, documented)** — MIDI over TCP. NRPN levels, Note-On mutes, SysEx gets (level, name). Channel type = MIDI channel nibble N (0=inputs, 1=zones). Needs one persistent connection — rapid connect/disconnect breaks the unit's TCP MIDI routing. No set-name exists on this port.

**AHNet (TCP 51321 + UDP 51325, proprietary — reverse engineered)** — System Manager's own protocol:
- Session hello must announce the client's **own UDP port**; meters then stream over UDP (needs "Metering Sources" subscription + 0.9 s UDP keepalives)
- Meter encoding: linear-in-dB, 256 counts/dB, 0x8001 = −110 dB sentinel, wraps mod 2¹⁶ above +18 dB
- "Playback Manager": track-list TLV push, play cmd 0x1005 (channel/mode/track), stop 0x1006
- "Input/Zone Channel Name Colour Manager": object 0x1000+i = channel i+1 name (16-char buffer). Subscribe → live name pushes; write the object → rename. Colours likely 0x1040+i (not implemented)
- **"Mixer" service — matrix crosspoints (RE'd 2026-07-09):** each source→zone crosspoint is one object whose id is carried in the f1 `cmd` field: `object = 0x5000 + row*0x40 + col` (row, col 0..15 → a 16×16 matrix, objects 0x5000–0x53cf). Write payload `0x01` = route on, `0x00` = off. State read reports it 2-byte (0x0100 on / 0x0000 off). Confirmed live 6× (top-left = 0x5000). **Gotcha:** System Manager streams the mouse-cursor position to the AHM continuously while the pointer moves (fire-and-forget on a pre-opened handle, payload `<x> 00 <y> <y>`) — this floods captures; the crosspoint set is a tiny 1-byte write only on the *click*, isolated by holding the mouse STILL. Handles reassign every reconnect → open services by name. Which axis is source(input) vs zone(output) still to confirm by probing. Full write-up: `Desktop\Beyond Bell Commander\AHM\matrix-crosspoint-FINDINGS.md`.

## Updates

### 2026-07-09 — matrix crosspoint command (bell→zone routing)
- Reverse-engineered the "Mixer" service crosspoint write (see Protocol findings above) — the last piece for [[Beyond Bell Commander]] bell-group → zone routing. Method: state-diff of System Manager crosspoint OFF vs ON reconnect dumps + a still-mouse live capture to isolate the 1-byte click write. tshark on the Sophos TAP, SM V1.61, against the office AHM 172.16.200.127 over VPN.
- Implemented in the engine (`ahnet.set_matrix_crosspoints` + gated `AHMDriver` routing, 84 tests). Activation pending one live axis/source-row experiment.

### 2026-07-07 — office deployment
- Pi + AHM-16 deployed at the BNS office (was home bench). `ahm-meter` container running the control panel.
- This container's `ahm_server.py` **is effectively the Bell Commander AHM driver already field-running** — the v2 appliance service wraps a scheduler around this proven playback/routing/mute path. See [[Beyond Bell Commander]] Architecture v2.
- TODO: confirm 192.168.1.168 is static (commissioning checklist item); update note if the office Pi differs from the [[PiFace Kiosk]] Pi.

### 2026-07-06 — names, zones, rename
- Channel names on strips (SysEx get + live AHNet subscription — SM renames appear instantly)
- Zone section added (first UI control of the PA zones, N=1 addressing)
- Click-to-rename via reverse-engineered name managers, verified end-to-end
- AHM OFFLINE detection fixed (UI previously showed CONNECTED with the unit unplugged)

### 2026-07-03 — home migration, Docker, media player
- Setup moved to house (AHM now 192.168.1.168); server containerised on the Pi
- Metering cracked (AHNet subscription requirement + linear-in-dB encoding); bar rescaled to +18 dB
- Channel mapping fixed (10-byte stride); real mutes (Note-On, not level-zero)
- Media player with play modes via AHNet Playback Manager
- Full documentation written to Desktop

## Known issues / ideas
- Mute buttons don't sync state on page load (Get Channel Mute SysEx exists, not wired)
- No "now playing" indicator
- Zone meters not implemented (packet group 0x02 unverified)
- Channel colours readable/writable same way as names (objects 0x1040+)
- Windows dev mode (`--tshark`) reconnects AHNet every ~30 s (no UDP keepalives there); Pi unaffected

## Related
- [[Beyond Bell Commander]] — AHM is one of the DSP driver targets
- [[PiFace Kiosk]] — hosts the control panel container

#bns #project/ahm #reverse-engineering
