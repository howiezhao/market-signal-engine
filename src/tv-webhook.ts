import type { Env } from "./env";
import { sendTelegramMessage } from "./telegram";

const PRICE_FIELDS = ["open", "high", "low", "close"] as const;
const PAYLOAD_FIELDS = new Set(["secret", "ticker", "message", ...PRICE_FIELDS]);

class WebhookError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WebhookError";
  }
}

interface TradingViewAlert {
  ticker: string;
  message?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
}

export async function handleTradingViewWebhook(request: Request, env: Env): Promise<Response> {
  try {
    assertWebhookConfig(env);
    const body = await parseRequest(request);
    if (body.secret !== env.TV_WEBHOOK_SECRET) {
      throw new WebhookError("Unauthorized", 401);
    }

    const alert = toTradingViewAlert(body);
    const text = formatTradingViewAlert(alert);
    await sendTelegramMessage(env, text);
    console.log(`TradingView alert delivered: ${alert.ticker}`);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof WebhookError) {
      if (error.status >= 500 || error.status === 401) {
        console.error(error.message);
      }
      return Response.json({ ok: false, error: error.message }, { status: error.status });
    }

    const detail = error instanceof Error ? error.message : String(error);
    console.error(detail);
    return Response.json({ ok: false, error: "Failed to deliver alert" }, { status: 502 });
  }
}

async function parseRequest(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new WebhookError("Webhook JSON is invalid", 400);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new WebhookError("Webhook JSON must be an object", 400);
  }
  return value as Record<string, unknown>;
}

function toTradingViewAlert(record: Record<string, unknown>): TradingViewAlert {
  for (const key of Object.keys(record)) {
    if (!PAYLOAD_FIELDS.has(key)) {
      throw new WebhookError(`Unexpected field: ${key}`, 400);
    }
  }

  const alert: TradingViewAlert = {
    ticker: requireText(record, "ticker"),
    message: Object.hasOwn(record, "message") ? requireText(record, "message") : undefined,
  };
  for (const name of PRICE_FIELDS) {
    if (Object.hasOwn(record, name)) alert[name] = requireText(record, name);
  }
  if (!PRICE_FIELDS.some((name) => alert[name])) {
    throw new WebhookError("At least one of open, high, low, close is required", 400);
  }
  return alert;
}

function formatTradingViewAlert(alert: TradingViewAlert): string {
  const lines = ["⚠️ TradingView alert"];
  if (alert.message) lines.push(alert.message);
  for (const name of PRICE_FIELDS) {
    const value = alert[name];
    if (value) lines.push(`${alert.ticker} ${name} ${value}`);
  }
  return lines.join("\n");
}

function assertWebhookConfig(env: Env): void {
  if (!env.TV_WEBHOOK_SECRET) {
    throw new WebhookError("TradingView webhook secret is not configured", 500);
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new WebhookError("Telegram is not configured", 500);
  }
}

function requireText(record: Record<string, unknown>, key: keyof TradingViewAlert): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new WebhookError(`${key} must be a non-empty string`, 400);
  }
  return value.trim();
}
