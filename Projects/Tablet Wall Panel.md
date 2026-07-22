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

## Related
[[Beyond Bell Commander]] · [[2026-07-22]]

#bns #project/bell-commander #hardware
