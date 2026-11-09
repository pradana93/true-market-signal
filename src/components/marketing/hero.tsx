import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BarChart3, Shield, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRUST = [
  { icon: Shield, label: 'No repainting', tone: 'text-brand' },
  { icon: Zap, label: 'Sub-30s latency', tone: 'text-amber-500' },
  { icon: BarChart3, label: '18 instruments', tone: 'text-sky-500' },
  { icon: Target, label: 'TP/SL per trade', tone: 'text-violet-500' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-[180px]" />
        <div className="absolute -bottom-24 right-0 h-[460px] w-[460px] rounded-full bg-sky-500/[0.05] blur-[180px]" />
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_28%,transparent_72%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-6 md:py-28 lg:px-8 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="animate-fade-up motion-reduce:animate-none">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1.5 text-xs font-medium text-brand">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Live across 18 instruments — refreshed every 30 seconds
            </p>

            <h1 className="mt-6 text-display-1 text-balance md:text-6xl lg:text-7xl">
              Know the setup
              <br className="hidden sm:block" />{' '}
              <span className="bg-gradient-to-r from-brand via-brand to-sky-500 bg-clip-text text-transparent">
                before the crowd
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-body-lg text-muted-foreground md:text-xl">
              A deterministic confluence engine scores stocks, crypto, forex, commodities, indices and ETFs, then
              hands you the entry, three targets, the stop and the position size. No repainting, ever.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="#pricing" className="sm:w-auto">
                <Button
                  size="lg"
                  className="group h-12 w-full bg-brand px-7 text-brand-foreground hover:opacity-90 sm:w-auto"
                >
                  Start free
                  <ArrowRight
                    className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Button>
              </Link>
              <Link href="#how-it-works" className="sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-border/70 px-7 hover:border-brand/50 hover:bg-brand/5 sm:w-auto"
                >
                  See how it works
                </Button>
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-body-sm text-muted-foreground">
              {TRUST.map(({ icon: Icon, label, tone }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '120ms' }}>
            <SignalPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

const LEVELS = [
  { label: 'Entry', value: '$231.80', tone: 'text-foreground' },
  { label: 'TP1', value: '$236.50', tone: 'text-brand' },
  { label: 'TP2', value: '$241.20', tone: 'text-brand' },
  { label: 'SL', value: '$227.40', tone: 'text-rose-500 dark:text-rose-400' },
];

const METHODS = ['RSI divergence', 'MACD cross', 'VWAP reclaim', 'OBV surge'];

function SignalPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="absolute -inset-px rounded-2xl bg-gradient-to-b from-brand/40 via-border/40 to-transparent opacity-60"
        aria-hidden="true"
      />
      <figure className="relative rounded-2xl border border-border/60 bg-card/80 p-5 shadow-2xl backdrop-blur-xl md:p-6">
        <figcaption className="sr-only">Example live signal for AAPL on the 1 hour timeframe</figcaption>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
              <BarChart3 className="h-5 w-5 text-brand" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold leading-tight">AAPL · NASDAQ</p>
              <p className="text-xs text-muted-foreground">1H · Confluence engine</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            LIVE
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 rounded-xl bg-muted/40 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Last price</p>
            <p className="num mt-0.5 text-3xl font-bold tracking-tight md:text-4xl">$232.10</p>
            <p className="num mt-1 text-xs font-medium text-brand">+1.42% today</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Bias</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1.5 text-lg font-bold text-brand">
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              LONG
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confluence confidence</span>
            <span className="num font-bold text-brand">87%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={87}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Confluence confidence"
          >
            <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-brand/70 to-brand" />
          </div>
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Execution plan</p>
          <dl className="mt-3 grid grid-cols-4 gap-2">
            {LEVELS.map((level) => (
              <div key={level.label} className="rounded-lg bg-muted/40 px-2 py-2 text-center">
                <dt className="text-[11px] text-muted-foreground">{level.label}</dt>
                <dd className={`num mt-0.5 text-xs font-semibold ${level.tone} md:text-sm`}>{level.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-4">
          {METHODS.map((method) => (
            <li
              key={method}
              className="rounded border border-brand/20 bg-brand/10 px-2 py-1 text-[11px] font-medium text-brand"
            >
              {method}
            </li>
          ))}
        </ul>

        <p className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Risk 1% · Reward 1.9R</span>
          <span>Invalidation $227.40</span>
        </p>
      </figure>
    </div>
  );
}
