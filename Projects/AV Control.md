# AV Control

A Flask control system for AV and other IP devices, with a dashboard you build yourself. You add devices, lay out buttons, sliders and status displays on pages by drag-and-drop, and chain actions into macros. Started 28 Sep 2026. It's separate from [[Beyond Bell Commander]], but reuses what that project learned about the Atlas protocol.

- **Code:** `Desktop\AV Control`, git repo on branch `beta`, **not committed yet**.
- **Running at:** http://192.168.1.42:5050 on the [[PiFace Kiosk]] Pi, which is on DHCP (it's been `.41` or `.42` before).
- **Stack:** Python / Flask / waitress, a vanilla-JS frontend, and GridStack 11.5.1 bundled in the app, so it needs no internet access.

## What it does
- **Dashboard.** Pages of widgets: button, on/off toggle, slider, dropdown, up/down stepper, status display, macro button and heading, in 5 colours.
  - **Edit layout** lets you add, remove, drag and resize widgets and add, rename or delete pages. Changes autosave.
  - Buttons show live feedback. For example, "HDMI 2" lights up only when the screen really is on HDMI 2. Devices that are offline are dimmed.
  - On a phone it reflows to one column. Editing the layout is desktop and tablet only.
- **Devices.** Add, edit or remove devices. Each device's page is built automatically from what it can do, and **+ Pin** puts any control on the dashboard.
- **Macros.** A sequence of steps across any devices, with optional waits, run on the server from one button. Errors are reported per step.

## Device types
| Type | Protocol | Controls | Tested against |
|---|---|---|---|
| AtlasIED Atmosphere (AZM4/AZM8/-D) | JSON-RPC, TCP 5321 | zones (source/level/mute), sources, mixes, groups (combine), messages, scenes, routines, GPO presets, bell schedule | simulator only |
| Samsung display | MDC, TCP 1515 | power, input, volume, mute | simulator only |
| Projector / display | PJLink class 1, TCP 4352 | power, input, A/V mute, lamp hours, health; password supported | simulator only |
| **Shelly** | Gen 1 HTTP + Gen 2+ RPC | on/off, **dimmer slider**, power (W); real state polled every 2 s | ✅ real devices at home |
| Global Cache iTach IP2CC / Flex | TCP 4998 | per relay: on/off with real state + momentary pulse | simulator only |
| Generic TCP / UDP / HTTP | text / hex / REST | your own buttons and on/off pairs | ✅ real Shelly (via HTTP) |
| Wake-on-LAN | magic packet | Wake | — |

- The **Atlas** driver needs no setup. On connect it reads the unit's own names (`ZoneName_N`, `SourceName_N`, …) and then *subscribes* to live values, so changes made from wall controllers show up. The protocol is from AtlasIED doc **ATS006993-B**.
- **To add a new device type,** subclass `Device` with `controls()` and `set_control()`. The dashboard, device page and macros pick it up without any frontend changes.

## Devices configured on the Pi
- **Dining:** Shelly **Plus 2PM** (Gen 2, 2 channels, switch profile) at `192.168.1.246`. Still set up as the *generic HTTP* type, with the user's own ON / OFF / ON/OFF buttons and a macro. It could be converted to the Shelly type for live state and power; that's offered, not done.
- **Entry Light:** Shelly **Dimmer 2** (Gen 1, `SHDM-2`) at `192.168.1.138`, using the Shelly type. The Home page has an on/off toggle and a brightness slider for it.
- **Atlas AZM4 + Samsung screens 1 and 2:** office devices (`172.16.200.188` / `.45` / `.46`). **They always show offline from this Pi**, because it's on the home LAN with no route to the office. See [[Office Raspberry Pi 5]] and [[Tablet Wall Panel]].

## Gotchas found while building it
- **PJLink and iTach lines end in a bare `\r`.** Reading them with `file.readline()` (which waits for `\n`) hangs until timeout. The first PJLink driver did exactly this and the unit tests caught it.
- **GridStack 11 needs `gridstack-extra.min.css` as well as `gridstack.min.css`** for any layout other than 12 columns. Without it, the phone layout rendered every widget 0 px wide, so the page looked empty.
- **Resize handles auto-hide until hover**, which is useless on a touch panel. The app sets `alwaysShowResizeHandle: true` in edit mode.
- **Pasting a full URL into an HTTP command's Path box** used to produce `http://host:80/http://host/...` and a 404. Full URLs are now accepted as well as bare paths.
- **The two Shelly generations use different URLs.** Gen 1 uses `/light/0?turn=on&brightness=50`; Gen 2+ uses `/rpc/Switch.Set?id=0&on=true` (or `Light.Set`). Check `GET /shelly`: there's no `gen` field on Gen 1.
- **Two people editing the same device overwrite each other,** because the last save wins. This happened once, while the user was editing Dining in the UI at the same time as an API change.
- **Atlas mix numbering in the zone-source list is an assumption:** mixes come straight after the last Source (office AZM4: Mix 1 = 8). Confirm against the Message Table on a new site.
- **Samsung input codes follow the MDC spec** (HDMI3 = `0x31`, DisplayPort = `0x25`). The old Node-RED flow on the [[Tablet Wall Panel]] used `0x25` for HDMI3.

## Deploying
Copy the folder over ssh, **leaving out `devices.json`, `dashboard.json` and `.venv`**, which are live site config edited in the UI. Then:
```
ssh piface@192.168.1.42 'cd ~/avcontrol && .venv/bin/python -m pytest -q && sudo systemctl restart avcontrol'
```
- It runs as a systemd service, `avcontrol.service`, set to start on boot.
- To try it without hardware, run `python dev_fakes.py`. It simulates an Atlas, a Samsung display, a PJLink projector, a Shelly (either generation) and an iTach.
- **32 tests**, plus a full Playwright UI run (devices, commands, pinning, macros, drag and resize, pages, phone layout) against the simulators.

## Open items
- [ ] Commit the repo (it's on `beta`, nothing committed yet)
- [ ] **No login.** Anyone on the LAN can control devices and edit the layout. Consider a PIN for edit mode.
- [ ] Test Atlas, Samsung and PJLink against real hardware: install at the office (the [[Office Raspberry Pi 5]] or the [[Tooling Docker Host]]), or give piface a route to the office network
- [ ] Global Cache IP2CC: not on the network yet (no beacon, port 4998 closed on `192.168.1.0/24`). Add it by IP once it's installed
- [ ] Convert **Dining** to the Shelly type, and move its buttons and macro across
- [ ] Shelly devices with a login password aren't supported yet (Gen 2 uses SHA-256 digest auth)

## Related
- [[Beyond Bell Commander]]: its Atlas driver is where the Atmosphere protocol was first proven
- [[Tablet Wall Panel]]: its Node-RED "AV Controller" drives the same Samsung screens over MDC
- [[Home Assistant + Zigbee2MQTT]]
- [[PiFace Kiosk]]

#bns #project/av-control
