const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=1d&interval=1d";

export interface VixReading {
  value: number;
  symbol: string;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        symbol?: string;
      };
    }> | null;
    error?: { description?: string } | null;
  };
}

export function parseVix(payload: YahooChartResponse): VixReading {
  const error = payload.chart?.error?.description;
  if (error) {
    throw new Error(`Yahoo Finance error: ${error}`);
  }

  const meta = payload.chart?.result?.[0]?.meta;
  const value = meta?.regularMarketPrice;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Yahoo Finance response is missing regularMarketPrice");
  }

  return {
    value,
    symbol: meta?.symbol ?? "^VIX",
  };
}

export async function fetchVix(): Promise<VixReading> {
  const response = await fetch(YAHOO_CHART_URL, {
    headers: {
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Yahoo Finance request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    throw new Error(`Yahoo Finance returned ${contentType || "a non-JSON response"}`);
  }

  return parseVix((await response.json()) as YahooChartResponse);
}

export function vixAlert(reading: VixReading, threshold: number): string | null {
  if (reading.value <= threshold) {
    return null;
  }
  return `⚠️ VIX above ${threshold}!\nCurrent value: ${reading.value} (${reading.symbol})`;
}
