'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Layers, ShieldAlert, Activity } from 'lucide-react';
import Link from 'next/link';

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
    const interval = setInterval(fetchSignals, 30000); // Poll every 30s
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Signal Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One live reading per instrument. Only methods that fired are counted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading'}
          </span>
          <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Instruments</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Long</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums text-emerald-600 dark:text-emerald-400">{stats.longs}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Short</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums text-rose-600 dark:text-rose-400">{stats.shorts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Standing aside</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums text-muted-foreground">{stats.neutrals}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {MARKETS.map(m => (
            <button
              key={m}
              onClick={() => setMarketFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                marketFilter === m
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {DIRECTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDirectionFilter(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                directionFilter === d
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      {loading && signals.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-44 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium">No instruments match this filter</p>
          <p className="text-sm text-muted-foreground mt-1">Clear the market or direction filter to see all readings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSignals.map(signal => {
            const sym = signal.instrument?.symbol ?? '';
            const mkt = signal.instrument?.market ?? '';
            const price = signal.evidence?.price;
            const fired = Object.entries(signal.evidence?.methodSignals || {})
              .filter(([, s]: any) => s.direction !== 'neutral')
              .map(([id]) => id);
            const isLong = signal.direction === 'long';
            const isShort = signal.direction === 'short';
            const accent = isLong ? 'border-l-emerald-500' : isShort ? 'border-l-rose-500' : 'border-l-slate-300 dark:border-l-slate-700';

            return (
              <Link key={signal.id} href={`/signals/${encodeURIComponent(sym)}`} className="group">
                <Card className={`h-full border-l-2 ${accent} transition-colors hover:bg-muted/40`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold truncate">{sym}</span>
                          <span className="text-[11px] text-muted-foreground capitalize shrink-0">{mkt}</span>
                        </div>
                        {price != null && (
                          <p className="font-mono text-xs text-muted-foreground mt-0.5 tabular-nums">
                            ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground shrink-0">{signal.tf}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        {isLong ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                          : isShort ? <TrendingDown className="h-4 w-4 text-rose-500" />
                          : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span className={`text-sm font-semibold capitalize ${
                          isLong ? 'text-emerald-600 dark:text-emerald-400'
                            : isShort ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground'
                        }`}>
                          {signal.direction}
                        </span>
                      </div>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {Math.round(signal.confidence * 100)}%
                      </span>
                    </div>

                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          isLong ? 'bg-emerald-500' : isShort ? 'bg-rose-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ width: `${signal.confidence * 100}%` }}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {signal.reason}
                    </p>

                    {fired.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {fired.slice(0, 3).map(m => (
                          <Badge key={m} variant="secondary" className="text-[10px] font-mono px-1.5 py-0 font-normal">
                            {m.split('.')[1]}
                          </Badge>
                        ))}
                        {fired.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{fired.length - 3}</span>
                        )}
                      </div>
                    )}

                    {signal.invalidation != null && (
                      <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                        Invalidation ${Number(signal.invalidation).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
