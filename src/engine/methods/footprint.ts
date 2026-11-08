import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// Footprint methods
export const footprintImbalance: SignalMethod = {
  id: 'footprint.imbalance',
  markets: ['crypto'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, footprint } = ctx;
    
    if (!footprint) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Footprint data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Footprint imbalance detection
    if (footprint.imbalance > 3.0) {
      return {
        direction: 'long',
        confidence: 0.75,
        reason: `Strong footprint imbalance (${footprint.imbalance.toFixed(1)}×) indicating bullish momentum`, 
        evidence: {
          imbalance: footprint.imbalance,
          delta: footprint.delta,
          currentPrice
        }
      };
    }
    
    if (footprint.imbalance < 0.33) {
      return {
        direction: 'short',
        confidence: 0.7,
        reason: `Strong footprint imbalance (${footprint.imbalance.toFixed(1)}×) indicating bearish momentum`, 
        evidence: {
          imbalance: footprint.imbalance,
          delta: footprint.delta,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No significant footprint imbalance detected',
      evidence: {}
    };
  }
};

export const footprintDeltaDivergence: SignalMethod = {
  id: 'footprint.delta_divergence',
  markets: ['crypto'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, footprint } = ctx;
    
    if (!footprint) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Footprint data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Delta divergence detection
    if (footprint.delta > 0 && currentPrice < Math.min(...candles.slice(-5).map(c => c.low))) {
      return {
        direction: 'long',
        confidence: 0.65,
        reason: `Bullish delta divergence: positive delta with price making lower lows`, 
        evidence: {
          delta: footprint.delta,
          currentPrice,
          recentLow: Math.min(...candles.slice(-5).map(c => c.low))
        }
      };
    }
    
    if (footprint.delta < 0 && currentPrice > Math.max(...candles.slice(-5).map(c => c.high))) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `Bearish delta divergence: negative delta with price making higher highs`, 
        evidence: {
          delta: footprint.delta,
          currentPrice,
          recentHigh: Math.max(...candles.slice(-5).map(c => c.high))
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No significant delta divergence detected',
      evidence: {}
    };
  }
};

export const footprintDiagonalImbalance: SignalMethod = {
  id: 'footprint.diagonal_imbalance',
  markets: ['crypto'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, footprint } = ctx;
    
    if (!footprint) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Footprint data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Diagonal imbalance detection
    if (footprint.diagonalImbalance > 3.0) {
      return {
        direction: 'long',
        confidence: 0.7,
        reason: `Strong diagonal imbalance (${footprint.diagonalImbalance.toFixed(1)}×) indicating bullish bias`, 
        evidence: {
          diagonalImbalance: footprint.diagonalImbalance,
          currentPrice
        }
      };
    }
    
    if (footprint.diagonalImbalance < 0.33) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `Strong diagonal imbalance (${footprint.diagonalImbalance.toFixed(1)}×) indicating bearish bias`, 
        evidence: {
          diagonalImbalance: footprint.diagonalImbalance,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No significant diagonal imbalance detected',
      evidence: {}
    };
  }
};

export const footprintMethods = [
  footprintImbalance,
  footprintDeltaDivergence,
  footprintDiagonalImbalance,
];