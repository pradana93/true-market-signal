'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, Target, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import Link from 'next/link';
import { TradePlanLadder } from '@/components/trade-plan';
import { MarketNews } from '@/components/market-news';
import type { TradePlan } from '@/lib/trade-levels';

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

const MARKETS = ['all', 'crypto', 'stocks', 'forex', 'commodities', 'etfs'];
const DIRECTIONS = ['all', 'long', 'short', 'neutral'];

export default function DashboardPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  const filteredSignals = signals.filter(s => {
    if (marketFilter !== 'all' && s.instrument?.market !== marketFilter) return false;
    if (directionFilter !== 'all' && s.direction !== directionFilter) return false;
    return true;
  });

  const stats = {
    total: signals.length,
    longs: signals.filter(s => s.direction === 'long').length,
    shorts: signals.filter(s => s.direction === 'short').length,
    neutrals: signals.filter(s => s.direction === 'neutral').length,
  };

  return (
    <div className="space-y-8 relative">
      <div className="ambient" />

      {/* Hero Header */}
      <div className="panel p-8 relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-body-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Multi-Method Confluence Engine Active</span>
              </div>
            </div>
            <h1 className="text-display-2 tracking-tight text-balance">
              Flagship Market Intelligence
            </h1>
            <p className="text-muted-foreground text-body-md max-w-2xl leading-relaxed">
              Deterministic scoring across 18 instruments with live trade execution plans (TP1, TP2, TP3, SL) derived from market regime and volatility.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-body-sm text-muted-foreground">Last synchronized</p>
              <p className="text-xs font-mono font-medium">
                {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Syncing...'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading} className="h-9 px-4 shadow-sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Feed
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="panel mobile-card flex items-center justify-between premium-shadow">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Instruments Scored</p>
            <p className="text-3xl font-bold num">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="panel mobile-card flex items-center justify-between relative overflow-hidden border-l-4 border-l-emerald-500 premium-shadow">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Long Conviction</p>
            <p className="text-3xl font-bold num text-emerald-600 dark:text-emerald-400">{stats.longs}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="panel mobile-card flex items-center justify-between relative overflow-hidden border-l-4 border-l-rose-500 premium-shadow">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Short Conviction</p>
            <p className="text-3xl font-bold num text-rose-600 dark:text-rose-400">{stats.shorts}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="panel mobile-card flex items-center justify-between relative overflow-hidden border-l-4 border-l-slate-400 premium-shadow">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Standing Aside</p>
            <p className="text-3xl font-bold num text-muted-foreground">{stats.neutrals}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filtering Bar */}
      <div className="panel p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mobile-card premium-shadow">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-body-sm font-medium text-muted-foreground px-2 uppercase tracking-wider shrink-0">Market:</span>
          {MARKETS.map(m => (
            <button
              key={m}
              onClick={() => setMarketFilter(m)}
              className={`px-3 py-1.5 text-body-sm font-medium rounded-lg capitalize whitespace-nowrap transition-all mobile-touch-target ${
                marketFilter === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-body-sm font-medium text-muted-foreground px-2 uppercase tracking-wider shrink-0">Bias:</span>
          {DIRECTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDirectionFilter(d)}
              className={`px-3 py-1.5 text-body-sm font-medium rounded-lg capitalize whitespace-nowrap transition-all mobile-touch-target ${
                directionFilter === d
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

            {loading && signals.length === 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="panel h-80 animate-pulse bg-muted/30" />
            ))}
          </div>
          <div className="xl:col-span-4">
            <div className="panel h-[600px] animate-pulse bg-muted/30" />
          </div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8">
            <div className="text-center py-24 panel bg-muted/5">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-semibold text-lg">No signals match filter criteria</h3>
              <p className="text-sm text-muted-foreground mt-1">Try resetting market or bias filters to view all active readings.</p>
            </div>
          </div>
          <div className="xl:col-span-4">
            <MarketNews limit={8} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredSignals.map(signal => {
              const sym = signal.instrument?.symbol ?? '';
              const mkt = signal.instrument?.market ?? '';
              const price = signal.evidence?.price;
              const plan = signal.plan;
              const isLong = signal.direction === 'long';
              const isShort = signal.direction === 'short';
              const accent = isLong ? 'border-l-emerald-500' : isShort ? 'border-l-rose-500' : 'border-l-slate-400';

              const fired = Object.entries(signal.evidence?.methodSignals || {})
                .filter(([, s]: any) => s.direction !== 'neutral')
                .map(([id]) => id);

              return (
                <Link key={signal.id} href={`/signals/${encodeURIComponent(sym)}`} className="group block mobile-touch-target">
                  <div className={`panel h-full border-l-4 ${accent} transition-all duration-200 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between overflow-hidden bg-card mobile-card premium-shadow`}>
                    <div className="p-6 pb-4 space-y-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-h2 tracking-tight group-hover:text-primary transition-colors">{sym}</span>
                            <span className="text-body-sm font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {mkt}
                            </span>
                          </div>
                          {price != null && (
                            <p className="text-body-md font-mono text-muted-foreground num">
                              ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-mono text-body-sm uppercase">
                            {signal.tf}
                          </Badge>
                        </div>
                      </div>

                      {/* Direction & Confidence */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                        <div className="flex items-center space-x-2">
                          {isLong ? (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                          ) : isShort ? (
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                              <TrendingDown className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <span className={`text-body-md font-bold capitalize block leading-none ${
                              isLong ? 'text-emerald-600 dark:text-emerald-400'
                                : isShort ? 'text-rose-600 dark:text-rose-400'
                                : 'text-muted-foreground'
                            }`}>
                              {signal.direction}
                            </span>
                            <span className="text-body-sm text-muted-foreground mt-0.5 block">
                              {Math.round(signal.confidence * 100)}% Confluence
                            </span>
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="score-track">
                            <div
                              className={`score-fill ${
                                isLong ? 'bg-emerald-500' : isShort ? 'bg-rose-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${signal.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {signal.reason}
                      </p>

                      {/* Trade Plan Matrix (TP / SL) */}
                      {plan ? (
                        <TradePlanLadder plan={plan} bias={signal.direction} variant="compact" />
                      ) : (
                        <div className="pt-2 border-t border-border/60 text-center py-2">
                          <span className="text-body-sm text-muted-foreground italic">Standing aside — no active trade plan</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Methods & Action */}
                    <div className="px-6 py-3 bg-muted/20 border-t flex items-center justify-between text-body-sm">
                      <div className="flex flex-wrap gap-1">
                        {fired.slice(0, 2).map(m => (
                          <span key={m} className="px-1.5 py-0.5 rounded text-body-sm font-mono bg-muted text-muted-foreground">
                            {m.split('.')[1]}
                          </span>
                        ))}
                        {fired.length > 2 && (
                          <span className="text-body-sm text-muted-foreground self-center">+{fired.length - 2}</span>
                        )}
                      </div>
                      <span className="font-medium text-primary flex items-center group-hover:translate-x-0.5 transition-transform">
                        Inspect Matrix →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="xl:col-span-4 sticky top-20">
            <MarketNews limit={10} />
          </div>
        </div>
      )}
    </div>
  );
}
