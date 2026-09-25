import type { Env } from "./env";

const TELEGRAM_API_URL = "https://api.telegram.org";

export async function sendTelegramMessage(env: Env, text: string): Promise<void> {
  const url = `${TELEGRAM_API_URL}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram send failed (${response.status}): ${body.slice(0, 300)}`);
  }
}
