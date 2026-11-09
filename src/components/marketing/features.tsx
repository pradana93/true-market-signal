import { Brain, Layers, Target, Globe, Zap, ShieldAlert, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = { Brain, Layers, Target, Globe, Zap, ShieldAlert };

interface Feature {
  icon: keyof typeof ICONS;
  title: string;
  desc: string;
  highlight: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'Brain',
    title: 'Multi-Method Confluence',
    desc: 'RSI, MACD, VWAP, OBV, Bollinger, ATR and six more methods fuse into one deterministic score. No subjective read.',
    highlight: '12 methods',
  },
  {
    icon: 'Layers',
    title: 'Session-Aware Coverage',
    desc: 'Asia, London and New York session filters surface only the instruments that are actually moving right now.',
    highlight: '3 sessions',
  },
  {
    icon: 'Target',
    title: 'Execution-Ready Plans',
    desc: 'Every signal ships with TP1/TP2/TP3, stop loss, position size and risk/reward. Paste it straight into your broker.',
    highlight: 'TP/SL per trade',
  },
  {
    icon: 'Globe',
    title: '18 Instruments, 6 Markets',
    desc: 'Stocks, crypto, forex, commodities, indices and ETFs. One engine, one dashboard, every liquid market.',
    highlight: '6 asset classes',
  },
  {
    icon: 'Zap',
    title: 'Sub-30s Latency',
    desc: 'Edge-cached feed refreshing every 30 seconds. You see a signal the moment confluence fires, never later.',
    highlight: 'Real-time',
  },
  {
    icon: 'ShieldAlert',
    title: 'Built-In Risk Controls',
    desc: 'Volatility-adjusted sizing, daily drawdown caps and correlation filters keep one bad trade from becoming a bad month.',
    highlight: 'Risk-managed',
  },
];

const STATS = [
  { label: 'Instruments scored', value: '18' },
  { label: 'Methods fused', value: '12' },
  { label: 'Session windows', value: '3' },
  { label: 'Signals / month', value: '2,400+' },
];

interface Step {
  step: string;
  title: string;
  desc: string;
  icon: keyof typeof ICONS;
}

const HOW_IT_WORKS: Step[] = [
  {
    step: '01',
    title: 'Confluence Detection',
    desc: 'Twelve independent methods run across every timeframe. A signal only fires when at least four agree.',
    icon: 'Layers',
  },
  {
    step: '02',
    title: 'Risk-Calibrated Plan',
    desc: 'ATR-based stop, Fibonacci targets and fractional sizing are computed before the alert reaches you.',
    icon: 'Target',
  },
  {
    step: '03',
    title: 'Act or Automate',
    desc: 'Copy the plan manually, or push it to your bot through the webhook and API access included on Pro.',
    icon: 'Zap',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-y border-border/40 bg-muted/20 py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Proof numbers */}
        <dl className="mb-16 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="panel relative overflow-hidden text-center">
              <div
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"
                aria-hidden="true"
              />
              <dd className="num text-3xl font-bold tracking-tight text-foreground md:text-4xl">{stat.value}</dd>
              <dt className="mt-1 text-body-sm text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <div className="space-y-16 md:space-y-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-display-2 text-balance">Why traders choose True Market Signal</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Not another indicator pack. A deterministic engine that fuses twelve methods into one actionable
              score, with the trade plan already written.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>

          <div id="how-it-works" className="scroll-mt-24 border-t border-border/40 pt-16 md:pt-24">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="text-display-2 text-balance">From signal to execution in three steps</h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                No chart staring. No guessing. A clear plan the moment an opportunity appears.
              </p>
            </div>

            <ol className="grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, idx) => (
                <HowItWorksCard key={step.step} step={step} index={idx} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = ICONS[feature.icon] ?? Brain;

  return (
    <article className="panel group relative overflow-hidden transition-colors hover:border-brand/40">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-h3 transition-colors group-hover:text-brand">{feature.title}</h3>
      <p className="mt-2 text-body-sm text-muted-foreground">{feature.desc}</p>
      <span className="mt-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
        {feature.highlight}
      </span>
    </article>
  );
}

function HowItWorksCard({ step, index }: { step: Step; index: number }) {
  const Icon = ICONS[step.icon] ?? Layers;

  return (
    <li className="panel relative">
      <div className="mb-4 flex items-center gap-3">
        <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
          {step.step}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
        <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
      </div>
      <h3 className="text-h3">{step.title}</h3>
      <p className="mt-2 text-body-sm text-muted-foreground">{step.desc}</p>
      <span className="sr-only">Step {index + 1} of {HOW_IT_WORKS.length}</span>
    </li>
  );
}
