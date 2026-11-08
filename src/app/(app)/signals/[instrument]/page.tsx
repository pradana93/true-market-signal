'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, ArrowLeft, ShieldAlert, Activity } from 'lucide-react';
import Link from 'next/link';

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
  instrument?: { id: number; symbol: string; market: string };
}

export default function SignalDetailPage() {
  const params = useParams();
  const instrument = decodeURIComponent(params.instrument as string);
  const [signal, setSignal] = useState<SignalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-6">
        <Card className="h-40 animate-pulse bg-muted/20" />
        <Card className="h-64 animate-pulse bg-muted/20" />
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to board
          </Button>
        </Link>
        <div className="text-center py-16 border rounded-xl bg-muted/10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold text-lg">
            {error ? 'Could not load signal' : `No signal recorded for ${instrument}`}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
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

  const fired = Object.entries(methodSignals).filter(([, m]) => m.direction !== 'neutral');

  const dirColor = signal.direction === 'long' ? 'text-green-600 dark:text-green-400'
    : signal.direction === 'short' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{instrument}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Full evidence trail for the latest {signal.tf} reading
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSignal} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Verdict card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-xl">{signal.instrument?.symbol}</span>
              <Badge variant="secondary" className="capitalize">{signal.instrument?.market}</Badge>
              <Badge variant="outline" className="font-mono uppercase text-xs">{signal.tf}</Badge>
            </div>
            {price != null && (
              <span className="font-mono text-lg font-semibold">
                ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <div className={`flex items-center space-x-2 ${dirColor}`}>
              {signal.direction === 'long' ? <TrendingUp className="h-6 w-6" />
                : signal.direction === 'short' ? <TrendingDown className="h-6 w-6" />
                : <AlertCircle className="h-6 w-6" />}
              <span className="font-bold text-lg capitalize">{signal.direction}</span>
            </div>
            <div className="flex items-center space-x-2 flex-1 max-w-xs">
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    signal.confidence >= 0.7 ? 'bg-green-500' :
                    signal.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${signal.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">{Math.round(signal.confidence * 100)}%</span>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg mt-4">
            <p className="text-sm leading-relaxed">{signal.reason}</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            {regime?.regime && (
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Regime:</span>
                <span className="font-medium capitalize">{regime.regime}</span>
                {regime.evidence?.adx != null && (
                  <span className="text-xs text-muted-foreground">(ADX {Number(regime.evidence.adx).toFixed(0)})</span>
                )}
              </div>
            )}
            {atr != null && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">ATR:</span>
                <span className="font-mono">{Number(atr).toFixed(2)}</span>
              </div>
            )}
            {signal.invalidation != null && (
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">Invalidation:</span>
                <span className="font-mono text-red-600 dark:text-red-400">${Number(signal.invalidation).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Corroboration:</span>
              <span className="font-medium">{corroboratingLong}L / {corroboratingShort}S</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Fired methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Methods that fired ({fired.length})</CardTitle>
          <CardDescription className="text-xs">
            Only methods that found a pattern are listed. Neutral readings are abstentions and do not vote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fired.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No method found a pattern. The engine is standing aside rather than guessing.
            </p>
          ) : (
            <div className="space-y-2">
              {fired.map(([id, m]) => (
                <div key={id} className="flex items-center justify-between p-2 rounded-md border text-sm">
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium ${
                      m.direction === 'long' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {m.direction === 'long' ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
                      {m.direction}
                    </span>
                    <span className="font-mono text-xs">{id}</span>
                    {weights[id] != null && (
                      <span className="text-xs text-muted-foreground">w={weights[id]}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-muted-foreground hidden sm:block">{m.reason}</span>
                    <span className="font-mono text-xs font-semibold">{Math.round(m.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full method table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All method readings</CardTitle>
          <CardDescription className="text-xs">
            The complete evidence set, including abstentions. This is what the fusion layer saw.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="py-2 pr-4 font-medium">Method</th>
                  <th className="py-2 pr-4 font-medium">Direction</th>
                  <th className="py-2 pr-4 font-medium">Confidence</th>
                  <th className="py-2 pr-4 font-medium">Weight</th>
                  <th className="py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(methodSignals).map(([id, m]) => (
                  <tr key={id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{id}</td>
                    <td className={`py-2 pr-4 capitalize ${
                      m.direction === 'long' ? 'text-green-600 dark:text-green-400' :
                      m.direction === 'short' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    }`}>{m.direction}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{Math.round(m.confidence * 100)}%</td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{weights[id] ?? '—'}</td>
                    <td className="py-2 text-xs text-muted-foreground">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
