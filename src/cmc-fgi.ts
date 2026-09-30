const CMC_FGI_URL = "https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest";

export interface CmcFgiReading {
  value: number;
  classification: string;
}

interface CmcFgiResponse {
  data?: {
    value?: number | string;
    value_classification?: string;
  };
}

export function parseCmcFgi(payload: CmcFgiResponse): CmcFgiReading {
  const value = Number(payload.data?.value);
  const classification = payload.data?.value_classification;
  if (!Number.isFinite(value) || !classification) {
    throw new Error("CMC FGI response is missing value or classification");
  }
  return { value, classification };
}

export async function fetchCmcFgi(apiKey: string): Promise<CmcFgiReading> {
  const response = await fetch(CMC_FGI_URL, {
    headers: {
      "X-CMC_PRO_API_KEY": apiKey,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CMC API request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return parseCmcFgi((await response.json()) as CmcFgiResponse);
}

export function cmcFgiAlert(reading: CmcFgiReading, threshold: number): string | null {
  if (reading.value >= threshold) {
    return null;
  }
  return `⚠️ CMC Crypto FGI below ${threshold}!\nCurrent value: ${reading.value} (${reading.classification})`;
}
