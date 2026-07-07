# Beyond Bell Commander — Product Plan v0.1 (Draft for Review)

**Beyond Network Solutions** · July 2026
Status: DRAFT — open decisions flagged as ❓ throughout. Mark up and return.

---

## 1. Product Definition

**What it is:** A productised school PA bell scheduling and control system. A Crestron 4-Series processor runs a universal Bell Commander program; a commissioning wizard configures it per site (DSP platform, zones, sounds, calendar, timetable). Sold as a complete deployment: hardware, install, commissioning, handover, and support.

**What it is not:** A certified emergency warning system. Bell Commander *supplements* EWIS — it accepts a fire panel dry contact to suppress all bells (and can drive secondary indication such as strobes) but never replaces AS 1670.4 certified equipment. This boundary appears in every proposal and handover document.

**Target customer:** NSW public and independent primary/secondary schools; initially schools with existing 100V PA infrastructure needing modernised control.

**Tiers:**

| Tier | Head end | Audio | Playback source | Indicative sell |
|---|---|---|---|---|
| Core | RMC4 | Existing single/dual-zone 100V amp | BNS Sound Node (Pi) | ❓ set price |
| Plus | CP4 | Multi-zone 100V amp, relay zone switching | BNS Sound Node (Pi) | ❓ set price |
| Pro | CP4 | Q-SYS Core + networked amps, per-room routing | Native Q-SYS Audio Player | ❓ set price |

❓ **DECISION:** Confirm tier names and price points. Is there a fourth "existing DSP" tier (school already owns Tesira/AHM — BNS adds Crestron + Sound Node only)?

---

## 2. Architecture Freeze

Decisions that are expensive to reverse. Once agreed, these do not change without a version bump.

### 2.1 Control layer
- Crestron 4-Series only (RMC4 / CP4). One program image for both.
- Scheduling engine in C# (SIMPL# Pro). NTP-synced, Australia/Sydney with DST, gating order: EVAC → no-bell date → weekend → term calendar → day template.
- Web UI (dashboard, calendar, wizard) served as CH5 from the processor's web server.
- ❓ **DECISION:** CH5 framework — plain HTML/JS with CrComLib, or React compiled to CH5? (Demo is React; compiling React for CH5 is proven but adds build complexity.)

### 2.2 Driver abstraction
Standard interface every DSP driver implements:

```
Connect() / Disconnect() / IsOnline (heartbeat)
TriggerBell(soundId, zoneGroupId)
SetZoneMute(zoneId, state)
SetZoneLevel(zoneId, level)
EvacSuppress(state)
```

- v1 drivers: **Q-SYS (QRC/TCP)** and **BNS Sound Node (HTTP)**. All others (Tesira, AHM, Symetrix, BSS) are v1.1+.
- ❓ **DECISION:** Confirm v1 driver pair. AHM could jump the queue given the protocol work already done — but only if a pilot site needs it.

### 2.3 Site configuration
- Single JSON file on processor flash is the complete site definition: DSP config, zones, groups, sounds, calendar, templates, I/O assignments.
- Config is exportable/importable — backup, restore, and site templating for repeat deployments.
- ❓ **DECISION:** Where do config backups live long-term? (BNS server, customer copy, both?)

### 2.4 Audio playback rule
- **Rule:** audio never streams from the Crestron. Playback source is native DSP player (Q-SYS) or BNS Sound Node feeding a DSP/amp input.
- Sound format standard: 48 kHz / 16-bit WAV, loudness-normalised across the library.

### 2.5 Fire panel integration
- Dry contact (N/C) from fire panel into processor digital input. Contact closed = EVAC suppress. Hardwired, not networked.
- ❓ **DECISION:** Standard interface detail with fire contractors — who terminates, what documentation BNS requires at handover.

---

## 3. Hardware BOM (per tier)

### Common to all tiers
- Crestron processor (RMC4 or CP4)
- Managed PoE switch (sized per site)
- Rack shelf/enclosure, labelled patching per BNS cable schedule standard
- Optional: Algo 8128 IP strobes (secondary indication only)

### BNS Sound Node v1 spec (Core/Plus tiers)
- Pi Zero 2 W (or 3A+ — ❓ decide one, not both)
- PCM5102 I2S DAC
- Isolation transformer / passive DI to balanced line out
- Official PSU, industrial-grade SD, vented case, DIN or shelf mount
- Golden image: read-only rootfs (overlayFS), Flask API, systemd + watchdog, `/health` endpoint, static IP set at flash time
- Target build cost < AUD $120 · ❓ set sell price / include in tier price

### RMC4 vs CP4 criteria
- RMC4: all-IP control, no relay zone switching, ≤ 1 serial device.
- CP4: relay/versiport zone switching, Cresnet, multiple serial, or headroom for site growth.

❓ **DECISION:** Standard amp models for Core/Plus tiers (pick one or two SKUs BNS always quotes — candidates from existing supplier relationships).

---

## 4. Software Build Phases

