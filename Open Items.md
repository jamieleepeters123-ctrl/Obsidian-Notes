# Open Items

Consolidated backlog across every project — swept from scattered TODOs/checkboxes/"pending" notes across the vault, 1 Aug 2026. Not a duplicate of each note's own detail — this is the index; follow the links for context. Update this when something here gets resolved, and check other notes for new ones before assuming this list is complete.

## Backups & infra
Full detail in [[Backups]] — headline items only here:
- [ ] Turn the Portainer off-box backup pull into something scheduled, not manual
- [ ] Portainer CE's backup doesn't cover app volumes/bind mounts — decide if that gap matters enough to solve
- [ ] Move credentials (Portainer, `BC_ADMIN_PASSWORD`) into an actual password manager
- [ ] Reissue the classic GitHub PAT — parked, still the one pasted into a chat transcript
- [ ] `BC_ADMIN_PASSWORD` is `2036` — weak for what it gates, wants a real random one once it's in a password manager
- [ ] Add a **Caddy reverse proxy** on [[Tooling Docker Host]] once there are a few more apps — clean hostnames instead of juggling ports, automatic TLS

## Hardware — needs physical, on-site access
- [ ] **[[BBC ↔ Xilica Solaro]] bench Pi, USB card 3 (Preamble/BGM)** — zero signal reaching the DSP even at full ALSA volume; BGM on the same dongle shows only a faint trace. Points to a bad cable, wrong input, or a partially faulty channel — can't be fixed remotely, needs someone on the bench. (From [[2026-07-23]]; not yet written into the project note itself.)
- [ ] **[[Tablet Wall Panel]] relay GPIO** — still unidentified since 14 Jul. The schematic that solved the switch terminal was for a different connector; the R157 *mainboard* schematic is the next lead if picked up.
- [ ] **[[Office Raspberry Pi 5]] revert-to-live steps** — reverting from the current Xilica POC back to the real school AHM setup isn't actually documented step-by-step anywhere, just "restore the backed-up config and confirm the driver picker." Worth nailing down before it's needed under time pressure.
- [ ] **[[AHM Reverse Engineering]]**: confirm `192.168.1.168` is static (commissioning checklist item); matrix crosspoint routing is implemented and gated but activation is pending one live axis/source-row experiment.

## Site data pending
- [ ] **[[Campbelltown PS]]** onsite EVAC voice file — offsite version done, onsite still waiting on the voice recording.

## Bell Commander — bugs & questions
Full detail in [[Bugs]]:
- [ ] Switching between the DSP's internal media player and Bell Commander's own doesn't reflect exact file names in each — was a smooth-migration tradeoff, but accuracy should win even if it means renaming files.
- [ ] Idea: auto-detect a connected Beyond panel from the server (a file/heartbeat the panel drops), report its IP and let the server drive its brightness/sleep times.
- [ ] Question: could two 2-channel USB interfaces run as two separate media players instead of one 4-channel interface?

## Bell Commander — concepts not yet built
- [ ] **[[Commissioning Agent]]** — a dedicated step-by-step commissioning wizard (admin + end-user paths), instead of the current setup flow that's grown organically feature-by-feature.
- [ ] **[[New features i want to explore|client-facing web page]]** — a simple page to welcome/introduce a client to their system (zones, mics, tones, EVACs, timetable) and capture info useful both for quoting and for programming the actual install.
- [ ] See **[[Bell Commander — Internal Notes (not for client)]]** (2 Aug) for the full list of ideas/archived plans kept deliberately out of client-facing material.

## The Candle Collection
- [ ] GPT hero/story imagery — blocked on OpenAI billing hard limit. `gen_images.py` (gpt-image-1) is ready to run once that's lifted; stand-in photos are live in the meantime (`static/img/hero.jpg`, `story.jpg`).
- [ ] Consider Stripe/PayID checkout later.

## Related
- [[Home]] · [[Backups]]

#bns #reference
