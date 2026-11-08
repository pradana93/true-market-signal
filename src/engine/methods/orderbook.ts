import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// Order Book methods
export const orderbookSweep: SignalMethod = {
  id: 'orderbook.sweep',
  markets: ['crypto'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, orderbook } = ctx;
    
    if (!orderbook) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Order book data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Liquidity sweep detection: price moving through large bid/ask clusters
    const bidCluster = orderbook.bids.find(([price]) => price <= currentPrice * 0.995);
    const askCluster = orderbook.asks.find(([price]) => price >= currentPrice * 1.005);
    
    if (bidCluster && bidCluster[1] > 1000000) {
      return {
        direction: 'long',
        confidence: 0.7,
        reason: `Liquidity sweep detected at ${bidCluster[0].toFixed(2)} with ${bidCluster[1]} size`, 
        evidence: {
          sweepPrice: bidCluster[0],
          sweepSize: bidCluster[1],
          currentPrice
        }
      };
    }
    
    if (askCluster && askCluster[1] > 1000000) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `Liquidity sweep detected at ${askCluster[0].toFixed(2)} with ${askCluster[1]} size`, 
        evidence: {
          sweepPrice: askCluster[0],
          sweepSize: askCluster[1],
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No liquidity sweep pattern detected',
      evidence: {}
    };
  }
};

export const orderbookImbalance: SignalMethod = {
  id: 'orderbook.imbalance',
  markets: ['crypto'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, orderbook } = ctx;
    
    if (!orderbook) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Order book data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Order book imbalance detection
    const totalBidVolume = orderbook.bids.reduce((sum, [_, size]) => sum + size, 0);
    const totalAskVolume = orderbook.asks.reduce((sum, [_, size]) => sum + size, 0);
    
    const imbalanceRatio = totalBidVolume / (totalBidVolume + totalAskVolume);
    
    if (imbalanceRatio > 0.7) {
      return {
        direction: 'long',
        confidence: 0.75,
        reason: `Strong bid-side imbalance (${(imbalanceRatio * 100).toFixed(1)}%) indicating bullish pressure`, 
        evidence: {
          imbalanceRatio,
          totalBidVolume,
          totalAskVolume,
          currentPrice
        }
      };
    }
    
    if (imbalanceRatio < 0.3) {
      return {
        direction: 'short',
        confidence: 0.7,
        reason: `Strong ask-side imbalance (${(imbalanceRatio * 100).toFixed(1)}%) indicating bearish pressure`, 
        evidence: {
          imbalanceRatio,
          totalBidVolume,
          totalAskVolume,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No significant order book imbalance detected',
      evidence: {}
    };
  }
};

export const orderbookLiquidityVoids: SignalMethod = {
  id: 'orderbook.liquidity_voids',
  markets: ['crypto'],
  timeframe: ['1m', '5m', '15m', '1h'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, orderbook } = ctx;
    
    if (!orderbook) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Order book data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Liquidity void detection: gaps in order book
    const bidPrices = orderbook.bids.map(([price]) => price);
    const askPrices = orderbook.asks.map(([price]) => price);
    
    // Find gaps in bid prices
    let bidGap = false;
    for (let i = 1; i < bidPrices.length; i++) {
      if (bidPrices[i-1] - bidPrices[i] > 0.01 * currentPrice) {
        bidGap = true;
        break;
      }
    }
    
    // Find gaps in ask prices
    let askGap = false;
    for (let i = 1; i < askPrices.length; i++) {
      if (askPrices[i] - askPrices[i-1] > 0.01 * currentPrice) {
        askGap = true;
        break;
      }
    }
    
    if (bidGap && askGap) {
      return {
        direction: 'neutral',
        confidence: 0.6,
        reason: `Liquidity void detected on both bid and ask sides`, 
        evidence: {
          bidGap,
          askGap,
          currentPrice
        }
      };
    }
    
    if (bidGap) {
      return {
        direction: 'long',
        confidence: 0.65,
        reason: `Liquidity void detected on bid side`, 
        evidence: {
          bidGap,
          currentPrice
        }
      };
    }
    
    if (askGap) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `Liquidity void detected on ask side`, 
        evidence: {
          askGap,
          currentPrice
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No liquidity voids detected',
      evidence: {}
    };
  }
};

export const orderbookMethods = [
  orderbookSweep,
  orderbookImbalance,
  orderbookLiquidityVoids,
];