### v1.0 — Pilot release (ruthless scope)
- Scheduler engine + gating logic
- Q-SYS driver + Sound Node driver
- One day-template type ("Normal Day") + one-off overrides (skip next, silence today, manual ring)
- Commissioning wizard (5 steps as demoed)
- Year calendar (NSW divisions, dev days, public holidays)
- Audit log
- EVAC suppress via digital input

### v1.1
- Additional DSP drivers (priority order: ❓ AHM / Tesira / Symetrix?)
- Multiple day templates (Sports Day, Wet Weather, Exam) + calendar override from the calendar view
- Paging priority ducking integration

### v1.2+
- AHM Events fallback schedule auto-sync (Node-RED/engine pushes timetable changes to the AHM's internal scheduler)
- Voice announcement scheduling (TTS pipeline)
- Multi-site fleet dashboard for BNS support
- ❓ Anything here that should be pulled forward? Anything in v1.0 that can be cut?

**Effort estimate (working days, single developer):**

| Item | Est. |
|---|---|
| Scheduler engine + gating | 5 |
| Driver layer + Q-SYS + Sound Node | 6 |
| CH5 UI (dashboard, calendar, log) | 8 |
| Commissioning wizard | 6 |
| Sound Node golden image | 3 |
| Bench test rig + soak testing | 4 |
| **v1.0 total** | **~32 days** |

❓ **DECISION:** Timeline expectation — evenings/weekends alongside BNS work, or dedicated blocks? Drives the realistic pilot date.

---

## 5. Pilot

- **Site:** ❓ Campbelltown PS (existing relationship, EVAC audio already produced, real bell times already parsed) — confirm.
- **Success criteria:** 4 weeks unattended operation; zero missed/false bells; office staff perform a skip and a manual ring unaided; commissioning completed in ≤ 1 day on site.
- **Instrumentation:** audit log export reviewed weekly; Sound Node/processor uptime tracked.
- Pilot findings feed a v1.0 → v1.0.1 punch list before the product is sold to a second school.

---

## 6. Commercial Layer

### 6.1 Remote management — DECIDED (Jul 2026)
- **Architecture:** phone-home over outbound HTTPS (443) from each site to a BNS portal — device-initiated only, nothing inbound at schools. Heartbeats ~60 s; bell/skip/EVAC events posted live with local queueing through internet outages; commands retrieved by device polling.
- **Hosting:** self-hosted at the BNS office on the fixed IP, as a Docker compose stack (ingest API, database, dashboard, alerter) behind a reverse proxy with TLS, on an isolated VLAN, per-device auth tokens. Portable to a VPS by DNS change if scale ever demands it.
- **Non-negotiables:** external uptime watchdog (e.g. UptimeRobot) monitoring the portal from outside; UPS on portal box + router; confirm the office IP is contractually static.
- **Remote access (as distinct from telemetry):** BNS-owned 4G out-of-band gateway in the rack as the standard method; Tailscale runs on the rack side of that gateway (zero footprint on school networks). Tailscale on a school's own network only with written IT approval.
- Sites remain fully autonomous — a portal outage never affects bell operation.
- ❓ Remaining sub-decision: HTTPS polling (default) vs MQTT for the transport.

- Pricing model: hardware + install + commissioning as capex; ❓ annual support/maintenance agreement (remote monitoring via §6.1, term-date updates, sound changes) as recurring revenue — set price.
- Spares strategy: one spare Sound Node per site or BNS-held pool? ❓
- Warranty positioning: BNS warrants the system; component warranties (Crestron 3yr) passed through.
- Collateral: one-page product sheet, tiered proposal template (reuse GLA ReportLab pipeline with BNS branding), handover/user guide (reuse Kiosk User Guide format).
- ❓ **DECISION:** Crestron dealer/programmer licensing status — confirm BNS's purchasing path for 4-Series hardware and any SW licensing costs, as this affects tier pricing.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Crestron hardware cost pressures tier pricing | Sound Node margin offsets; RMC4 keeps Core tier lean |
| SD card / Pi reliability perception | Read-only FS, watchdog, industrial SD, spare policy, `/health` monitoring |
| Scope creep kills v1 | This document — v1 list is closed once signed off |
| School networks (DoE-managed) restrict device access | Design for isolated AV VLAN; document network requirements pre-sale |
| Compliance confusion with EWIS | Fixed wording in all documents; strobes sold as secondary indication only |

---

## 8. Open Decisions Summary

1. Tier names + pricing (§1)
2. Fourth "existing DSP" tier? (§1)
3. CH5 framework choice (§2.1)
4. v1 driver pair confirmation (§2.2)
5. Config backup home (§2.3)
6. Fire contractor interface standard (§2.5)
7. Sound Node Pi model — Zero 2 W vs 3A+ (§3)
8. Standard amp SKUs (§3)
9. v1.1 driver priority order (§4)
10. Build timeline model (§4)
11. Pilot site confirmation (§5)
12. Support agreement pricing (§6)
13. Spares strategy (§6)
14. Crestron purchasing/licensing path (§6)
15. Phone-home transport: HTTPS polling (default) vs MQTT (§6.1)

**Decided so far:** UI direction = Schoolyard (§2.1) · Remote management = office-hosted Docker phone-home portal + 4G out-of-band access (§6.1).

Answer the rest and the plan is executable.
