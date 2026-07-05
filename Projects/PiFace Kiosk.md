# PiFace Kiosk

Pi 5 touchscreen kiosk platform. Full config: [[Pi Kiosk Config]]

## Resolved issues
- DSI-2 output, xrandr rotation, xinput touch calibration matrix
- simple-keyboard virtual keyboard
- Save & Launch → `sudo reboot`
- Boot text suppression

## Docs
- BNS Kiosk User Guide v2.0 produced
- Claude Code installed on Windows PC and on the Pi

## Roadmap (dependency order)
1. ✅ Claude Code CLI on Pi terminal
2. Zigbee2MQTT in Docker
3. Mosquitto MQTT broker on Pi
4. Claude AI chat interface w/ speech-to-text in Flask
5. System stats (CPU/RAM/temp/disk) in side menu
6. Z2M panel/link in side menu

## Related
- [[Home Assistant + Zigbee2MQTT]]
- [[AI Inference Server]] — Whisper/Piper candidates for STT/TTS

#bns #project/kiosk
