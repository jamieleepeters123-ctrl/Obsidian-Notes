# Rack Builder App

3D rack-planning web app. Now runs **standalone in Docker** on the tooling host.

## Deployment
- **Primary (standalone):** `172.16.200.151:5000/rack-builder` — on **bns-toolingdocker**, as its own Compose stack at `~/apps/rackbuilder/` (gunicorn on `python:3.12-slim`, `data/` bind-mount for `equipment.db` + `equipment_files`). See [[Tooling Docker Host]].
- **Original (legacy):** `192.168.1.42:5000/rack-builder` — still lives inside the PiFace kiosk monolith (`/home/piface/kiosk/app.py`). Untouched; kept running for now.

Migrated 2026-07-09: extracted the equipment CRUD + rack-layouts routes out of the kiosk app into a self-contained Flask + SQLite service. The standalone DB is an **independent point-in-time copy** — it does **not** sync with the Pi.

## Features
- 3D visualiser (Three.js + OrbitControls)
- Equipment library (`/equipment` editor — CRUD, file attachments)
- Saved rack layouts
- PDF export
- ~~AI Export (Gemini)~~ — **removed** in the standalone build. No autofill / render-views / fetch-sources, no external API calls. (Earlier SDXL attempt on the inference server had already failed to produce usable output.)

## Related
- [[Tooling Docker Host]]
- [[AI Inference Server]]

#bns #project/rack-builder
