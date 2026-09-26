# Bell Commander — RTP Stream Zones & Beyond Pi Receiver

**Status:** design sketch, 26 Sep 2026 — nothing built yet. Internal, not for client.
Part of [[Beyond Bell Commander]]. Revives the idea behind the archived "BNS Sound Node (Pi build)" in [[Bell Commander Hardware Options]], this time as a *receiver* fed by Bell Commander rather than a standalone player.

> Check part availability and exact specs against current datasheets before ordering — product families below are right, exact model features/codec support are from memory.

---

## The idea

Today every zone is a **DSP output** (an Atlas `ZoneSource` index). Add a second zone transport, **`rtp`**: a zone whose audio leaves Bell Commander as an RTP stream to a **receiver wired into an amp**. The two kinds sit side by side in one site (e.g. 4 Atlas zones + 6 RTP zones) and share the same groups, timetable and messages.

Carries **everything**: bells, EVAC/emergency, live paging, background music.

### Key decisions (Bell Commander / sender side)
- **Routing is done by the sender.** A hardware receiver plays whatever arrives, so each RTP zone gets its own outgoing stream. What feeds it reuses the Atlas zone-ownership model (`route_role_to_zones` / `_zone_owner`) — a bell claims the zone, a page steals or yields by the same rules. Mute/level become software gain. Engine barely changes: a **composite driver** fans DSP zones to the Atlas driver and RTP zones to a new RTP sender.
- **Stream continuously** (silence when idle) — receivers take up to seconds to lock on, so on-demand streaming would clip every page and EVAC tone's start. ~64 kbps/zone G.711, ~768 kbps/zone L16 48k mono — nothing on a LAN.
- **Clock packets off the audio callback**, not a Python timer.
- **Unicast by default, multicast optional** — multicast needs IGMP snooping and usually won't cross VLANs (cf. the cross-VLAN paging saga).
- **Codec:** L16 (full-range, music) preferred, G.711 fallback for interop. Opus between Beyond sender/receiver.

### Tradeoffs to settle
1. **EVAC reliability** — RTP is UDP, no delivery confirmation → needs per-receiver health (see below). Still *supplementary* to the certified EWIS, same as the DSP path.
2. **Echo between wired and RTP zones** — RTP zones lag DSP zones ~50–200 ms. Where they overlap acoustically a page sounds doubled → fixed receiver latency + per-zone delay alignment on the DSP side.
3. **Multicast vs unicast** (above).
4. **Codec** support depends on the receiver.

---

## Receiver recommendation

**Build a Beyond Pi receiver, and keep the sender plain standards-based RTP so commercial boxes also work.**

Why our own:
- **Real health telemetry** ("locked, receiving, output level") — a commercial RTP box only answers ping. Matters for EVAC.
- **Controlled jitter buffer** → every receiver plays at the same fixed delay → solves the echo-alignment problem properly.
- **Codec freedom** (Opus / L16) — music doesn't sound like a phone call.
- **Fleet updates** via the existing [[Bell Commander Portal]] firmware API.
- **SRTP possible** — most commercial receivers can't.
- **Cost + Beyond-branded hardware to sell.**

Commercial fallbacks for sites that insist on off-the-shelf (buy one to prove interop):
- **Algo 8301 paging adapter** — built for multicast RTP/SIP paging into an amp; supports prioritised multicast zones (EVAC can interrupt music on the device itself).
- **Barix Exstreamer range** — long-standing IP→analog decoder, flexible codecs/buffering, HTTP control API.
- **Axis C8033 audio bridge** — solid, leans on the Axis ecosystem.

Standing rule from [[Bell Commander Hardware Options]] still applies: **no consumer streaming gear in the signal chain.**

---

## Parts list (per endpoint)

