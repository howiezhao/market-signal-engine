# Market Signal Engine

Cloudflare Worker that sends a Telegram message for market alerts.

Scheduled every 30 minutes:

- CMC Crypto Fear & Greed Index below 20
- VIX above 45, from the Yahoo Finance chart API (`^VIX`)

While a scheduled condition stays true, the Worker sends that alert again on each run.

Stock alerts are configured on TradingView. When an alert fires, TradingView POSTs to the Worker URL, and this Worker forwards it to Telegram.

## Secrets

Do not commit credentials. Set them as Worker secrets (or copy `.dev.vars.example` to `.dev.vars` for local dev):

```bash
npx wrangler secret put CMC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put TV_WEBHOOK_SECRET
```

Thresholds live in `wrangler.jsonc` as `CMC_FGI_ALERT_THRESHOLD` and `VIX_ALERT_THRESHOLD`.

## Develop

```bash
npm install
npm run check
npm run dev
```

`GET /` returns a health payload. Cron triggers can be simulated with:

```bash
curl "http://localhost:8787/cdn-cgi/local/scheduled"
```

## Deploy

Connect the GitHub repo in the Cloudflare dashboard (Workers Builds) or run:

```bash
npm run deploy
```

The Worker is built from this repo with Wrangler. Cron is UTC: `*/30 * * * *`.

## TradingView webhook

Create the alert on TradingView (for example, INTC crossing below 90) and enable its webhook. TradingView sends one POST. Use the deployed `https://` Worker URL on port 443.

Webhook URL:

```text
https://<worker-host>
```

The body must be this JSON object. `secret` and `ticker` are required. Include at least one of `open`, `high`, `low`, `close`, using the field name that matches the placeholder. `message` is optional. Other fields are rejected. Quote every TradingView placeholder so the body stays valid JSON:

```json
{
  "secret": "<TV_WEBHOOK_SECRET>",
  "ticker": "{{ticker}}",
  "close": "{{close}}",
  "message": "{{ticker}} price below 90"
}
```

`secret` authenticates the request. `message`, when present, is an extra line in the Telegram alert. Local check:

```bash
curl -X POST "http://localhost:8787/" \
  -H 'content-type: application/json' \
  --data '{"secret":"YOUR_SECRET","ticker":"INTC","close":"89.50","message":"INTC price below 90"}'
```
