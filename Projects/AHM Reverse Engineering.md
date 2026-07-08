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

## Updates

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
