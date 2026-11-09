'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Flag,
  Globe,
  Layers,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TradePlanLadder } from '@/components/trade-plan';
import { MarketNews } from '@/components/market-news';
import { PlanUsageCard } from '@/components/engagement/plan-usage-card';
import { OnboardingChecklist } from '@/components/engagement/onboarding-checklist';
import { UpgradeCard } from '@/components/engagement/upgrade-card';
import { InviteCard } from '@/components/engagement/invite-card';
import { notifyUsageChanged, recordSignalView } from '@/lib/plan-usage';
import type { TradePlan } from '@/lib/trade-levels';
import { cn } from '@/lib/utils';

interface SignalItem {
  id: number;
  instrument_id: number;
  tf: string;
  direction: 'long' | 'short' | 'neutral';
  confidence: number;
  reason: string;
  evidence: any;
  invalidation?: number;
  created_at: string;
  plan?: TradePlan | null;
  instrument?: {
    id: number;
    symbol: string;
    market: string;
  };
}

const MARKET_OPTIONS = {
  all: 'All',
  crypto: 'Crypto',
  stocks: 'Stocks',
  forex: 'Forex',
  commodities: 'Commodities',
  etfs: 'ETFs',
  asia: 'Asia',
  uk: 'London',
  ny: 'New York',
} as const;

const MARKETS = Object.keys(MARKET_OPTIONS) as Array<keyof typeof MARKET_OPTIONS>;

const SESSION_MARKETS = {
  asia: ['forex', 'crypto'],
  uk: ['forex', 'stocks', 'etfs'],
  ny: ['stocks', 'etfs', 'commodities'],
} as const;

const DIRECTIONS = [
  { id: 'all', label: 'All' },
  { id: 'long', label: 'Long' },
  { id: 'short', label: 'Short' },
  { id: 'neutral', label: 'Neutral' },
] as const;

const MARKET_LABEL: Record<string, string> = {
  crypto: 'Crypto',
  stocks: 'Stocks',
  forex: 'Forex',
  commodities: 'Commodities',
  etfs: 'ETFs',
  indices: 'Indices',
};

function getCurrentSession() {
  const utcHours = new Date().getUTCHours();

  if (utcHours >= 0 && utcHours < 8) {
    return { id: 'asia', label: 'Asia session', tone: 'text-amber-600 dark:text-amber-400', Icon: Globe };
  }
  if (utcHours >= 8 && utcHours < 13) {
    return { id: 'uk', label: 'London session', tone: 'text-sky-600 dark:text-sky-400', Icon: Building2 };
  }
  if (utcHours >= 13 && utcHours < 21) {
    return { id: 'ny', label: 'New York session', tone: 'text-indigo-600 dark:text-indigo-400', Icon: Flag };
  }
  return { id: 'asia', label: 'Asia pre-open', tone: 'text-amber-600/70 dark:text-amber-400/70', Icon: Globe };
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const session = getCurrentSession();

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/signals', { cache: 'no-store' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSignals(json.data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      const market = signal.instrument?.market ?? '';

      if (marketFilter !== 'all') {
        if (SESSION_MARKETS[marketFilter as keyof typeof SESSION_MARKETS]) {
          if (!SESSION_MARKETS[marketFilter as keyof typeof SESSION_MARKETS].includes(market as never)) return false;
        } else if (market !== marketFilter) {
          return false;
        }
      }

      if (directionFilter !== 'all' && signal.direction !== directionFilter) return false;
      return true;
    });
  }, [signals, marketFilter, directionFilter]);

  const stats = useMemo(
    () => ({
      total: signals.length,
      longs: signals.filter((s) => s.direction === 'long').length,
      shorts: signals.filter((s) => s.direction === 'short').length,
      neutrals: signals.filter((s) => s.direction === 'neutral').length,
    }),
    [signals]
  );

  const filtersActive = marketFilter !== 'all' || directionFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="panel relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/[0.08] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                Engine live
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium',
                  session.tone
                )}
              >
                <session.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {session.label}
              </span>
            </div>
            <h1 className="mt-3 text-h1 text-balance md:text-3xl">Signal board</h1>
            <p className="mt-1.5 max-w-2xl text-body-sm text-muted-foreground">
              Eighteen instruments, scored continuously. Every call carries its own invalidation, targets and
              position size before it reaches you.
            </p>
            <details className="group mt-2.5 max-w-2xl">
              <summary className="inline-flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-brand underline-offset-4 hover:underline">
                New here? Start with this
              </summary>
              <p className="mt-1.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-body-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Confluence</strong> is how many of the twelve methods agree.
                Above 75% the engine treats the read as high conviction. Every card also shows the entry, stop and
                three targets, so you never have to build the plan yourself.
              </p>
            </details>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last sync</p>
              <p className="num text-xs font-medium">
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Syncing…'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading} className="h-10">
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
              {loading ? 'Syncing' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Scored" value={stats.total} Icon={Layers} tone="text-muted-foreground" />
        <StatCard label="Long bias" value={stats.longs} Icon={TrendingUp} tone="text-brand" accent="brand" />
        <StatCard label="Short bias" value={stats.shorts} Icon={TrendingDown} tone="text-rose-600 dark:text-rose-400" accent="bear" />
        <StatCard label="Standing aside" value={stats.neutrals} Icon={Minus} tone="text-muted-foreground" />
      </dl>

      <OnboardingChecklist />

      {/* Filters */}
      <div className="panel flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="shrink-0 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Market
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Filter by market">
            {MARKETS.map((market) => (
              <FilterPill
                key={market}
                active={marketFilter === market}
                onClick={() => setMarketFilter(market)}
                label={MARKET_OPTIONS[market]}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="shrink-0 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bias
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Filter by bias">
            {DIRECTIONS.map((direction) => (
              <FilterPill
                key={direction.id}
                active={directionFilter === direction.id}
                onClick={() => setDirectionFilter(direction.id)}
                label={direction.label}
              />
            ))}
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setMarketFilter('all');
                setDirectionFilter('all');
              }}
              className="ml-1 shrink-0 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert" aria-live="assertive"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading && signals.length === 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="panel h-72 animate-pulse bg-muted/30" />
            ))}
          </div>
          <div className="xl:col-span-4">
            <div className="panel h-[600px] animate-pulse bg-muted/30" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <h2 className="sr-only">Live signals</h2>
            {filteredSignals.length === 0 ? (
              <div className="panel py-16 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
                <h2 className="mt-4 text-h3">Nothing matches this filter</h2>
                <p className="mx-auto mt-1 max-w-sm text-body-sm text-muted-foreground">
                  No instrument currently satisfies this market and bias combination. Widen the filter to see the
                  full board.
                </p>
                {filtersActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-5"
                    onClick={() => {
                      setMarketFilter('all');
                      setDirectionFilter('all');
                    }}
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </ul>
            )}
          </div>

          <aside className="xl:col-span-4 xl:sticky xl:top-20">
            <div className="space-y-4">
              <PlanUsageCard />
              <UpgradeCard />
              <MarketNews limit={10} />
              <InviteCard />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-brand text-brand-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
  accent,
}: {
  label: string;
  value: number;
  Icon: typeof Layers;
  tone: string;
  accent?: 'brand' | 'bear';
}) {
  return (
    <div
      className={cn(
        'panel flex items-center justify-between gap-3 px-4 py-3.5',
        accent === 'brand' && 'border-brand/30',
        accent === 'bear' && 'border-rose-500/30'
      )}
    >
      <div className="min-w-0">
        <dt className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className={cn('num mt-0.5 text-2xl font-bold tracking-tight', accent ? tone : 'text-foreground')}>
          {value}
        </dd>
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon className={cn('h-4 w-4', tone)} aria-hidden="true" />
      </span>
    </div>
  );
}

