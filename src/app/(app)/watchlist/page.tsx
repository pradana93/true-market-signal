'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

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

  // Collapse to the newest signal per instrument
  const instruments = useMemo(() => {
    const latest = new Map<number, SignalItem>();
    for (const s of signals) {
      const existing = latest.get(s.instrument_id);
      if (!existing || new Date(s.created_at) > new Date(existing.created_at)) {
        latest.set(s.instrument_id, s);
      }
    }
    return [...latest.values()];
  }, [signals]);

  const filtered = instruments.filter(i => {
    const sym = i.instrument?.symbol?.toLowerCase() || '';
    return sym.includes(query.toLowerCase());
  });

  const grouped = useMemo(() => {
    const g: Record<string, SignalItem[]> = {};
    for (const item of filtered) {
      const m = item.instrument?.market || 'other';
      if (!g[m]) g[m] = [];
      g[m].push(item);
    }
    return g;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground mt-1">
            Every instrument the engine is currently tracking, grouped by market.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search instruments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="flex items-center text-sm text-muted-foreground px-2">
          {instruments.length} instruments tracked
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading && instruments.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold text-lg">
            {query ? 'No instruments match your search' : 'No instruments tracked yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? 'Try a different symbol.' : 'Run the ingestion script to populate the watchlist.'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([market, items]) => (
          <div key={market} className="space-y-3">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-lg capitalize">{market}</h2>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => {
                const price = item.evidence?.price;
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">{item.instrument?.symbol}</span>
                            <Badge variant="outline" className="text-[10px] font-mono uppercase">{item.tf}</Badge>
                          </div>
                          {price != null && (
                            <p className="text-sm text-muted-foreground mt-1 font-mono">
                              ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {item.direction === 'long' ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : item.direction === 'short' ? (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={`text-sm font-semibold capitalize ${
                            item.direction === 'long' ? 'text-green-600 dark:text-green-400' :
                            item.direction === 'short' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                          }`}>{item.direction}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Confidence</span>
                          <span className="font-medium">{Math.round(item.confidence * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.confidence >= 0.7 ? 'bg-green-500' :
                              item.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link href={`/signals/${encodeURIComponent(item.instrument?.symbol || '')}`}>
                          <Button variant="outline" size="sm" className="text-xs px-3 py-1 w-full">
                            View Signal
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
