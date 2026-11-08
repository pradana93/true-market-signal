import { SignalMethod, MarketContext, MethodSignal, Market, TF } from './methods/index';
import { smcMethods } from './methods/smc';
import { volumeProfileMethods } from './methods/volume-profile';
import { orderbookMethods } from './methods/orderbook';
import { footprintMethods } from './methods/footprint';
import { cvdMethods } from './methods/cvd';
import { absorptionMethods } from './methods/absorption';
import { confluenceMethods } from './methods/confluence';

export type { MarketContext } from './methods/index';

// All available signal methods
export const ALL_METHODS: SignalMethod[] = [
  ...smcMethods,
  ...volumeProfileMethods,
  ...orderbookMethods,
  ...footprintMethods,
  ...cvdMethods,
  ...absorptionMethods,
  ...confluenceMethods,
];

// Regime detection
export enum Regime {
  TRENDING = 'trending',
  RANGING = 'ranging',
  VOLATILE = 'volatile',
  QUIET = 'quiet',
}

export interface RegimeResult {
  regime: Regime;
  confidence: number;
  evidence: Record<string, unknown>;
}

// Detect market regime
export function detectRegime(candles: any[]): RegimeResult {
  if (candles.length < 20) {
    return {
      regime: Regime.QUIET,
      confidence: 0.3,
      evidence: { reason: 'Insufficient data' }
    };
  }
  
  // Calculate ADX (simplified)
  const adx = calculateADX(candles);
  const atrPercent = calculateATRPercent(candles);
  
  // Determine regime based on ADX and ATR
  if (adx > 25 && atrPercent > 1.5) {
    return {
      regime: Regime.TRENDING,
      confidence: 0.85,
      evidence: { adx, atrPercent }
    };
  }
  
  if (adx < 15 && atrPercent < 0.5) {
    return {
      regime: Regime.QUIET,
      confidence: 0.75,
      evidence: { adx, atrPercent }
    };
  }
  
  if (adx < 20 && atrPercent > 1.0) {
    return {
      regime: Regime.VOLATILE,
      confidence: 0.7,
      evidence: { adx, atrPercent }
    };
  }
  
  return {
    regime: Regime.RANGING,
    confidence: 0.65,
    evidence: { adx, atrPercent }
  };
}

// Fusion weights per market, timeframe, regime
const DEFAULT_WEIGHTS: Record<string, Record<string, number>> = {
  trending: {
    'smc.bos': 1.2,
    'smc.choch': 1.1,
    'vp.poc_break': 1.0,
    'vp.vah_val': 0.9,
    'orderbook.sweep': 1.0,
    'orderbook.imbalance': 1.0,
    'footprint.imbalance': 1.1,
    'footprint.delta_divergence': 1.0,
    'cvd.slope': 1.0,
    'cvd.divergence': 1.0,
    'absorption.exhaustion': 0.8,
    'confluence.ema_structure': 1.0,
    'confluence.rsi_divergence': 0.8,
    'confluence.vwap_deviation': 0.7,
  },
  ranging: {
    'smc.bos': 0.8,
    'smc.choch': 1.2,
    'vp.poc_break': 1.0,
    'vp.vah_val': 1.1,
    'orderbook.sweep': 0.9,
    'orderbook.imbalance': 0.8,
    'footprint.imbalance': 0.9,
    'footprint.delta_divergence': 1.0,
    'cvd.slope': 0.8,
    'cvd.divergence': 1.0,
    'absorption.exhaustion': 1.0,
    'confluence.ema_structure': 0.6,
    'confluence.rsi_divergence': 1.0,
    'confluence.vwap_deviation': 0.9,
  },
  volatile: {
    'smc.bos': 1.1,
    'smc.choch': 1.0,
    'vp.poc_break': 0.9,
    'vp.vah_val': 0.8,
    'orderbook.sweep': 1.1,
    'orderbook.imbalance': 1.1,
    'footprint.imbalance': 1.0,
    'footprint.delta_divergence': 0.9,
    'cvd.slope': 0.9,
    'cvd.divergence': 1.1,
    'absorption.exhaustion': 1.0,
    'confluence.ema_structure': 0.7,
    'confluence.rsi_divergence': 1.1,
    'confluence.vwap_deviation': 0.8,
  },
  quiet: {
    'smc.bos': 0.7,
    'smc.choch': 0.8,
    'vp.poc_break': 0.8,
    'vp.vah_val': 1.0,
    'orderbook.sweep': 0.8,
    'orderbook.imbalance': 0.9,
    'footprint.imbalance': 0.8,
    'footprint.delta_divergence': 0.9,
    'cvd.slope': 0.8,
    'cvd.divergence': 0.8,
    'absorption.exhaustion': 0.9,
    'confluence.ema_structure': 0.5,
    'confluence.rsi_divergence': 0.9,
    'confluence.vwap_deviation': 1.0,
  },
};

// Fuse signals from all methods
export interface FusedSignal {
  direction: 'long' | 'short' | 'neutral';
  confidence: number;
  reason: string;
  evidence: Record<string, unknown>;
  invalidation?: number;
  methodSignals: Record<string, MethodSignal>;
}

