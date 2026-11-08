import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// Confluence methods (not standalone, used for weighting)
export const confluenceEMAStructure: SignalMethod = {
  id: 'confluence.ema_structure',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    
    if (candles.length < 200) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for EMA structure analysis',
        evidence: {}
      };
    }
    
    // Calculate EMAs
    const ema20 = calculateEMA(candles, 20);
    const ema50 = calculateEMA(candles, 50);
    const ema200 = calculateEMA(candles, 200);
    
    const currentPrice = candles[candles.length - 1].close;
    
    // EMA stack confluence
    if (currentPrice > ema20 && ema20 > ema50 && ema50 > ema200) {
      return {
        direction: 'long',
        confidence: 0.6,
        reason: `Bullish EMA stack confluence (20/50/200)`, 
        evidence: {
          ema20,
          ema50,
          ema200,
          currentPrice
        }
      };
    }
    
    if (currentPrice < ema20 && ema20 < ema50 && ema50 < ema200) {
      return {
        direction: 'short',
        confidence: 0.6,
        reason: `Bearish EMA stack confluence (20/50/200)`, 
        evidence: {
          ema20,
          ema50,
          ema200,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No EMA structure confluence detected',
      evidence: {}
    };
  }
};

export const confluenceRSIDivergence: SignalMethod = {
  id: 'confluence.rsi_divergence',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    
    if (candles.length < 30) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for RSI divergence analysis',
        evidence: {}
      };
    }
    
    // Simple RSI calculation
    const rsi = calculateRSI(candles, 14);
    const currentPrice = candles[candles.length - 1].close;
    
    // Bullish RSI divergence
    if (rsi < 30 && currentPrice < Math.min(...candles.slice(-10, -1).map(c => c.close))) {
      return {
        direction: 'long',
        confidence: 0.65,
        reason: `Bullish RSI divergence in oversold territory (${rsi.toFixed(1)})`, 
        evidence: {
          rsi,
          currentPrice
        }
      };
    }
    
    // Bearish RSI divergence
    if (rsi > 70 && currentPrice > Math.max(...candles.slice(-10, -1).map(c => c.close))) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `Bearish RSI divergence in overbought territory (${rsi.toFixed(1)})`, 
        evidence: {
          rsi,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No RSI divergence detected',
      evidence: {}
    };
  }
};

export const confluenceVWAPDeviation: SignalMethod = {
  id: 'confluence.vwap_deviation',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    
    if (candles.length < 20) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for VWAP deviation analysis',
        evidence: {}
      };
    }
    
    // Simple VWAP calculation
    const vwap = calculateVWAP(candles);
    const currentPrice = candles[candles.length - 1].close;
    
    const deviation = (currentPrice - vwap) / vwap;
    
    // Standard deviation bands (simplified)
    if (deviation > 0.02) { // 2% above VWAP
      return {
        direction: 'short',
        confidence: 0.6,
        reason: `Price extended above VWAP (${(deviation * 100).toFixed(1)}%) indicating potential mean reversion`, 
        evidence: {
          vwap,
          currentPrice,
          deviation
        }
      };
    }
    
    if (deviation < -0.02) { // 2% below VWAP
      return {
        direction: 'long',
        confidence: 0.6,
        reason: `Price extended below VWAP (${(deviation * 100).toFixed(1)}%) indicating potential mean reversion`, 
        evidence: {
          vwap,
          currentPrice,
          deviation
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'Price near VWAP indicating neutral bias',
      evidence: {
        vwap,
        currentPrice,
        deviation
      }
    };
  }
};

// Helper functions
function calculateEMA(candles: any[], period: number): number {
  if (candles.length < period) return 0;
  
  const k = 2 / (period + 1);
  let ema = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
  }
  
  return ema;
}

function calculateRSI(candles: any[], period: number): number {
  if (candles.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i-1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i-1].close;
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateVWAP(candles: any[]): number {
  let typicalPriceSum = 0;
  let volumeSum = 0;
  
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    typicalPriceSum += typicalPrice * c.volume;
    volumeSum += c.volume;
  }
  
  return volumeSum > 0 ? typicalPriceSum / volumeSum : 0;
}

export const confluenceMethods = [
  confluenceEMAStructure,
  confluenceRSIDivergence,
  confluenceVWAPDeviation,
];