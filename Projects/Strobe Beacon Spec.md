# Strobe Beacon Spec

IP-controlled strobe light beacons for BNS school deployments (visual alerting alongside PA).

## Options evaluated
| Option | Type | Notes |
|---|---|---|
| Algo 8128G2 | Commercial | Certified, PoE, SIP/multicast |
| ESP32 + WLED | DIY | Cheap, flexible; secondary indication only |
| Waveshare Modbus PoE relay | DIY | Relay-driven beacons; secondary indication only |

## Decision guidance
- DIY approaches scoped as **secondary indication only** — not certified emergency alerting
- Commercial (Algo) for anything safety-critical

## Related
- [[Beyond Bell Commander]]

#bns #project/strobes
