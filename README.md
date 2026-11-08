# True Market Signal Web App

A production-ready market signal engine that ingests live data across Stocks, Crypto, Commodities, Forex, Indices, and ETFs, then generates actionable long/short/neutral signals with trader-grade rationale.

## Features

- **Multi-source market data**: Crypto (Binance, Bybit, OKX, Coinbase), Stocks (Finnhub), Forex/Commodities (Twelve Data)
- **Advanced signal engine**: Smart Money Concepts, Volume Profile, Order Book Heatmap, Footprint Analysis, Tape/CVD, Absorption/Exhaustion
- **Real-time dashboard**: Signal Board with sortable grid, deep dive views, confidence scoring
- **Production architecture**: Next.js 15 App Router, Supabase Postgres, Upstash Redis, TradingView charts

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript strict
- **UI**: Tailwind CSS + shadcn/ui + lucide-react
- **Charts**: TradingView Lightweight Charts + Recharts
- **State**: TanStack Query + Zustand
- **Realtime**: Supabase Realtime
- **DB**: Supabase Postgres (RLS on)
- **Cache**: Upstash Redis
- **Auth**: Supabase Auth (magic link + OAuth)
- **Validation**: Zod everywhere
- **ORM**: Drizzle ORM
- **Tests**: Vitest + Playwright
- **Lint/Format**: Biome + secretlint
- **CI**: GitHub Actions
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
npm install

# Create .env.local file with your environment variables
# See .env.example for required variables

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hdegnxatnjmfiparoweq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZWdueGF0bmptZmlwYXJvd2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMTc3NTEsImV4cCI6MjEwOTY5Mzc1MX0.skeC6HKK7CbZHUkhJdzqrW4GK-VDAL5aN86qE88NzOI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZWdueGF0bmptZmlwYXJvd2VxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDExNzc1MSwiZXhwIjoyMTA5NjkzNzUxfQ.p-aWqxKFUzP5zuCPNJg72rGrF9-CpC4huF2F-DV41Fo

# Data Providers
FINNHUB_API_KEY=dbo2lk1r01qpqmftt1b0dbo2lk1r01qpqmftt1bg
TWELVEDATA_API_KEY=01b40b77ee4e4157b90b701396795920

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_TOKEN=

# Vercel
VERCEL_ENV=development
```

## Development

### Running the Development Server

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Deployment

The application is configured for deployment to Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy.

## License

MIT

## Contact

For questions or support, please open an issue on GitHub.