| Part | Suggestion | Why |
|---|---|---|
| Board | **Pi 4 Model B (2GB)**, or Pi 3B+ | Wired Ethernet is essential for EVAC — no Wi-Fi reliance. Zero 2 W has no Ethernet. |
| Power | **802.3af PoE splitter → 5V USB-C** (not a PoE HAT) | PoE HAT + DAC HAT fight over the GPIO header. Splitter leaves it free for the DAC. |
| Audio out | **HiFiBerry DAC2 Pro / DAC+ Pro**, or **Raspberry Pi DAC Pro** (ex-IQaudio) | Clean I²S line out to the amp. Balanced-output variant or a line balancer/DI for long runs. |
| Alt audio | **Raspberry Pi DigiAMP+** | Built-in amp for small rooms with 8Ω speakers. Not for normal 100V-line school PA amps. |
| Storage | High-endurance / industrial microSD | Plus read-only root (below) — avoids the classic Pi SD death. |
| Case | **DIN-rail or rack-mount metal enclosure** | Lives in the comms cabinet next to the amps. |
| Optional | Relay on a spare GPIO, status LED, recessed reset button | Relay drives the amp's remote-on/standby contact so it wakes before a bell — ties into the existing amp keep-alive feature. |

---

## Receiver software design

### Media path — GStreamer, not hand-rolled
`udpsrc → rtpjitterbuffer → depayload → decode (L16 / Opus / PCMU) → level → alsasink`
- Jitter buffer handles reordering, loss and RTP timing; with NTP-synced clocks (**chrony** on the LAN) it plays out at a **shared fixed delay** across all receivers → DSP zones can be delayed to match.
- **10 ms packets, ~80–100 ms fixed buffer** — low enough for live paging.
- Continuous stream (silence when idle).

### Control plane — `beyond-receiver` Python agent (systemd)
- **Discovery/provisioning:** first boot advertises via mDNS (or is given the Bell Commander URL) → shows in Setup as an **unassigned receiver** → admin assigns it to a zone. **Identify** button plays a tone + flashes LED to find the box in the cabinet.
- **Config pulled, not typed:** stream port, codec, latency target, output trim, allowed sender — all from Bell Commander.
- **Heartbeat every 2–5 s** (same pattern as the wall panels' `panel_heartbeat`): stream locked, packet loss, jitter, live output level (`level` element), buffer latency, temperature, uptime, version.

### EVAC-grade health (the big advantage)
- When Bell Commander sends a bell/EVAC to a zone, it checks the receiver **reports real output level during that window** — "measure, don't infer", like the `/api/media/meters` check, but at the far end. Proves audio reached the DAC, not just that packets left the Pi.
- Heartbeat missing > N s → zone **offline** on the System page; firing an EVAC with an offline receiver raises a visible warning.
- Optional fallback: **cache EVAC tones on the receiver** so Bell Commander can send "play cached tone" as a command if the stream degrades.

### Reliability
- **Read-only root via overlayfs** (built into `raspi-config`); tiny writable partition for identity only.
- **Hardware watchdog** reboots on an agent hang.
- Stream lost → **silence**, never buzz/noise.

### Security — flag early
Plain RTP plays anything sent to its port → **anyone on the VLAN could put audio through the school PA.**
- Accept only packets from the configured **sender IP + SSRC**.
- Ideally **SRTP**, key provisioned over the authenticated heartbeat channel.
- Per-device token on the control API (same pattern as `BC_PANEL_TOKEN`).

### Updates
Agent updates through the portal firmware API; full OS images rare and manual.

---

## Bell Commander side (summary)
- `rtp` zone transport in the model + Setup UI
- Receiver registry in Setup (unassigned → assigned, Identify)
- RTP sender clocked from the audio callback
- Per-RTP-zone routing reusing the Atlas ownership model; composite driver
- Receiver health on the System page + EVAC warnings

## Next steps
- [ ] **Milestone 1:** one Pi 4 + DAC HAT, GStreamer receive pipeline, quick test sender. **Measure** real mouth-to-speaker latency and packet-loss behaviour on the office LAN before building anything else.
- [ ] Buy one Algo 8301 or Barix unit to prove standards interop.
- [ ] Then: heartbeat + registry, sender integration, health/EVAC warnings.

#bns #bell-commander
