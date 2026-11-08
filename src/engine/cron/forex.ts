import { createAdminClient } from '@/lib/supabase/server';
import { fuseSignals, MarketContext } from '@/engine/fusion';

// Process forex signals
export async function processForexSignals(supabase: ReturnType<typeof createAdminClient>) {
  // Get all active forex and commodities instruments
  const { data: instruments, error: instrumentsError } = await supabase
    .from('instruments')
    .select('id, symbol, market')
    .in('market', ['forex', 'commodities'])
    .eq('enabled', true);
  
  if (instrumentsError) {
    console.error('Error fetching forex/commodities instruments:', instrumentsError);
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
      
      // Get CVD data (tape-derived)
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