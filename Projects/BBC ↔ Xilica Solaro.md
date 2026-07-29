# BBC ↔ Xilica Solaro

[[Beyond Bell Commander]]'s third DSP driver (`XilicaDriver`, `engine/bellcommander/drivers/xilica.py`), alongside AHM ([[AHM Reverse Engineering]]) and Atmosphere. Talks to a real **Xilica Solaro QR1** over its documented third-party TCP control API. Unlike the AHM driver, the appliance owns all audio (USB → analog in) — the Solaro only routes.

## Live units

- **Real school Solaro**: 172.16.200.174:10007 (also reachable at 192.168.1.174 on the home bench LAN in earlier sessions — same physical unit, different network) — routes a real 4-zone site.
- **Bench Solaro (a different unit, [[Tooling Docker Host]] context)**: 192.168.1.210:10007, paired with a bench Pi at 192.168.1.211. **Do not confuse the two** — a device.json regression on 2026-07-30 (below) pointed the office Pi's driver at the *bench* unit's address instead of the school's, and it went unnoticed for ten days because "DSP offline" reads the same in the UI whether the address is merely wrong or genuinely unroutable.
- **Office Pi deployment**: [[Office Raspberry Pi 5]], `/home/pi/bellcommander` — a plain deployed copy, **not a git checkout**. Code changes made to the engine repo do not reach it automatically; see that note's tarball-over-ssh deploy recipe.

## Protocol basics

TCP :10007, line-based third-party control commands (`SET`/`GET`/`GETRAW`), plus a UDP push channel (:10008, `SUBSCRIBE`) for live meters — the driver uses the real subscription mechanism rather than polling `GETRAW`, matching the vendor's documented pattern. Raw wire values are dB×1000; the driver converts.

**The Solaro replies `OK`/`ERROR=<n>` to every command, including a plain `SET`** — not just `GET`s. A dormant bug (found 2026-07-23) went a long time unnoticed because `_send_line` never drained that reply; it sat in the socket buffer and corrupted the *next* `GETRAW`, scrambling fader values read back after a restart. Fixed by draining and parsing every reply, the same pattern `_get_raw` already used. Any future protocol work on this driver should assume **every write needs its reply drained**, not just reads.

## Config: which host the driver actually dials

Two independent host fields live in `device.json` on each deployment, and the precedence between them is easy to get backwards:

- **`dsp_host`/`dsp_port`** — what `XilicaDriver` (and `AtmosphereDriver`) actually connects to. Falls back to `ahm_host` only if `dsp_host` is absent.
- **`ahm_host`/`ahm_port`** — used by `AHMDriver` and by AHM-specific features (`ahnet.fetch_track_list`, channel renames). Irrelevant to a Xilica deployment except as a stale-looking field that invites confusion if it drifts out of sync with `dsp_host`.
- **The systemd unit's `BC_AHM_HOST` env var** is a *startup default*, and `device.json` wins over it entirely if either host field is present — `serve.py`: `ahm_host = device.get("ahm_host") or os.environ.get("BC_AHM_HOST")`.
- **Change it via `PUT /api/system/driver {kind, host, port}`** (`service.py: set_driver`), not by hand-editing the file — it writes atomically (`.tmp` + `os.replace`) and is the one path the System page's driver picker also uses. There's a parallel `PUT /api/system/sound {host, port}` (`set_sound_system`) that live-hot-swaps `ahm_host` *and* calls the running driver's `set_endpoint()` — useful for aligning `ahm_host` to match `dsp_host` without restarting.
- **Takes effect only on `systemctl restart bellcommander`** — `serve.py` reads `device.json` once at startup, so a driver-config change doesn't hot-apply.

## Known bugs, fixed (chronological, for anyone touching this driver again)

