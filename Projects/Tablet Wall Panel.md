# Tablet Wall Panel

The Beyond paging station — a 10.1" Android/Linux touch panel kiosking [[Beyond Bell Commander]]'s `/panel` page. Modelled on the customer's Q-SYS console.

## Hardware
- **"Smart Home Control Panel"**, 10.1" — board model **ZX-SMT1019-R157-V2.0** (Rockchip **RK3576S**, quad Cortex-A55 + quad Cortex-A53/A72, 4GB/32-64GB, Debian 12 bookworm on this unit — vendor also ships Android). Manual photos: `Desktop\Beyond Bell Commander\Tablet\Manual`.
- Host: `linaro@192.168.1.214` (DHCP, IP has moved before — was `.40` earlier in the project), key `~/.ssh/bell_tablet`. Passwordless sudo.
- Kiosk: Chromium `--app=file:///home/linaro/kiosk/launcher.html`, discovers the engine via [[Beyond Bell Commander]]'s broadcast discovery, driven by `lightdm`. Companion daemons `netpanel.service` (discovery agent) and `led-panel.service` (status LED) both run here.
- Rear terminal block (from the manual, page 6, "10.1" Exterior Components"):

  | No. | Function | No. | Function |
  |---|---|---|---|
  | 1 | Camera | 8 | I/O, GND/1/2 |
  | 2 | Light sensor | 9 | IR, GND/IR/VCC |
  | 3 | Power | 10 | 485 232, A/B/GND/RX/TX |
  | 4 | Temperature sensor | 11 | DC in |
  | 5 | Speaker | 12 | Type-C |
  | 6 | Mic | 13 | RJ45 with POE |
  | 7 | Relay, 1/COM/2 | 14 | Recovery |

## Open task: GPIO-trigger Talk (2026-07-22, parked)
Goal: wire an external ON-OFF-MOM switch into port 8 ("I/O, GND/1/2") to trigger the on-screen Talk button — hold-to-talk semantics (matches the panel's own press-and-hold Talk), whatever zones are selected on screen (not a fixed group), via `xdotool`/uinput synthesizing a real touch on the button so all existing browser-side paging logic is reused as-is.

**Not implemented — parked pending real board documentation.** Investigated extensively and came up empty on every avenue that didn't risk the hardware:
- Full sweep of GPIO1 (SoC pins 32–63): no pin changes state with the switch.
- PMIC GPIO bank (`gpiochip5`/`rk806-gpio`, pins 509–511): no change either.
- `adc-keys` input device (`/dev/input/event5`): confirmed to be the physical volume buttons only (`KEY_VOLUMEUP`/`KEY_VOLUMEDOWN`), not the switch.
- `27330000.pwm` / "remotectl" gpio-keys device: the IR receiver, unrelated.
- I2C bus scan (`i2cdetect` across buses 0/1/2/3/4/7): two unclaimed addresses found and read (`i2cdump`) — bus3/0x32 looks like a small PMIC/fuel-gauge chip, bus7/0x0e is clearly an EEPROM (128-byte pattern repeating twice). Neither matches a GPIO-expander register pattern.
- Opened the case: traced the wiring to a daughterboard silkscreened **"R128-USB-V1.2 A 20250418"**, carrying two **MB6S bridge rectifiers** (a common trick for making an external switch's wiring polarity-independent) and a ribbon connector back to the mainboard's `MB` header. Consistent with the "I/O" terminal being signal-conditioned before it ever reaches the main SoC — plausibly explaining why nothing showed up on raw SoC GPIO at all (it may route through an ADC channel, a chip we haven't identified, or a small supervisory MCU).
- A serial number printed on a small board near the switch (`2606980030003`) didn't resolve to anything — it's a serial, not a part/model number.

### The real reason to stop here
Blind raw-GPIO `sysfs export` on unclaimed pins on this SoC caused **three real crashes** in one evening, two of which corrupted the ext4 journal on the root filesystem (`mmcblk0p6`) badly enough to need a fresh boot's automatic journal replay to recover (both times it self-healed — `EXT4-fs: recovery complete`, orphan inodes cleaned up — but that's luck, not a guarantee). Mechanism: `sysfs` GPIO export can silently pull a pin away from a peripheral function even when nothing shows that pin as "claimed" in `/sys/kernel/debug/gpio` — that dump only lists pins with a registered software consumer, not pins hardwired to a peripheral at the board level. Banks 0/2/3/4 are confirmed (from what *is* claimed there) to carry real display/touch/camera power-rail enable lines (LCD 1.8V, touch 5V, MIPI PHY power, USB 5V) — an unlucky adjacent unclaimed pin is a real, not hypothetical, risk.

**Do not resume GPIO scanning on this board without an actual schematic or vendor pinout.** If picking this back up: get real documentation for "ZX-SMT1019-R157-V2.0" or the "R128-USB" daughterboard first, or use a multimeter to trace the terminal block's voltage swing (zero software risk) before touching `/sys/class/gpio` again.

**Device tree checked too, both live and from the vendor's own firmware — confirmed empty, don't re-check this.** The live kernel's own parsed tree (`/proc/device-tree`, manually recursed — `find` can't traverse this procfs filesystem, walk it by hand instead) has no `gpio-keys` node anywhere; `adc-keys` has only the two volume-key children (`vol-up-key`/`vol-down-key`), no third channel. Then went further: located and parsed the actual compiled DTB straight out of the vendor's raw firmware image (`Desktop\Beyond Bell Commander\Tablet\Drivers\...\Debian 12-SMT1019-R157-V2.0-10.1-L1.1-20260702.img`, no `dtc` available locally, so parsed the FDT structure block directly in Python — scan for the `0xd00dfeed` magic, validate header sanity (plausible totalsize, in-bounds offsets, version 16-18), extract nodes/props by walking `FDT_BEGIN_NODE`/`FDT_PROP`/`FDT_END_NODE` tags against the strings block). Root `compatible` confirms it's genuinely this board (`rockchip,rk3576s-r157-v10a`), 1,749 nodes total — same empty result: no relay/IO/gpio-keys node anywhere in the vendor's own shipped tree either. This isn't "disabled but supported" — the terminal is never wired to anything Linux can see, in any build this vendor has shipped for this SoC config.

## Panel software fixes (2026-07-22)
- **Heartbeat thread was dying permanently on transient network errors.** `netpanel.py`'s `beacon()` had one unguarded call (`discover_engines()`, used whenever its candidate-engine list is empty) inside an otherwise fault-tolerant loop — every individual heartbeat POST already tolerated failure, but a transient `OSError: Network is unreachable` from the broadcast `sendto` (seen repeatedly right after boot, during the GPIO crash-reboot cycle above) killed the whole background thread with nothing to restart it. This is why the System page stopped showing the panel as connected, and — as a direct consequence, since brightness/screen-policy/reboot all ride the same heartbeat response — why panel brightness stopped responding too. Fixed: the discovery call is now caught and retried next cycle, same as an all-candidates-failed heartbeat already was. Verified live: `/api/panels` shows the tablet online again, and a brightness change round-tripped correctly (100%→50%→100%, confirmed via the real backlight sysfs value).
- **External Inputs page now shows only the Paging Aux fader** — every other input is a commissioning trim, and all of them are reachable from the office console's Zones tab now (see [[Beyond Bell Commander]]), so there's no need to duplicate them on the touchscreen. Filtered client-side by whole-word name match ("paging"+"aux"), not hardcoded to one exact string.
- **Dark/light mode added**, same palette as the office console's own two themes, toggled via a new sidebar button, persisted per-device (localStorage, defaults dark). First cut used emoji (☀️/🌙) for the toggle icon — the moon glyph rendered as a tofu box on this tablet's font stack, so it was switched to inline SVG (matching every other icon already in this panel) instead. Both themes and the toggle verified live via real screenshots (`xwd` + manual header decode, this device has no working screenshot tool).

## NIC power-management bug — real root cause: the power button (2026-07-22)
Wired Ethernet (`eth0`, Realtek r8168) dropped mid-session and wouldn't reconnect — `nmcli`/`ip -br addr` showed the link physically fine (`ethtool`: "Link detected: yes", 100Mb/s full duplex) but NetworkManager stuck retrying DHCP every 45s with `ip-config-unavailable`, forever. `dmesg` showed why, not a cable/switch issue at all:
```
r8168 0000:01:00.0: Unable to change power state from D3hot to D0, device inaccessible
r8168 0000:01:00.0 eth0: Device reseting!
```
First pass: assumed PCIe *runtime* power management (idle autosuspend) and fixed it with a udev rule forcing `power/control=on` for the r8168 device (`/etc/udev/rules.d/81-eth0-no-runtime-pm.rules`) — a real, correct fix for that mechanism, but it turned out to be treating a symptom, not the actual trigger.

**It happened again immediately**, and the user correctly called it: it happens when the physical power button is pressed to sleep the panel. `dmesg` confirmed it precisely — `PM: suspend entry (deep)` right before every failure, a genuine kernel suspend-to-RAM, not idle runtime PM at all (a full system suspend forces every device through D3hot regardless of the `power/control` setting, so the earlier udev fix was necessary but not sufficient). Traced the trigger to a standalone vendor script, **`/usr/bin/power-key.sh`**, which handles the power button entirely outside `systemd-logind` (explains why `HandlePowerKey=ignore` in `logind.conf` had no effect — that setting was never in the loop) — its `short_press()` wrote `echo mem > /sys/power/state` directly, unconditionally, on every short press.

**Real fix**: this is a wall-mounted paging station that must always be reachable — an actual system suspend is never correct behaviour here regardless of the NIC bug, so the fix is to stop the button from ever suspending the kernel at all, not to make suspend/resume survive cleanly. Changed `short_press()` to `xset dpms force off` (blank the screen — what the button's for anyway) instead of writing to `/sys/power/state`. Long-press `poweroff` (3s hold) is untouched. Both this script and the earlier udev rule are backed up to `Desktop\Beyond Bell Commander\Tablet\power\` and tracked in git (matches the `net/`/`led/`/`kiosk/` convention for tablet site-glue).

Manual recovery, if this or something like it is ever seen again before a fix lands: `ip link set eth0 down` then `up` (wait ~15-20s for `r8168: eth0: link up` in dmesg before retrying — an immediate retry gets "device has no carrier"), then `nmcli device connect eth0`.

## Related
[[Beyond Bell Commander]] · [[2026-07-22]]

#bns #project/bell-commander #hardware
