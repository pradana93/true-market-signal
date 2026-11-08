import { describe, it, expect } from 'vitest';
import { normalizeArticle } from './news';

const NOW = new Date('2026-11-08T20:00:00Z').getTime();

function article(over: Partial<Parameters<typeof normalizeArticle>[0]> = {}) {
  return {
    id: 1,
    headline: 'Fed signals rate hike as inflation stays elevated',
    summary: 'The FOMC warned that persistent inflation could force another hike.',
    source: 'Reuters',
    url: 'https://example.com/a',
    image: 'https://example.com/i.jpg',
    datetime: Math.floor(NOW / 1000) - 3600,
    related: '',
    ...over,
  };
}

describe('news curation', () => {
  it('scores a central-bank story as high impact', () => {
    const a = normalizeArticle(article(), NOW);
    expect(a).not.toBeNull();
    expect(a!.impact).toBeGreaterThan(50);
    expect(a!.drivers).toContain('Fed');
    expect(a!.category).toBe('rates');
  });

  it('drops a story with no market vocabulary', () => {
    const a = normalizeArticle(
      article({
        headline: 'Best recipe for pumpkin soup this autumn weekend',
        summary: 'Cook with broth and fresh cream.',
      }),
      NOW
    );
    expect(a).toBeNull();
  });

  it('ranks fresh macro news above an older copy of the same theme', () => {
    const fresh = normalizeArticle(article({ datetime: Math.floor(NOW / 1000) - 600 }), NOW);
    const stale = normalizeArticle(article({ datetime: Math.floor(NOW / 1000) - 60 * 3600 }), NOW);
    expect(fresh!.impact).toBeGreaterThan(stale!.impact);
  });

  it('reads a bearish tone from risk wording', () => {
    const a = normalizeArticle(
      article({
        headline: 'Stocks plunge as recession fears spark broad selloff',
        summary: 'Investors dumped risk assets in a sharp sell-off.',
      }),
      NOW
    );
    expect(a!.sentiment).toBe('bearish');
  });

  it('reads a bullish tone from strength wording', () => {
    const a = normalizeArticle(
      article({
        headline: 'Gold surges to record high as dollar weakens',
        summary: 'Bullion rallied on strong safe-haven demand.',
      }),
      NOW
    );
    expect(a!.sentiment).toBe('bullish');
  });

  it('maps stories to the instruments they touch', () => {
    const a = normalizeArticle(
      article({
        headline: 'Bitcoin ETF inflows accelerate as BTC holds $70,000',
        summary: 'Spot bitcoin funds saw record institutional inflow.',
      }),
      NOW
    );
    expect(a!.symbols).toContain('BTC-USD');
  });

  it('maps a Fed story to broad index and dollar exposure', () => {
    const a = normalizeArticle(article(), NOW);
    expect(a!.symbols).toEqual(expect.arrayContaining(['SPY', 'QQQ', 'DIA', 'EUR/USD']));
  });

  it('uses upstream ticker hints when the headline is generic', () => {
    const a = normalizeArticle(
      article({
        headline: 'Chipmaker beats estimates and raises full-year guidance',
        summary: 'Quarterly earnings topped analyst expectations.',
        related: 'NVDA',
      }),
      NOW
    );
    expect(a!.symbols).toContain('NVDA');
  });

  it('rejects an article with no url, since it cannot be verified', () => {
    expect(normalizeArticle(article({ url: '' }), NOW)).toBeNull();
  });

  it('keeps impact inside 0-100 for a heavily keyworded story', () => {
    const a = normalizeArticle(
      article({
        headline:
          'Fed rate hike fears: inflation, payrolls, tariffs, oil, bitcoin, gold, dollar, yields, sanctions, war, recession, selloff',
        summary: 'Every market term at once.',
      }),
      NOW
    );
    expect(a!.impact).toBeLessThanOrEqual(100);
    expect(a!.impact).toBeGreaterThan(90);
  });
});