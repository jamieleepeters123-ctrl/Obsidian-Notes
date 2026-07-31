# Beyond Bell Commander — Hardware Options

**Beyond Network Solutions** · July 2026 · Companion to Product Plan v0.1
Indicative AUD pricing only — confirm with distributors before quoting. ★ = recommended standard.

---

## 1. Head End (Control)

| Option | Fits | Notes |
|---|---|---|
| ★ Crestron RMC4 | Core tier | Compact, all-IP control. 1 COM, minimal I/O — fine when zone routing lives in the DSP/Sound Node and the fire contact uses its digital input. |
| ★ Crestron CP4 | Plus / Pro | 8 relays + 8 Versiports + Cresnet + multiple COM. Needed for relay zone-switching of 100V lines, or any site wanting I/O headroom. |
| Crestron CP4N | Large campuses | Same as CP4 with dual-NIC network isolation — useful if the AV VLAN must be physically separated from the school network. Only if a site demands it. |

## 2. Bell Playback Source

| Option | Fits | Indicative | Notes |
|---|---|---|---|
| ★ BNS Sound Node (Pi build) | Core / Plus | < $120 build | Pi Zero 2 W or 3A+ (pick one), PCM5102 I2S DAC, isolation transformer/DI to balanced out, read-only rootfs, Flask HTTP API, `/health` heartbeat. BNS-branded, BNS-controlled. |
| Native Q-SYS Audio Player | Pro | included | WAVs on the Core, triggered via QRC. No extra hardware. |
| ~~WiiM / consumer streamers~~ | — | — | Ruled out: unofficial API, forced firmware updates, no PoE, consumer lifecycle. **Standing rule: no consumer streaming gear in the signal chain.** |

> **Fallback playback:** the AHM's internal Events scheduler (NTP-synced, Track Playback events, ~2.5 GB storage) holds a dormant mirror of the core timetable — bells survive a controller failure with no additional hardware.

## 3. DSP Platforms (driver targets)

| Option | Fits | Notes |
|---|---|---|
| ★ Q-SYS Core 8 Flex / Core 110f | Pro | v1 driver (QRC/TCP). Native playback, per-room routing, scripting. The flagship pairing. |
| Allen & Heath AHM-16/32/64 | Plus / Pro | Documented TCP protocol (51325) already proven in BNS test harness — cheapest path to a second driver. No internal file player → pairs with Sound Node. |
| Biamp TesiraFORTÉ | Pro alt | TTP over TCP. Common in existing school installs — good for takeover jobs. No file player → Sound Node. |
| Symetrix Prism / Radius | Plus / Pro alt | Has wave file player module. Composer control protocol. |
| BSS BLU-50/100 | Takeovers | DI protocol. Driver only if a real site demands it. |

## 4. Amplification (100V line)

| Option | Fits | Notes |
|---|---|---|
| ★ Redback A44-series mixer amps (Altronics) | Core / Plus | Local supply, spares everywhere in AU, school-budget friendly. Single or multi-zone models. |
| Australian Monitor AMC+ / AMIS series | Core / Plus alt | Local warranty, solid 100V workhorses. |
| TOA A-3600D series | Plus alt | Proven school pedigree, zone versions available. |
| Bosch Plena PLE series | Plus alt | Mixer amps with zone options. |
| ★ QSC CX-Q series (Q-SYS native) | Pro | Network amps, 70/100V capable, appear as Q-SYS inventory — one ecosystem, per-channel routing. |

## 5. Zone Switching (Core/Plus tiers)

| Option | Notes |
|---|---|
| ★ CP4 relays driving 100V line relays | Speaker-rated relay modules on the 100V runs, fired by the CP4's 8 onboard relays. Simple, serviceable. |
| Multi-zone amp with built-in zone select | Where the chosen Redback/TOA model has zone outputs, trigger via contact closure from CP4. |
| DSP matrix routing | Pro tier — no relays at all; routing is software. |

## 6. Paging Layer

| Option | Fits | Notes |
|---|---|---|
| ★ Desk paging mic into DSP/amp input | All | Simple gooseneck zone-select paging mic at the front office; ducking handled by DSP or amp priority input. |
| BNS touchscreen paging console (PiFace) | Plus / Pro | The 7" kiosk paging dashboard — zones, EVAC status, volume. Reuses the Pi 5 + Touch 2 + PoE HAT platform. Product differentiator. |

## 7. Visual Indication (secondary only — never certified alerting)

| Option | Indicative | Notes |
|---|---|---|
| ★ Algo 8128G2 IP strobe (PoE) | ~$550–650 | The defensible spec for certified visual indication. |
| ESP32 + WLED beacons | < $60 | Non-certified convenience indication only (e.g. bell-visual in noisy workshops). Positioning must stay clear. |

## 8. Network

| Option | Notes |
|---|---|
| ★ Netgear AV Line M4250 or UniFi PoE switch | Sized per site; PoE budget for panels, Sound Node, strobes, kiosk. AV VLAN isolated from DoE network — documented pre-sale. |

## 9. Fire Panel Interface

| Option | Notes |
|---|---|
| ★ Dry contact (N/C) from FIP → CP4/RMC4 digital input | Hardwired, fail-safe (open = suppress on wiring fault is the safer failure mode — confirm convention in design review). Interface relay if the fire contractor requires isolation. Termination responsibility defined in handover doc. |

## 10. Operator Surfaces

| Option | Fits | Indicative | Notes |
|---|---|---|---|
| ★ Any staff browser (CH5 web UI) | All | included | The Schoolyard UI served from the processor — office PC, iPad. Zero hardware cost. |
| BNS wall kiosk (Pi 5 + Touch 2 + PoE) | Plus | ~$350 build | Proven PiFace platform in kiosk mode pointed at the CH5 UI. Big margin vs Crestron glass. |
| Crestron TSW-770 / TSW-1070 | Pro | ~$2,000–3,500 | Native panels where the school wants the premium fit-out. |

## 11. Rack & Power

| Option | Notes |
|---|---|
| ★ Wall-mount 6–12RU rack, vented | Per BNS cable schedule + labelling SOP. |
| ★ Line-interactive UPS (Eaton/CyberPower) | Rides through brownouts; sized for processor + switch + Sound Node + amp idle. Bells that survive a power blip are a selling point. |

## 12. Speakers (supply-and-install jobs)

| Option | Notes |
|---|---|
| 100V horn speakers | COLA, playgrounds, ovals. |
| 100V ceiling speakers | Classrooms, admin, library. |
| 100V wall cabinets | Halls, corridors. |
| Model standardisation | ❓ pick one or two SKUs per type from Altronics/local supplier for spares commonality. |

---

## Tier Snapshot

| | **Core** | **Plus** | **Pro** |
|---|---|---|---|
| Controller | RMC4 | CP4 | CP4 |
| Playback | Sound Node | Sound Node | Q-SYS native |
| Audio | Single/dual-zone Redback | Multi-zone amp + relay switching | Core 110f + CX-Q amps |
| Routing | None/amp zones | CP4 relays | DSP matrix |
| Paging | Desk mic | Desk mic or BNS kiosk console | Kiosk console / SIP |
| Surface | Browser | Browser + BNS wall kiosk | Crestron panel option |
| Upgrades | — | Strobes | Strobes |

**Open hardware decisions** (feeding Plan §8): Pi model for Sound Node · standard amp SKUs · speaker SKUs · switch standard (Netgear AV vs UniFi) · fire-contact failure convention.
