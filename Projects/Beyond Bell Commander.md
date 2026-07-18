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
- **Prototype Pi:** `ssh pi@172.16.200.217` — key-based (ed25519 in `/home/pi/.ssh/authorized_keys`), no password prompt; passwordless sudo. Pi 5 Model B Rev 1.1, Raspberry Pi OS / Debian 12 bookworm, kernel `6.12.75+rpt-rpi-2712`. Portrait DSI touch display (`.xinitrc`: `xrandr --output DSI-2 --rotate left` + touch coordinate-transform matrix). **Now the deployed Beyond Bell prototype** (see Prototype build below): `bellcommander.service` on :80, Chromium `--kiosk` repointed to the appliance UI (`http://127.0.0.1/`). Old kiosk build removed 8 Jul — `~/kiosk` deleted (was pushed to its own repo), `kiosk-app.service`/`nodered.service`/`adb-connect.service` disabled. No Docker on this Pi.
- **Office AHM:** `172.16.200.127` (confirmed online: TCP :51325 open, no SSH/web). Separate unit from the bench AHM at 192.168.1.168. Driver reuses [[AHM Reverse Engineering]] (`ahm_player.py`/`ahm_server.py`, persistent TCP :51325).
- Verify: WAV storage/backup-restore with sounds loaded · direct playback-channel trigger over TCP · Events fallback end-to-end (Manage > Events, Track Playback) · whether Events are writable over AH-Net (capture System Manager while creating one) · AVIO music path + auto-fallback
- Keep one persistent AHM TCP session with heartbeat/reconnect

## Prototype build — deployed 8 Jul 2026
First working appliance built and running on the office Pi (`172.16.200.217`, systemd `bellcommander.service`, serves on **:80**), driving the **real office AHM** (`172.16.200.127`). Code: `Desktop\Beyond Bell Commander\engine` (git repo since ~12 Jul — work on **beta** branch, bare remote `tooling` on [[Tooling Docker Host]]; `README.md` + `DEPLOY.md` inside). Build the React UI on the dev box → vendor into `engine/bellcommander/static` → redeploy over the VPN. Survives reboot (verified).

### Engine (hardware-free core, ~78 tests, "did we break bells?" is a CI answer)
- `compile_day(config, date)` → sorted bell list or a silent reason. Gating: **no-bell date → special day → weekend → out of term → template**. (A *special day* = per-date template; forces a ringing day, overriding weekend/holidays — fixed 8 Jul after it silently no-showed out of term.)
- `Engine.tick(now)` — 1-second loop, fires each bell once inside a grace window (never rings a stale bell after a restart), EVAC/silence/skip/manual overrides, recompiles at midnight, DST-correct via `zoneinfo`.
- `SiteConfig` = one pydantic-validated JSON (zones, groups, sounds, day templates, calendar). Bad references fail at load.
- **AHMDriver** — persistent Ext-Control TCP :51325 (play SysEx, mute, level, get-level heartbeat, get-name). Fails soft, never crashes the tick loop. **FakeAHM** speaks the same protocol → the whole schedule→driver→AHM path is tested with no hardware. Real office AHM replied to get-level in MIDI *running status* (7-byte, not 9) — driver fixed to accept it.
- Audit log = **SQLite (WAL)**, every ring / skip / hold / EVAC / manual, UTC at source.
- **FastAPI** wraps it (blocking tick runs in an executor thread) and serves the Schoolyard React UI.

### UI (Schoolyard React, served from the appliance)
Tabs: **Today** (live countdown, chalkboard timeline, Ring/Skip/Silence/EVAC), **Calendar** (year view from the real calendar), **Zones** (live mute — switch goes red when muted), **Log**, **Setup** (commissioning), **System**.
- **Setup** sub-tabs — School / Sounds & Zones / Timetable / Calendar — with one Save that validates and **hot-reloads live** (a bad edit is rejected, running config keeps ringing).

