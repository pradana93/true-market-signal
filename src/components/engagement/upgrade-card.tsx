'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { ArrowRight, Check, Lock, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Href = NonNullable<LinkProps<unknown>['href']>;

const DEFAULT_BENEFITS = [
  'Every signal, every market — no daily cap',
  'Position-size calculator on each trade plan',
  'Email, SMS and webhook alerts the second a level breaks',
  'Weekly desk note with the engine’s recalibrations',
];

interface UpgradeCardProps {
  variant?: 'sidebar' | 'banner';
  eyebrow?: string;
  title?: string;
  blurb?: string;
  benefits?: string[];
  ctaLabel?: string;
  href?: Href;
  className?: string;
}

export function UpgradeCard({
  variant = 'sidebar',
  eyebrow = 'Pro desk',
  title = 'Stop reading the board. Start trading it.',
  blurb = 'Free shows you what the engine thinks. Pro tells you exactly how much to risk, and pings you the moment a level breaks.',
  benefits = DEFAULT_BENEFITS,
  ctaLabel = 'Compare plans',
  href = '/#pricing',
  className,
}: UpgradeCardProps) {
  return (
    <section
      aria-labelledby="upgrade-card-heading"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.09] via-card to-card',
        variant === 'sidebar' ? 'p-5' : 'p-5 md:p-6',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/15 blur-3xl"
        aria-hidden="true"
      />

      <div
        className={cn(
          'relative',
          variant === 'banner' && 'flex flex-col gap-5 md:flex-row md:items-center md:justify-between'
        )}
      >
        <div className={cn('min-w-0', variant === 'banner' && 'md:max-w-xl')}>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 id="upgrade-card-heading" className="mt-3 text-h3 text-balance">
            {title}
          </h2>
          <p className="mt-1.5 text-body-sm text-muted-foreground">{blurb}</p>

          {variant === 'sidebar' && (
            <ul className="mt-4 space-y-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-body-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cn('mt-5 flex flex-col gap-2', variant === 'banner' && 'mt-0 shrink-0 md:w-56')}>
          <Button asChild className="h-10 bg-brand text-brand-foreground hover:opacity-90">
            <Link href={href}>
              {ctaLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Link
            href="/#how-it-works"
            className="text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            See how the engine works
          </Link>
        </div>
      </div>
    </section>
  );
}

interface ProLockProps {
  title: string;
  description: string;
  /** Short label for what the locked block contains, e.g. "Position size". */
  tag?: string;
  href?: Href;
  className?: string;
}

/**
 * A visibly locked panel rather than a fake preview: the value is stated in
 * words, and the only action offered is upgrading.
 */
export function ProLock({ title, description, tag = 'Pro', href = '/#pricing', className }: ProLockProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-dashed border-brand/35 bg-brand/[0.04] p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              {tag}
            </span>
          </div>
          <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">{description}</p>
          <Link
            href={href}
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand underline-offset-4 hover:underline"
          >
            Unlock with Pro
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface UsageStripProps {
  used: number;
  limit: number;
  className?: string;
}

/** Compact free-plan meter used above the board on mobile. */
export function UsageStrip({ used, limit, className }: UsageStripProps) {
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs', className)}>
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Zap className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
        <span className="num">
          {used}/{limit}
        </span>
        <span className="text-muted-foreground">free signals today</span>
      </span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </span>
      <Link href="/#pricing" className="font-semibold text-brand underline-offset-4 hover:underline">
        Remove the cap
      </Link>
    </div>
  );
}
