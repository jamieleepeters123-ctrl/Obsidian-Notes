# Bell Commander UI Spec

Screen + settings structure for the Schoolyard UI. Source of feature intent: daily note 2026-07-07. Working demo: [[Bell Commander Demo UI]].

> **Build status (8 Jul 2026):** the deployed appliance (`Desktop\Beyond Bell Commander\engine` — see [[Beyond Bell Commander]] → *Prototype build*) implements most of this: Network (Static/DHCP/MAC), Display brightness + sleep, Save (validated config + hot-reload), System Health (Log tab), commissioning importers. **Not yet built:** two-tier auth (login gates Setup/Settings), per-display settings, local audio-output select, and the drag-and-drop music-bell file transfer. The earlier `Code/bellcommander` skeleton + build-handoff note were **retired** — superseded by the deployed build.

## Access tiers (two levels)
- **Staff** — no login for day-to-day. Today screen, ring / skip / manual, calendar view. Office staff never fight a password to skip a bell.
- **Installer** — login (username + password) gates Setup, Settings, Network, System Health. Protects commissioning + infrastructure from accidental change.

## Main screens
- **Today** — next-bell countdown, timeline, ring / skip / emergency test (staff)
- **Calendar** — NSW year view, per-day preview, overrides (staff)
- **Zones** — status, mutes, groups (staff view; editing = installer)
- **Log** — bell RUNG / SKIPPED / HELD, local face of telemetry
- **Setup** — commissioning wizard (installer)

## Settings menu
- **Display** — resolution, scale, aspect, screensaver, sleep. **Per-display** (wall SMT101 vs office PC want different sleep/screensaver). Fits the decoupled-display model.
- **Sound** — select local audio output (e.g. USB interface / AVIO if present). This is the music-bell output path made configurable.
- **Save / Import / Export** — config JSON surfaced as UI. = backup, restore, and site-templating. (Config-is-the-deployment principle.)
- **Network** — Static / DHCP / MAC / WiFi. Appliance addressing; same static-IP discipline applied to the AHM.
- **System Health (Logs)** — local view of phone-home telemetry ([[Bell Commander Telemetry]]).

## File transfer — drag & drop with auto conversion
- **Question (daily note): "can we get file transfer working?" → YES.**
- Music bells play from the **appliance** via AVIO USB → Dante, NOT from the AHM. So the drop target is the Pi's local library, which sidesteps the AHM's closed upload path entirely.
- Flow: staff drag an MP3 → ffmpeg auto-converts (loudness-normalise, trim to max length, fade) → lands as an assignable bell → preview to a zone → attach to any timetable event.
- Schools self-serve music bells and change them each term with zero BNS labour.
- (Music licensing = school's responsibility; APRA AMCOS education licences generally cover NSW schools.)

## Related
- [[Beyond Bell Commander]] · [[Bell Commander Demo UI]] · [[Bell Commander Telemetry]]

#bns #project/bell-commander
