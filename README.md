# True Market Signal

A multi-method market signal engine with a Next.js dashboard. It tracks 18 instruments across crypto, equities, ETFs, FX and commodities, scores each with ten independent methods, and reports a directional call with the evidence that produced it.

**The engine is designed to tell you when there is no edge.** Roughly a third of instruments report `neutral` at low confidence on any given run. That is the intended output, not a failure.

## What it does

- Ingests OHLCV candles from Binance / Finnhub / Twelve Data, falling back to Yahoo Finance when a primary source is unavailable.
- Runs six method families: SMC, volume profile, order book, footprint, tape/CVD, absorption, plus a confluence layer.
- Detects market regime (trending / ranging / quiet / volatile) and reweights methods accordingly.
- Fuses method signals into one call with a confidence score and an auditable reason string.
- Serves it through a Next.js 15 dashboard, REST API, and Supabase Realtime stream.

See [`docs/SIGNAL_ENGINE.md`](docs/SIGNAL_ENGINE.md) for the methodology and its limits.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Supabase (Postgres, Realtime, Auth) · Drizzle ORM · Vitest · GitHub Actions

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
```

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FINNHUB_API_KEY=
TWELVEDATA_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security and is **server-side only**. Never expose it to the client.

Apply the database schema:

```bash
npx drizzle-kit push        # or: supabase db push
```

Ingest one round of data and score every instrument:

```bash
node --env-file=.env.local scripts/run-ingest.mjs
```

Run the app:

```bash
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build, type-checked |
| `npx tsc --noEmit` | Type check only |
| `npm test -- --run` | Regression suite |
| `node scripts/run-ingest.mjs` | Ingest + score all instruments |
| `node scripts/verify-supabase.mjs` | Check table reachability and RLS |

## Data model

Eight tables in Supabase, all with RLS enabled: `instruments`, `candles`, `orderbook_snapshots`, `trades_agg`, `signals`, `signal_weights`, `watchlists`, `alerts`.

Anonymous clients may read published signals and instruments. All writes require the service role. Anonymous insert attempts are rejected — verified by `scripts/verify-supabase.mjs`.

## API

| Route | Method | Description |
|---|---|---|
| `/api/signals` | GET | Latest signals across all instruments |
| `/api/signals/[symbol]` | GET | Signals for one instrument, `?timeframe=1h` |
| `/api/stream` | GET | Realtime signal stream |
| `/api/cron/[job]` | POST | Scheduled ingestion (`crypto` / `stocks` / `forex`) |

## CI

`.github/workflows/ci.yml` runs on every push and pull request against `master`:

1. `npx tsc --noEmit`
2. `npm test -- --run`
3. `npm run build` (with type checking enabled — build errors are not suppressed)

## Deployment

Deploy to Vercel with the environment variables above set for Production, Preview and Development. The app requires `SUPABASE_SERVICE_ROLE_KEY` at build time for server-side data access.

## Reading the output

Each signal carries `direction`, `confidence`, `reason`, and `invalidation` (1.5 × ATR on the opposite side of the call).

Confidence is a weighted measure of **method agreement**, not a calibrated probability of the trade working. A 0.95 means "nearly every method that fired agrees", not "95% win rate". Treat it as a measure of internal consistency until it is backtested against realized outcomes.
