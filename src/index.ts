import { assertSecrets, readThresholds, type Env } from "./env";
import { cmcFgiAlert, fetchCmcFgi } from "./cmc-fgi";
import { sendTelegramMessage } from "./telegram";
import { handleTradingViewWebhook } from "./tv-webhook";
import { fetchVix, vixAlert } from "./vix";

async function checkCmcFgi(env: Env, threshold: number): Promise<string> {
  const reading = await fetchCmcFgi(env.CMC_API_KEY);
  console.log(`CMC FGI: ${reading.value} (${reading.classification})`);
  const alert = cmcFgiAlert(reading, threshold);
  if (alert) {
    await sendTelegramMessage(env, alert);
  }
  return `cmc-fgi ${reading.value} (${reading.classification})`;
}

async function checkVix(env: Env, threshold: number): Promise<string> {
  const reading = await fetchVix();
  console.log(`VIX: ${reading.value}`);
  const alert = vixAlert(reading, threshold);
  if (alert) {
    await sendTelegramMessage(env, alert);
  }
  return `vix ${reading.value}`;
}

async function runChecks(env: Env): Promise<string[]> {
  assertSecrets(env);
  const thresholds = readThresholds(env);
  const tasks = [
    checkCmcFgi(env, thresholds.cmcFgi),
    checkVix(env, thresholds.vix),
  ];

  const settled = await Promise.allSettled(tasks);
  const lines: string[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled") {
      lines.push(result.value);
      continue;
    }
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(message);
    lines.push(`error: ${message}`);
    try {
      await sendTelegramMessage(env, `Market signal check failed.\n${message}`);
    } catch (notifyError) {
      console.error("Failed to send notification:", notifyError);
    }
  }

  return lines;
}

export default {
  async scheduled(_controller, env): Promise<void> {
    await runChecks(env);
  },

  async fetch(request, env): Promise<Response> {
    if (new URL(request.url).pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      return Response.json({
        ok: true,
        schedule: "*/30 * * * *",
        signals: ["cmc-fgi", "vix"],
        webhooks: ["tradingview"],
      });
    }

    if (request.method === "POST") {
      return handleTradingViewWebhook(request, env);
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  },
} satisfies ExportedHandler<Env>;
