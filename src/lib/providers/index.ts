export type ProviderHealth = 'live' | 'stale' | 'down';

export interface OHLCVBar {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change_pct: number | null;
  ts: number;
}

export type MarketKey = 'crypto' | 'stocks' | 'etfs' | 'indices' | 'forex' | 'commodities';

export type ProviderId = 'binance' | 'finnhub' | 'twelvedata' | 'yahoo';

export interface MarketDataProvider {
  id: ProviderId;
  supports: (market: MarketKey) => boolean;
  fetchCandles(symbol: string, tf: string, limit: number): Promise<OHLCVBar[]>;
  fetchQuote?(symbol: string): Promise<Quote>;
}

export interface ProviderResult<T> {
  data: T | null;
  health: ProviderHealth;
  source: string;
  error?: string;
  fetched_at: number;
}

const TIMEOUT_MS = 8000;

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// --- Binance (crypto, free, no key) --------------------------------
const BINANCE_TF: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

export function binanceProvider(baseUrl = 'https://api.binance.com'): MarketDataProvider {
  return {
    id: 'binance',
    supports: (m) => m === 'crypto',
    async fetchCandles(symbol, tf, limit) {
      const interval = BINANCE_TF[tf] ?? '1h';
      const url = `${baseUrl}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
      const raw = await fetchJson(url);
      if (!Array.isArray(raw)) throw new Error('unexpected binance payload');
      return raw.map((k: any[]) => ({
        ts: Number(k[0]),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
      }));
    },
    async fetchQuote(symbol) {
      const raw = await fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
      return {
        symbol,
        price: Number(raw.lastPrice),
        change_pct: Number(raw.priceChangePercent),
        ts: Number(raw.closeTime ?? Date.now()),
      };
    },
  };
}

// --- Finnhub (stocks / ETFs / indices) -----------------------------
export function finnhubProvider(apiKey: string | undefined): MarketDataProvider {
  return {
    id: 'finnhub',
    supports: (m) => m === 'stocks' || m === 'etfs' || m === 'indices',
    async fetchCandles(symbol, tf, limit) {
      if (!apiKey) throw new Error('FINNHUB_API_KEY missing');
      const resolution = tf === '1d' ? 'D' : tf === '1h' ? '60' : tf === '15m' ? '15' : tf === '5m' ? '5' : '1';
      const to = Math.floor(Date.now() / 1000);
      const spanSeconds =
        resolution === 'D' ? 86400 : resolution === '60' ? 3600 : resolution === '15' ? 900 : resolution === '5' ? 300 : 60;
      const from = to - spanSeconds * limit;
      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
      const raw = await fetchJson(url);
      if (!raw || raw.s !== 'ok' || !Array.isArray(raw.t)) {
        throw new Error(`finnhub no data (${raw?.s ?? 'empty'})`);
      }
      return raw.t.map((t: number, i: number) => ({
        ts: t * 1000,
        open: raw.o[i],
        high: raw.h[i],
        low: raw.l[i],
        close: raw.c[i],
        volume: raw.v?.[i] ?? 0,
      }));
    },
    async fetchQuote(symbol) {
      if (!apiKey) throw new Error('FINNHUB_API_KEY missing');
      const raw = await fetchJson(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
      );
      if (!raw || typeof raw.c !== 'number') throw new Error('finnhub quote unavailable');
      return { symbol, price: raw.c, change_pct: raw.dp ?? null, ts: Date.now() };
    },
  };
}

// --- Twelve Data (forex / commodities) ----------------------------
const TD_INTERVAL: Record<string, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
};

export function twelveDataProvider(apiKey: string | undefined): MarketDataProvider {
  return {
    id: 'twelvedata',
    supports: (m) => m === 'forex' || m === 'commodities',
    async fetchCandles(symbol, tf, limit) {
      if (!apiKey) throw new Error('TWELVEDATA_API_KEY missing');
      const interval = TD_INTERVAL[tf] ?? '1h';
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${limit}&apikey=${apiKey}`;
      const raw = await fetchJson(url);
      if (raw?.status === 'error' || !Array.isArray(raw?.values)) {
        throw new Error(`twelvedata error (${raw?.message ?? 'no values'})`);
      }
      return raw.values
        .map((v: any) => ({
          ts: new Date(v.datetime.replace(' ', 'T') + 'Z').getTime(),
          open: Number(v.open),
          high: Number(v.high),
          low: Number(v.low),
          close: Number(v.close),
          volume: Number(v.volume ?? 0),
        }))
        .sort((a: OHLCVBar, b: OHLCVBar) => a.ts - b.ts);
    },
  };
}

// --- Yahoo Finance (fallback for all) -----------------------------
import yahooFinance from 'yahoo-finance2';
const yahoo = new yahooFinance();

const YF_INTERVAL: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '60m',
  '4h': '240m',
  '1d': '1d',
  '1w': '1wk',
  '1mo': '1mo',
};

export function yahooFinanceProvider(): MarketDataProvider {
  return {
    id: 'yahoo',
    supports: () => true, // Supports all markets as a fallback
    async fetchCandles(symbol, tf, limit) {
      const interval = (YF_INTERVAL[tf] ?? '1d') as any;
      const period1 = new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // ~limit days ago
      const result = await yahoo.chart(symbol, { period1, interval });
      if (!result?.quotes?.length) throw new Error('yahoo finance no data');
      return result.quotes.map((q) => ({
        ts: q.date.getTime(),
        open: q.open ?? 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        close: q.close ?? 0,
        volume: q.volume ?? 0,
      }));
    },
    async fetchQuote(symbol) {
      const result = await yahoo.quote(symbol);
      if (!result?.regularMarketPrice) throw new Error('yahoo finance quote unavailable');
      return {
        symbol,
        price: result.regularMarketPrice,
        change_pct: result.regularMarketChangePercent ?? null,
        ts: result.regularMarketTime?.getTime() ?? Date.now(),
      };
    },
  };
}

// Resilient wrapper: retry with backoff, report health instead of throwing
export async function safeFetch<T>(
  label: string,
  fn: () => Promise<T>,
  retries = 2
): Promise<ProviderResult<T>> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fn();
      return { data, health: 'live', source: label, fetched_at: Date.now() };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
      }
    }
  }
  return {
    data: null,
    health: 'down',
    source: label,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    fetched_at: Date.now(),
  };
}

export function getProviders() {
  return {
    binance: binanceProvider(),
    finnhub: finnhubProvider(process.env.FINNHUB_API_KEY),
    twelvedata: twelveDataProvider(process.env.TWELVEDATA_API_KEY),
    yahoo: yahooFinanceProvider(),
  };
}
