'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, ArrowLeft, ShieldAlert, Activity, ArrowUpRight, ArrowDownRight, Target, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { TradePlanLadder } from '@/components/trade-plan';
import { TradePlan } from '@/lib/trade-levels';

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
        <div className="panel h-32 animate-pulse bg-muted/30" />
        <div className="panel h-48 animate-pulse bg-muted/30" />
        <div className="panel h-48 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Board
          </Button>
        </Link>
        <div className="panel text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-lg">
            {error ? 'Could not load signal' : `No signal recorded for ${instrument}`}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
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

  const isLong = signal.direction === 'long';
  const isShort = signal.direction === 'short';
  const dirColor = isLong ? 'text-emerald-600 dark:text-emerald-400'
    : isShort ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground';
  const accentBg = isLong ? 'bg-emerald-500/10' : isShort ? 'bg-rose-500/10' : 'bg-muted';
  const accentBorder = isLong ? 'border-emerald-500/20' : isShort ? 'border-rose-500/20' : 'border-muted';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Ambient wash for the detail page */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[80rem] rounded-full bg-gradient-to-br from-emerald-500/5 via-transparent to-rose-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight">{signal.instrument?.symbol}</span>
              <Badge variant="secondary" className="capitalize text-xs">{signal.instrument?.market}</Badge>
              <Badge variant="outline" className="font-mono uppercase text-[10px]">{signal.tf}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Full evidence trail for the latest {signal.tf} reading
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSignal} disabled={loading} className="h-9 px-4 shadow-sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Verdict Card — Premium */}
      <div className="panel relative overflow-hidden" style={{ borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: isLong ? 'hsl(var(--bull))' : isShort ? 'hsl(var(--bear))' : 'hsl(var(--neutral))' }}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-emerald-500/5 via-transparent to-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="p-6 pb-4 space-y-5 relative z-10">
          {/* Top Row: Symbol + Price */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-semibold text-xl tracking-tight">{signal.instrument?.symbol}</span>
                <Badge variant="secondary" className="capitalize">{signal.instrument?.market}</Badge>
                <Badge variant="outline" className="font-mono uppercase text-[10px]">{signal.tf}</Badge>
              </div>
              {price != null && (
                <p className="text-sm font-mono text-muted-foreground num">
                  ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Direction, Confidence, Regime */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className={`flex items-center space-x-4 ${dirColor}`}>
              <div className={`w-12 h-12 rounded-xl ${accentBg} ${accentBorder} flex items-center justify-center flex-shrink-0`}>
                {isLong ? <TrendingUp className="h-7 w-7" /> : isShort ? <TrendingDown className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
              </div>
              <div className="space-y-1">
                <span className="font-bold text-lg capitalize">{signal.direction}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isLong ? 'bg-emerald-500' : isShort ? 'bg-rose-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${signal.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold num whitespace-nowrap">{Math.round(signal.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {regime?.regime && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Regime:</span>
                  <span className="font-medium capitalize">{regime.regime}</span>
                  {regime.evidence?.adx != null && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted font-mono">
                      ADX {Number(regime.evidence.adx).toFixed(0)}
                    </span>
                  )}
                </div>
              )}
              {atr != null && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40">
                  <span className="text-muted-foreground">ATR:</span>
                  <span className="font-mono font-semibold num">{Number(atr).toFixed(2)}</span>
                </div>
              )}
              {signal.invalidation != null && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-muted-foreground">Invalidation:</span>
                  <span className="font-mono num text-rose-600 dark:text-rose-400">${Number(signal.invalidation).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40">
                <span className="text-muted-foreground">Corroboration:</span>
                <span className="font-medium">{corroboratingLong}L / {corroboratingShort}S</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 rounded-lg bg-muted/40 border">
            <p className="text-sm leading-relaxed text-muted-foreground">{signal.reason}</p>
          </div>
        </CardHeader>

        {/* Trade Plan — Full Ladder */}
        <CardContent className="p-6 pt-0 relative z-10">
          <TradePlanLadder plan={signal.plan ?? null} bias={signal.direction} variant="full" title="Execution Plan" showDerivation />
        </CardContent>
      </div>

      {/* Fired Methods */}
      <div className="panel">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Methods That Fired ({fired.length})</CardTitle>
              <CardDescription className="text-xs">
                Only methods that found a pattern are listed. Neutral readings are abstentions and do not vote.
              </CardDescription>
            </div>
            {fired.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {fired.length} active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {fired.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                No method found a pattern. The engine is standing aside rather than guessing.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fired.map(([id, m]) => {
                const isMethodLong = m.direction === 'long';
                return (
                  <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border transition-colors hover:bg-muted/60">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isMethodLong ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {isMethodLong ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium capitalize ${isMethodLong ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {m.direction}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{id}</span>
                          {weights[id] != null && (
                            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">w={weights[id]}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground max-w-md line-clamp-1">{m.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <span className="font-mono text-xs font-semibold text-muted-foreground hidden sm:block">{Math.round(m.confidence * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      {/* Full Method Table */}
      <div className="panel">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base">All Method Readings</CardTitle>
          <CardDescription className="text-xs">
            The complete evidence set, including abstentions. This is what the fusion layer saw.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="py-3 pr-4 font-medium">Method</th>
                  <th className="py-3 pr-4 font-medium">Direction</th>
                  <th className="py-3 pr-4 font-medium">Confidence</th>
                  <th className="py-3 pr-4 font-medium">Weight</th>
                  <th className="py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(methodSignals).map(([id, m]) => {
                  const isMethodLong = m.direction === 'long';
                  const isMethodShort = m.direction === 'short';
                  return (
                    <tr key={id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs">{id}</td>
                      <td className={`py-3 pr-4 capitalize ${
                        isMethodLong ? 'text-emerald-600 dark:text-emerald-400' :
                        isMethodShort ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                      }`}>{m.direction}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{Math.round(m.confidence * 100)}%</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{weights[id] ?? '—'}</td>
                      <td className="py-3 text-xs text-muted-foreground">{m.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </div>
    </div>
  );
}