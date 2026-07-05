# Beyond Bell Commander

Productised school PA + bell scheduling system under the BNS brand.

## Architecture (current — Jul 2026)
- **Brain & face:** Pi 5 + 7" touch display — Node-RED scheduling engine, Schoolyard web UI (kiosk + any staff browser), GPIO EVAC contact input, phone-home client. Commissioning via web UI.
- **Audio:** Allen & Heath AHM-16 — internal WAV bell player (bells stored on the unit), matrix routing, priority ducking for paging. Triggered over documented TCP :51325 (ahm_player.py work ports straight in).
- **Distribution:** Dante I/O card in the AHM → decentralised Dante amps per block → local 100V speakers. One network drop per block; a block failure silences only that block.
- **Network:** Netgear M4250 (Dante AV VLAN, IGMP, PTP QoS).
- **No Sound Node** — AHM internal player removed the need. AHM-16 is the product floor.
- **Crestron:** not in the prototype. If a tender demands it, a CP4 slots in above the Node-RED engine as I/O + badge. Identity = BNS appliance.
- **EVAC:** FIP dry contact (N/C) → Pi GPIO → holds all bells. Supplementary only — certified EWIS (AS 1670.4) always independent.

## UI
- Direction locked: **Schoolyard** — blazer green + bell brass on warm paper, plain language ("Ring the bell", "held", "skipped"), tactile buttons. Full working React demo built (dashboard w/ live countdown + chalkboard timeline, year calendar w/ NSW terms, zones, log, 5-step setup wizard).

## Remote management (decided)
- Phone-home over outbound HTTPS to office-hosted Docker portal (fixed IP — confirm contractually static). External uptime watchdog + UPS non-negotiable. VPS migration = DNS change.
- Remote access: 4G out-of-band gateway w/ Tailscale on rack side (school-network Tailscale only with written IT approval). Dropped from prototype diagram for now.
- Telemetry spec: [[Bell Commander Telemetry]]

## Prototype (next build)
Pi 5 + 7" display · AHM-16 + Dante card · one Dante amp as stand-in block · M4250 · GPIO EVAC via optocoupler on bench.
- Keep scheduler logic in structured function node / sidecar service — flows only for drivers + orchestration
- One persistent AHM TCP session with heartbeat/reconnect
- Bench-verify: AHM WAV storage limits (files live in config — test backup/restore loaded), and direct playback-channel trigger vs preset-recall workaround (RX inspector on System Manager)

## Docs produced
- Product Plan v0.1 (14+ open decisions flagged; §6.1 remote mgmt decided)
- Hardware options list (12 categories, tier snapshot)
- Signal flow SVGs (analogue + Dante versions, Schoolyard-styled)
- UI direction comparison sheet (4 options → Schoolyard chosen)

## Status
- Demo UI complete (Schoolyard skin)
- Bell scheduler fetches real bell times (see [[Campbelltown PS]]) and [[NSW 2026 Term Dates]]
- Evac audio produced for Campbelltown PS (offsite version done, onsite pending voice file)

## Related
- [[Bell Commander Telemetry]]
- [[Strobe Beacon Spec]] — visual alerting companion
- [[AHM Reverse Engineering]] — protocol groundwork the driver reuses
- [[Campbelltown PS]]

#bns #project/bell-commander
