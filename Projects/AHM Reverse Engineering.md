# AHM Reverse Engineering

Allen & Heath AHM protocol work — documented + proprietary protocols.

## Toolkit: `ahm-ahnet-kit.tar.gz`
- **Documented TCP protocol** (port 51325): Flask app `ahm_player.py`
- **Proprietary AH-Net protocol** (port 51321 + UDP 51324–51424):
  - tshark capture scripts
  - marker tool
  - scapy analyzers
  - `PROTOCOL.md` — cross-session memory file (keep updated!)

## Environment
- Live AHM unit available
- System Manager + Wireshark ready for capture sessions

## Related
- [[Beyond Bell Commander]] — AHM is one of the DSP driver targets

#bns #project/ahm #reverse-engineering
