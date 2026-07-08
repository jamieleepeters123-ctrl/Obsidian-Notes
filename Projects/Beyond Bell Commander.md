# Beyond Bell Commander

Productised school PA + bell scheduling system under the BNS brand.

## Architecture v2 (locked — Jul 2026)
Designed from scratch for maintainability and stability. Three lines:
**Headless Linux appliance (engine) → TCP :51325 → AHM (playback + Dante routing) → per-block amps.** Any browser is the face.

### Head end
- Headless Pi / Linux appliance in the rack beside the AHM. No attached display — a dead screen is cosmetic, never a bells fault. Easy swap via golden image + site config.
- **One Python service**: scheduler, AHM driver, EVAC GPIO, phone-home client, serves the UI. FastAPI + SQLite (WAL). Deliberately boring, few pinned dependencies.
- **Scheduler = compiled tick loop, not a framework.** Daily (and on config change) the engine compiles the day's plan into a flat list ("ring bell X to group Y at 11:00:00"); a 1-second tick executes it. ~100 readable lines, exhaustively unit-tested: every 2026 date, every override, DST. "Did we break bells?" is a CI answer.
- **Fake AHM** test server (speaks the documented protocol) — full schedule→driver→DSP path exercised on every commit, no hardware. Field bugs reproduced + pinned as regression tests.
- Stability layers: Pi hardware watchdog → systemd → app self-check; read-only rootfs; no auto-updates (deliberate tested release images); chrony; fully functional with zero internet (telemetry queues locally).
- Config = one schema-validated JSON. Code / config / data never mix. Reflash + config.json = site restored.

### Displays (fully decoupled — all just browsers on the appliance URL)
- Office PC / iPad — zero cost
- ELC SMT101 10.1" Android wall panel (Fully Kiosk) — the 10" upgrade AND the Android-tablet option in one SKU (see [[ELC Smart Panels]])
- Pi + 7"/10" touch all-in-one where a single-box look is wanted (PiFace kiosk pattern)

### Audio
- **AHM-16** (product floor): internal WAV bell player (~2.5 GB storage), matrix, priority ducking. Driver = documented TCP :51325 (ahm_player.py groundwork).
- **Dante I/O card** → decentralised Dante amps per block → local 100V speakers. One network drop per block; block failure silences only that block. Netgear M4250 (IGMP, PTP QoS).
- **Music bells** (schools change songs each term, self-service): Audinate AVIO USB on the appliance puts it on Dante as a source. Staff upload MP3 in UI → ffmpeg normalise/trim/fade → assign to any bell. Engine health-checks the path and falls back to AHM stored tone automatically. (Music licensing = school's responsibility; APRA AMCOS education licences generally cover NSW schools.)
- **Fallback bells**: AHM **Manage > Events** scheduler (50 events/config, NTP-synced, Track Playback event type) holds a dormant mirror of the core timetable. Activation via labelled SoftKey or remotely. Bells survive appliance failure with no extra hardware. *(Algo 8301 removed from plan — AHM Events does its job for free.)*
- No file upload to AHM over documented TCP — uploads ride AH-Net (System Manager). Product answer: fixed sound-slot bank loaded at commissioning + UI remaps slots; true uploads = remote System Manager support task. Music bells cover the "custom audio" demand anyway.

### Safety
- FIP dry contact (N/C) → appliance GPIO → holds all bells. Supplementary only — certified EWIS (AS 1670.4) always independent and untouched.
- EVAC events logged forever (see [[Bell Commander Telemetry]]).

### Remote management (decided)
- Outbound-HTTPS phone-home → office-hosted Docker portal (fixed IP; confirm contractually static). External uptime watchdog + UPS non-negotiable. VPS migration = DNS change.
- Remote access: 4G out-of-band gateway w/ Tailscale on rack side; school-network Tailscale only with written IT approval.

### Languages
- **Python** everywhere on the backend (appliance service + portal, one monorepo, shared models) — matches existing BNS tooling (Flask, ReportLab, ffmpeg, ahm_player.py).
- **React** UI (Schoolyard), built to static files, vendored per release — no build tooling on the Pi.
- Node-RED = bench/prototyping tool only, never in the shipped image.

## UI
- Direction locked: **Schoolyard** — blazer green + bell brass on warm paper, plain language ("Ring the bell", "held", "skipped"), tactile buttons. Working React demo: [[Bell Commander Demo UI]].

## Bench checklist (prototype)
- Pi 5 · AHM-16 + Dante card · one Dante amp · M4250 · GPIO EVAC via optocoupler
- AHM: set **static IP** (currently 192.168.1.168 on the bench after a DHCP move — pin it; commissioning checklist item: "AHM IP fixed + recorded in site config")

### Office bench access (confirmed 2026-07-07, over Sophos VPN)
Reached from home over the **Sophos SSL VPN** — office subnets `172.16.200.0/24` + `172.16.220.0/24`, gateway `172.16.240.129`. VPN must be up or nothing below is reachable.
- **Prototype Pi:** `ssh pi@172.16.200.217` — key-based (ed25519 in `/home/pi/.ssh/authorized_keys`), no password prompt; passwordless sudo. Pi 5 Model B Rev 1.1, Raspberry Pi OS / Debian 12 bookworm, kernel `6.12.75+rpt-rpi-2712`. Portrait DSI touch display (`.xinitrc`: `xrandr --output DSI-2 --rotate left` + touch coordinate-transform matrix, backlight control), Chromium `--kiosk` fullscreen. Slated to be wiped and rebuilt as the Beyond Bell prototype (single-box Pi + touch = one of the decoupled display options; no Docker on this Pi). Old kiosk build lives in `~/kiosk` (git repo: `kiosk-app.service` Flask on :80, `nodered.service` on :1880, ADB rig driving an Android device) — to be removed.
- **Office AHM:** `172.16.200.127` (confirmed online: TCP :51325 open, no SSH/web). Separate unit from the bench AHM at 192.168.1.168. Driver reuses [[AHM Reverse Engineering]] (`ahm_player.py`/`ahm_server.py`, persistent TCP :51325).
- Verify: WAV storage/backup-restore with sounds loaded · direct playback-channel trigger over TCP · Events fallback end-to-end (Manage > Events, Track Playback) · whether Events are writable over AH-Net (capture System Manager while creating one) · AVIO music path + auto-fallback
- Keep one persistent AHM TCP session with heartbeat/reconnect

## Docs produced (all in Attachments)
- [[Bell Commander Product Plan v0.1]] (Algo removed; §6.1 remote mgmt decided — note: pre-dates Architecture v2 in places)
- [[Bell Commander Hardware Options]]
- Signal flow: [[bell-commander-signal-flow-dante.svg]] (current) · [[bell-commander-signal-flow-analogue.svg]] (superseded)
- UI comparison sheet: [[bell-commander-ui-options.html]] → Schoolyard chosen

## Status
- Demo UI complete (Schoolyard) — [[Bell Commander Demo UI]]
- Bell scheduler fetches real bell times (see [[Campbelltown PS]]) and [[NSW 2026 Term Dates]]
- Evac audio produced for Campbelltown PS (offsite done, onsite pending voice file)

## Related
- [[Bell Commander Telemetry]] · [[Bell Commander Demo UI]] · [[AHM Reverse Engineering]] · [[Campbelltown PS]] · [[ELC Smart Panels]]

#bns #project/bell-commander
