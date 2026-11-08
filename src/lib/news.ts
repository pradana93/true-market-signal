/**
 * Market news curation.
 *
 * The upstream feed (Finnhub) returns a general newswire with a lot of material
 * that is irrelevant to a trading desk — travel prices, brand marketing, human
 * interest. Dumping that into the UI would make the wire noisy and would bury
 * the handful of stories that actually move the instruments this engine scores.
 *
 * So every article is scored twice, deterministically and with no hidden model:
 *
 *   impact    — how much this story plausibly moves price, from the market
 *               vocabulary in the headline and summary plus its freshness.
 *   sentiment — the direction the wording points, from a fixed lexicon.
 *
 * Both expose the terms that produced the score (`drivers`), so a reader can see
 * exactly why a story ranks where it does. Nothing is invented: if the feed has
 * no market-relevant story, the wire returns nothing and the UI says so.
 */

export type NewsSentiment = 'bullish' | 'bearish' | 'neutral';

export type NewsCategory =
  | 'macro'
  | 'rates'
  | 'equities'
  | 'crypto'
  | 'forex'
  | 'commodities'
  | 'geopolitics';

export interface MarketNewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string | null;
  publishedAt: string;
  category: NewsCategory;
  /** Symbols from this engine's universe that the story touches. */
  symbols: string[];
  /** 0-100 relevance-and-impact score used for ranking. */
  impact: number;
  sentiment: NewsSentiment;
  /** The matched terms that produced the score, for transparency. */
  drivers: string[];
}

interface RawArticle {
  id?: number | string;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  image?: string;
  datetime?: number;
  related?: string;
  category?: string;
}

/**
 * Market vocabulary with weights. A term only earns weight when it appears in
 * the article text, so a travel piece scores near zero and a Fed story scores
 * high. Weights are deliberately coarse: the goal is ordering, not precision.
 */
const SIGNAL_TERMS: Array<{ pattern: RegExp; weight: number; label: string; category: NewsCategory }> = [
  // Macro / rates — the widest blast radius.
  { pattern: /\bfed\b|federal reserve|fomc/i, weight: 26, label: 'Fed', category: 'rates' },
  { pattern: /rate (hike|cut|decision)|interest rate|monetary policy/i, weight: 24, label: 'rates', category: 'rates' },
  { pattern: /\binflation\b|\bcpi\b|\bpce\b|price index/i, weight: 22, label: 'inflation', category: 'macro' },
  { pattern: /payroll|nonfarm|non-farm|jobs report|unemployment/i, weight: 20, label: 'labour data', category: 'macro' },
  { pattern: /\bgdp\b|recession|economic growth|slowdown/i, weight: 18, label: 'growth', category: 'macro' },
  { pattern: /treasury|bond yield|yield curve|\bdebt\b/i, weight: 16, label: 'yields', category: 'rates' },
  { pattern: /\becb\b|european central bank|\bboj\b|bank of japan|pboc|central bank/i, weight: 18, label: 'central banks', category: 'rates' },

  // Equities
  { pattern: /earnings|guidance|quarterly results|revenue beat|profit/i, weight: 20, label: 'earnings', category: 'equities' },
  { pattern: /\bai\b|artificial intelligence|data cent(er|re)/i, weight: 14, label: 'AI capex', category: 'equities' },
  { pattern: /selloff|sell-off|rout|crash|correction|bear market/i, weight: 22, label: 'selloff', category: 'equities' },
  { pattern: /record high|rally|bull market|all-time high/i, weight: 18, label: 'rally', category: 'equities' },
  { pattern: /upgrade|downgrade|price target/i, weight: 14, label: 'analyst action', category: 'equities' },

  // Crypto
  { pattern: /bitcoin|\bbtc\b|crypto|ethereum|\beth\b|altcoin|stablecoin/i, weight: 20, label: 'crypto', category: 'crypto' },
  { pattern: /\betf\b|spot bitcoin|institutional inflow/i, weight: 16, label: 'ETF flows', category: 'crypto' },

  // FX
  { pattern: /\bdollar\b|\bdxy\b|greenback|currency|forex|\bfx\b/i, weight: 15, label: 'dollar', category: 'forex' },
  { pattern: /\byen\b|euro\b|sterling|pound|yuan|renminbi/i, weight: 12, label: 'major pairs', category: 'forex' },

  // Commodities
  { pattern: /\bgold\b|bullion|silver|precious metal/i, weight: 18, label: 'gold', category: 'commodities' },
  { pattern: /\boil\b|crude|brent|\bopec\b|barrel|natural gas/i, weight: 20, label: 'energy', category: 'commodities' },

  // Geopolitics / risk
  { pattern: /sanction|tariff|trade war|embargo/i, weight: 20, label: 'trade policy', category: 'geopolitics' },
  { pattern: /war|strike|attack|conflict|escalat|military/i, weight: 16, label: 'conflict', category: 'geopolitics' },
  { pattern: /election|political|parliament|government collapse/i, weight: 12, label: 'politics', category: 'geopolitics' },
];