export async function fuseSignals(ctx: MarketContext): Promise<FusedSignal> {
  // Detect regime
  const regimeResult = detectRegime(ctx.candles);
  const regime = regimeResult.regime;
  
  // Get weights for this regime
  const weights = DEFAULT_WEIGHTS[regime] || DEFAULT_WEIGHTS.ranging;
  
  // Filter methods applicable to this market and timeframe
  const applicableMethods = ALL_METHODS.filter(
    m => m.markets.includes(ctx.market) && m.timeframe.includes(ctx.timeframe)
  );
  
  // Compute signals from each method
  const methodSignals: Record<string, MethodSignal> = {};
  const promises = applicableMethods.map(async (method) => {
    try {
      const signal = await method.compute(ctx);
      methodSignals[method.id] = signal;
    } catch (error) {
      console.error(`Error computing signal for ${method.id}:`, error);
      methodSignals[method.id] = {
        direction: 'neutral',
        confidence: 0.3,
        reason: 'Error computing signal',
        evidence: {}
      };
    }
  });
  
  await Promise.all(promises);
  
  // Weight and aggregate signals. Neutral readings are abstentions, not votes
  // for sideways, so they are excluded from the score.
  let longWeight = 0;
  let shortWeight = 0;
  const firedLong: string[] = [];
  const firedShort: string[] = [];

  for (const [methodId, signal] of Object.entries(methodSignals)) {
    const weight = weights[methodId] || 1.0;

    if (signal.direction === 'long') {
      longWeight += signal.confidence * weight;
      if (signal.confidence >= 0.6) firedLong.push(methodId);
    } else if (signal.direction === 'short') {
      shortWeight += signal.confidence * weight;
      if (signal.confidence >= 0.6) firedShort.push(methodId);
    }
  }

  const decisiveWeight = longWeight + shortWeight;
  let direction: 'long' | 'short' | 'neutral' = 'neutral';
  let confidence = 0;
  let reason = '';
  
  // Require at least 2 corroborating methods for confidence >= 0.6
  const corroboratingLong = Object.entries(methodSignals).filter(([id, s]) => 
    s.direction === 'long' && s.confidence >= 0.6
  ).length;
  
  const corroboratingShort = Object.entries(methodSignals).filter(([id, s]) => 
    s.direction === 'short' && s.confidence >= 0.6
  ).length;
  
  if (decisiveWeight === 0) {
    direction = 'neutral';
    confidence = 0.3;
    reason = `No setup on ${ctx.symbol} ${ctx.timeframe}. No method found a pattern. ${regime} regime.`;
  } else if (longWeight > shortWeight * 1.15) {
    direction = 'long';
    confidence = Math.min(0.95, longWeight / decisiveWeight);

    // Reduce confidence if not enough corroboration
    if (corroboratingLong < 2 && confidence >= 0.6) {
      confidence = 0.55;
    }

    const adxVal = (regimeResult.evidence as any).adx;
    reason = `Long ${ctx.symbol} ${ctx.timeframe} — ${firedLong.slice(0, 3).map(m => m.split('.')[1]).join(', ')} confirmed. ${adxVal ? `Regime: ${regime} (ADX: ${adxVal.toFixed(1)})` : `Regime: ${regime}`}`;
  } else if (shortWeight > longWeight * 1.15) {
    direction = 'short';
    confidence = Math.min(0.95, shortWeight / decisiveWeight);

    if (corroboratingShort < 2 && confidence >= 0.6) {
      confidence = 0.55;
    }

    const adxVal2 = (regimeResult.evidence as any).adx;
    reason = `Short ${ctx.symbol} ${ctx.timeframe} — ${firedShort.slice(0, 3).map(m => m.split('.')[1]).join(', ')} confirmed. ${adxVal2 ? `Regime: ${regime} (ADX: ${adxVal2.toFixed(1)})` : `Regime: ${regime}`}`;
  } else {
    direction = 'neutral';
    confidence = 0.35;
    const conflict = [...firedLong, ...firedShort].slice(0, 3).map((id) => `${id.split('.')[1]}=${methodSignals[id].direction}`);
    reason = `Split evidence on ${ctx.symbol} ${ctx.timeframe} — ${conflict.join(' vs ') || 'balanced weight'}. ${regime} regime.`;
  }
  
  // Calculate invalidation level
  let invalidation: number | undefined;
  if (direction !== 'neutral') {
    const price = ctx.candles[ctx.candles.length - 1].close;
    const atr = calculateATR(ctx.candles);
    
    if (direction === 'long') {
      invalidation = price - atr * 1.5;
    } else {
      invalidation = price + atr * 1.5;
    }
  }
  
  return {
    direction,
    confidence: parseFloat(confidence.toFixed(2)),
    reason,
    evidence: {
      regime: regimeResult,
      methodWeights: weights,
      methodSignals,
      decisiveWeight,
      corroboratingLong,
      corroboratingShort,
    },
    invalidation,
    methodSignals,
  };
}

// Helper functions
function calculateADX(candles: any[]): number {
  if (candles.length < 20) return 0;
  
  let sumDMPlus = 0;
  let sumDMMinus = 0;
  let sumTR = 0;
  
  for (let i = 1; i < 20; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i-1].high;
    const prevLow = candles[i-1].low;
    const prevClose = candles[i-1].close;
    
    const dmPlus = high - prevHigh;
    const dmMinus = prevLow - low;
    
    sumDMPlus += dmPlus > dmMinus && dmPlus > 0 ? dmPlus : 0;
    sumDMMinus += dmMinus > dmPlus && dmMinus > 0 ? dmMinus : 0;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    sumTR += tr;
  }
  
  if (sumTR === 0) return 0;
  
  const diPlus = (sumDMPlus / sumTR) * 100;
  const diMinus = (sumDMMinus / sumTR) * 100;
  
  return Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
}

function calculateATR(candles: any[]): number {
  if (candles.length < 14) return 0;
  
  let sumTR = 0;
  
  for (let i = 1; i < 14; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i-1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    sumTR += tr;
  }
  
  return sumTR / 14;
}

function calculateATRPercent(candles: any[]): number {
  const atr = calculateATR(candles);
  const currentPrice = candles[candles.length - 1].close;
  return (atr / currentPrice) * 100;
}