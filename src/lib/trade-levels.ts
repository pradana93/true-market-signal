/**
 * Trade plan levels (stop loss and three take-profit targets).
 *
 * Everything here is derived from evidence the fusion engine already produced:
 * the entry (last close), the ATR, the regime and the invalidation price. No
 * level is invented — if a signal stands aside (neutral) there is no plan, and
 * the UI must say so rather than print numbers that imply a trade exists.
 *
 * Target sizing is expressed in R (one R = the distance from entry to stop), so
 * the ladder is comparable across instruments regardless of price scale. The
 * multiples widen with the regime: a trending tape earns more room than a quiet
 * one, because the same R is less likely to be reached when there is no trend.
 */

export type TradeDirection = 'long' | 'short' | 'neutral';

export interface TradeLevel {
  price: number;
  /** Distance from entry, always positive. */
  distance: number;
  /** Distance as a share of entry price. */
  distancePct: number;
  /** Reward-to-risk multiple for targets, undefined for the stop. */
  rMultiple?: number;
}

export interface TradePlan {
  bias: Exclude<TradeDirection, 'neutral'>;
  entry: TradeLevel;
  stop: TradeLevel;
  targets: [TradeLevel, TradeLevel, TradeLevel];
  /** Risk per unit, i.e. |entry - stop|. */
  risk: number;
  riskPct: number;
  /** Total reward at the third target, in R. */
  maxR: number;
  /**
   * Decimal places that keep every level on this plan legible. Consumers must
   * format with this rather than a fixed two decimals: an FX level at 1.1129
   * would otherwise render as 1.11 and the whole ladder would collapse.
   */
  precision: number;
  /** Plain-language record of how the levels were built. */
  derivation: string;
}

/** R multiples per regime: [TP1, TP2, TP3]. */
const REGIME_TARGETS: Record<string, [number, number, number]> = {
  trending: [1.5, 2.5, 4.0],
  volatile: [1.2, 2.0, 3.0],
  ranging: [1.0, 1.8, 2.5],
  quiet: [1.0, 1.5, 2.0],
};

const DEFAULT_TARGETS: [number, number, number] = [1.0, 2.0, 3.0];

/**
 * Fallback risk when ATR and invalidation are both unusable. Expressed as a
 * share of price because a zero-distance stop is not a trade plan.
 */
const FALLBACK_RISK_PCT = 0.006;

/**
 * Decimal places that keep a level readable at its own price scale: two for
 * index-sized numbers, five below ten so FX majors around 1.10 keep enough
 * resolution for a stop a few pips away to stay distinct from entry.
 */
export function pricePrecision(price: number): number {
  const p = Math.abs(price);
  if (p >= 100) return 2;
  if (p >= 10) return 3;
  return 5;
}

export function roundPrice(price: number, precision = pricePrecision(price)): number {
  const factor = 10 ** precision;
  return Math.round(price * factor) / factor;
}

function toLevel(price: number, entry: number, rMultiple?: number, risk?: number): TradeLevel {
  const distance = Math.abs(price - entry);
  return {
    price,
    distance,
    distancePct: entry === 0 ? 0 : (distance / Math.abs(entry)) * 100,
    ...(rMultiple !== undefined && risk ? { rMultiple } : {}),
  };
}

export interface TradePlanInput {
  direction: TradeDirection;
  /** Last close used as entry. */
  price?: number | null;
  /** Average true range from the regime evidence. */
  atr?: number | null;
  /** Invalidation price from the signal. */
  invalidation?: number | null;
  /** Regime name, e.g. 'trending'. */
  regime?: string | null;
}

/**
 * Build a trade plan, or return null when the signal is not actionable.
 */
export function buildTradePlan(input: TradePlanInput): TradePlan | null {
  const { direction, price, atr, invalidation, regime } = input;

  if (direction !== 'long' && direction !== 'short') return null;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;

  const precision = pricePrecision(price);
  const sign = direction === 'long' ? 1 : -1;

  // Risk first: the stop defines the unit of reward.
  const atrRisk = typeof atr === 'number' && Number.isFinite(atr) && atr > 0 ? atr * 1.5 : undefined;
  const invalidationRisk =
    typeof invalidation === 'number' && Number.isFinite(invalidation) && invalidation > 0
      ? Math.abs(price - invalidation)
      : undefined;

  const rawRisk =
    atrRisk ?? invalidationRisk ?? Math.abs(price) * FALLBACK_RISK_PCT;

  // A stop must sit on the losing side of entry.
  const stopPrice =
    typeof invalidation === 'number' &&
    Number.isFinite(invalidation) &&
    (direction === 'long' ? invalidation < price : invalidation > price)
      ? invalidation
      : price - sign * rawRisk;

  const risk = Math.abs(price - stopPrice);
  if (risk <= 0) return null;

  const multiples = REGIME_TARGETS[regime ?? ''] ?? DEFAULT_TARGETS;

  const targetPrices = multiples.map((m) => roundPrice(price + sign * risk * m, precision));

  const entryLevel = toLevel(roundPrice(price, precision), price);
  const stopLevel = toLevel(roundPrice(stopPrice, precision), price);
  const targetLevels = targetPrices.map((p, i) =>
    toLevel(p, price, multiples[i], risk)
  ) as [TradeLevel, TradeLevel, TradeLevel];

  const atrNote =
    atrRisk !== undefined
      ? `stop at 1.5x ATR (${atrRisk.toFixed(precision)})`
      : invalidationRisk !== undefined
        ? 'stop at signal invalidation'
        : `stop at ${(FALLBACK_RISK_PCT * 100).toFixed(1)}% of price`;

  return {
    bias: direction,
    entry: entryLevel,
    stop: stopLevel,
    targets: targetLevels,
    risk,
    riskPct: (risk / Math.abs(price)) * 100,
    maxR: multiples[2],
    precision,
    derivation: `${(regime ?? 'default').toString()} sizing | ${atrNote} | targets at ${multiples.join('R / ')}R`,
  };
}

/** Convenience helper for API responses and tests. */
export function planFromSignal(signal: {
  direction?: string | null;
  invalidation?: number | null;
  evidence?: Record<string, any> | null;
}): TradePlan | null {
  const evidence = signal.evidence ?? {};
  const regime =
    typeof evidence.regime === 'string'
      ? evidence.regime
      : evidence.regime?.regime ?? null;

  return buildTradePlan({
    direction: (signal.direction as TradeDirection) ?? 'neutral',
    price: evidence.price ?? null,
    atr: evidence.atr ?? null,
    invalidation: signal.invalidation ?? null,
    regime,
  });
}