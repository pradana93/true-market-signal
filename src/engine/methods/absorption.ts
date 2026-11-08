import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// Absorption/Exhaustion methods
export const absorptionExhaustion: SignalMethod = {
  id: 'absorption.exhaustion',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    
    if (candles.length < 20) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for absorption analysis',
        evidence: {}
      };
    }
    
    // Absorption/exhaustion detection: high volume flat price movement
    const recentCandles = candles.slice(-10);
    const priceRange = Math.max(...recentCandles.map(c => c.high)) - Math.min(...recentCandles.map(c => c.low));
    const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
    
    // Look for high volume with low price movement
    if (avgVolume > 1000000 && priceRange < 0.005 * candles[candles.length - 1].close) {
      // High volume flat price - potential exhaustion
      return {
        direction: 'neutral',
        confidence: 0.65,
        reason: `High volume exhaustion pattern detected with ${avgVolume.toFixed(0)} volume and ${priceRange.toFixed(4)} price range`, 
        evidence: {
          avgVolume,
          priceRange,
          currentPrice: candles[candles.length - 1].close
        }
      };
    }
    
    // Decreasing volume into new highs/lows
    const volumeTrend = recentCandles.slice(-5).reduce((sum, c) => sum + c.volume, 0) / 
                       recentCandles.slice(-10, -5).reduce((sum, c) => sum + c.volume, 0);
    
    if (volumeTrend < 0.7 && candles[candles.length - 1].close > Math.max(...candles.slice(-20).map(c => c.high))) {
      return {
        direction: 'short',
        confidence: 0.6,
        reason: `Decreasing volume into new highs indicating exhaustion`, 
        evidence: {
          volumeTrend,
          currentPrice: candles[candles.length - 1].close,
          recentHigh: Math.max(...candles.slice(-20).map(c => c.high))
        }
      };
    }
    
    if (volumeTrend < 0.7 && candles[candles.length - 1].close < Math.min(...candles.slice(-20).map(c => c.low))) {
      return {
        direction: 'long',
        confidence: 0.6,
        reason: `Decreasing volume into new lows indicating exhaustion`, 
        evidence: {
          volumeTrend,
          currentPrice: candles[candles.length - 1].close,
          recentLow: Math.min(...candles.slice(-20).map(c => c.low))
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No absorption or exhaustion pattern detected',
      evidence: {}
    };
  }
};

export const absorptionMethods = [
  absorptionExhaustion,
];