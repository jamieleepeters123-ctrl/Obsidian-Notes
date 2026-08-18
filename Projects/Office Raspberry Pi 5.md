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

## Audio: RaspiAudio 8xOUT (added 18 Aug 2026)

**Not a HifiBerry**, despite what every log line says. The HAT EEPROM reads `product: 8xOUT`, `vendor: Raspiaudio.com` — it's a RaspiAudio 8xOUT that identifies as DAC8x-compatible, so the stock in-kernel `snd_rpi_hifiberry_dac8x` overlay drives it. (Same vendor as the RaspiAudio Ultra planned for the Pi Zero paging station.) **No drivers needed** — the overlay is loaded automatically off the EEPROM, ALSA card 2, 8 outputs, no capture.

Two messages that look like faults and aren't: `no ADC8x detected` is the overlay probing for the optional ADC add-on that isn't fitted, and `Subdevices: 0/1` means the engine is holding the stream open, not that the device is broken.

**⚠ The overlay is NOT pinned in `config.txt`** — it works purely via EEPROM auto-detect. Fine today; worth adding `dtoverlay=hifiberry-dac8x` explicitly before the pending kernel upgrade (6.12.75 → 6.12.96, deliberately held back), since that's exactly when auto-detect matters.

Bell Commander's four media roles now sit on **discrete outputs 0/1/2/3** (they were doubled up on 0/1 before this card), so bells and WebRTC paging no longer share a wire — four channels spare. Verified with a 1s 880Hz tone at 30% volume: bells read **−20.9 dBFS**, exactly the expected arithmetic (0.3 generator × 0.3 volume = 0.09), with preamble/webrtc/evac flat at −80 throughout.

**System default output** is pinned in `/etc/asound.conf` **by card name (`sndrpihifiberry`), not index** — ALSA card numbers are assigned in probe order and shift when a kernel update or an added device reorders them, and "default silently became HDMI" is the wrong failure mode for a bells appliance.

> **Gotcha worth remembering:** `aplay -L` in an SSH session reports `default` as *PulseAudio*, because an interactive login starts Pulse and it shadows `/etc/asound.conf`. **The bellcommander service has no Pulse and enumerates raw ALSA devices**, so the service and a shell genuinely see different device tables — a shell test alone will mislead you here. To prove which card `default` really resolves to, use the engine's own open handle as the oracle: `aplay -D default` returning *"Device or resource busy"* means it landed on the card the service holds.

## Wi-Fi (enabled 18 Aug 2026)

Was present but **soft-blocked** out of the box (`WIFI-HW: enabled / WIFI: disabled`, rfkill `Soft blocked: yes`, `wlan0: unavailable`) — driver, firmware and `country AU` regulatory domain all fine, just the radio off. `nmcli radio wifi on` (or the new System-page toggle) is all it needed.

Now joined to **BNS-WLAN** as a *secondary* link: `wlan0` on `172.16.200.190/24`, **eth0 still primary (metric 100), wlan0 backup (metric 600)**, both on the same subnet. So this is genuine redundancy — if the wired drop fails, the box stays reachable at `.190` instead of going dark.

> **⚠ WPA3 trap, will recur at other sites.** BNS-WLAN runs in **WPA2/WPA3 transition mode** (RSN flags literally `psk sae`). NetworkManager sees both and picks the stronger — SAE/WPA3 — but the Pi's `brcmfmac` firmware doesn't implement SAE, and the failure comes back as **"Secrets were required, but not provided"**, which points straight at the password. The password is not the problem. Fix is to pin the profile to the WPA2 the same AP also offers:
> ```
> nmcli con mod <SSID> 802-11-wireless-security.key-mgmt wpa-psk >                      802-11-wireless-security.pmf 1
> nmcli con up <SSID>
> ```
> Bell Commander's own `wifi_connect` now does this automatically after a failed join (see [[Beyond Bell Commander]]'s 18 Aug pm entry), so the console handles it — this is for when you're at a shell.

## Related
- [[Beyond Bell Commander]] · [[BBC ↔ Xilica Solaro]] · [[Tablet Wall Panel]] · [[Tooling Docker Host]] · [[Backups]]

#bns #project/bell-commander #infra
