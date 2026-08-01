# Backups — Pinned Reference

How Beyond Bell Commander's code and each deployment's live data are (and aren't yet) protected, as of 1 Aug 2026. Three different things get backed up three different ways — code, per-site runtime data, and this vault — don't conflate them.

## 1. Code — `Beyond Bell Commander` repo
Root: `Desktop\Beyond Bell Commander` (a real git repo — `engine/` inside it is *not* its own repo, easy to assume otherwise). Active work happens on **`feature/ux-audit-fixes`**, kept level with **`beta`**.

- **This machine** is the main copy.
- **`tooling` remote** — `jamie@172.16.200.151:repos/beyond-bell-commander.git`, i.e. the [[Tooling Docker Host]] doubling as a bare-repo git host. Real, pushed-to, working.
- **GitHub — done, 1 Aug.** `beyond-bell-commander` (private) created by hand on github.com since no `gh` CLI exists here and the cached fine-grained PAT couldn't create repos via the API. Same PAT then couldn't even *push* to it either (fine-grained tokens are scoped to specific repos at creation, and this new one wasn't on the list) — fixed with a fresh classic PAT (`repo` scope, works for any repo going forward) stored in the git credential manager. Both `beta` and `feature/ux-audit-fixes` pushed; `beta` set as the repo's default branch to match the project convention.
- **`backup.sh` / `beta` vs `feature/ux-audit-fixes`** — resolved 1 Aug. `beta` was 30 commits behind; turned out its 2 unique commits (dashboard fill-width, sidenav ultra-wide breakpoint) were both already superseded by later work on the feature branch (identical `.wrap` change; the breakpoint got tuned further, 2800px vs beta's 2528px). Recorded as a real merge (`-s ours`, no file changes) rather than force-pushing `beta`'s ref, so history stays honest; `beta` then fast-forwarded cleanly. Both branches pushed, both at the same commit, 437/437 tests green. `backup.sh` needs no changes — it was already pointed at the right branch, `beta` just needed to catch up.

## 2. Per-site runtime data — NOT code, never in git
Real school config (zone names, bell schedule, EVAC audio) is data, not source — `.gitignore` explicitly excludes `office-pi-config-backups/`, `toolkit-server-backups/`, and `engine/media/` ("site data, never code").

- **`office-pi-config-backups/YYYY-MM-DD-<label>/`** at the repo root — manually pulled dated snapshots. Existing convention (not built this session): `2026-07-20-xilica-poc`, `2026-07-21-bench`, `2026-07-22-bench`, flat dated `config-*.json` files from mid-July.
- **Scope widened 1 Aug**: `2026-08-01-office` now pulls `config.json` + `device.json` **and** `branding/` (logo + a real wallpaper, `hero-image.png`, uploaded since the branding feature shipped) **and** the full `media/` sound library (~59MB total) — not just the JSON like every prior snapshot. Same convention going forward.
- **On-device, same-disk backups** — every deploy to a Pi backs up what it's about to overwrite first. Good insurance against a bad deploy; **useless against SD-card/disk failure** since it never leaves the device — that's what `office-pi-config-backups/` is for.
  - **Fixed 1 Aug (pm)**: the hand-typed `cp file file.bak-$TS` pattern used all session had no retention limit — ~70 stray per-file `.bak-*` paths had piled up in `~/bellcommander/`. Replaced with `deploy.sh` (repo root): one `bellcommander-py.bak-*.tar.gz` snapshot of the whole package per deploy, self-pruned to the last 5, plus a test-run + curl-verify before/after. ~15 of the old stray files (all already superseded by pushed commits or the new tarballs) pruned by hand; older named milestone backups (`*-predeploy`, `xilica.py.bak-pre-circuit-breaker-*`, etc.) left alone.
  - **New, 1 Aug (pm)**: `apply_config` now also snapshots the config to `config-backups/` (kept last 10) before every overwrite it makes — separate from the deploy-time tarballs above, this one covers a bad *config PUT* (schema-valid but wrong), not a bad code deploy.
  - `branding.bak-*.tar.gz`, `static.bak-*`, `panel.bak-*` from earlier features still exist on-disk from before `deploy.sh`, untouched.
- **Gap found and closed 1 Aug**: `/etc/systemd/system/bellcommander.service` lives entirely outside `~/bellcommander/` — none of the above ever captured it. It now also carries `BC_ADMIN_PASSWORD` in plaintext (see Credentials below), which made the gap worth closing immediately rather than later. Added to `2026-08-01-office/` alongside everything else.
- **The wall tablet** stores nothing of its own — it's a Chromium kiosk pointed at the Pi's `/panel` route, so the Pi is the only place a panel copy needs to exist.

## 3. Office toolkit server (`bns-toolingdocker`, 172.16.200.151)
Doubles as the git remote *and* runs 7 Docker containers — `bellcommander`, `bellcommander-redesign`, `bellcommander-uxfix`, `bellcommander-xilica-poc`, `vzx-clone`, `homarr`, `rackbuilder`, `portainer`.

- **Portainer backup — set up 1 Aug.** Lost the admin login; reset it via Portainer's official `portainer/helper-reset-password` helper against the `portainer_portainer_data` volume (stop container → run helper → restart), rather than trying to recover the old one. Logged in via the API once to mint a scoped API token (`Settings → API tokens` equivalent, done headlessly), so the password itself isn't needed again.
- `~/backups/portainer-backup.sh` on the toolkit server (cron: `17 3 * * *`) hits `POST /api/backup` nightly, rotates, keeps 14 days. **Coverage caveat still stands** — Portainer CE's backup is its own DB (stack defs/settings/users) only, **not** the bind-mounted app data/volumes underneath each stack.
- Verified end-to-end and pulled the first archive down to this machine's `toolkit-server-backups/portainer/` — the cron keeps it rotating server-side, but nothing was actually "backed up" until a copy existed somewhere else too. Right now that off-box copy is a manual pull, same as the Pi convention above — worth automating properly (e.g. push to the Pi, or object storage) if this needs to be truly hands-off.

## 4. Credentials — deliberately NOT in this vault
Asked (1 Aug) to write a note listing every username/password for this project. Declined the plaintext-in-git version of that on purpose: this vault is pushed to GitHub, and a credentials file in git history is permanent even after it's edited or deleted, and becomes one high-value target if the account or repo is ever compromised. Chose "use a real password manager" instead of "gitignore a plaintext note" — the safer of the two options offered, so nothing in-vault stores secrets. What actually exists (told to Jamie directly, not written here):

- SSH access to the office Pi, the tablet, and the toolkit server — all key-based, no password known to Claude.
- Portainer (`jamie` / rotated again 1 Aug via the API — `PUT /api/users/1` with `newPassword`, not `password`, is the field the API actually wants) — confirmed the new password logs in and, separately, that the cron job's own scoped API token (a different credential entirely) kept working through the rotation unaffected. Save the new one into a password manager now; don't let it sit only in this chat transcript either.
- Two GitHub PATs still live in Windows' git credential manager: the original fine-grained one (Obsidian push only) and a classic `repo`-scoped one (added 1 Aug for the `beyond-bell-commander` push, still not rotated — GitHub has no API for a token to reissue/revoke itself, so that one needs the same by-hand github.com trip as creating it did). Both separate from the actual GitHub account password (unknown to Claude).
- Bell Commander's admin gate (`BC_ADMIN_PASSWORD`) — set on the office Pi 1 Aug, changed same day from `admin` to `2036`. Flagged both times as weak before setting (gates network/restart/driver-change/media-delete on a live school system reachable over the VPN) — the second change isn't actually stronger, just weak differently (4 chars, a guessable year) — set anyway on explicit instruction both times. Lives as a plaintext `Environment=` line in `/etc/systemd/system/bellcommander.service`, both on the Pi itself and in today's local `office-pi-config-backups/2026-08-01-office/` snapshot (kept current with each change).

No claim of completeness here or anywhere else — this only covers what's been directly used/observed in a Claude session, not vendor portals, DNS/domain accounts, or anything else that might exist for this project.

## Open items (1 Aug 2026)
All four original items resolved. What's left:
- [ ] Turn the Portainer off-box pull into something scheduled, not manual
- [ ] Portainer CE's backup still doesn't cover app volumes/bind mounts — decide if that gap matters enough to solve
- [ ] Move the credentials above into an actual password manager (Portainer's rotated password and the new `BC_ADMIN_PASSWORD` both included)
- [ ] Reissue the classic GitHub PAT when convenient — skipped for now, still the one pasted into a chat transcript
- [ ] `BC_ADMIN_PASSWORD` is now `2036` — still weak for what it gates (was `admin`, changed same day, neither attempt was a real strengthening); worth a proper random one once it's in a password manager and doesn't need to be memorable

## Related
- [[Beyond Bell Commander]] · [[Tooling Docker Host]] · [[Tablet Wall Panel]] · [[2026-08-01]]

#bns #reference #infra #project/bell-commander