- **20 Jul** — fake per-zone level/mute controls that weren't wired to real ones; `set_zone_mute` was reusing *the same tag as EVAC's safety exclusion* (a real safety-relevant bug — an ordinary zone mute could have silently defeated an EVAC override). Also: saving any System-page setting silently wiped `device.json`'s driver-selection keys.
- **22 Jul** — fader response was linear; re-tapered (squared) after feedback that only the top 30% of fader travel was usable.
- **23 Jul** — Pink Noise has its own dedicated **"Pink Insert Mixer"** DSP block (bypasses Exclusion/Duckers/Matrix entirely) — driving only `Mute` left `Level` floored at −100dB regardless. Fader unity fixed: 100% now means 0dB, not the raw +15dB hardware ceiling (`FADER_UNITY_MAX_DB`, applied to `set_zone_level`/`set_input_level` only — `set_source_gain` correctly keeps the full range). Reply-draining bug above.
- **26 Jul** — **connect-timeout circuit breaker.** `_ensure()` re-dialled the DSP on every single write with no cooldown; against an unreachable unit each attempt burned the full 2s connect timeout, and `evac_suppress` alone issues 12-16 writes — so on an offline DSP, **starting an EVAC took 32s and clearing it 26s**, with an operator's finger on an emergency control the whole time. Fixed with `RECONNECT_COOLDOWN` (5s): a failed connect suppresses further attempts until the cooldown expires, so one batch of writes pays the timeout once. An explicit `connect()` or a corrected `set_endpoint()` clears the cooldown immediately (commit `e83971e`). **Not deployed to the office Pi as of 2026-07-30 — see below.**

## 2026-07-30 — device.json regression, found via an unrelated PTT test

While verifying [[Tablet Wall Panel]]'s new physical push-to-talk switch end-to-end, the office Pi's engine (`Xilica POC` site) hung completely under nothing more than normal request load — `/api/status` itself stopped responding, and `systemctl restart` had to `SIGKILL` the process after a 90s graceful-stop timeout because it wasn't even responding to `SIGTERM`.

**Root cause: `device.json`'s `dsp_host` had regressed to `192.168.1.210`** — the *bench* Solaro's address (a different site's device entirely, unroutable from the office LAN) — rather than the real school unit at `172.16.200.174` that the 20 Jul session had correctly set. Exactly how it drifted is unconfirmed, but the office Pi's `device.json` is hand-editable and has been touched by more than one POC/testing session since. **And the office Pi's deployed driver predates the 26 Jul circuit-breaker fix above** — the two compounded: a wrong-but-plausible-looking address, on code with no timeout protection at all, produces exactly this failure mode (a request that blocks forever rather than failing fast).

**Fixed:**
- `PUT /api/system/driver {"kind":"xilica","host":"172.16.200.174","port":10007}` — corrected `dsp_host`.
- `PUT /api/system/sound {"host":"172.16.200.174","port":10007}` — aligned the stale `ahm_host` to match, live, without a restart.
- `systemctl restart bellcommander` to apply — came back clean this time (`Deactivated successfully`, no `SIGKILL`), confirming the earlier hangs were purely the unroutable address, not a deeper fault.
- Verified: `GET /api/status` → `"online":true`, panel sidebar shows "Sound system online."
- Backed up the now-fully-consistent `device.json` to `device.xilica-poc-backup-2026-07-30-verified-good.json`, alongside the existing `device.xilica-poc-backup-2026-07-20.json`.

**Still open:** the office Pi's `xilica.py` does not have the `RECONNECT_COOLDOWN` circuit breaker from `e83971e` — it's a plain deployed copy, not a git checkout, and that fix was never pushed to it. The DSP address is correct now, but **a future DSP outage on this box (reboot, cable, switch) will reproduce today's hang** exactly as the 26 Jul commit message warned. Porting that one file is the natural next step, not yet done.

## Related

[[Beyond Bell Commander]] · [[Office Raspberry Pi 5]] · [[Tablet Wall Panel]] · [[2026-07-30]]

#bns #project/bell-commander #xilica #hardware
