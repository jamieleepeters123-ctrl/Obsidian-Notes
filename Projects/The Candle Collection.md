# The Candle Collection

E-commerce site for Anthony & Leanne's hand-poured sculptural candles (pillars, florals, keepsakes, faith pieces — pearl-white soy). Built and deployed 2026-07-11.

**Live:** https://thecandlecollection.duckdns.org (public, Let's Encrypt via Caddy)
**LAN:** http://192.168.1.42:8081 · Admin at `/admin` (password in `Desktop\Candle Website\admin_password.txt`)

## Where it runs

- **Host:** piface Pi ([[PiFace Kiosk]]) — **192.168.1.42 on WiFi** (relocated; good signal at new spot)
- **App:** `/home/piface/candles` — Flask + SQLite + Jinja + vanilla CSS/JS, venv, gunicorn via `candles.service` (systemd, auto-start, port **8081**; 8080 is the [[AHM Reverse Engineering|AHM panel]])
- **Secrets:** `/home/piface/candles/.env` — `OPENAI_API_KEY`, `ADMIN_PASSWORD`, `FLASK_SECRET_KEY`
- **DNS:** DuckDNS `thecandlecollection` — cron `~/duckdns/duck.sh` every 5 min keeps it on the (dynamic) public IP
- **HTTPS:** Caddy on the Pi (80 + 4443, /etc/caddy/Caddyfile) reverse-proxies to :8081; UniFi forwards WAN 80 → .42:80 and WAN 443 → .42:4443

## What's in it

- Home (hero, featured, category tiles), shop grid with category filters + price sort, product pages (multi-image gallery, size variants on the Ribbed Pillar), cart, checkout (order form — no card payments; confirm by email, bank transfer / cash on pickup), FAQ, Our Story, newsletter signup
- Admin: dashboard, product editor (image upload, featured/active flags), orders with status workflow (new → confirmed → done / cancelled), subscribers
- 14 products seeded from photos in `Desktop\Candle Website\My Candles`; categories Pillars / Florals / Keepsakes / Faith
- Design modelled on the "Slowburn" demo store (YouTube TzJCly4YgDQ) — cream palette, Fraunces serif, ticker, footer watermark
- Security: CSRF on all POSTs, admin login rate-limiting, hardened systemd unit, security headers

## Useful commands

```bash
ssh piface@192.168.1.42
sudo systemctl status candles.service
sudo journalctl -u candles.service -f
cd /home/piface/candles && ./venv/bin/python seed.py   # re-seed (skips existing)
```

## To do

- [ ] GPT hero/story imagery — blocked on OpenAI billing hard limit (script ready: `gen_images.py`, gpt-image-1); stand-in product photos in `static/img/hero.jpg` + `story.jpg`
- [ ] Consider Stripe/PayID checkout later
