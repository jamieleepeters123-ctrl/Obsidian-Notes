# Backups — Pinned Reference

How Beyond Bell Commander's code and each deployment's live data are (and aren't yet) protected, as of 1 Aug 2026. Three different things get backed up three different ways — code, per-site runtime data, and this vault — don't conflate them.

## 1. Code — `Beyond Bell Commander` repo
Root: `Desktop\Beyond Bell Commander` (a real git repo — `engine/` inside it is *not* its own repo, easy to assume otherwise). Active work happens on **`feature/ux-audit-fixes`**.

- **This machine** is the main copy.
- **`tooling` remote** — `jamie@172.16.200.151:repos/beyond-bell-commander.git`, i.e. the [[Tooling Docker Host]] doubling as a bare-repo git host. Real, pushed-to, working.
- **GitHub** — not set up yet. No `gh` CLI on this machine, so it needs a repo created on github.com by hand, then added as a second remote here. Pending.
- **`backup.sh`** (repo root) — one-command `git add -A` + commit + `git push tooling beta`. ⚠ Targets branch **`beta`**, which as of 1 Aug is **30 commits behind** `feature/ux-audit-fixes` — all of July's work has been happening on the feature branch, not beta. Running it as-is would push stale history and indiscriminately stage anything sitting in the working tree. Needs a decision: is `beta` meant to catch up via a merge at some point, or has `feature/ux-audit-fixes` effectively become the real branch and `backup.sh` needs repointing?

## 2. Per-site runtime data — NOT code, never in git
Real school config (zone names, bell schedule, EVAC audio) is data, not source — `.gitignore` explicitly excludes `office-pi-config-backups/` and `engine/media/` ("site data, never code").

- **`office-pi-config-backups/YYYY-MM-DD-<label>/`** at the repo root — manually pulled dated snapshots of a Pi's `config.json` + `device.json`. Existing convention (not something built this session): `2026-07-20-xilica-poc`, `2026-07-21-bench`, `2026-07-22-bench`, flat dated `config-*.json` files from mid-July, and now `2026-08-01-office` (the real office Pi, pulled during this session).
- **Scope gap**: this convention only ever captured config/device JSON — never the branding images (~4MB) or sound library (~55MB on the office Pi). Those exist only on the Pi itself right now. Worth deciding if they need their own periodic pull.
- **On-device, same-disk backups** — every deploy to a Pi backs up what it's about to overwrite first: `config.json.bak-*`, `branding.bak-*.tar.gz`, `bellcommander-py.bak-*.tar.gz`, `static.bak-*`, `panel.bak-*`, accumulating in `~/bellcommander/` on the Pi. Good insurance against a bad deploy; **useless against SD-card/disk failure** since it never leaves the device — that's what `office-pi-config-backups/` is for.
- **The wall tablet** stores nothing of its own — it's a Chromium kiosk pointed at the Pi's `/panel` route, so the Pi is the only place a panel copy needs to exist.

## 3. Office toolkit server (`bns-toolingdocker`, 172.16.200.151)
Doubles as the git remote *and* runs 7 Docker containers with no backup tool installed at all (checked 1 Aug: no restic/borg/duplicati, just rsync) — `bellcommander`, `bellcommander-redesign`, `bellcommander-uxfix`, `bellcommander-xilica-poc`, `vzx-clone`, `homarr`, `rackbuilder`, `portainer`.

- Decided: **Portainer's built-in backup**, not Restic.
- Caveat: it's Portainer **CE**, which only does a manual "Download backup" from Settings — no scheduler (that's a Business Edition feature). CE's backup also only covers Portainer's own DB (stack defs, settings, users) — **not** the actual bind-mounted app data/volumes underneath each stack.
- To automate it needs an admin API token (Settings → API tokens) so a cron job can hit `POST /api/backup` on a schedule and stash the archive somewhere off that same box. **Blocked on getting that token.**

## Open items (1 Aug 2026)
- [ ] Create the GitHub repo + add as a second remote
- [ ] Get a Portainer API token, script the scheduled backup, and confirm the archive actually lands somewhere *other* than the toolkit server itself
- [ ] Resolve `backup.sh`'s `beta` vs `feature/ux-audit-fixes` mismatch
- [ ] Decide whether branding images / sound library need their own backup convention alongside config/device

## Related
- [[Beyond Bell Commander]] · [[Tooling Docker Host]] · [[Tablet Wall Panel]] · [[2026-08-01]]

#bns #reference #infra #project/bell-commander
