'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ArrowRight, Bell, BellOff, RefreshCw, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { UpgradeCard } from '@/components/engagement/upgrade-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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

export default function AlertsPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const latestPerInstrument = useMemo(() => {
    const latest = new Map<number, SignalItem>();
    for (const signal of signals) {
      const existing = latest.get(signal.instrument_id);
      if (!existing || new Date(signal.created_at) > new Date(existing.created_at)) {
        latest.set(signal.instrument_id, signal);
      }
    }
    return [...latest.values()];
  }, [signals]);

  const highConviction = useMemo(
    () => latestPerInstrument.filter((s) => s.direction !== 'neutral' && s.confidence >= 0.75),
    [latestPerInstrument]
  );

  const nearInvalidation = useMemo(
    () =>
      latestPerInstrument.filter((signal) => {
        const price = signal.evidence?.price;
        if (!price || !signal.invalidation) return false;
        return Math.abs(price - signal.invalidation) / price < 0.005;
      }),
    [latestPerInstrument]
  );

  const totalWatch = highConviction.length + nearInvalidation.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-h1 md:text-3xl">Alerts</h1>
          <p className="mt-1.5 max-w-xl text-body-sm text-muted-foreground">
            Live conditions worth acting on: signals above 75% confluence, and positions trading at their
            invalidation level.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-10 self-start">
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          {loading ? 'Checking' : 'Refresh'}
        </Button>
      </header>

      {error && (
        <div
          role="alert" aria-live="assertive"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="panel flex items-center justify-between">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active alerts</dt>
            <dd className="num mt-0.5 text-2xl font-bold">{totalWatch}</dd>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
            <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </span>
        </div>

        <div className="panel flex items-center justify-between border-brand/30">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">High conviction</dt>
            <dd className="num mt-0.5 text-2xl font-bold text-brand">{highConviction.length}</dd>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
            <TrendingUp className="h-4 w-4 text-brand" aria-hidden="true" />
          </span>
        </div>

        <div className="panel flex items-center justify-between border-rose-500/30">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">At invalidation</dt>
            <dd className="num mt-0.5 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {nearInvalidation.length}
            </dd>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
            <ShieldAlert className="h-4 w-4 text-rose-500" aria-hidden="true" />
          </span>
        </div>
      </dl>

      {loading && signals.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel h-24 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : totalWatch === 0 ? (
        <div className="panel py-16 text-center">
          <BellOff className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <h2 className="mt-4 text-h3">No alert conditions firing</h2>
          <p className="mx-auto mt-1 max-w-md text-body-sm text-muted-foreground">
            No signal is above 75% confluence and none is within 0.5% of its invalidation. That is a normal
            market state, not an error.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {highConviction.length > 0 && (
            <section aria-labelledby="high-conviction-heading">
              <div className="mb-3 flex items-center gap-2">
                <h2 id="high-conviction-heading" className="text-sm font-semibold uppercase tracking-wider">
                  High conviction
                </h2>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                  {highConviction.length}
                </span>
                <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
              </div>

              <ul className="space-y-2.5">
                {highConviction.map((signal) => (
                  <li key={`hc-${signal.id}`}>
                    <AlertRow signal={signal} kind="conviction" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {nearInvalidation.length > 0 && (
            <section aria-labelledby="invalidation-heading">
              <div className="mb-3 flex items-center gap-2">
                <h2 id="invalidation-heading" className="text-sm font-semibold uppercase tracking-wider">
                  At invalidation
                </h2>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {nearInvalidation.length}
                </span>
                <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
              </div>

              <ul className="space-y-2.5">
                {nearInvalidation.map((signal) => (
                  <li key={`ni-${signal.id}`}>
                    <AlertRow signal={signal} kind="invalidation" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <UpgradeCard
        variant="banner"
        eyebrow="Never miss a break"
        title="These alerts only fire while the tab is open"
        blurb="Pro delivers the same triggers by push, email and webhook, plus your own per-instrument price and indicator alerts."
        benefits={[
          'Push, email and webhook delivery',
          'Custom price and indicator alerts per symbol',
          'Escalation when a position hits invalidation',
        ]}
        ctaLabel="Turn on Pro alerts"
        className="border-brand/25"
      />
    </div>
  );
}

function AlertRow({ signal, kind }: { signal: SignalItem; kind: 'conviction' | 'invalidation' }) {
  const symbol = signal.instrument?.symbol ?? '';
  const market = signal.instrument?.market ?? '';
  const isLong = signal.direction === 'long';
  const confidence = Math.round(signal.confidence * 100);

  const price = Number(signal.evidence?.price ?? 0);
  const invalidation = Number(signal.invalidation ?? 0);

  return (
    <div
      className={cn(
        'panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        kind === 'conviction' ? 'border-l-4 border-l-brand' : 'border-l-4 border-l-rose-500'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            kind === 'conviction' ? 'bg-brand/10 text-brand' : 'bg-rose-500/10 text-rose-500'
          )}
          aria-hidden="true"
        >
          {kind === 'conviction' ? (
            isLong ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold">{symbol}</h3>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {MARKET_LABEL[market] ?? market}
            </span>
            <span className="rounded border border-border/70 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              {signal.tf}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {kind === 'conviction'
              ? signal.reason
              : `Price $${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} is within 0.5% of invalidation $${invalidation.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p
            className={cn(
              'text-xs font-bold capitalize',
              isLong ? 'text-brand' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {signal.direction}
          </p>
          <p className="num text-[11px] text-muted-foreground">{confidence}% confidence</p>
        </div>

        <Link href={`/signals/${encodeURIComponent(symbol)}`}>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
            Inspect
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