function SignalCard({ signal }: { signal: SignalItem }) {
  const symbol = signal.instrument?.symbol ?? 'Unknown';
  const market = signal.instrument?.market ?? '';
  const price = signal.evidence?.price;
  const plan = signal.plan;
  const isLong = signal.direction === 'long';
  const isShort = signal.direction === 'short';
  const confidence = Math.round(signal.confidence * 100);

  const fired = Object.entries(signal.evidence?.methodSignals || {})
    .filter(([, value]: any) => value.direction !== 'neutral')
    .map(([id]) => id);

  const directionTone = isLong
    ? 'text-brand'
    : isShort
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-muted-foreground';

  return (
    <li>
      <Link
        href={`/signals/${encodeURIComponent(symbol)}`}
        onClick={() => {
          recordSignalView(symbol);
          notifyUsageChanged();
        }}
        className={cn(
          'panel group flex h-full flex-col justify-between overflow-hidden transition-all hover:border-brand/40 hover:shadow-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      >
        <div className="space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-bold tracking-tight transition-colors group-hover:text-brand">
                  {symbol}
                </h3>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {MARKET_LABEL[market] ?? market}
                </span>
              </div>
              {price != null && (
                <p className="num mt-0.5 text-sm text-muted-foreground">
                  ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              {signal.tf}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  isLong ? 'bg-brand/10 text-brand' : isShort ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'
                )}
                aria-hidden="true"
              >
                {isLong ? <TrendingUp className="h-4 w-4" /> : isShort ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </span>
              <span>
                <span className={cn('block text-sm font-bold capitalize leading-none', directionTone)}>
                  {signal.direction}
                </span>
                <span className="num mt-1 block text-[11px] text-muted-foreground">{confidence}% confluence</span>
              </span>
            </div>

            <div className="w-20 shrink-0" aria-hidden="true">
              <div className="score-track">
                <div
                  className={cn(
                    'score-fill',
                    isLong ? 'bg-brand' : isShort ? 'bg-rose-500' : 'bg-muted-foreground/50'
                  )}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{signal.reason}</p>

          {plan ? (
            <TradePlanLadder plan={plan} bias={signal.direction} variant="compact" />
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 py-2.5 text-center text-xs italic text-muted-foreground">
              Standing aside — no active plan
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px]">
          <div className="flex min-w-0 flex-wrap gap-1">
            {fired.slice(0, 2).map((method) => (
              <span key={method} className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                {method.split('.')[1] ?? method}
              </span>
            ))}
            {fired.length > 2 && <span className="text-muted-foreground">+{fired.length - 2}</span>}
          </div>
          <span className="flex shrink-0 items-center gap-1 font-medium text-brand">
            Inspect
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}
