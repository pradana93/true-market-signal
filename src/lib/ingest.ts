import { fuseSignals } from '@/engine/fusion';
import type { Candle, MarketContext } from '@/engine/methods';
import { getProviders, safeFetch, type OHLCVBar, type MarketKey, type ProviderId, type ProviderResult } from '@/lib/providers';
import { createAdminClient } from '@/lib/supabase/server';

export interface TrackedInstrument {
  symbol: string;
  market: MarketKey;
  provider: ProviderId;
  exchange: string;
  /** Symbol as the feed names it, when it differs from our instrument row (e.g. BTCUSDT for BTC-USD). */
  providerSymbol?: string;
}

// Instruments we actively track. Symbol must match the provider's convention.
export const TRACKED: TrackedInstrument[] = [
  { symbol: 'BTCUSDT', market: 'crypto', provider: 'binance', exchange: 'binance' },
  { symbol: 'ETHUSDT', market: 'crypto', provider: 'binance', exchange: 'binance' },
  { symbol: 'SOLUSDT', market: 'crypto', provider: 'binance', exchange: 'binance' },
  { symbol: 'BNBUSDT', market: 'crypto', provider: 'binance', exchange: 'binance' },
  { symbol: 'XRPUSDT', market: 'crypto', provider: 'binance', exchange: 'binance' },
  { symbol: 'BTC-USD', market: 'crypto', provider: 'yahoo', exchange: 'yahoo' },
  { symbol: 'ETH-USD', market: 'crypto', provider: 'yahoo', exchange: 'yahoo' },
  { symbol: 'AAPL', market: 'stocks', provider: 'finnhub', exchange: 'nasdaq' },
  { symbol: 'MSFT', market: 'stocks', provider: 'finnhub', exchange: 'nasdaq' },
  { symbol: 'NVDA', market: 'stocks', provider: 'finnhub', exchange: 'nasdaq' },
  { symbol: 'TSLA', market: 'stocks', provider: 'finnhub', exchange: 'nasdaq' },
  { symbol: 'AMZN', market: 'stocks', provider: 'finnhub', exchange: 'nasdaq' },
  { symbol: 'AAPL', market: 'stocks', provider: 'yahoo', exchange: 'nasdaq' },
  { symbol: 'SPY', market: 'etfs', provider: 'yahoo', exchange: 'nyse' },
  { symbol: 'QQQ', market: 'etfs', provider: 'yahoo', exchange: 'nasdaq' },
  { symbol: 'EUR/USD', market: 'forex', provider: 'twelvedata', exchange: 'fx' },
  { symbol: 'USD/JPY', market: 'forex', provider: 'twelvedata', exchange: 'fx' },
  { symbol: 'GBP/USD', market: 'forex', provider: 'twelvedata', exchange: 'fx' },
  { symbol: 'EURUSD=X', market: 'forex', provider: 'yahoo', exchange: 'yahoo' },
  { symbol: 'XAU/USD', market: 'commodities', provider: 'twelvedata', exchange: 'otc' },
  { symbol: 'GC=F', market: 'commodities', provider: 'yahoo', exchange: 'cmx' },
];

