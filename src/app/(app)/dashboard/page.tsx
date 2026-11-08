'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function DashboardPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/signals');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSignals(json.data || []);
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
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/30 p-6 rounded-xl border">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight">True Signal Board</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Multi-method confluence engine tracking 18 instruments across crypto, equities, forex, and commodities.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded-lg border text-xs font-medium">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping" />
            <span>Live Engine Active</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading} className="flex items-center space-x-1">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Tracked Signals</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <Layers className="h-8 w-8 text-muted-foreground/40" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-green-500">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Bullish Conviction</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.longs}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500/40" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Bearish Conviction</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.shorts}</p>
          </div>
          <TrendingDown className="h-8 w-8 text-red-500/40" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-gray-400">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Standing Aside</p>
            <p className="text-2xl font-bold text-muted-foreground mt-1">{stats.neutrals}</p>
          </div>
          <ShieldAlert className="h-8 w-8 text-muted-foreground/40" />
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground">Market:</span>
          <div className="flex flex-wrap gap-1">
            {['all', 'crypto', 'stocks', 'forex', 'commodities', 'etfs'].map(m => (
              <Button
                key={m}
                variant={marketFilter === m ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMarketFilter(m)}
                className="capitalize text-xs h-8 px-3"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-sm font-medium text-muted-foreground">Direction:</span>
          {['all', 'long', 'short', 'neutral'].map(d => (
            <Button
              key={d}
              variant={directionFilter === d ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDirectionFilter(d)}
              className="capitalize text-xs h-8 px-3"
            >
              {d}
            </Button>
          ))}
        </div>
      </div>

      {/* Error / Loading / Signal Grid */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading && signals.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold text-lg">No signals match filter</h3>
          <p className="text-sm text-muted-foreground mt-1">Try resetting market or direction filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSignals.map(signal => {
            const sym = signal.instrument?.symbol || 'UNKNOWN';
            const mkt = signal.instrument?.market || 'general';
            const price = signal.evidence?.price;
            const firedMethods = Object.entries(signal.evidence?.methodSignals || {})
              .filter(([_, s]: any) => s.direction !== 'neutral')
              .map(([id]) => id.split('.')[1]);

            return (
              <Card key={signal.id} className="hover:shadow-lg transition-all duration-200 flex flex-col justify-between border-l-4" style={{
                borderLeftColor: signal.direction === 'long' ? '#22c55e' : signal.direction === 'short' ? '#ef4444' : '#94a3b8'
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{sym}</span>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {mkt}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs uppercase">
                      {signal.tf}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-1.5">
                      {signal.direction === 'long' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : signal.direction === 'short' ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={`font-bold text-base capitalize ${
                        signal.direction === 'long' ? 'text-green-600 dark:text-green-400' :
                        signal.direction === 'short' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                      }`}>
                        {signal.direction}
                      </span>
                    </div>
                    {price && (
                      <span className="font-mono text-sm font-semibold">
                        ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  <CardDescription className="text-xs mt-2 line-clamp-3 leading-relaxed">
                    {signal.reason}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Confidence Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence Confluence</span>
                      <span className="font-semibold">{Math.round(signal.confidence * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          signal.confidence >= 0.7 ? 'bg-green-500' :
                          signal.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${signal.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Fired Methods badges */}
                  {firedMethods.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {firedMethods.slice(0, 3).map((m, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {signal.invalidation && (
                      <span className="font-mono text-red-500/80">Invalidates: ${Number(signal.invalidation).toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
