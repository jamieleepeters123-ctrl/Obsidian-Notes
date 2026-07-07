# Bell Commander Demo UI

Working React demo of the Bell Commander interface — **Schoolyard** design language (blazer green + bell brass, warm paper, Nunito, tactile buttons).

Source file: [[bell-commander-demo.jsx]] (in Attachments)

## What it contains
- **Today / Dashboard** — live countdown to next bell, chalkboard-green timeline with a moving "now" cursor, Ring the bell / Skip next / Emergency test. Demo clock starts 10:57 am so the 11:00 recess bell fires live with a synthesised bell tone.
- **Calendar** — full NSW 2026 year view (Eastern division terms, dev days, public holidays). Tap any day to preview what rings; school days in brass, no-bell days in red.
- **Zones** — plain-language zone list with status + mutes; bell groups.
- **Log** — every bell RUNG / SKIPPED / HELD, timestamped.
- **Setup wizard** — 5 steps: Sound system (Q-SYS / AHM / Tesira / Symetrix / Sound Node), Zones, Bell sounds, School, Timetable (URL import with raw-text review + per-row ring toggles).

## How to run
It's React source, not a standalone app. Options:
1. **Vite project (PC):** `npm create vite@latest` → React → replace `src/App.jsx` with this file → `npm install` → `npm run dev` → localhost:5173. Same way it'd run on the Pi kiosk.
2. Paste into an online React sandbox for a quick look.

## Notes
- Simulated data only (Campbelltown PS, Q-SYS Core 110f, CP4) — no live hardware calls.
- Voice/labels deliberately written for front-office staff, not integrators.
- This is the UI layer only; the real engine is Node-RED + AHM per [[Beyond Bell Commander]].

## Related
- [[Beyond Bell Commander]]
- [[Bell Commander Telemetry]]

#bns #project/bell-commander
