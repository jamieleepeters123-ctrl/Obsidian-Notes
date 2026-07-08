# Bell Commander Build Handoff

Handoff note for continuing the build with a Claude agent **on the office network** (Sophos VPN up). Everything needed to resume cold.

## Environment (office bench, over Sophos SSL VPN)
- VPN subnets: `172.16.200.0/24` + `172.16.220.0/24`, gateway `172.16.240.129`. **VPN must be up.**
- **Prototype Pi:** `ssh pi@172.16.200.217` — key-based (ed25519), passwordless sudo. Pi 5, Bookworm, kernel 6.12.75. To be **wiped & rebuilt** as the Beyond Bell appliance (single-box Pi + touch; NO Docker on this Pi). Old kiosk in `~/kiosk` (kiosk-app.service :80, nodered.service :1880) — remove.
- **Office AHM:** `172.16.200.127` — TCP :51325 open, no SSH/web. This is the target DSP. (Separate unit from the home bench AHM at 192.168.1.168.)

## What exists — code in [[Code/bellcommander]]
Python appliance skeleton, **19 tests passing** (`python -m pytest -q`). Architecture v2 (see [[Beyond Bell Commander]]).

- `bellcommander/config/schema.py` — site-config loader + strict validation. Config JSON = the deployment.
- `bellcommander/engine/compiler.py` — **pure deterministic** plan compiler. Gating order (no-bell date → weekend → term), DST resolved at compile time, overrides (force template / skip / silence). Returns flat sorted absolute-time bells.
- `bellcommander/engine/supervisor.py` — 1-second tick loop. Live EVAC gate (checked at fire time), skip-next, manual ring, date rollover, telemetry emit. Recompiles on any change.
- `bellcommander/drivers/ahm.py` — real AHM driver. Persistent connection + auto-reconnect (NEVER churn the socket — rapid connect/disconnect breaks the unit). Note-On zone mutes on MIDI ch 1. `play_track()` is the seam.
- `bellcommander/drivers/fake.py` — FakeAHM double; makes the whole path testable without hardware.
- `tests/` — compiler (full-year sweep, gating, overrides) + supervisor (fire-once, EVAC hold, skip, miss-on-offline).

## THE one open wiring task
`AHMDriver.play_track()` raises `NotImplementedError`. Wire the **AHNet Playback Manager play cmd 0x1005 (channel/mode/track)** framing from the proven `ahm_server.py`. Source: `C:\Users\jamie.peters\Documents\ahm-meter\ahm_server.py`. Protocol details in [[AHM Reverse Engineering]] and `Desktop\Beyond Bell Commander\AHM\AHM-Control-Documentation.md`.
- Note: playback = AHNet (TCP 51321 + UDP), NOT the documented :51325 MIDI port. Driver currently holds the :51325 session for mutes/levels; playback needs the AHNet channel alongside it (as ahm_server.py already does both).

## Next steps (suggested order)
1. Wire `play_track()` from ahm_server.py; add an integration test against the office AHM at 172.16.200.127.
2. FastAPI layer in `bellcommander/web/` — serve the Schoolyard UI (built static files from [[Bell Commander Demo UI]]) + REST for ring/skip/evac/next-bell.
3. EVAC GPIO input (BCM pin in config, default 17) → `supervisor.set_evac()`.
4. Telemetry client in `bellcommander/telemetry/` — SQLite queue + outbound HTTPS phone-home (spec: [[Bell Commander Telemetry]]).
5. AVIO music-bell path + auto-fallback to AHM tone (spec: [[Bell Commander UI Spec]]).
6. systemd unit + hardware watchdog + read-only rootfs; golden image.
7. Load a real site config.json (Campbelltown bell times + [[NSW 2026 Term Dates]]).

## Guardrails (Architecture v2)
- Python everywhere backend; React UI built to static, no build tooling on Pi.
- One persistent AHM connection. Config schema-validated, reject loud.
- Compiler stays pure + fully unit-tested — "did we break bells?" is a CI answer.
- Node-RED = bench tool only, never in the shipped image.

## Related
- [[Beyond Bell Commander]] · [[Bell Commander UI Spec]] · [[Bell Commander Telemetry]] · [[Bell Commander Demo UI]] · [[AHM Reverse Engineering]]

#bns #project/bell-commander #handoff