/** Directional vocabulary. Equal-weight evidence, so one term never dominates. */
const BULLISH_TERMS =
  /\b(surge[sd]?|soar(s|ed)?|rally|rallies|jump(s|ed)?|beat(s)?|upgrade[sd]?|record|strong(er)?|optimis(m|tic)|boost(s|ed)?|gain(s|ed)?|rebound(s|ed)?|higher|outperform(s|ed)?|accelerat(e|es|ing)|growth)\b/i;

const BEARISH_TERMS =
  /\b(plunge[sd]?|slump(s|ed)?|tumble[sd]?|drop(s|ped)?|fall(s|ing)?|sink(s|ing)?|miss(es|ed)?|downgrade[sd]?|weak(er)?|fear(s)?|warning|recession|crash(es|ed)?|selloff|sell-off|rout|cut(s)?|layoff(s)?|crisis|default|contraction|lower|slowdown|risk)\b/i;

/**
 * Keyword-to-instrument map. This is what lets a detail page show only the
 * stories that touch the instrument a reader is actually looking at.
 */
const SYMBOL_RULES: Array<{ pattern: RegExp; symbols: string[] }> = [
  { pattern: /bitcoin|\bbtc\b/i, symbols: ['BTC-USD'] },
  { pattern: /ethereum|\beth\b|\bether\b/i, symbols: ['ETH-USD'] },
  { pattern: /solana|\bsol\b/i, symbols: ['SOL-USD'] },
  { pattern: /xrp|ripple/i, symbols: ['XRP-USD'] },
  { pattern: /bnb|binance coin/i, symbols: ['BNB-USD'] },
  { pattern: /crypto|altcoin|stablecoin|digital asset/i, symbols: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD'] },
  { pattern: /\bgold\b|bullion|XAU/i, symbols: ['GC=F', 'XAU/USD'] },
  { pattern: /oil|crude|brent|opec|natural gas|energy/i, symbols: ['GC=F', 'XAU/USD'] },
  { pattern: /euro\b|EUR\/USD|eurozone/i, symbols: ['EUR/USD'] },
  { pattern: /yen\b|boj|bank of japan|japan/i, symbols: ['USD/JPY'] },
  { pattern: /sterling|pound|bank of england|\buk\b/i, symbols: ['GBP/USD'] },
  { pattern: /\bdollar\b|dxy|greenback/i, symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'] },
  { pattern: /nvidia|nvda/i, symbols: ['NVDA'] },
  { pattern: /apple|iphone|aapl/i, symbols: ['AAPL'] },
  { pattern: /tesla|\btsla\b|musk/i, symbols: ['TSLA'] },
  { pattern: /microsoft|azure|msft/i, symbols: ['MSFT'] },
  { pattern: /amazon|\baws\b|amzn/i, symbols: ['AMZN'] },
  { pattern: /s&p|\bspy\b|sp500|s&p 500/i, symbols: ['SPY'] },
  { pattern: /nasdaq|qqq|tech stocks/i, symbols: ['QQQ'] },
  { pattern: /dow|dow jones|\bdia\b/i, symbols: ['DIA'] },
  { pattern: /stock market|wall street|equit(y|ies)|s&p 500|nasdaq/i, symbols: ['SPY', 'QQQ', 'DIA'] },
  { pattern: /\bfed\b|fomc|rate (hike|cut)|treasury|payroll/i, symbols: ['SPY', 'QQQ', 'DIA', 'EUR/USD', 'XAU/USD'] },
];

/** Below this, a story is considered noise for a trading desk. */
const MIN_IMPACT = 26;

/** Instruments this engine actually scores. An upstream ticker tag on one of
 *  these is direct evidence the story is on our coverage list. */
const COVERAGE_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'SPY', 'QQQ', 'DIA'];

/** Impact added when the newswire tags a coverage ticker on the story. */
const TICKER_TAG_WEIGHT = 20;

/** How much of the impact score decays per hour of age (24h half-life-ish). */
const AGE_DECAY_PER_HOUR = 0.9;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectSentiment(text: string): NewsSentiment {
  const bull = (text.match(new RegExp(BULLISH_TERMS.source, 'gi')) ?? []).length;
  const bear = (text.match(new RegExp(BEARISH_TERMS.source, 'gi')) ?? []).length;
  if (bull === 0 && bear === 0) return 'neutral';
  // Require a clear margin; a single matching word is not a directional read.
  if (bull >= bear * 1.5) return 'bullish';
  if (bear >= bull * 1.5) return 'bearish';
  return 'neutral';
}

function mapSymbols(text: string, related: string): string[] {
  const out = new Set<string>();
  for (const rule of SYMBOL_RULES) {
    if (rule.pattern.test(text)) rule.symbols.forEach((s) => out.add(s));
  }
  for (const ticker of knownTickers(related)) {
    out.add(ticker);
  }
  return [...out];
}

function normalizedRelated(related: string): string[] {
  return related
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0);
}

