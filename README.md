# market-signal-engine

Cloudflare Worker that checks two market signals every 30 minutes and sends a Telegram message when a threshold is crossed.

- CMC Crypto Fear & Greed Index below 20
- VIX above 45, from the Yahoo Finance chart API (`^VIX`)

While a condition stays true, the Worker sends the alert again on each run.

## Secrets

Do not commit credentials. Set them as Worker secrets (or copy `.dev.vars.example` to `.dev.vars` for local dev):

```bash
npx wrangler secret put CMC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

Thresholds live in `wrangler.jsonc` as `CMC_FEAR_ALERT_THRESHOLD` and `VIX_ALERT_THRESHOLD`.

## Develop

```bash
npm install
npm run check
npm run dev
```

`GET /` returns a health payload. Cron triggers can be simulated with:

```bash
curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=*/30+*+*+*+*"
```

## Deploy

Connect the GitHub repo in the Cloudflare dashboard (Workers Builds) or run:

```bash
npm run deploy
```

The Worker is built from this repo with Wrangler. Cron is UTC: `*/30 * * * *`.
