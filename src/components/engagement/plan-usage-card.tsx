'use client';

import Link from 'next/link';
import { ArrowRight, Gauge, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanUsage } from '@/lib/plan-usage';

/**
 * Free-plan meter for the dashboard sidebar. Honest about what it measures:
 * distinct trade plans opened today on this device.
 */
export function PlanUsageCard({ className }: { className?: string }) {
  const { ready, used, remaining, limit, symbols } = usePlanUsage();
  const pct = Math.min((used / limit) * 100, 100);
  const capped = ready && remaining === 0;

  return (
    <section aria-labelledby="plan-usage-heading" className={cn('panel', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="plan-usage-heading" className="text-sm font-semibold">
            Your plan
          </h2>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Free tier</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Gauge className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="num font-semibold">
            {ready ? used : 0} of {limit}
          </span>
          <span className="text-muted-foreground">plans opened today</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={ready ? used : 0}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label="Free plans opened today"
        >
          <div
            className={cn('h-full rounded-full transition-all duration-500', capped ? 'bg-rose-500' : 'bg-brand')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={cn('mt-2 text-xs', capped ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
          {capped
            ? 'Daily cap reached. Pro removes it entirely.'
            : `${remaining} ${remaining === 1 ? 'plan' : 'plans'} left before the daily cap.`}
        </p>
      </div>

      {ready && symbols.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1">
          {symbols.slice(0, 5).map((symbol) => (
            <li key={symbol}>
              <Link
                href={`/signals/${encodeURIComponent(symbol)}`}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {symbol}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/#pricing"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand underline-offset-4 hover:underline"
      >
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        Unlock unlimited signals
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </section>
  );
}