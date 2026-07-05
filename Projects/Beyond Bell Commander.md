# Beyond Bell Commander

Productised school PA + bell scheduling system under the BNS brand.

## Architecture
- **Control layer:** Crestron RMC4 / CP4
- **DSP abstraction:** pluggable driver layer — Q-SYS, Biamp Tesira, Allen & Heath AHM, etc.
- **Commissioning:** site-specific JSON config
- **UI:** React demo UI built

## Status
- Demo UI complete
- Bell scheduler fetches real bell times (see [[Campbelltown PS]]) and [[NSW 2026 Term Dates]]
- Evac audio produced for Campbelltown PS (offsite version done, onsite pending voice file)

## Related
- [[Strobe Beacon Spec]] — visual alerting companion
- [[Campbelltown PS]]

#bns #project/bell-commander