### Commissioning = "point at the AHM + the DoE"
All importers fetch *candidates for review*, then save through the validated config write.
- **Bell sounds ← AHM library** (AHNet :51321 track list). Office AHM: Period_Bell, Lock_Down, Lock_In, EVAC, All_Clear, Shelter-in-place.
- **Zones ← AHM zone names** (Ext-Control get-name). Office AHM: Gym, Canteen, Kiss&Ride, B/C/D Block Int/Ext (ch 1-8). Renaming a zone + Save **writes the name back to the AHM** (AHNet name-manager → shows in System Manager). Each zone carries an "AHM ch" so mutes/routing hit the right output.
- **Timetable ← the school's bell-times page** (restricted to `schools.nsw.gov.au`). Parses the DoE CMS layout; times reliable, labels reviewed.
- **Term dates ← NSW DoE calendar** (`education.nsw.gov.au/schooling/calendars/{year}`, Eastern/Western). **Public holidays ← NSW** (Nager.Date, filtered to NSW), now with the holiday *name* stored per date.

### System settings
- **Network**: DHCP/static via NetworkManager with a **90 s auto-revert safety** (a bad static IP can't lock out a remote appliance); MAC shown.
- **Display**: brightness + **sleep timer** (blank after N idle minutes, wake on touch) on the DSI panel; backlight is `pi`-writable, an X-side `xprintidle` watcher does the blanking.
- **Time**: **custom NTP server** (systemd-timesyncd drop-in), with clock-sync status shown — silent drift = broken bells.

### Open items
- **Bell group → zone routing — LIVE (10 Jul).** Crosspoint command RE'd ("Mixer" service, `object = 0x5000 + row*0x40 + col`, payload 01/00, 16×16 — see [[AHM Reverse Engineering]]) and activated: `matrix_source_row=0` = the AHM's **Input 1 "Bells"** row; zones map by AHM channel (col = ch−1). Proven end-to-end on the office AHM — a bell sounds only in its group's zones (verified via XPoint grid + zone meters). Zones re-commissioned to the AHM's real 8 (Gym/Canteen/Kiss&Ride/B·C·D block int/ext). RE write-up: `Desktop\Beyond Bell Commander\AHM\matrix-crosspoint-FINDINGS.md`.
- **App ↔ AHM two-way sync (10 Jul).** App→AHM auto (rename on save, routing on ring); AHM→App auto-adopts System Manager zone renames (delta-safe 30s poll + `POST /api/ahm/sync`). Config stays source of truth.
- **EVAC/Messages + Today page (10 Jul).** Configurable one-touch actions (`config.messages`): Setup → EVAC/Messages tab (per-action sound/group/placement/hold-release-stop/colour, Load-defaults); Today Emergency **popup** (Onsite/Off-Site EVAC, Lock In/Out, Test/Test End, All Clear, STOP) + Rainy Day quick button; removed Skip/Silence; **"Now ringing" indicator**. Runs via `POST /api/message`. *Still to do:* true STOP (AHNet playback-stop 0x1006 — currently only clears/releases); differentiate Onsite vs Off-Site; set the Rainy Day sound.
- **Phone-home portal** — blocked (no BNS portal details yet); audit log is already the source of truth.
- Still the **example site config** (out of term today → silent); needs a real commissioned schedule. Also: systemd watchdog, and confirm the display-sleep self-wake was a real touch vs phantom DSI input.

## Docs produced (all in Attachments)
- [[Bell Commander Product Plan v0.1]] (Algo removed; §6.1 remote mgmt decided — note: pre-dates Architecture v2 in places)
- [[Bell Commander Hardware Options]]
- Signal flow: [[bell-commander-signal-flow-dante.svg]] (current) · [[bell-commander-signal-flow-analogue.svg]] (superseded)
- UI comparison sheet: [[bell-commander-ui-options.html]] → Schoolyard chosen

## Status
- **Working prototype deployed to the office Pi (8 Jul 2026)** — full commissioning UI, driving the real office AHM. See *Prototype build* above. ~78 tests green.
- Demo UI ([[Bell Commander Demo UI]]) superseded by the live Schoolyard React app served from the appliance.
- **9 Jul: AHM matrix crosspoint command reverse-engineered + wired into the driver (gated).**
- **10 Jul: bell→zone routing LIVE on the office AHM; zones commissioned to the real 8; App↔AHM two-way name sync; Today page + Setup EVAC/Messages tab built + deployed.** See *Open items*.
- **10 Jul (pm): SECOND DSP — AtlasIED Atmosphere driver, validated live on a bench AZM4** (172.16.200.161). JSON-RPC :5321; DSP-aware commissioning (Load-from-Atlas Pull + Push build-sheet/Verify, since Atlas names are read-only); group→zone routing via per-message zone bundles (Option A); rang a bell end-to-end; real Stop (`StopMessage`) + per-sound track length. Proves the `Driver` abstraction — a whole DSP was one file + fake + tests, brain unchanged. Also: config Export/Import (Setup→School), log-time UTC→local fix, code under git backed up to bns-tooling. 106 tests.
- Evac audio produced for Campbelltown PS (offsite done, onsite pending voice file)
- **12–15 Jul: live paging + the paging station.** Mic paging over the AHM matrix (each `PagingSource` = input + its own matrix source row; a page is the same crosspoint op as a bell), FastAPI + **/panel** paging UI, deployed rev **0.2.0** to three consoles: office Pi (:80, real AHM), piface Pi (:8095), docker demo on [[Tooling Docker Host]] (:8090, fakeahm). The RK3576S 10.1" tablet (192.168.1.40) is the wall **paging station**, kiosking /panel — see daily notes 2026-07-12..15.
- **16 Jul: THIRD DSP scaffolded — Xilica Solaro QR1** (`XilicaDriver`, TCP :10007 third-party API, raw = dB×1000). Plan: appliance owns the audio (USB→analog in), Xilica only routes. Control-tag xlsx + `Bell System Demo.pjxml` in Tech Resources. *(Driver file still uncommitted on the dev box.)*
- **17 Jul: MEDIA PLAYER.** The appliance is now its own 4-channel player (Ch1 Bells / Ch2 Preamble / Ch3 BGM / Ch4 EVAC) out a USB audio interface — per-channel volume/device/output, sound library with browser upload, BGM ducks under anything else, preamble chime before pages. **`replace_dsp_player`** = DSPs route only, no internal player needed (the whole point for the Xilica). Amber console warning when media-owned audio can't actually play.
- **18 Jul: mode-aware sound names** (labels always show what will actually play — DSP track name vs media file name, flips live with the mode); **two 2-ch USB interfaces ≡ one 4-ch** (per-channel device); **panel auto-management** (tablet agent heartbeats every 20 s → System tab shows panel + IP, remote reboot, screen wakes 30 min before first bell / sleeps 30 min after last, off on silent days; auto-deployer armed on the office Pi for Monday).
- **18 Jul (pm): Calendar tab owns all scheduling** (Year view + Timetable + Schedules + Terms & Holidays moved out of Setup); **slot-less-sound crash fixed** (uploads with no DSP slot crash-looped the office Pi on restart — drivers now skip them, and a DSP-mode SILENT warning flags scheduled ones: the office rig's 5 re-pointed EVAC actions are silent until the USB interface arrives); **A/B WEEKS** — week rotation up to 4 letters, term's first week = A, each term restarts at A, editor in Calendar → Terms & Holidays, letters in year/month views + header chip. **245 tests.** Daily notes 2026-07-17/18 have the detail.

## Related
- [[Bell Commander Telemetry]] · [[Bell Commander Demo UI]] · [[Bell Commander UI Spec]] · [[AHM Reverse Engineering]] · [[Campbelltown PS]] · [[ELC Smart Panels]]

#bns #project/bell-commander
