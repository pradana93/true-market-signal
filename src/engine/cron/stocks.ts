import { createAdminClient } from '@/lib/supabase/server';
import { fuseSignals, MarketContext } from '@/engine/fusion';

// Process stocks signals
export async function processStocksSignals(supabase: ReturnType<typeof createAdminClient>) {
  // Get all active stocks instruments
  const { data: instruments, error: instrumentsError } = await supabase
    .from('instruments')
    .select('id, symbol, market')
    .eq('market', 'stocks')
    .eq('enabled', true);
  
  if (instrumentsError) {
    console.error('Error fetching stocks instruments:', instrumentsError);
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
        .eq('tf', '1d')
        .order('ts', { ascending: false })
        .limit(100);
      
      if (candlesError || !candles || candles.length === 0) {
        continue;
      }
      
      // Get volume profile
      const { data: volumeProfile, error: volumeProfileError } = await supabase
        .from('volume_profiles')
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
        timeframe: '1d',
        candles: candles.map(c => ({
          timestamp: new Date(c.ts).getTime(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        })).reverse(),
        volumeProfile: volumeProfile?.[0] ? {
          poc: volumeProfile[0].poc,
          vah: volumeProfile[0].vah,
          val: volumeProfile[0].val,
          valueArea: volumeProfile[0].value_area,
          totalVolume: volumeProfile[0].total_volume,
          timestamp: new Date(volumeProfile[0].ts).getTime(),
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
        // Store signal
        const { error: insertError } = await supabase
          .from('signals')
          .insert([{
            instrument_id: instrument.id,
            tf: '1d',
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