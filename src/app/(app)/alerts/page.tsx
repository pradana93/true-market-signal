'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, RefreshCw, AlertCircle, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
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
  instrument?: { id: number; symbol: string; market: string };
}

/**
 * Alerts view.
 *
 * The alerts table is user-scoped and requires auth; without an authenticated
 * session there is nothing to list. Rather than fabricate rows, this page
 * surfaces alerts conditionally: it derives "watch conditions" from live
 * signal state that a user would want to be notified about (sustained high
 * conviction, or a price at its invalidation level), and says plainly when
 * nothing is firing.
 */
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

  // Deduplicate to latest signal per instrument
  const latestPerInstrument = (() => {
    const latest = new Map<number, SignalItem>();
    for (const s of signals) {
      const existing = latest.get(s.instrument_id);
      if (!existing || new Date(s.created_at) > new Date(existing.created_at)) {
        latest.set(s.instrument_id, s);
      }
    }
    return [...latest.values()];
  })();

  // High-conviction signals worth alerting on
  const highConviction = latestPerInstrument.filter(s => s.direction !== 'neutral' && s.confidence >= 0.75);

  // Signals near/at invalidation
  const nearInvalidation = latestPerInstrument.filter(s => {
    const price = s.evidence?.price;
    if (!price || !s.invalidation) return false;
    const distance = Math.abs(price - s.invalidation) / price;
    return distance < 0.005;
  });

  const totalWatch = highConviction.length + nearInvalidation.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Conditions the engine is flagging right now: high-conviction calls and signals at their invalidation level.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase">Active Alerts</p>
          <p className="text-2xl font-bold mt-1">{totalWatch}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase">High Conviction</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{highConviction.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase">At Invalidation</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{nearInvalidation.length}</p>
        </Card>
      </div>

      {loading && signals.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/20" />)}
        </div>
      ) : totalWatch === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/10">
          <BellOff className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold text-lg">No alert conditions firing</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Nothing currently meets the alert thresholds — no signal is above 75% confluence,
            and none is within 0.5% of its invalidation level. That is a valid state, not an error.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {highConviction.map(s => (
            <Card key={`hc-${s.id}`} className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{s.instrument?.symbol}</span>
                        <Badge variant="secondary" className="capitalize text-xs">{s.instrument?.market}</Badge>
                        <Badge variant="outline" className="text-xs font-mono uppercase">{s.tf}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className={`text-sm font-semibold capitalize ${
                        s.direction === 'long' ? 'text-green-600' : 'text-red-600'
                      }`}>{s.direction}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(s.confidence * 100)}% confidence</p>
                    </div>
                    {s.direction === 'long' ? (
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {nearInvalidation.map(s => (
            <Card key={`ni-${s.id}`} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{s.instrument?.symbol}</span>
                        <Badge variant="secondary" className="capitalize text-xs">{s.instrument?.market}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Price ${Number(s.evidence?.price).toLocaleString()} within 0.5% of invalidation ${Number(s.invalidation).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Link href={`/signals/${encodeURIComponent(s.instrument?.symbol || '')}`}>
                    <Button variant="outline" size="sm" className="text-xs">Inspect</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span>Custom alerts require sign-in</span>
          </CardTitle>
          <CardDescription className="text-xs">
            User-defined price and technical alerts are stored per account and are not shown here.
            The conditions above are derived from live engine state and are available without an account.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
