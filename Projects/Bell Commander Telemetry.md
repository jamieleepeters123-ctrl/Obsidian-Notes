# Bell Commander Telemetry

Phone-home data captured from each site → BNS office portal (Docker, fixed IP). Outbound HTTPS :443 only, device-initiated. Heartbeat ~60 s; events posted live with local queueing through outages; commands via device polling.

## Bell operation (core promise)
- Every bell: scheduled vs actual fire time (drift), sound, target group, result
- Skips, manual rings, EVAC holds — with which user/surface triggered them
- Missed bells + reason (DSP offline, config error) — the headline report number
- Daily summary: bells expected vs delivered

## AHM / audio chain health
- TCP session state, disconnect/reconnect counts, command round-trip latency
- Playback confirmations vs failures; zone mute/level snapshots
- Dante amp reachability per block (ping, or LEA API if LEA amps chosen)

## Pi appliance health
- CPU temp, load, memory, disk wear/free, uptime, unexpected reboots
- Node-RED flow errors/restarts; UI process alive; software + flow version per site
- NTP sync status and offset (silent drift = broken bells)
- Undervoltage/throttling flags

## Network & environment
- Internet reachability, heartbeat gaps, DNS failures
- Switch / inter-block link status via SNMP (M4250)
- Portal-side: TLS cert expiry, token auth failure bursts

## Safety events — log forever, never prune
- Every EVAC contact close/open with timestamps + what was held
- BNS's professional protection if a school incident is ever reviewed

## Usage & commercial intelligence
- Feature usage (skip vs manual ring vs calendar edits) → roadmap input
- Config changes: who/what/when (audit trail + config backup-on-change)
- Timetable/term-date changes per year → support agreement value evidence

## Reporting payoff
Per-term PDF per school via ReportLab (Schoolyard-branded): *"Term 3: 1,240 bells scheduled, 1,240 delivered, 0 missed, 2 EVAC events handled correctly, uptime 100%."* Renews support agreements by itself.

## Guardrails
- Heartbeats tiny: state changes + events, not raw logs (pull logs on demand via command polling)
- Timestamp in UTC at source
- Retain bell/safety events for years; roll up health metrics after ~90 days

## Related
- [[Beyond Bell Commander]]

#bns #project/bell-commander