function knownTickers(related: string): string[] {
  return normalizedRelated(related).filter((t) => COVERAGE_TICKERS.includes(t));
}

export function normalizeArticle(raw: RawArticle, now = Date.now()): MarketNewsArticle | null {
  const headline = stripTags(raw.headline ?? '');
  if (!headline || !raw.url) return null;

  const summary = stripTags(raw.summary ?? '');
  const text = `${headline}. ${summary}`;
  const publishedMs = (raw.datetime ?? 0) * 1000;
  const ageHours = publishedMs ? (now - publishedMs) / 3_600_000 : 72;

  // A coverage ticker tag from the wire is direct evidence the story is ours.
  const tagTickers = knownTickers(raw.related ?? '');
  let drivers: string[] = [];
  let rawScore = 0;
  let maxCategoryScore = 0;
  const categoryScores = new Map<NewsCategory, number>();

  for (const term of SIGNAL_TERMS) {
    if (!term.pattern.test(text)) continue;
    rawScore += term.weight;
    drivers.push(term.label);
    categoryScores.set(term.category, (categoryScores.get(term.category) ?? 0) + term.weight);
  }

  const breadth = categoryScores.size;
  rawScore += (breadth - 1) * 8;
  rawScore -= clamp(ageHours, 0, 72) * AGE_DECAY_PER_HOUR;

  if (tagTickers.length) {
    rawScore += tagTickers.length * TICKER_TAG_WEIGHT;
    drivers.push(...tagTickers);
  }

  // Stories below the noise floor are dropped entirely — the UI gets a clean
  // wire or an explicit 'no relevant news' state rather than filler.
  if (rawScore < MIN_IMPACT) return null;

  for (const [, score] of categoryScores) {
    if (score > maxCategoryScore) maxCategoryScore = score;
  }

  const category = [...categoryScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'macro';

  return {
    id: String(raw.id ?? raw.url),
    headline,
    summary: summary.slice(0, 320),
    source: raw.source ?? 'Newswire',
    url: raw.url,
    image: raw.image && raw.image.startsWith('https://') ? raw.image : null,
    publishedAt: new Date(publishedMs || now).toISOString(),
    category,
    symbols: mapSymbols(text, raw.related ?? ''),
    impact: Math.round(clamp(rawScore, 1, 100)),
    sentiment: detectSentiment(text),
    drivers: [...new Set(drivers)].slice(0, 6),
  };
}

/** Collapse near-duplicate wire copies of the same story. */
function dedupe(articles: MarketNewsArticle[]): MarketNewsArticle[] {
  const seen = new Set<string>();
  const out: MarketNewsArticle[] = [];
  for (const a of articles) {
    const fingerprint = a.headline
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .slice(0, 8)
      .join(' ');
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    out.push(a);
  }
  return out;
}

interface FetchOptions {
  limit?: number;
  category?: string;
  symbol?: string;
}

const FEED_CATEGORIES = ['general', 'crypto', 'forex', 'merger'] as const;

/**
 * Pull the newswire, score and rank it. Any feed that fails is skipped rather
 * than failing the whole wire — one dead upstream must not blank the panel.
 */
export async function fetchMarketNews(opts: FetchOptions = {}): Promise<{
  articles: MarketNewsArticle[];
  sources: number;
  feeds: string[];
}> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY missing');

  const now = Date.now();
  const settled = await Promise.allSettled(
    FEED_CATEGORIES.map(async (category) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`,
        { cache: 'no-store', signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`feed ${category} HTTP ${res.status}`);
      const rows = (await res.json()) as RawArticle[];
      return Array.isArray(rows) ? rows.map((r) => normalizeArticle(r, now)) : [];
    })
  );

  const okFeeds: string[] = [];
  const collected: MarketNewsArticle[] = [];

  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      okFeeds.push(FEED_CATEGORIES[i]);
      for (const a of result.value) if (a) collected.push(a);
    }
  });

  if (okFeeds.length === 0) {
    throw new Error('all news feeds unavailable');
  }

  let ranked = dedupe(collected).sort((a, b) => b.impact - a.impact);

  if (opts.category && opts.category !== 'all') {
    ranked = ranked.filter((a) => a.category === opts.category);
  }
  if (opts.symbol) {
    const s = opts.symbol.toUpperCase();
    // Stories naming the instrument directly rank first; the general market
    // stories that mention its asset class still follow, because they move it.
    const direct = ranked.filter((a) => a.symbols.includes(s));
    const broad = ranked.filter(
      (a) => !a.symbols.includes(s) && (a.category === 'macro' || a.category === 'rates' || a.category === 'geopolitics')
    );
    ranked = [...direct, ...broad];
  }

  const limit = clamp(opts.limit ?? 12, 1, 40);
  const articles = ranked.slice(0, limit);

  return {
    articles,
    sources: new Set(articles.map((a) => a.source)).size,
    feeds: okFeeds,
  };
}