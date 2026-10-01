# Market Signal Engine

This project is built with Cloudflare Workers and monitors financial market signals, sending notifications to IM platforms.

It includes the following active scheduled tasks, which run every 30 minutes:

- [**CMC FGI**](https://coinmarketcap.com/charts/fear-and-greed-index/) (CoinMarketCap Crypto Fear and Greed Index) < 20
- [**VIX**](https://finance.yahoo.com/quote/%5EVIX/) (from the Yahoo Finance Chart API, `^VIX`) > 45

When either condition is met, it may indicate a potentially attractive buying opportunity in the corresponding market, and a notification is sent to Telegram.

The project also includes a passive **TradingView webhook receiver**, allowing any TradingView webhook alert to be forwarded to Telegram.

## Develop

For local development, first copy `.dev.vars.example` to `.dev.vars` and populate it with real secrets.

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

The Worker is built from this repo with Wrangler. Cron is UTC: `*/30 * * * *`. Thresholds live in `wrangler.jsonc` as `CMC_FGI_ALERT_THRESHOLD` and `VIX_ALERT_THRESHOLD`.

Additionally, please configure the following secrets using Wrangler or the Cloudflare dashboard:

```bash
npx wrangler secret put CMC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put TV_WEBHOOK_SECRET
```

## Integrate

Integrating with TradingView only requires setting up a webhook alert and configuring the Webhook URL to point to the deployed Worker URL.

Please note that the alert message must conform to the following JSON object format:

```json
{
  "secret": "<TV_WEBHOOK_SECRET>",
  "ticker": "{{ticker}}",
  "close": "{{close}}",
  "message": "{{ticker}} price below 90"
}
```

`secret` and `ticker` are required. At least one of `open`, `high`, `low`, and `close` must be included, and the field names must exactly match the placeholders. `message` is optional. Any additional fields will be rejected.

`secret` authenticates the request. `message`, when present, is an extra line in the Telegram alert.

For an explanation of these variables in TradingView, please refer to the [official documentation](https://www.tradingview.com/support/solutions/43000531021-how-to-use-a-variable-value-in-alert/).

## Contributing

Any PRs and issues are welcome.

## License

This repository is licensed under the [Apache-2.0 License](LICENSE).
