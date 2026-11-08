import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// CVD (Cumulative Volume Delta) methods
export const cvdSlope: SignalMethod = {
  id: 'cvd.slope',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, cvd } = ctx;
    
    if (!cvd) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'CVD data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // CVD slope detection
    if (cvd.slope > 0.5) {
      return {
        direction: 'long',
        confidence: 0.75,
        reason: `Strong positive CVD slope (${cvd.slope.toFixed(2)}) indicating accumulation`, 
        evidence: {
          slope: cvd.slope,
          currentPrice
        }
      };
    }
    
    if (cvd.slope < -0.5) {
      return {
        direction: 'short',
        confidence: 0.7,
        reason: `Strong negative CVD slope (${cvd.slope.toFixed(2)}) indicating distribution`, 
        evidence: {
          slope: cvd.slope,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No significant CVD slope detected',
      evidence: {}
    };
  }
};

export const cvdDivergence: SignalMethod = {
  id: 'cvd.divergence',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, cvd } = ctx;
    
    if (!cvd) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'CVD data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // CVD divergence detection
    if (cvd.divergence > 0.3 && currentPrice < Math.min(...candles.slice(-5).map(c => c.low))) {
      return {
        direction: 'long',
        confidence: 0.7,
        reason: `Bullish CVD divergence: positive divergence with price making lower lows`, 
        evidence: {
          divergence: cvd.divergence,
          currentPrice,
          recentLow: Math.min(...candles.slice(-5).map(c => c.low))
        }
      };
    }
    
    if (cvd.divergence < -0.3 && currentPrice > Math.max(...candles.slice(-5).map(c => c.high))) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `Bearish CVD divergence: negative divergence with price making higher highs`, 
        evidence: {
          divergence: cvd.divergence,
          currentPrice,
          recentHigh: Math.max(...candles.slice(-5).map(c => c.high))
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No significant CVD divergence detected',
      evidence: {}
    };
  }
};

export const cvdMethods = [
  cvdSlope,
  cvdDivergence,
];