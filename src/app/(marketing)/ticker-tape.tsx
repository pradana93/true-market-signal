'use client';

import * as React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

const TICKER_ITEMS = [
  { symbol: 'BTC/USD', price: '$89,420.00', change: '+4.80%', bullish: true },
  { symbol: 'SPY', price: '$586.40', change: '+0.82%', bullish: true },
  { symbol: 'EUR/USD', price: '$1.0824', change: '-0.31%', bullish: false },
  { symbol: 'NVDA', price: '$141.50', change: '+3.40%', bullish: true },
  { symbol: 'ETH/USD', price: '$3,420.10', change: '+2.10%', bullish: true },
  { symbol: 'XAU/USD', price: '$2,742.80', change: '+0.45%', bullish: true },
  { symbol: 'TSLA', price: '$248.90', change: '-1.20%', bullish: false },
  { symbol: 'AAPL', price: '$232.10', change: '+0.65%', bullish: true },
];

export function TickerTape() {
  const [paused, setPaused] = React.useState(false);

  return (
    <div
      className="group relative z-20 w-full overflow-hidden border-y border-border/60 bg-muted/30 backdrop-blur-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-[1600px] items-stretch">
        <span className="hidden shrink-0 items-center gap-1.5 border-r border-border/60 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          Markets
        </span>

        <div
          className="relative flex-1 overflow-hidden py-2.5"
          role="marquee"
          aria-label="Market prices, illustrative snapshot"
          aria-live="off"
        >
          <div
            className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap motion-reduce:animate-none"
            style={{ animationPlayState: paused ? 'paused' : 'running' }}
          >
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                className="flex items-center gap-10"
                aria-hidden={copy === 1 ? true : undefined}
              >
                {TICKER_ITEMS.map((item) => (
                  <li key={item.symbol} className="flex items-center gap-2.5 font-mono">
                    <span className="text-xs font-semibold tracking-tight text-foreground">{item.symbol}</span>
                    <span className="num text-xs text-muted-foreground">{item.price}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                        item.bullish
                          ? 'bg-brand/10 text-brand'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.bullish ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {item.change}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>

          {/* Edge fades so the loop does not cut off mid-number. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
