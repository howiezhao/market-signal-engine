const CMC_FEAR_GREED_URL = "https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest";

export interface CmcFearGreedReading {
  value: number;
  classification: string;
}

interface CmcFearGreedResponse {
  data?: {
    value?: number | string;
    value_classification?: string;
  };
}

export function parseCmcFearGreed(payload: CmcFearGreedResponse): CmcFearGreedReading {
  const value = Number(payload.data?.value);
  const classification = payload.data?.value_classification;
  if (!Number.isFinite(value) || !classification) {
    throw new Error("CMC fear and greed response is missing value or classification");
  }
  return { value, classification };
}

export async function fetchCmcFearGreed(apiKey: string): Promise<CmcFearGreedReading> {
  const response = await fetch(CMC_FEAR_GREED_URL, {
    headers: {
      "X-CMC_PRO_API_KEY": apiKey,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CMC API request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return parseCmcFearGreed((await response.json()) as CmcFearGreedResponse);
}

export function cmcFearGreedAlert(reading: CmcFearGreedReading, threshold: number): string | null {
  if (reading.value >= threshold) {
    return null;
  }
  return `⚠️ CMC Crypto Fear & Greed Index below ${threshold}!\nCurrent value: ${reading.value} (${reading.classification})`;
}
