'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Globe,
  Newspaper,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { MarketNewsArticle } from '@/lib/news';

interface MarketNewsProps {
  /** 'panel' = dashboard card, 'compact' = sidebar, 'symbol' = detail page filtered */
  variant?: 'panel' | 'compact' | 'symbol';
  /** Optional symbol to filter (detail page) */
  symbol?: string;
  /** Optional category filter */
  category?: string;
  /** Max articles to show */
  limit?: number;
  /** Override the API base (for testing) */
  apiBase?: string;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  macro: 'Macro',
  rates: 'Rates',
  equities: 'Equities',
  crypto: 'Crypto',
  forex: 'FX',
  commodities: 'Commodities',
  geopolitics: 'Geopolitics',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  macro: <Globe className="h-3 w-3" />,
  rates: <Zap className="h-3 w-3" />,
  equities: <TrendingUp className="h-3 w-3" />,
  crypto: <Newspaper className="h-3 w-3" />,
  forex: <Globe className="h-3 w-3" />,
  commodities: <Zap className="h-3 w-3" />,
  geopolitics: <Newspaper className="h-3 w-3" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function SentimentChip({ sentiment }: { sentiment: MarketNewsArticle['sentiment'] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-mono h-5 px-2 gap-1',
        sentiment === 'bullish' && 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
        sentiment === 'bearish' && 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5',
        sentiment === 'neutral' && 'text-muted-foreground border-muted/40'
      )}
    >
      {sentiment === 'bullish' && <TrendingUp className="h-3 w-3" />}
      {sentiment === 'bearish' && <TrendingDown className="h-3 w-3" />}
      {sentiment === 'neutral' && <Minus className="h-3 w-3" />}
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </Badge>
  );
}

function ImpactMeter({ impact }: { impact: number }) {
  return (
    <div className="flex items-center gap-2" title={`Impact score: ${impact}/100`}>
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${impact}%`,
            background:
              impact >= 80
                ? 'hsl(var(--bull))'
                : impact >= 50
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--muted-foreground))',
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{impact}</span>
    </div>
  );
}

function ArticleCard({
  article,
  variant,
  isFeatured,
}: {
  article: MarketNewsArticle;
  variant: 'panel' | 'compact' | 'symbol';
  isFeatured?: boolean;
}) {
  const cat = article.category;
  const showImage = variant === 'panel' && isFeatured && article.image;

  return (
    <article
      className={cn(
        'group relative rounded-xl border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg',
        variant === 'panel' && isFeatured && 'p-5',
        variant === 'panel' && !isFeatured && 'p-3',
        variant === 'compact' && 'p-2.5',
        variant === 'symbol' && 'p-3'
      )}
    >
      {showImage && article.image && (
        <div className="absolute inset-0 -z-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <img
            src={article.image}
            alt=""
            className="w-full h-full object-cover rounded-xl"
            loading="lazy"
          />
        </div>
      )}

      <div className={cn('flex flex-col gap-2', showImage && 'relative z-10')}>
        {/* Header: source · time · category */}
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium">{article.source}</span>
            <span aria-hidden="true">·</span>
            <span><Clock className="h-3 w-3 inline" /> {timeAgo(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[9px] font-mono h-4 px-2 gap-1"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              {CATEGORY_ICONS[cat]}
              {CATEGORY_LABELS[cat] ?? cat}
            </Badge>
            <ImpactMeter impact={article.impact} />
          </div>
        </div>

        {/* Headline */} 
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'font-semibold leading-tight transition-colors hover:text-primary',
            isFeatured ? 'text-lg' : 'text-sm'
          )}
        >
          {article.headline}
          <ExternalLink className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Summary — panel/symbol only, truncated */} 
        {(variant === 'panel' || variant === 'symbol') && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground/80 transition-colors">
            {article.summary}
          </p>
        )}

        {/* Symbol chips — visible on panel/symbol */} 
        {article.symbols.length > 0 && (variant === 'panel' || variant === 'symbol') && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.symbols.slice(0, 4).map((sym) => (
              <Badge
                key={sym}
                variant="secondary"
                className="text-[9px] font-mono h-4 px-2"
              >
                {sym}
              </Badge>
            ))}
            {article.symbols.length > 4 && (
              <Badge variant="outline" className="text-[9px] font-mono h-4 px-2 text-muted-foreground">
                +{article.symbols.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Drivers — transparent evidence */} 
        {article.drivers.length > 0 && variant !== 'compact' && (
          <details className="group text-[10px] text-muted-foreground">
            <summary className="flex items-center gap-1 cursor-pointer select-none">
              <span className="opacity-60 group-hover:opacity-100">Drivers:</span>
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-1 flex flex-wrap gap-1">
              {article.drivers.map((d) => (
                <Badge key={d} variant="outline" className="h-4 px-2 text-[9px] font-mono">
                  {d}
                </Badge>
              ))}
            </div>
          </details>
        )}

        {/* Sentiment chip */} 
        <div className="flex items-center justify-between pt-1">
          <SentimentChip sentiment={article.sentiment} />
        </div>
      </div>
    </article>
  );
}

export function MarketNews({
  variant = 'panel',
  symbol,
  category,
  limit = 12,
  apiBase = '',
  className,
}: MarketNewsProps) {
  const [articles, setArticles] = useState<MarketNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ count: number; sources: number; feeds: string[] } | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set('limit', String(limit));
    if (symbol) p.set('symbol', symbol);
    if (category && category !== 'all') p.set('category', category);
    return p;
  }, [symbol, category, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${apiBase}/api/news?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setArticles(json.data ?? []);
          setMeta({ count: json.meta?.count ?? 0, sources: json.meta?.sources ?? 0, feeds: json.meta?.feeds ?? [] });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load news');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.toString(), apiBase]);

  const featured = articles[0];
  const rest = articles.slice(1);

  if (loading && articles.length === 0) {
    return (
      <div className={cn('panel', className)}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('panel p-6 text-center', className)}>
        <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={cn('panel p-6 text-center', className)}>
        <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          {symbol ? `No market-relevant news for ${symbol}` : 'No market-relevant stories in the feed right now'}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Irrelevant lifestyle and human-interest wire copies are filtered out.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('panel flex flex-col', className)}>
      {/* Header */} 
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {variant === 'symbol' && symbol ? `News for ${symbol}` : 'Market Intelligence Wire'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {meta?.count ?? articles.length} stories · {meta?.sources ?? 0} sources · {meta?.feeds?.join(', ') ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="h-5 px-2 gap-1 text-[10px]">
            <Zap className="h-3 w-3" />
            Impact-ranked
          </Badge>
        </div>
      </div>

      {/* Content */} 
      {variant === 'compact' ? (
        <div className="flex-1 p-2 overflow-y-auto max-h-[500px]">
          <div className="space-y-2">
            {articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} variant="compact" isFeatured={i === 0} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-4">
          {featured && (
            <div className="relative">
              <ArticleCard article={featured} variant={variant} isFeatured />
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} variant={variant} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MarketNews;