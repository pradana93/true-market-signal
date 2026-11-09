import { createAdminClient } from '@/lib/supabase/server';
import { ingestInstrument, computeAndStoreSignal } from '@/lib/ingest';
import type { MarketKey, ProviderId } from '@/lib/providers';

/**
 * Full engine pass: refresh candles for every enabled instrument, then score
 * it. This is the job a scheduler calls; the per-market handlers only re-score
 * candles already in the table.
 */

export interface IngestResult {
  symbol: string;
  ok: boolean;
  tf?: string;
  candles?: number;
  direction?: string;
  confidence?: number;
  error?: string;
}

const DAILY_MARKETS = new Set<string>(['stocks', 'etfs', 'indices']);
const KNOWN_PROVIDERS: ProviderId[] = ['binance', 'finnhub', 'twelvedata', 'yahoo'];
const CONCURRENCY = 4;

interface InstrumentRow {
  id: number;
  symbol: string;
  market: string;
  provider_ids: Record<string, string> | null;
}

/**
 * The provider mapping lives on the instrument row, so adding an instrument in
 * the database is enough to put it on the engine. Falls back to a market-based
 * default when the row predates the mapping.
 */
function resolveFeed(instrument: InstrumentRow): { provider: ProviderId; providerSymbol: string } | null {
  for (const [id, feedSymbol] of Object.entries(instrument.provider_ids ?? {})) {
    if (KNOWN_PROVIDERS.includes(id as ProviderId) && feedSymbol) {
      return { provider: id as ProviderId, providerSymbol: feedSymbol };
    }
  }

  if (instrument.market === 'forex' || instrument.market === 'commodities') {
    return { provider: 'twelvedata', providerSymbol: instrument.symbol };
  }
  return { provider: 'yahoo', providerSymbol: instrument.symbol };
}

async function scoreInstrument(supabase: ReturnType<typeof createAdminClient>, instrument: InstrumentRow): Promise<IngestResult> {
  const feed = resolveFeed(instrument);
  if (!feed) {
    return { symbol: instrument.symbol, ok: false, error: 'no provider mapping' };
  }

  const tf = DAILY_MARKETS.has(instrument.market) ? '1d' : '1h';

  try {
    const { outcome, ctx } = await ingestInstrument(
      supabase,
      {
        symbol: instrument.symbol,
        market: instrument.market as MarketKey,
        provider: feed.provider,
        exchange: '',
        providerSymbol: feed.providerSymbol,
      },
      tf
    );

    if (!ctx || outcome.health === 'down') {
      return {
        symbol: instrument.symbol,
        ok: false,
        tf,
        candles: outcome.candles,
        error: outcome.error ?? 'no candles',
      };
    }

    const scored = await computeAndStoreSignal(supabase, ctx);
    return {
      symbol: instrument.symbol,
      ok: scored.stored,
      tf,
      candles: outcome.candles,
      direction: scored.direction,
      confidence: scored.confidence,
      error: scored.error,
    };
  } catch (err) {
    return {
      symbol: instrument.symbol,
      ok: false,
      tf,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runFullIngest(): Promise<IngestResult[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('instruments')
    .select('id, symbol, market, provider_ids')
    .eq('enabled', true)
    .order('id');

  if (error) throw new Error(`Could not load instruments: ${error.message}`);

  const instruments = (data ?? []) as InstrumentRow[];
  const queue = [...instruments];
  const results: IngestResult[] = [];

  // A small pool keeps a whole run inside the function budget without opening
  // twenty simultaneous provider connections (Twelve Data allows 8 per minute).
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      results.push(await scoreInstrument(supabase, next));
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, instruments.length) }, worker));

  return results.sort((a, b) => a.symbol.localeCompare(b.symbol));
}