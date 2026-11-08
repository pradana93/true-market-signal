import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// Smart Money Concepts methods
export const smcBOS: SignalMethod = {
  id: 'smc.bos',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    // Basic BOS detection logic
    const { candles } = ctx;
    if (candles.length < 20) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for BOS analysis',
        evidence: {}
      };
    }
    
    // Simple BOS detection: price breaking above previous swing high
    const recentHigh = Math.max(...candles.slice(-10).map(c => c.high));
    const currentPrice = candles[candles.length - 1].close;
    
    if (currentPrice > recentHigh * 1.005) { // 0.5% buffer
      return {
        direction: 'long',
        confidence: 0.75,
        reason: `BOS confirmed above ${recentHigh.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          recentHigh,
          currentPrice,
          breakoutStrength: ((currentPrice / recentHigh) - 1) * 100
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No BOS pattern detected',
      evidence: {}
    };
  }
};

export const smcCHOCH: SignalMethod = {
  id: 'smc.choch',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    if (candles.length < 20) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for CHoCH analysis',
        evidence: {}
      };
    }
    
    // CHoCH detection: lower high followed by lower low
    const highs = candles.slice(-20).map(c => c.high);
    const lows = candles.slice(-20).map(c => c.low);
    
    // Find swing points
    const swingHighs = [];
    const swingLows = [];
    
    for (let i = 5; i < highs.length - 5; i++) {
      if (highs[i] > Math.max(...highs.slice(i-5, i)) && highs[i] > Math.max(...highs.slice(i+1, i+6))) {
        swingHighs.push({ index: i, price: highs[i] });
      }
      if (lows[i] < Math.min(...lows.slice(i-5, i)) && lows[i] < Math.min(...lows.slice(i+1, i+6))) {
        swingLows.push({ index: i, price: lows[i] });
      }
    }
    
    if (swingHighs.length >= 2 && swingLows.length >= 2) {
      const lastTwoHighs = swingHighs.slice(-2);
      const lastTwoLows = swingLows.slice(-2);
      
      if (lastTwoHighs[0].price > lastTwoHighs[1].price && lastTwoLows[0].price > lastTwoLows[1].price) {
        return {
          direction: 'short',
          confidence: 0.7,
          reason: `CHoCH breakdown confirmed with lower high (${lastTwoHighs[1].price.toFixed(2)}) and lower low (${lastTwoLows[1].price.toFixed(2)})`, 
          evidence: {
            lastHigh: lastTwoHighs[0].price,
            currentHigh: lastTwoHighs[1].price,
            lastLow: lastTwoLows[0].price,
            currentLow: lastTwoLows[1].price
          }
        };
      }
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No CHoCH pattern detected',
      evidence: {}
    };
  }
};

export const smcOrderBlock: SignalMethod = {
  id: 'smc.order_block',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    if (candles.length < 10) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for order block analysis',
        evidence: {}
      };
    }
    
    // Order block detection: strong bullish/bearish candle with follow-through
    const recentCandles = candles.slice(-10);
    const strongCandles = recentCandles.filter(c => (c.close - c.open) / c.open > 0.01 || (c.open - c.close) / c.open > 0.01);
    
    if (strongCandles.length > 0) {
      const lastStrong = strongCandles[strongCandles.length - 1];
      const isBullish = lastStrong.close > lastStrong.open;
      
      // Check for follow-through
      const followThrough = recentCandles.slice(-5).filter(c => 
        isBullish ? c.close > lastStrong.close : c.close < lastStrong.close
      ).length > 2;
      
      if (followThrough) {
        return {
          direction: isBullish ? 'long' : 'short',
          confidence: 0.65,
          reason: `${isBullish ? 'Bullish' : 'Bearish'} order block confirmed with follow-through`, 
          evidence: {
            orderBlockPrice: isBullish ? lastStrong.high : lastStrong.low,
            followThroughCount: recentCandles.slice(-5).filter(c => 
              isBullish ? c.close > lastStrong.close : c.close < lastStrong.close
            ).length
          }
        };
      }
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No order block pattern detected',
      evidence: {}
    };
  }
};

export const smcFVG: SignalMethod = {
  id: 'smc.fvg',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    if (candles.length < 10) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for FVG analysis',
        evidence: {}
      };
    }
    
    // FVG detection: gap between previous candle's high/low and current candle's low/high
    const recentCandles = candles.slice(-10);
    
    for (let i = 1; i < recentCandles.length; i++) {
      const prev = recentCandles[i-1];
      const curr = recentCandles[i];
      
      // Bullish FVG: previous candle's high < current candle's low
      if (prev.high < curr.low) {
        return {
          direction: 'long',
          confidence: 0.7,
          reason: `Bullish FVG detected between ${prev.high.toFixed(2)} and ${curr.low.toFixed(2)}`, 
          evidence: {
            fvgLow: prev.high,
            fvgHigh: curr.low,
            fvgSize: curr.low - prev.high
          }
        };
      }
      
      // Bearish FVG: previous candle's low > current candle's high
      if (prev.low > curr.high) {
        return {
          direction: 'short',
          confidence: 0.7,
          reason: `Bearish FVG detected between ${curr.high.toFixed(2)} and ${prev.low.toFixed(2)}`, 
          evidence: {
            fvgLow: curr.high,
            fvgHigh: prev.low,
            fvgSize: prev.low - curr.high
          }
        };
      }
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No FVG pattern detected',
      evidence: {}
    };
  }
};

export const smcLiquiditySweep: SignalMethod = {
  id: 'smc.liquidity_sweep',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    if (candles.length < 20) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for liquidity sweep analysis',
        evidence: {}
      };
    }
    
    // Liquidity sweep detection: price moving through obvious liquidity pools
    const recentCandles = candles.slice(-20);
    const recentHighs = recentCandles.map(c => c.high);
    const recentLows = recentCandles.map(c => c.low);
    
    // Find recent swing highs/lows
    const swingHighs = [];
    const swingLows = [];
    
    for (let i = 5; i < recentHighs.length - 5; i++) {
      if (recentHighs[i] > Math.max(...recentHighs.slice(i-5, i)) && recentHighs[i] > Math.max(...recentHighs.slice(i+1, i+6))) {
        swingHighs.push(recentHighs[i]);
      }
      if (recentLows[i] < Math.min(...recentLows.slice(i-5, i)) && recentLows[i] < Math.min(...recentLows.slice(i+1, i+6))) {
        swingLows.push(recentLows[i]);
      }
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Check for liquidity sweeps above recent swing highs
    if (swingHighs.length > 0) {
      const recentSwingHigh = Math.max(...swingHighs);
      if (currentPrice > recentSwingHigh * 1.003) {
        return {
          direction: 'long',
          confidence: 0.65,
          reason: `Liquidity sweep above recent swing high ${recentSwingHigh.toFixed(2)}`, 
          evidence: {
            swingHigh: recentSwingHigh,
            currentPrice,
            sweepDistance: ((currentPrice / recentSwingHigh) - 1) * 100
          }
        };
      }
    }
    
    // Check for liquidity sweeps below recent swing lows
    if (swingLows.length > 0) {
      const recentSwingLow = Math.min(...swingLows);
      if (currentPrice < recentSwingLow * 0.997) {
        return {
          direction: 'short',
          confidence: 0.65,
          reason: `Liquidity sweep below recent swing low ${recentSwingLow.toFixed(2)}`, 
          evidence: {
            swingLow: recentSwingLow,
            currentPrice,
            sweepDistance: ((recentSwingLow / currentPrice) - 1) * 100
          }
        };
      }
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No liquidity sweep pattern detected',
      evidence: {}
    };
  }
};

export const smcPremiumDiscount: SignalMethod = {
  id: 'smc.premium_discount',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles } = ctx;
    if (candles.length < 20) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Insufficient candle data for premium/discount analysis',
        evidence: {}
      };
    }
    
    // Premium/discount zone detection: price relative to volume profile
    const recentCandles = candles.slice(-50);
    const avgPrice = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
    const priceRange = Math.max(...recentCandles.map(c => c.high)) - Math.min(...recentCandles.map(c => c.low));
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Premium zone: price in top 25% of recent range
    if (currentPrice > avgPrice + priceRange * 0.25) {
      return {
        direction: 'long',
        confidence: 0.6,
        reason: `Price in premium zone above ${avgPrice.toFixed(2)}`, 
        evidence: {
          avgPrice,
          currentPrice,
          premiumZone: avgPrice + priceRange * 0.25
        }
      };
    }
    
    // Discount zone: price in bottom 25% of recent range
    if (currentPrice < avgPrice - priceRange * 0.25) {
      return {
        direction: 'short',
        confidence: 0.6,
        reason: `Price in discount zone below ${avgPrice.toFixed(2)}`, 
        evidence: {
          avgPrice,
          currentPrice,
          discountZone: avgPrice - priceRange * 0.25
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No premium/discount zone detected',
      evidence: {}
    };
  }
};

export const smcMethods = [
  smcBOS,
  smcCHOCH,
  smcOrderBlock,
  smcFVG,
  smcLiquiditySweep,
  smcPremiumDiscount,
];