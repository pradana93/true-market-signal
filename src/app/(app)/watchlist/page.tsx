'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ArrowRight, Minus, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UpgradeCard } from '@/components/engagement/upgrade-card';

interface SignalItem {
  id: number;
  instrument_id: number;
  tf: string;
  direction: 'long' | 'short' | 'neutral';
  confidence: number;
  evidence: any;
  created_at: string;
  instrument?: { id: number; symbol: string; market: string };
}

const MARKET_LABEL: Record<string, string> = {
  crypto: 'Crypto',
  stocks: 'Stocks',
  forex: 'Forex',
  commodities: 'Commodities',
  etfs: 'ETFs',
  indices: 'Indices',
};

export default function WatchlistPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/signals');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSignals(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const instruments = useMemo(() => {
    const latest = new Map<number, SignalItem>();
    for (const signal of signals) {
      const existing = latest.get(signal.instrument_id);
      if (!existing || new Date(signal.created_at) > new Date(existing.created_at)) {
        latest.set(signal.instrument_id, signal);
      }
    }
    return [...latest.values()].sort((a, b) =>
      (a.instrument?.symbol ?? '').localeCompare(b.instrument?.symbol ?? '')
    );
  }, [signals]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return instruments;
    return instruments.filter(
      (item) =>
        item.instrument?.symbol?.toLowerCase().includes(needle) ||
        item.instrument?.market?.toLowerCase().includes(needle)
    );
  }, [instruments, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, SignalItem[]> = {};
    for (const item of filtered) {
      const market = item.instrument?.market || 'other';
      groups[market] ??= [];
      groups[market].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const counts = useMemo(
    () => ({
      long: instruments.filter((i) => i.direction === 'long').length,
      short: instruments.filter((i) => i.direction === 'short').length,
    }),
    [instruments]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-h1 md:text-3xl">Watchlist</h1>
          <p className="mt-1.5 max-w-xl text-body-sm text-muted-foreground">
            Every instrument the engine tracks, grouped by market, showing only the newest reading per symbol.
            Open any card for the full entry, stop and target ladder.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="num">{instruments.length} tracked</span>
            <span className="flex items-center gap-1 text-brand">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {counts.long} long
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              {counts.short} short
            </span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-10 self-start">
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          {loading ? 'Syncing' : 'Refresh'}
        </Button>
      </header>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="watchlist-search" className="sr-only">
          Search instruments by symbol or market
        </label>
        <input
          id="watchlist-search"
          type="search"
          placeholder="Search symbol or market…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
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

      {loading && instruments.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="panel h-36 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel py-16 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <h2 className="mt-4 text-h3">{query ? 'No matching instrument' : 'Nothing tracked yet'}</h2>
          <p className="mx-auto mt-1 max-w-sm text-body-sm text-muted-foreground">
            {query
              ? 'Try a shorter symbol, or clear the search to see every market.'
              : 'Run the ingestion job to populate the watchlist.'}
          </p>
          {query && (
            <Button variant="outline" size="sm" className="mt-5" onClick={() => setQuery('')}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([market, items]) => (
            <section key={market} aria-labelledby={`market-${market}`}>
              <div className="mb-3 flex items-center gap-2">
                <h2 id={`market-${market}`} className="text-sm font-semibold uppercase tracking-wider">
                  {MARKET_LABEL[market] ?? market}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {items.length}
                </span>
                <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
              </div>

              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <WatchlistCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <UpgradeCard
        variant="banner"
        eyebrow="Trader’s shortcut"
        title="Turn a watchlist into positions"
        blurb="Pro adds the position-size calculator, per-level alerts and the full 18-instrument board with no daily cap."
        ctaLabel="See Pro plans"
      />
    </div>
  );
}

function WatchlistCard({ item }: { item: SignalItem }) {
  const symbol = item.instrument?.symbol ?? '';
  const price = item.evidence?.price;
  const confidence = Math.round(item.confidence * 100);
  const isLong = item.direction === 'long';
  const isShort = item.direction === 'short';

  return (
    <li>
      <Link
        href={`/signals/${encodeURIComponent(symbol)}`}
        className="panel group flex h-full flex-col justify-between transition-all hover:border-brand/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight transition-colors group-hover:text-brand">{symbol}</h3>
              {price != null && (
                <p className="num mt-0.5 text-xs text-muted-foreground">
                  ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              {item.tf}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold capitalize',
                isLong ? 'text-brand' : isShort ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
              )}
            >
              {isLong ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : isShort ? (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {item.direction}
            </span>
            <span className="num text-[11px] text-muted-foreground">{confidence}%</span>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className={cn('h-full rounded-full', isLong ? 'bg-brand' : isShort ? 'bg-rose-500' : 'bg-muted-foreground/50')}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
          <span>Latest reading</span>
          <span className="flex items-center gap-1 font-medium text-brand">
            View
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}
