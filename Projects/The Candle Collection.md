# The Candle Collection

E-commerce site for Anthony & Leanne's hand-poured sculptural candles (pillars, florals, keepsakes, faith pieces — pearl-white soy). Built and deployed 2026-07-11.

**Live:** http://thecandlecollection.duckdns.org:8081 (public)
**LAN:** http://192.168.1.41:8081 · Admin at `/admin` (password in `Desktop\Candle Website\admin_password.txt`)

## Where it runs

- **Host:** piface Pi ([[PiFace Kiosk]]) — now **192.168.1.41 wired**, WiFi disabled (was .42 on WiFi; caused 3.7 s ping spikes and intermittent page loads)
- **App:** `/home/piface/candles` — Flask + SQLite + Jinja + vanilla CSS/JS, venv, gunicorn via `candles.service` (systemd, auto-start, port **8081**; 8080 is the [[AHM Reverse Engineering|AHM panel]])
- **Secrets:** `/home/piface/candles/.env` — `OPENAI_API_KEY`, `ADMIN_PASSWORD`, `FLASK_SECRET_KEY`
- **DNS:** DuckDNS `thecandlecollection` — cron `~/duckdns/duck.sh` every 5 min keeps it on the (dynamic) public IP
- **Port-forward:** UniFi Express, WAN 8081/TCP → 192.168.1.41:8081

## What's in it

- Home (hero, featured, category tiles), shop grid with category filters + price sort, product pages (multi-image gallery, size variants on the Ribbed Pillar), cart, checkout (order form — no card payments; confirm by email, bank transfer / cash on pickup), FAQ, Our Story, newsletter signup
- Admin: dashboard, product editor (image upload, featured/active flags), orders with status workflow (new → confirmed → done / cancelled), subscribers
- 14 products seeded from photos in `Desktop\Candle Website\My Candles`; categories Pillars / Florals / Keepsakes / Faith
- Design modelled on the "Slowburn" demo store (YouTube TzJCly4YgDQ) — cream palette, Fraunces serif, ticker, footer watermark
- Security: CSRF on all POSTs, admin login rate-limiting, hardened systemd unit, security headers

## Useful commands

```bash
ssh piface@192.168.1.41
sudo systemctl status candles.service
sudo journalctl -u candles.service -f
cd /home/piface/candles && ./venv/bin/python seed.py   # re-seed (skips existing)
```

## To do

- [ ] GPT hero/story imagery — blocked on OpenAI billing hard limit (script ready: `gen_images.py`, gpt-image-1); stand-in product photos in `static/img/hero.jpg` + `story.jpg`
- [ ] HTTPS — put Caddy in front (DuckDNS works with Let's Encrypt) before promoting the shop
- [ ] Consider Stripe/PayID checkout later
