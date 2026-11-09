'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Minus,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { TradePlanLadder } from '@/components/trade-plan';
import { MarketNews } from '@/components/market-news';
import { CopyPlanButton } from '@/components/engagement/copy-plan';
import { ProLock } from '@/components/engagement/upgrade-card';
import { notifyUsageChanged, recordSignalView } from '@/lib/plan-usage';
import { TradePlan } from '@/lib/trade-levels';
import { cn } from '@/lib/utils';

interface MethodSignal {
  direction: 'long' | 'short' | 'neutral';
  confidence: number;
  reason: string;
  evidence: any;
}

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

export default function SignalDetailPage() {
  const params = useParams();
  const instrument = decodeURIComponent(params.instrument as string);
  const [signal, setSignal] = useState<SignalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Count this view against the free-tier meter once the signal resolves.
  useEffect(() => {
    if (!signal) return;
    recordSignalView(signal.instrument?.symbol ?? instrument);
    notifyUsageChanged();
  }, [signal, instrument]);

  const fetchSignal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/signals/${encodeURIComponent(instrument)}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const rows: SignalItem[] = json.data || [];
      const latest = rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      setSignal(latest || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load signal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignal();
  }, [instrument]);

  if (loading && !signal) {
    return (
      <div className="space-y-4">
        <div className="panel h-24 animate-pulse bg-muted/30" />
        <div className="panel h-56 animate-pulse bg-muted/30" />
        <div className="panel h-56 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to board
        </Link>
        <div role="alert" aria-live="assertive" className="panel py-16 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <h1 className="mt-4 text-h3">{error ? 'Could not load signal' : `No signal recorded for ${instrument}`}</h1>
          <p className="mx-auto mt-1 max-w-md text-body-sm text-muted-foreground">
            {error || 'This instrument has not been scored yet. Run the ingestion job to populate it.'}
          </p>
        </div>
      </div>
    );
  }

  const methodSignals: Record<string, MethodSignal> = signal.evidence?.methodSignals || {};
  const weights: Record<string, number> = signal.evidence?.methodWeights || {};
  const price = signal.evidence?.price;
  const atr = signal.evidence?.atr;
  const regime = signal.evidence?.regime;
  const corroboratingLong = signal.evidence?.corroboratingLong ?? 0;
  const corroboratingShort = signal.evidence?.corroboratingShort ?? 0;

  const fired = Object.entries(methodSignals).filter(([, method]) => method.direction !== 'neutral');

  const isLong = signal.direction === 'long';
  const isShort = signal.direction === 'short';
  const confidence = Math.round(signal.confidence * 100);
  const symbol = signal.instrument?.symbol ?? instrument;
  const market = signal.instrument?.market ?? '';

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to board
        </Link>
        <div className="flex items-center gap-2">
          <CopyPlanButton plan={signal.plan ?? null} symbol={symbol} direction={signal.direction} />
          <Button variant="outline" size="sm" onClick={fetchSignal} disabled={loading} className="h-9">
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            {loading ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Verdict */}
      <header
        className={cn(
          'panel relative overflow-hidden border-l-4',
          isLong ? 'border-l-brand' : isShort ? 'border-l-rose-500' : 'border-l-muted-foreground/40'
        )}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand/[0.07] blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 tracking-tight md:text-3xl">{symbol}</h1>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {MARKET_LABEL[market] ?? market}
            </span>
            <span className="rounded border border-border/70 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              {signal.tf}
            </span>
          </div>
          {price != null && (
            <p className="num mt-1 text-lg text-muted-foreground">
              ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3.5">
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  isLong ? 'bg-brand/10 text-brand' : isShort ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'
                )}
                aria-hidden="true"
              >
                {isLong ? <TrendingUp className="h-6 w-6" /> : isShort ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
              </span>
              <div>
                <p
                  className={cn(
                    'text-xl font-bold capitalize leading-none',
                    isLong ? 'text-brand' : isShort ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                  )}
                >
                  {signal.direction}
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <div
                    className="h-1.5 w-28 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={confidence}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Confluence confidence"
                  >
                    <div
                      className={cn('h-full rounded-full', isLong ? 'bg-brand' : isShort ? 'bg-rose-500' : 'bg-muted-foreground/50')}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className="num text-sm font-semibold">{confidence}% confluence</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {regime?.regime && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">Regime</span>
                  <span className="font-medium capitalize">{regime.regime}</span>
                  {regime.evidence?.adx != null && (
                    <span className="num rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                      ADX {Number(regime.evidence.adx).toFixed(0)}
                    </span>
                  )}
                </span>
              )}
              {atr != null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5">
                  <span className="text-muted-foreground">ATR</span>
                  <span className="num font-mono font-semibold">{Number(atr).toFixed(2)}</span>
                </span>
              )}
              {signal.invalidation != null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                  <span className="text-muted-foreground">Invalidation</span>
                  <span className="num font-mono text-rose-600 dark:text-rose-400">
                    ${Number(signal.invalidation).toLocaleString()}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5">
                <span className="text-muted-foreground">Votes</span>
                <span className="num font-medium">{corroboratingLong}L / {corroboratingShort}S</span>
              </span>
            </div>
          </div>

          <p className="mt-5 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-body-sm leading-relaxed text-muted-foreground">
            {signal.reason}
          </p>
        </div>
      </header>

      {/* Execution plan */}
      <section aria-labelledby="plan-heading" className="panel">
        <h2 id="plan-heading" className="sr-only">
          Execution plan
        </h2>
        <TradePlanLadder
          plan={signal.plan ?? null}
          bias={signal.direction}
          variant="full"
          title="Execution plan"
          showDerivation
        />
        <ProLock
          title="Position-size calculator"
          description="Risk % and account equity in → exact contract size out. Built into every Pro trade plan."
          tag="Pro"
        />
      </section>

      {/* Fired methods */}
      <section aria-labelledby="fired-heading" className="panel">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 id="fired-heading" className="text-h3">
              Methods that fired{' '}
              <span className="num text-sm font-medium text-muted-foreground">({fired.length})</span>
            </h2>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Neutral readings are abstentions and do not vote toward the score.
            </p>
          </div>
          {fired.length > 0 && (
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              {fired.length} active
            </span>
          )}
        </div>

        {fired.length === 0 ? (
          <div className="py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <ShieldAlert className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <p className="mt-3 text-body-sm text-muted-foreground">
              No method found a pattern. The engine stands aside rather than guessing.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {fired.map(([id, method]) => {
              const methodLong = method.direction === 'long';
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        methodLong ? 'bg-brand/10 text-brand' : 'bg-rose-500/10 text-rose-500'
                      )}
                      aria-hidden="true"
                    >
                      {methodLong ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-semibold capitalize',
                            methodLong ? 'text-brand' : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {method.direction}
                        </span>
                        <span className="truncate font-mono text-xs text-muted-foreground">{id}</span>
                        {weights[id] != null && (
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            w={weights[id]}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{method.reason}</p>
                    </div>
                  </div>
                  <span className="num hidden shrink-0 font-mono text-sm font-semibold text-muted-foreground sm:block">
                    {Math.round(method.confidence * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Full table */}
      <section aria-labelledby="all-methods-heading" className="panel">
        <h2 id="all-methods-heading" className="text-h3">
          All method readings
        </h2>
        <p className="mt-1 text-body-sm text-muted-foreground">
          The complete evidence set, including abstentions. This is exactly what the fusion layer saw.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-body-sm">
            <caption className="sr-only">Every method, its direction, confidence, weight and reason</caption>
            <thead>
              <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2.5 pr-4 font-medium">Method</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Bias</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Conf.</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Weight</th>
                <th scope="col" className="py-2.5 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(methodSignals).map(([id, method]) => {
                const methodLong = method.direction === 'long';
                const methodShort = method.direction === 'short';
                return (
                  <tr key={id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 pr-4 font-mono text-xs">{id}</td>
                    <td
                      className={cn(
                        'py-2.5 pr-4 text-xs capitalize',
                        methodLong ? 'text-brand' : methodShort ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                      )}
                    >
                      {method.direction}
                    </td>
                    <td className="num py-2.5 pr-4 font-mono text-xs">{Math.round(method.confidence * 100)}%</td>
                    <td className="num py-2.5 pr-4 font-mono text-xs text-muted-foreground">{weights[id] ?? '—'}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{method.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <MarketNews variant="symbol" symbol={instrument} limit={6} />
    </div>
  );
}
