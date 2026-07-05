# Pi Kiosk Config (Pi 5) — Pinned Reference

## Hardware
- Raspberry Pi 5, Touch 2 display (DSI-2, 720×1280 portrait, rotated left via xrandr)
- Waveshare PoE HAT with NVMe
- Raspberry Pi OS Bookworm Lite 64-bit

## Stack
- Flask on port 80 (run as root via systemd)
- Chromium kiosk mode, Openbox, Xorg — no desktop environment

## Boot flow
systemd auto-login → `.bash_profile` fires `startx` → `.xinitrc` launches Openbox + Chromium

## Paths
- App: `/home/pi/kiosk/app.py`
- Static: `/home/pi/kiosk/static/`
- Boot URL: `/home/pi/kiosk/boot_url.txt`

## Display & touch
- xrandr rotate left; Chromium `--window-size=1280,720`
- Touch calibration:
  ```
  xinput set-prop 6 "Coordinate Transformation Matrix" 0 -1 1 1 0 0 0 0 1
  ```

## Misc
- Virtual keyboard: simple-keyboard (`static/keyboard.js`, `keyboard.css`)
- Save & Launch → `sudo reboot` (not Chromium relaunch)
- Pi 5 IP: `192.168.1.151`
- Git repo at `/home/pi/kiosk/`; VS Code Remote-SSH workflow

#reference #kiosk
