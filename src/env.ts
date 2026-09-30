export interface Env {
  CMC_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  CMC_FGI_ALERT_THRESHOLD: string;
  VIX_ALERT_THRESHOLD: string;
}

export interface Thresholds {
  cmcFgi: number;
  vix: number;
}

export function readThresholds(env: Env): Thresholds {
  const cmcFgi = Number(env.CMC_FGI_ALERT_THRESHOLD);
  const vix = Number(env.VIX_ALERT_THRESHOLD);
  if (!Number.isFinite(cmcFgi) || !Number.isFinite(vix)) {
    throw new Error("Alert thresholds must be numbers");
  }
  return { cmcFgi, vix };
}

export function assertSecrets(env: Env): void {
  const missing = ["CMC_API_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"].filter(
    (key) => !env[key as keyof Env],
  );
  if (missing.length > 0) {
    throw new Error(`Missing Worker secrets: ${missing.join(", ")}`);
  }
}
