'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Billing = 'monthly' | 'annual';

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  cta: string;
  href: string;
  featured?: boolean;
  badge?: string;
  features: Array<{ label: string; included: boolean }>;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    tagline: 'See the engine before you pay for it.',
    monthly: 0,
    annual: 0,
    cta: 'Start free',
    href: '/dashboard',
    features: [
      { label: '3 delayed signals per day', included: true },
      { label: 'Direction + confidence score', included: true },
      { label: 'Daily market wrap', included: true },
      { label: 'Entry, TP and SL levels', included: false },
      { label: 'Real-time alerts', included: false },
      { label: 'API / webhook access', included: false },
    ],
  },
  {
    name: 'Pro',
    tagline: 'The full plan, the moment it fires.',
    monthly: 49,
    annual: 39,
    cta: 'Start 7-day trial',
    href: '/dashboard',
    featured: true,
    badge: 'Most popular',
    features: [
      { label: 'Unlimited real-time signals', included: true },
      { label: 'Direction + confidence score', included: true },
      { label: 'Full trade plan: entry, TP1–3, SL', included: true },
      { label: 'Session-aware instrument filters', included: true },
      { label: 'Push, email and Telegram alerts', included: true },
      { label: 'Risk sizing calculator', included: true },
      { label: 'API / webhook access', included: false },
    ],
  },
  {
    name: 'Desk',
    tagline: 'For teams and semi-automated execution.',
    monthly: 149,
    annual: 119,
    cta: 'Talk to us',
    href: 'mailto:sales@truemarketsignal.com?subject=Desk%20plan',
    badge: 'Teams',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'API + webhook access (2,000 calls/day)', included: true },
      { label: 'Unlimited sub-accounts', included: true },
      { label: 'Custom instrument coverage', included: true },
      { label: 'Priority support channel', included: true },
      { label: 'Quarterly performance review', included: true },
    ],
  },
];

const GUARANTEES = ['Cancel anytime, no lock-in', '7-day Pro trial, no card at signup', 'Signals never repaint'];

export function PricingSection() {
  const [billing, setBilling] = React.useState<Billing>('monthly');

  return (
    <section id="pricing" className="scroll-mt-24 py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Two months free on annual
          </span>
          <h2 className="mt-5 text-display-2 text-balance">Pricing that scales with your account, not your trades</h2>
          <p className="mt-4 text-body-lg text-muted-foreground">
            One subscription, every instrument we cover. No per-signal fees, no upsell for the stop loss.
          </p>

          {/* Billing toggle */}
          <div
            className="mt-8 inline-flex items-center rounded-full border border-border bg-muted/40 p-1"
            role="group"
            aria-label="Billing period"
          >
            {(['monthly', 'annual'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setBilling(period)}
                aria-pressed={billing === period}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors',
                  billing === period
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {period}
                {period === 'annual' && <span className="ml-1.5 text-xs font-semibold text-brand">−20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 md:gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-body-sm text-muted-foreground">
          {GUARANTEES.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-brand" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80">
          Signals are research output, not investment advice. Past performance does not guarantee future results.
          Trade only with capital you can afford to lose.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const price = billing === 'annual' ? plan.annual : plan.monthly;
  const suffix = price === 0 ? '' : billing === 'annual' ? '/mo billed yearly' : '/month';

  return (
    <div
      className={cn(
        'panel relative flex flex-col',
        plan.featured && 'border-brand/50 ring-1 ring-brand/30 lg:-mt-4 lg:mb-0'
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            'absolute -top-3 left-6 rounded-full px-2.5 py-1 text-xs font-semibold',
            plan.featured
              ? 'bg-brand text-brand-foreground'
              : 'border border-border bg-background text-muted-foreground'
          )}
        >
          {plan.badge}
        </span>
      )}

      <div className="pt-2">
        <h3 className="text-h3">{plan.name}</h3>
        <p className="mt-1 text-body-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="num text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {price === 0 ? '$0' : `$${price}`}
        </span>
        {suffix && <span className="text-body-sm text-muted-foreground">{suffix}</span>}
      </div>
      {billing === 'annual' && price > 0 && (
        <p className="mt-1 text-xs text-brand">
          Save ${(plan.monthly - plan.annual) * 12} a year
        </p>
      )}

      {plan.href.startsWith('http') || plan.href.startsWith('mailto') ? (
        <a href={plan.href} className="mt-6 block">
          <Button
            className={cn(
              'h-11 w-full text-sm font-semibold',
              plan.featured
                ? 'bg-brand text-brand-foreground hover:opacity-90'
                : 'border border-border bg-background text-foreground hover:bg-muted'
            )}
            variant={plan.featured ? 'default' : 'outline'}
          >
            {plan.cta}
          </Button>
        </a>
      ) : (
        <Link href={plan.href as any} className="mt-6 block">
          <Button
            className={cn(
              'h-11 w-full text-sm font-semibold',
              plan.featured
                ? 'bg-brand text-brand-foreground hover:opacity-90'
                : 'border border-border bg-background text-foreground hover:bg-muted'
            )}
            variant={plan.featured ? 'default' : 'outline'}
          >
            {plan.cta}
          </Button>
        </Link>
      )}

      <ul className="mt-6 space-y-3 border-t border-border/60 pt-6">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5 text-body-sm">
            {feature.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            ) : (
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden="true" />
            )}
            <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/60'}>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
