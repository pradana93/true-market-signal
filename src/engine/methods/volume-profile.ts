import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './index';

// Volume Profile methods
export const vpPOCBreak: SignalMethod = {
  id: 'vp.poc_break',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, volumeProfile } = ctx;
    
    if (!volumeProfile) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Volume profile data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // POC break detection
    if (currentPrice > volumeProfile.poc * 1.003) {
      return {
        direction: 'long',
        confidence: 0.8,
        reason: `POC break confirmed above ${volumeProfile.poc.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          poc: volumeProfile.poc,
          currentPrice,
          breakStrength: ((currentPrice / volumeProfile.poc) - 1) * 100
        }
      };
    }
    
    if (currentPrice < volumeProfile.poc * 0.997) {
      return {
        direction: 'short',
        confidence: 0.75,
        reason: `POC rejection confirmed below ${volumeProfile.poc.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          poc: volumeProfile.poc,
          currentPrice,
          rejectionStrength: ((volumeProfile.poc / currentPrice) - 1) * 100
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No POC break/rejection pattern detected',
      evidence: {}
    };
  }
};

export const vpVAHVAL: SignalMethod = {
  id: 'vp.vah_val',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, volumeProfile } = ctx;
    
    if (!volumeProfile) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Volume profile data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // VAH/VAL rejection detection
    if (currentPrice > volumeProfile.vah * 1.002) {
      return {
        direction: 'long',
        confidence: 0.7,
        reason: `VAH breakout confirmed above ${volumeProfile.vah.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          vah: volumeProfile.vah,
          currentPrice,
          breakStrength: ((currentPrice / volumeProfile.vah) - 1) * 100
        }
      };
    }
    
    if (currentPrice < volumeProfile.val * 0.998) {
      return {
        direction: 'short',
        confidence: 0.65,
        reason: `VAL rejection confirmed below ${volumeProfile.val.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          val: volumeProfile.val,
          currentPrice,
          rejectionStrength: ((volumeProfile.val / currentPrice) - 1) * 100
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No VAH/VAL break/rejection pattern detected',
      evidence: {}
    };
  }
};

export const vpValueAreaBreak: SignalMethod = {
  id: 'vp.value_area_break',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, volumeProfile } = ctx;
    
    if (!volumeProfile) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Volume profile data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Value area break detection
    if (currentPrice > volumeProfile.vah * 1.005) {
      return {
        direction: 'long',
        confidence: 0.65,
        reason: `Value area breakout confirmed above ${volumeProfile.vah.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          vah: volumeProfile.vah,
          currentPrice,
          breakStrength: ((currentPrice / volumeProfile.vah) - 1) * 100
        }
      };
    }
    
    if (currentPrice < volumeProfile.val * 0.995) {
      return {
        direction: 'short',
        confidence: 0.6,
        reason: `Value area rejection confirmed below ${volumeProfile.val.toFixed(2)} with price at ${currentPrice.toFixed(2)}`, 
        evidence: {
          val: volumeProfile.val,
          currentPrice,
          rejectionStrength: ((volumeProfile.val / currentPrice) - 1) * 100
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'No value area break/rejection pattern detected',
      evidence: {}
    };
  }
};

export const vpCompositeProfile: SignalMethod = {
  id: 'vp.composite_profile',
  markets: ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'],
  timeframe: ['1m', '5m', '15m', '1h', '4h', '1d'],
  async compute(ctx: MarketContext): Promise<MethodSignal> {
    const { candles, volumeProfile } = ctx;
    
    if (!volumeProfile) {
      return {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Volume profile data not available',
        evidence: {}
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    
    // Composite profile analysis
    const priceRelativeToPOC = (currentPrice - volumeProfile.poc) / volumeProfile.poc;
    
    if (priceRelativeToPOC > 0.02) {
      return {
        direction: 'long',
        confidence: 0.6,
        reason: `Price significantly above POC (${(priceRelativeToPOC * 100).toFixed(1)}%) indicating bullish bias`, 
        evidence: {
          poc: volumeProfile.poc,
          currentPrice,
          priceRelativeToPOC: priceRelativeToPOC
        }
      };
    }
    
    if (priceRelativeToPOC < -0.02) {
      return {
        direction: 'short',
        confidence: 0.6,
        reason: `Price significantly below POC (${(priceRelativeToPOC * 100).toFixed(1)}%) indicating bearish bias`, 
        evidence: {
          poc: volumeProfile.poc,
          currentPrice,
          priceRelativeToPOC: priceRelativeToPOC
        }
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reason: 'Price near POC indicating neutral bias',
      evidence: {
        poc: volumeProfile.poc,
        currentPrice,
        priceRelativeToPOC: priceRelativeToPOC
      }
    };
  }
};

export const volumeProfileMethods = [
  vpPOCBreak,
  vpVAHVAL,
  vpValueAreaBreak,
  vpCompositeProfile,
];