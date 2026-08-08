# Tooling Docker Host

General-purpose Docker server for hosting internal apps. Hostname **bns-toolingdocker**.

## Access
- **IP:** `172.16.200.151` (office subnet `172.16.200.0/24`, reachable over the Sophos VPN like the office Pi)
- **SSH:** `ssh jamie@172.16.200.151`
- **OS:** Ubuntu 26.04 LTS

## Docker
- Installed 2026-07-09 via `get.docker.com`. `jamie` is in the `docker` group (no `sudo` needed for docker/compose).
- **Convention:** one app = one Compose stack under `~/apps/<name>/`, each with its own `Dockerfile` + `compose.yaml`, data in a bind-mounted `./data` dir.
- `restart: unless-stopped` on containers so they come back after a reboot.

## Hosted apps
Table refreshed 1 Aug 2026 against real `docker ps` output — was badly stale (only ever listed Rack Builder).

| App | Port | Notes |
|-----|------|-------|
| bellcommander | `:8090` | [[Beyond Bell Commander]] demo, `beta` |
| bellcommander-uxfix | `:8091` | UX-audit-fix copy |
| bellcommander-xilica-poc | `:8092` | Stands in for the offline bench Pi |
| vzx-clone | `:8093` | Static nginx |
| bellcommander-redesign | `:8094` | |
| bellcommander-portal | `:8100` | [[Bell Commander Portal]] — real, in-use (not a demo copy); built 8 Aug 2026, firmware host + read-only repo mount at `./src:/repo:ro` |
| homarr | `:7575` | Dashboard |
| [[Rack Builder App]] | `:5000` | `~/apps/rackbuilder/` |
| portainer | `:9443` (https) | See [[Backups]] — nightly config backup running here since 1 Aug |

## Common commands
```bash
cd ~/apps/<name>
docker compose up -d --build     # build + (re)start
docker compose logs -f           # tail logs
docker compose down              # stop + remove
docker ps                        # what's running
```

## Backups
Doubles as the `tooling` git remote for [[Beyond Bell Commander]] (`repos/beyond-bell-commander.git`) — real, pushed-to. Portainer's own config gets a nightly backup (`~/backups/portainer-backup.sh`, cron `17 3 * * *`, 14-day rotation) — set up 1 Aug after the admin login was lost and had to be reset via Portainer's official `helper-reset-password` tool. Full picture, including the coverage gap (doesn't back up the actual app volumes/bind mounts, only Portainer's own DB) in [[Backups]].

## To do / ideas
- Add a **Caddy reverse proxy** once there are a few apps — clean hostnames (`rackbuilder.bns.local`) instead of juggling ports, automatic TLS.

#bns #infra #docker
