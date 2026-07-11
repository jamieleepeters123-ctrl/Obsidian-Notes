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
| App | Path | URL |
|-----|------|-----|
| [[Rack Builder App]] | `~/apps/rackbuilder/` | `172.16.200.151:5000/rack-builder` |

## Common commands
```bash
cd ~/apps/<name>
docker compose up -d --build     # build + (re)start
docker compose logs -f           # tail logs
docker compose down              # stop + remove
docker ps                        # what's running
```

## To do / ideas
- Add a **Caddy reverse proxy** once there are a few apps — clean hostnames (`rackbuilder.bns.local`) instead of juggling ports, automatic TLS.

#bns #infra #docker
