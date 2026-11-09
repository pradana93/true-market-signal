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
        sentiment === 'bullish' && 'text-brand border-brand/30 bg-brand/5',
        sentiment === 'bearish' && 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5',
        sentiment === 'neutral' && 'text-muted-foreground border-border'
      )}
    >
      {sentiment === 'bullish' && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
      {sentiment === 'bearish' && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
      {sentiment === 'neutral' && <Minus className="h-3 w-3" aria-hidden="true" />}
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </Badge>
  );
}

function ImpactMeter({ impact }: { impact: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden" aria-hidden="true">
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
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">
        <span className="sr-only">Impact score </span>
        {impact}
      </span>
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
        'group relative rounded-xl border border-border/70 bg-card transition-colors hover:border-brand/40',
        variant === 'panel' && isFeatured && 'p-4',
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{article.source}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {timeAgo(article.publishedAt)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="h-5 gap-1 px-2 font-mono text-[10px]">
              <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>
              {CATEGORY_LABELS[cat] ?? cat}
            </Badge>
            <ImpactMeter impact={article.impact} />
          </div>
        </div>

        {/* Headline */}
        <h3 className={cn('font-semibold leading-tight', isFeatured ? 'text-lg' : 'text-sm')}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 transition-colors hover:text-brand"
          >
            {article.headline}
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </h3>

        {/* Summary — panel/symbol only, truncated */}
        {(variant === 'panel' || variant === 'symbol') && (
          <p className="line-clamp-2 text-body-sm leading-relaxed text-muted-foreground">{article.summary}</p>
        )}

        {/* Symbol chips — visible on panel/symbol */}
        {article.symbols.length > 0 && (variant === 'panel' || variant === 'symbol') && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {article.symbols.slice(0, 4).map((sym) => (
              <li key={sym}>
                <Badge variant="secondary" className="h-5 px-2 font-mono text-[10px]">
                  {sym}
                </Badge>
              </li>
            ))}
            {article.symbols.length > 4 && (
              <li>
                <Badge variant="outline" className="h-5 px-2 font-mono text-[10px] text-muted-foreground">
                  +{article.symbols.length - 4}
                </Badge>
              </li>
            )}
          </ul>
        )}

        {/* Drivers — transparent evidence */}
        {article.drivers.length > 0 && variant !== 'compact' && (
          <details className="group text-[11px] text-muted-foreground">
            <summary className="flex cursor-pointer select-none items-center gap-1 py-1">
              <ChevronRight
                className="h-3 w-3 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                aria-hidden="true"
              />
              <span className="opacity-70 group-hover:opacity-100">Drivers</span>
            </summary>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {article.drivers.map((d) => (
                <li key={d}>
                  <Badge variant="outline" className="h-5 px-2 font-mono text-[10px]">
                    {d}
                  </Badge>
                </li>
              ))}
            </ul>
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
      <div className={cn('panel', className)} role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading market news</span>
        <div className="p-6 space-y-4" aria-hidden="true">
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
        <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" aria-hidden="true" />
        <p className="text-body-sm">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={cn('panel p-6 text-center', className)}>
        <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" aria-hidden="true" />
        <p className="text-body-sm">
          {symbol ? `No market-relevant news for ${symbol}` : 'No market-relevant stories in the feed right now'}
        </p>
        <p className="text-body-sm text-muted-foreground/70 mt-1">
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
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Newspaper className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-h3 font-semibold">
              {variant === 'symbol' && symbol ? `News for ${symbol}` : 'Market intelligence wire'}
            </h2>
            <p className="text-body-sm text-muted-foreground">
              {meta?.count ?? articles.length} stories · {meta?.sources ?? 0} sources ·{' '}
              {meta?.feeds?.join(', ') ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-body-sm">
          <Badge variant="outline" className="h-5 px-2 gap-1 text-body-sm">
            <Zap className="h-3 w-3" aria-hidden="true" />
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