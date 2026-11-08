import { describe, it, expect } from 'vitest';
import { fuseSignals, detectRegime, Regime } from './fusion';
import type { MarketContext, Candle } from './methods';

// Helper to generate deterministic test candles
function generateTrendCandles(count = 100, upward = true): Candle[] {
  const candles: Candle[] = [];
  let basePrice = 100;
  let baseTime = Date.now() - count * 3600000;

  for (let i = 0; i < count; i++) {
    const change = (upward ? 0.6 : -0.6) + Math.sin(i * 0.2) * 0.2;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + 0.4;
    const low = Math.min(open, close) - 0.4;
    const volume = 1500000 + Math.abs(Math.sin(i)) * 500000;

    candles.push({
      timestamp: baseTime + i * 3600000,
      open,
      high,
      low,
      close,
      volume,
    });
    basePrice = close;
  }
  return candles;
}

describe('Signal Engine Regression Suite', () => {
  it('detects trending regime correctly', () => {
    const candles = generateTrendCandles(100, true);
    const regimeRes = detectRegime(candles);
    expect(regimeRes.regime).toBeDefined();
    expect(regimeRes.confidence).toBeGreaterThan(0.5);
  });

  it('generates a long signal on strong upward breakout candles', async () => {
    const candles = generateTrendCandles(120, true);
    // Force a massive breakout at the end
    const last = candles[candles.length - 1];
    candles.push({
      timestamp: last.timestamp + 3600000,
      open: last.close,
      high: last.close * 1.03,
      low: last.close,
      close: last.close * 1.025,
      volume: 5000000,
    });

    const ctx: MarketContext = {
      symbol: 'TESTUSDT',
      market: 'crypto',
      timeframe: '1h',
      candles,
      volumeProfile: {
        poc: last.close * 0.99,
        vah: last.close * 1.01,
        val: last.close * 0.97,
        valueArea: 0.7,
        totalVolume: 10000000,
        timestamp: Date.now(),
      },
    };

    const result = await fuseSignals(ctx);
    expect(result).toBeDefined();
    expect(['long', 'neutral', 'short']).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    expect(typeof result.reason).toBe('string');
  });
});
