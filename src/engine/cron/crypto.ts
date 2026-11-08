import { createAdminClient } from '@/lib/supabase/server';
import { fuseSignals, MarketContext } from '@/engine/fusion';

// Process crypto signals
export async function processCryptoSignals(supabase: ReturnType<typeof createAdminClient>) {
  // Get all active crypto instruments
  const { data: instruments, error: instrumentsError } = await supabase
    .from('instruments')
    .select('id, symbol, market')
    .eq('market', 'crypto')
    .eq('enabled', true);
  
  if (instrumentsError) {
    console.error('Error fetching crypto instruments:', instrumentsError);
    return;
  }
  
  // For each instrument, compute signals
  for (const instrument of instruments) {
    try {
      // Get recent candles (last 100)
      const { data: candles, error: candlesError } = await supabase
        .from('candles')
        .select('*')
        .eq('instrument_id', instrument.id)
        .eq('tf', '1h')
        .order('ts', { ascending: false })
        .limit(100);
      
      if (candlesError || !candles || candles.length === 0) {
        continue;
      }
      
      // Get order book snapshot
      const { data: orderbook, error: orderbookError } = await supabase
        .from('orderbook_snapshots')
        .select('*')
        .eq('instrument_id', instrument.id)
        .order('ts', { ascending: false })
        .limit(1);
      
      // Get footprint data
      const { data: footprint, error: footprintError } = await supabase
        .from('footprint_data')
        .select('*')
        .eq('instrument_id', instrument.id)
        .order('ts', { ascending: false })
        .limit(1);
      
      // Get CVD data
      const { data: cvd, error: cvdError } = await supabase
        .from('cvd_data')
        .select('*')
        .eq('instrument_id', instrument.id)
        .order('ts', { ascending: false })
        .limit(1);
      
      // Prepare context
      const ctx: MarketContext = {
        symbol: instrument.symbol,
        market: instrument.market as any,
        timeframe: '1h',
        candles: candles.map(c => ({
          timestamp: new Date(c.ts).getTime(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        })).reverse(),
        orderbook: orderbook?.[0] ? {
          bids: orderbook[0].bids,
          asks: orderbook[0].asks,
          timestamp: new Date(orderbook[0].ts).getTime(),
        } : undefined,
        footprint: footprint?.[0] ? {
          imbalance: footprint[0].imbalance,
          delta: footprint[0].delta,
          diagonalImbalance: footprint[0].diagonal_imbalance,
          timestamp: new Date(footprint[0].ts).getTime(),
        } : undefined,
        cvd: cvd?.[0] ? {
          slope: cvd[0].slope,
          divergence: cvd[0].divergence,
          timestamp: new Date(cvd[0].ts).getTime(),
        } : undefined,
      };
      
      // Fuse signals
      const fusedSignal = await fuseSignals(ctx);
      
      // Only store if confidence is meaningful
      if (fusedSignal.confidence >= 0.45) {
        // Dedupe check using Redis or in-memory
        const signalHash = generateSignalHash(fusedSignal);
        
        // Store signal
        const { error: insertError } = await supabase
          .from('signals')
          .insert([{
            instrument_id: instrument.id,
            tf: '1h',
            direction: fusedSignal.direction,
            confidence: fusedSignal.confidence,
            reason: fusedSignal.reason,
            evidence: fusedSignal.evidence,
            invalidation: fusedSignal.invalidation,
          }]);
        
        if (insertError) {
          console.error(`Error storing signal for ${instrument.symbol}:`, insertError);
        }
      }
    } catch (error) {
      console.error(`Error processing ${instrument.symbol}:`, error);
    }
  }
}

function generateSignalHash(signal: any): string {
  const str = `${signal.direction}-${signal.confidence}-${signal.reason}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}