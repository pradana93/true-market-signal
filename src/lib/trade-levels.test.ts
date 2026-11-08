import { describe, it, expect } from 'vitest';
import { buildTradePlan, planFromSignal, pricePrecision, roundPrice } from './trade-levels';

const price = 100;

describe('trade plan levels', () => {
  it('places the stop below entry and targets above it for a long', () => {
    const plan = buildTradePlan({
      direction: 'long',
      price,
      atr: 2,
      regime: 'trending',
    });

    expect(plan).not.toBeNull();
    expect(plan!.stop.price).toBeLessThan(price);
    expect(plan!.targets[0].price).toBeGreaterThan(price);
    expect(plan!.targets[1].price).toBeGreaterThan(plan!.targets[0].price);
    expect(plan!.targets[2].price).toBeGreaterThan(plan!.targets[1].price);
  });

  it('mirrors the ladder for a short', () => {
    const plan = buildTradePlan({
      direction: 'short',
      price,
      atr: 2,
      regime: 'trending',
    });

    expect(plan!.stop.price).toBeGreaterThan(price);
    expect(plan!.targets[0].price).toBeLessThan(price);
    expect(plan!.targets[1].price).toBeLessThan(plan!.targets[0].price);
    expect(plan!.targets[2].price).toBeLessThan(plan!.targets[1].price);
  });

  it('sizes the stop at 1.5 ATR when no invalidation is supplied', () => {
    const plan = buildTradePlan({ direction: 'long', price, atr: 2, regime: 'ranging' });

    // 1.5 * ATR(2) = 3 of risk.
    expect(plan!.risk).toBeCloseTo(3, 6);
    expect(plan!.stop.price).toBeCloseTo(97, 6);
  });

  it('honours an invalidation level on the correct side of entry', () => {
    const plan = buildTradePlan({
      direction: 'long',
      price,
      atr: 2,
      invalidation: 98,
      regime: 'ranging',
    });

    expect(plan!.stop.price).toBe(98);
    expect(plan!.risk).toBeCloseTo(2, 6);
  });

  it('ignores an invalidation level on the wrong side of entry', () => {
    const plan = buildTradePlan({
      direction: 'long',
      price,
      atr: 2,
      // Above entry, so unusable as a long stop.
      invalidation: 105,
      regime: 'ranging',
    });

    expect(plan!.stop.price).toBeLessThan(price);
  });

  it('widens targets in trending regimes and tightens them when quiet', () => {
    const trending = buildTradePlan({ direction: 'long', price, atr: 2, regime: 'trending' });
    const quiet = buildTradePlan({ direction: 'long', price, atr: 2, regime: 'quiet' });

    expect(trending!.maxR).toBeGreaterThan(quiet!.maxR);
    expect(trending!.targets[2].price).toBeGreaterThan(quiet!.targets[2].price);
  });

  it('returns no plan for a neutral reading', () => {
    expect(buildTradePlan({ direction: 'neutral', price, atr: 2 })).toBeNull();
  });

  it('returns no plan without a usable price', () => {
    expect(buildTradePlan({ direction: 'long', price: null, atr: 2 })).toBeNull();
    expect(buildTradePlan({ direction: 'long', price: 0, atr: 2 })).toBeNull();
    expect(buildTradePlan({ direction: 'long', price: Number.NaN, atr: 2 })).toBeNull();
  });

  it('falls back to a percentage stop when ATR and invalidation are missing', () => {
    const plan = buildTradePlan({ direction: 'long', price, regime: 'ranging' });
    expect(plan).not.toBeNull();
    expect(plan!.risk).toBeGreaterThan(0);
    expect(plan!.stop.price).toBeLessThan(price);
  });

  it('keeps FX levels at a precision that does not collapse to zero', () => {
    // EUR/USD around 1.11 would round every level to 1.11 at two decimals.
    const plan = buildTradePlan({ direction: 'long', price: 1.0842, atr: 0.0012, regime: 'quiet' });
    expect(plan).not.toBeNull();
    const levels = [plan!.stop.price, ...plan!.targets.map((t) => t.price)];
    expect(new Set(levels).size).toBe(levels.length);
    expect(plan!.stop.price).toBeLessThan(plan!.entry.price);
  });

  it('reads regime and price out of a stored signal evidence payload', () => {
    const plan = planFromSignal({
      direction: 'long',
      invalidation: 4040,
      evidence: {
        price: 4074.9,
        atr: 14.57,
        regime: { regime: 'quiet', evidence: { adx: 14.1 } },
      },
    });

    expect(plan).not.toBeNull();
    expect(plan!.bias).toBe('long');
    expect(plan!.stop.price).toBe(4040);
  });

  it('scales precision with price magnitude', () => {
    expect(pricePrecision(68000)).toBe(2);
    expect(pricePrecision(540)).toBe(2);
    expect(pricePrecision(42)).toBe(3);
    expect(pricePrecision(1.0842)).toBe(5);
    expect(pricePrecision(0.62)).toBe(5);
    expect(roundPrice(1.084249, 4)).toBe(1.0842);
  });
});