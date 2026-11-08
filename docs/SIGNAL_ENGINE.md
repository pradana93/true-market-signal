# Signal Engine

The engine answers one question: *is there a directional edge on this instrument right now, and how much should you trust that answer?* Everything else is in service of making that answer honest.

## Design principles

1. **Abstention is not a vote.** A method that finds no pattern returns `neutral`. It contributes zero weight to the directional score. It does not count as evidence for sideways. This matters: with 10 methods, noise neutral readings previously outvoted genuine signals and produced a market where 17 of 18 instruments reported "neutral" while two long methods sat firing at 0.70 and 0.80.
2. **Corroboration gates confidence.** A single fired method cannot claim high conviction. If fewer than two methods agree above 0.60, confidence is capped at 0.55 regardless of weight.
3. **Regime changes the weights.** The same signal deserves different trust in a trend than in a range.
4. **The reason string must be checkable.** It names the methods that actually fired, so a reader can audit the call instead of taking it on faith.

## Methods

Ten methods across six families. Each returns `{ direction, confidence, reason, evidence }`.

| Family | Method | Reads |
|---|---|---|
| SMC | `smc.bos` | Break of structure — displacement through the last swing |
| SMC | `smc.choch` | Change of character — first counter-trend break after an extended leg |
| Volume Profile | `vp.poc_break` | Acceptance above/below the point of control |
| Volume Profile | `vp.vah_val` | Rejection or acceptance at value-area edges |
| Order Book | `orderbook.imbalance` | Bid/ask depth skew (crypto only; abstains elsewhere) |
| Footprint | `footprint.delta` | Per-bar buy/sell delta imbalance |
| Tape / CVD | `cvd.slope` | Cumulative volume delta trend |
| Tape / CVD | `cvd.divergence` | Price/delta disagreement at extremes |
| Absorption | `absorption.exhaustion` | High-volume wicks with no progress |
| Confluence | `confluence.ema_structure` | EMA stack and slope alignment |
| Confluence | `confluence.rsi_divergence` | RSI divergence against fresh highs/lows |
| Confluence | `confluence.vwap_deviation` | Stretch from rolling VWAP (>2% either way) |

Methods requiring data we do not have (L2 book for equities and FX) return `neutral` rather than guessing.

## Regime detection

`detectRegime` classifies each series before fusion, using ADX and ATR as a percentage of price:

| Condition | Regime |
|---|---|
| ADX > 25 and ATR% > 1.5 | trending |
| ADX < 15 and ATR% < 0.5 | quiet |
| ADX < 20 and ATR% > 1.0 | volatile |
| otherwise | ranging |

The regime selects a weight table. Trend-following methods (`smc.bos`, `cvd.slope`, `confluence.ema_structure`) gain weight in `trending`; mean-reversion methods (`vp.vah_val`, `confluence.rsi_divergence`, `confluence.vwap_deviation`) gain weight in `ranging`.

## Fusion

```
longWeight  = Σ conf(m) × w(m)  for m where direction = long
shortWeight = Σ conf(m) × w(m)  for m where direction = short
decisive    = longWeight + shortWeight
```

Decision:

| Condition | Direction | Confidence |
|---|---|---|
| `decisive == 0` | neutral | 0.30 — "no method found a pattern" |
| `longWeight > shortWeight × 1.15` | long | `min(0.95, longWeight / decisive)`, capped to 0.55 if < 2 corroborators |
| `shortWeight > longWeight × 1.15` | short | `min(0.95, shortWeight / decisive)`, capped to 0.55 if < 2 corroborators |
| otherwise | neutral | 0.35 — evidence is genuinely split |

The 1.15 margin prevents a coin-flip from being reported as a direction. Neutral confidence is deliberately low and fixed: there is nothing to be confident *about*.

Invalidation is set at ±1.5 × ATR from the current price, on the opposite side of the call. Neutral calls carry no invalidation.

## Data sources

| Market | Primary | Fallback |
|---|---|---|
| Crypto | Binance | Yahoo (`BTC-USD`) |
| Stocks / ETFs | Finnhub | Yahoo |
| Forex / Commodities | Twelve Data | Yahoo (`EURUSD=X`, `GC=F`) |

Every fetch goes through `safeFetch`, which returns `{ data, error }` instead of throwing, and every provider that fails falls back to Yahoo before an instrument is marked `down`. An instrument with fewer than 30 bars is marked `down` rather than scored on insufficient history.

## Regression tests

`src/engine/fusion.test.ts` builds deterministic synthetic series (sinusoidal drift for trends) and asserts on regime detection and fusion output shape. These guard the fusion contract, not specific market outcomes — asserting exact directions against synthetic data would be testing the fixture, not the engine.

Run:

```
npm test -- --run
```

## Known limits

- Volume-based methods are weaker on FX and commodity data from Twelve Data, where volume is tick-count proxy rather than true traded volume.
- `orderbook.imbalance` is inert outside crypto; crypto is scored on a slightly different evidence base than equities.
- Confidence is a confluence-weighted score, not a calibrated probability. It says "how much agreement exists", not "how often this is right". Backtesting against realized outcomes is the next step before this number should be read as an edge estimate.
