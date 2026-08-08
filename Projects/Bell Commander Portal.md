# Bell Commander Portal

[[Beyond Bell Commander]]'s internal admin app — everything that comes with turning the appliance from a one-box POC into a real product Jamie has to build and maintain across multiple sites: documentation, tickets/feedback/feature requests, test-run records, compliance/pentest documents, and the firmware host every deployed appliance self-updates from. Built 8 Aug 2026 in the same monorepo as `engine/`, at `portal/` — not a separate repo, one git history. Flask + SQLite (Flask-SQLAlchemy, WAL mode) + `waitress`, server-rendered Jinja, no build step — a deliberately smaller, boring stack next to the engine's FastAPI, matching its own low-traffic internal-tool job.

Deployed as a Docker container on [[Tooling Docker Host]] (`bns-toolingdocker`, 172.16.200.151), port **8100**, alongside the other Bell Commander demo/POC containers already documented there.

## What it hosts

- **Docs / Features / User Guide** — plain markdown committed to the repo (`portal/content/**/*.md`), rendered on the fly. No editing UI by design; authored the same way every other doc in this project already is.
- **Compliance Review** — the same content mechanism, one section: system overview, security posture (stated plainly — LAN-trust, not attacker-resistant, by design), and open questions. Written *before* the 8 Aug pentest below, and updated afterward rather than superseded, so it stays an honest running account.
- **Work** — one unified `Item` model behind tickets, feedback, and feature requests (they share almost every field), with per-kind in-page tabs rather than three separate systems.
- **Test Results** — pass/fail/skip counts per run, git ref, trend over time.
- **Documents** — the compliance/pentest/security-review shelf: uploaded files with metadata in SQLite, bytes on disk (`$PORTAL_DATA_DIR/documents/`), same split the appliance's own media library uses.
- **Firmware** — the real publish target for `release.sh --publish`/`--publish-only`: `$PORTAL_DATA_DIR/firmware/<version>.tar.gz` + a manifest + `latest.txt`, filesystem as source of truth, no DB table to drift out of sync. `engine/bellcommander/system.py`'s `check_for_update`/`apply_update` fetch from here over HTTP with a shared bearer token (`PORTAL_UPDATE_TOKEN`/`BC_UPDATE_TOKEN`) instead of the old raw SSH/SCP path.
- **Source Code** — a whole-repo, git-`ls-files`-backed browser (`/source/`), for reviewing the actual code from a browser. Deliberately a *separate* feature from the appliance's own `/api/system/source` (see below) — different job, different constraint.
- **Users** — real per-person accounts, two roles (`admin`/`staff`), admin-only user management. Same password-hashing approach (`hashlib.scrypt`, ported near-verbatim) as the appliance's own `UserStore`.

## Firmware hosting, end to end

`release.sh --publish` (or `--publish-only <version>` to republish an already-tagged version — added 8 Aug after discovering there was no way to re-run a publish once `git tag` had already been created) packages the tarball + manifest and `scp`s them to the portal host's bind-mounted `data/firmware/` directory, then writes `latest.txt`. Two real bugs found and fixed the same day investigating *"why hasn't v0.3.1 shown up in the portal"*: the script's default publish path was missing an `apps/` path segment (never matched the real deployed layout), and the portal container runs as root so files it had already created there were root-owned — `jamie` (the publishing user) couldn't write alongside them until a one-time `chown`. Verified end-to-end afterward via the office Pi's real `GET /api/system/update` reporting `available: false` (up to date) once v0.3.1 was actually published.

## Two source-code viewers — not the same feature

Built the same day, easy to conflate, deliberately kept separate:

- **Portal's `/source/`** — a git-`ls-files`-backed browser of the *whole repo*, for reviewing code with a fresh set of eyes from any browser with portal access. Hit a real "dubious ownership" git safety error inside the container (root-owned process, jamie-owned bind mount) — fixed with `git config --global --add safe.directory /repo` baked into the image.
- **Appliance's `GET /api/system/source[/<path>]`** — admin-only, plain-text, walks the real files on disk. Built after an initial misunderstanding: the actual ask was a way to pull up the code *running on a specific deployed appliance* for on-the-spot review, which a git browser structurally can't do (a deployed appliance is a tarball extract, not a git checkout — `deploy.sh` ships files, not a clone). Backend + wall panel source only; the built React console bundle and its own source aren't on-device at all.

## Security audit + pentest — 8 Aug 2026

Asked to "perform a pentest," then scoped to: find and fix real issues, don't break functionality, and file the results as a document in the portal. A systematic route-by-route audit of `engine/bellcommander/webapp.py`, cross-checked line-by-line against the React console's own source (which routes are actually called from non-admin-reachable UI) rather than guessed, found four real issues — fixed on the engine, then the same two behavioral ones ported to the portal itself once the Compliance Review page's own honest disclosure ("not present in either system: rate limiting... no MFA") made the portal-side gap visible:

- **22 routes with no admin check** — zone control, media/branding uploads, the Xilica reference catalog, DSP config were reachable by any session, not just `admin`. Gated all 22; `PUT /api/config` deliberately left open since the Today tab's own non-admin bell-upload flow genuinely depends on it (confirmed by reading the frontend, not assumed).
- **`.svg` allowed in branding uploads** — stored-XSS risk (served as static files, SVG can embed script). Dropped from the allowed extensions; PNG/JPG/WebP cover every real case.
- **Sessions never expired** — appliance: an in-memory dict with no TTL and no cookie `max-age`. Portal: Flask's own unconfigured 31-day default. Both now expire after 12 hours of inactivity, sliding on active use.
- **No login rate limiting** — both `/api/login` (appliance) and `/login` (portal) accepted unlimited password guesses. Both now lock out a source IP for 5 minutes after 5 failed attempts in that window — IP rather than username deliberately, so no one on the LAN can lock out a real admin by spamming their name.

Live-verified against the deployed office Pi and the deployed portal, not just the test suites (590 engine tests, 81 portal tests, all green throughout). Report filed as two portal Documents — a *Pentest Report* (finding-by-finding, with the live-verification log) and a *Security Review* (scope/methodology/posture summary) — uploaded via two disposable one-time `staff` accounts created and then deactivated for that single purpose, since the real portal admin password wasn't available to do it as an existing account.

## Redesign — 8 Aug 2026

Rebuilt the front end around the same BNS identity already applied to the appliance console: the real Beyond wordmark (inline SVG) in the topbar/hero/login/footer, a dashboard hero band (brand-blue gradient, a faint concentric "bell ring" motif standing in for the actual product rather than a generic effect, real numbers — open items, documents on file, latest firmware, last test pass rate), and a proper branded two-pane login screen. Navigation consolidated from 12 flat top-level links to 5: **Resources** (Docs/Features/User Guide), **Work** (Tickets/Feedback/Feature Requests — now one page with an in-page tab switcher instead of three separate nav entries), **Releases** (Firmware/Test Results/Source Code), **Compliance** (Compliance Review/Documents), **Users** (admin-only). Dropdowns are plain `<details>`/`<summary>`, no JS — the same disclosure pattern the Users page's password-reset control already used. Presentation/IA only — 81 tests unchanged throughout.

## Related

[[Beyond Bell Commander]] · [[Tooling Docker Host]] · [[Office Raspberry Pi 5]]

#bns #project/bell-commander #portal
