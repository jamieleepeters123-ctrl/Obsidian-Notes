# bellcommander — appliance service

Beyond Bell Commander v2 appliance. Headless Python service: scheduler + AHM driver + (todo) web UI + telemetry. See [[Bell Commander Build Handoff]].

## Run tests
```
pip install pytest pytest-asyncio --break-system-packages
python -m pytest -q
```
19 tests should pass.

## Layout
- `config/schema.py` — site config (the deployment)
- `engine/compiler.py` — pure plan compiler (fully tested)
- `engine/supervisor.py` — tick loop (EVAC gate, skip, manual, rollover)
- `drivers/ahm.py` — real AHM (persistent conn); `play_track()` = TODO seam
- `drivers/fake.py` — test double
- `web/`, `telemetry/` — stubs, next to build

## Open task
Wire `AHMDriver.play_track()` from `ahm_server.py` (AHNet play 0x1005).

## Target
Pi `172.16.200.217` → AHM `172.16.200.127:51325` (office, Sophos VPN).
