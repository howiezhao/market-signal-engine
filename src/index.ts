import { assertSecrets, readThresholds, type Env } from "./env";
import { cmcFearGreedAlert, fetchCmcFearGreed } from "./cmc-fear-greed";
import { sendTelegramMessage } from "./telegram";
import { fetchVix, vixAlert } from "./vix";

async function checkCmcFearGreed(env: Env, threshold: number): Promise<string> {
  const reading = await fetchCmcFearGreed(env.CMC_API_KEY);
  console.log(`CMC Fear & Greed: ${reading.value} (${reading.classification})`);
  const alert = cmcFearGreedAlert(reading, threshold);
  if (alert) {
    await sendTelegramMessage(env, alert);
  }
  return `cmc-fear-greed ${reading.value} (${reading.classification})`;
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
    checkCmcFearGreed(env, thresholds.cmcFear),
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

  async fetch(request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        ok: true,
        schedule: "*/30 * * * *",
        signals: ["cmc-fear-greed", "vix"],
      });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