function toCandles(bars: OHLCVBar[]): Candle[] {
  return bars.map((b) => ({
    timestamp: b.ts,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));
}

/**
 * Real market data never repeats the same high and low bar after bar. A series
 * with fewer than five distinct highs is a frozen quote, a synthetic filler or
 * a broken provider mapping — all of which would pin every ATR-derived level in
 * the trade plan to the same number forever.
 */
function isDegenerateSeries(bars: OHLCVBar[]): boolean {
  const sample = bars.slice(-50);
  const distinctHighs = new Set(sample.map((b) => b.high)).size;
  const distinctCloses = new Set(sample.map((b) => b.close)).size;
  return distinctHighs < 5 || distinctCloses < 5;
}

function buildVolumeProfile(candles: Candle[], buckets = 24) {
  if (candles.length === 0) return undefined;
  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return undefined;
  const step = (max - min) / buckets;
  const hist = new Array(buckets).fill(0);

  for (const c of candles) {
    const lo = Math.floor((c.low - min) / step);
    const hi = Math.floor((c.high - min) / step);
    const spread = Math.max(1, hi - lo + 1);
    for (let i = lo; i <= hi; i++) {
      const idx = Math.min(buckets - 1, Math.max(0, i));
      hist[idx] += c.volume / spread;
    }
  }

  const totalVolume = hist.reduce((a, b) => a + b, 0);
  const pocIdx = hist.indexOf(Math.max(...hist));
  const priceAt = (i: number) => min + step * (i + 0.5);

  // Expand outward from POC until 70% of volume is captured
  const target = totalVolume * 0.7;
  let captured = hist[pocIdx];
  let lo = pocIdx;
  let hi = pocIdx;
  while (captured < target && (lo > 0 || hi < buckets - 1)) {
    const nextLo = lo > 0 ? hist[lo - 1] : -1;
    const nextHi = hi < buckets - 1 ? hist[hi + 1] : -1;
    if (nextHi >= nextLo) {
      hi += 1;
      captured += nextHi;
    } else {
      lo -= 1;
      captured += nextLo;
    }
  }

  return {
    poc: priceAt(pocIdx),
    vah: priceAt(hi),
    val: priceAt(lo),
    valueArea: 0.7,
    totalVolume,
    timestamp: candles[candles.length - 1].timestamp,
  };
}

export interface IngestOutcome {
  symbol: string;
  market: MarketKey;
  health: 'live' | 'stale' | 'down';
  candles: number;
  error?: string;
}

export function ingestInstrument(
  supabase: ReturnType<typeof createAdminClient>,
  inst: TrackedInstrument,
  tf = '1h'
): Promise<{ outcome: IngestOutcome; ctx?: MarketContext }> {
  return ingestInstrumentInternal(supabase, inst, tf);
}

async function ingestInstrumentInternal(
  supabase: ReturnType<typeof createAdminClient>,
  inst: TrackedInstrument,
  tf = '1h'
): Promise<{ outcome: IngestOutcome; ctx?: MarketContext }> {
  const providers = getProviders();
  const provider = providers[inst.provider];
  const limit = tf === '1d' ? 250 : 200;
  // The feed may name the symbol differently from our instrument row.
  const feedSymbol = inst.providerSymbol ?? inst.symbol;

  let result: ProviderResult<OHLCVBar[]> = await safeFetch(`${inst.provider}:${feedSymbol}`, () =>
    provider.fetchCandles(feedSymbol, tf, limit)
  );

  // Fallback to Yahoo if primary fails
  if ((!result.data || result.data.length < 30) && inst.provider !== 'yahoo') {
    const yahooProvider = providers.yahoo;
    let yahooSymbol = feedSymbol;
    if (inst.market === 'crypto') yahooSymbol = `${feedSymbol.replace('USDT', '')}-USD`;
    if (inst.market === 'forex') yahooSymbol = `${feedSymbol.replace('/', '')}=X`;
    if (inst.market === 'commodities') yahooSymbol = feedSymbol === 'XAU/USD' ? 'GC=F' : 'SI=F';

    result = await safeFetch(`yahoo:${yahooSymbol}`, () =>
      yahooProvider.fetchCandles(yahooSymbol, tf, limit)
    );
  }

  if (!result.data || result.data.length < 30) {
    return {
      outcome: {
        symbol: inst.symbol,
        market: inst.market,
        health: 'down',
        candles: result.data?.length ?? 0,
        error: result.error ?? 'insufficient candles',
      },
    };
  }

  // A frozen or synthetic series produces a plan that can never move, so it is
  // rejected before it can overwrite good candles.
  if (isDegenerateSeries(result.data)) {
    return {
      outcome: {
        symbol: inst.symbol,
        market: inst.market,
        health: 'down',
        candles: result.data.length,
        error: 'degenerate candles (flat highs/lows)',
      },
    };
  }

  const candles = toCandles(result.data);

  // Upsert instrument row
  const { data: existing } = await supabase
    .from('instruments')
    .select('id')
    .eq('symbol', inst.symbol)
    .maybeSingle();

  let instrumentId = existing?.id as number | undefined;
  if (!instrumentId) {
    const { data: inserted, error } = await supabase
      .from('instruments')
      .insert([
        {
          symbol: inst.symbol,
          market: inst.market,
          exchange: inst.exchange,
          provider_ids: { [inst.provider]: inst.symbol },
          enabled: true,
        },
      ])
      .select('id')
      .single();
    if (error) {
      return {
        outcome: { symbol: inst.symbol, market: inst.market, health: 'down', candles: 0, error: error.message },
      };
    }
    instrumentId = inserted.id;
  }

  // Replace candle window for this tf (keeps table lean on free tier)
  const rows = candles.map((c) => ({
    instrument_id: instrumentId,
    tf,
    ts: new Date(c.timestamp).toISOString(),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));

  await supabase.from('candles').delete().eq('instrument_id', instrumentId).eq('tf', tf);
  const { error: candleError } = await supabase.from('candles').insert(rows);
  if (candleError) {
    return {
      outcome: {
        symbol: inst.symbol,
        market: inst.market,
        health: 'down',
        candles: 0,
        error: candleError.message,
      },
    };
  }

  const ctx: MarketContext = {
    symbol: inst.symbol,
    market: inst.market as MarketContext['market'],
    timeframe: tf as MarketContext['timeframe'],
    candles,
    volumeProfile: buildVolumeProfile(candles),
  };

  return {
    outcome: { symbol: inst.symbol, market: inst.market, health: 'live', candles: candles.length },
    ctx,
  };
}

export interface SignalRow {
  instrument_id: number;
  tf: string;
  direction: 'long' | 'short' | 'neutral';
  confidence: number;
  reason: string;
  evidence: Record<string, unknown>;
  invalidation?: number;
}

export async function computeAndStoreSignal(
  supabase: ReturnType<typeof createAdminClient>,
  ctx: MarketContext
): Promise<{ stored: boolean; direction?: string; confidence?: number; reason?: string; error?: string }> {
  const { data: inst } = await supabase
    .from('instruments')
    .select('id')
    .eq('symbol', ctx.symbol)
    .maybeSingle();

  if (!inst) return { stored: false, error: 'instrument not registered' };

  try {
    const fused = await fuseSignals(ctx);

    const row: SignalRow = {
      instrument_id: inst.id,
      tf: ctx.timeframe,
      direction: fused.direction,
      confidence: fused.confidence,
      reason: fused.reason,
      evidence: fused.evidence,
      invalidation: fused.invalidation,
    };

    const { error } = await supabase.from('signals').insert([row]);
    if (error) return { stored: false, error: error.message };

    return {
      stored: true,
      direction: fused.direction,
      confidence: fused.confidence,
      reason: fused.reason,
    };
  } catch (err) {
    return { stored: false, error: err instanceof Error ? err.message : String(err) };
  }
}
