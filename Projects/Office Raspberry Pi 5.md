# Office Raspberry Pi 5

Referenced from four other notes ([[Beyond Bell Commander]], [[BBC ↔ Xilica Solaro]], [[2026-07-20]], [[2026-07-30]]) but never had its own page until this backups/vault audit (1 Aug 2026) — writing down what's actually been verified about it rather than leaving those links dangling.

## Access
- **IP:** `172.16.200.217`, over the Sophos VPN (office subnet, same as [[Tooling Docker Host]])
- **SSH:** `ssh pi@172.16.200.217`
- **Service:** `bellcommander.service` (systemd) — `sudo systemctl restart bellcommander` / `status` / `reboot`

## Deployment model
`/home/pi/bellcommander` is a **plain deployed copy, not a git checkout** — code changes in the `Beyond Bell Commander` repo don't reach it automatically. The working deploy recipe (used repeatedly through July/Aug):
- Backend `.py` changes: `tar czf` the changed files from the local repo → `scp` → extract over the existing tree on the Pi.
- Static console/panel changes: same tar/scp/extract pattern for `bellcommander/static/` and `bellcommander/panel/` — clear out the old JS bundle in `static/assets/` first, since Vite hashes filenames per build and a stale one otherwise just sits there unreferenced.
- Always back up whatever's about to be overwritten first (`*.bak-<timestamp>` / `*.bak-<timestamp>.tar.gz`, right there in `~/bellcommander/`) — see [[Backups]] for why that alone isn't sufficient.
- Restart the service, then verify with a real `curl`/API call — not just "no error on deploy."

## Currently: standing in for the Xilica POC
**Not currently driving the real live school AHM install.** Repurposed 20 Jul 2026 as a 4-zone Xilica Solaro proof-of-concept (the real install is 8 zones on a real AHM) after a driver-swap test crashed it as predicted. The real school's config is backed up on the Pi itself:
- `config.school-backup-2026-07-20.json`
- `config.xilica-poc-backup-2026-07-20.json` / `device.xilica-poc-backup-2026-07-20.json`
- `device.xilica-poc-backup-2026-07-30-verified-good.json`

⚠ Exact, verified step-by-step revert-to-live instructions aren't written down anywhere yet — right now reverting means restoring `config.school-backup-2026-07-20.json` (and the matching pre-POC `device.json`, not yet clearly identified/backed up alongside it) and confirming the driver picker is back on AHM, not Xilica. Worth nailing down properly before it's actually needed under time pressure.

## Known quirk
On restart, the log line `driver.connect() failed at startup; will retry lazily` shows up consistently (seen repeatedly through the Aug 1 wallpaper/preview deploys) — appears benign/expected given the driver connects lazily, but not confirmed against the driver source.

## Related
- [[Beyond Bell Commander]] · [[BBC ↔ Xilica Solaro]] · [[Tablet Wall Panel]] · [[Tooling Docker Host]] · [[Backups]]

#bns #project/bell-commander #infra
