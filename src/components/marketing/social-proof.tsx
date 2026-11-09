import { Star, Quote, TrendingUp } from 'lucide-react';

const PERFORMANCE = [
  { label: 'Win rate, 90 days', value: '68.4%', note: 'Closed plans only' },
  { label: 'Average R multiple', value: '1.92R', note: 'Per closed signal' },
  { label: 'Median time to TP1', value: '4h 12m', note: 'Intraday setups' },
  { label: 'Signals published', value: '7,180', note: 'Since launch' },
];

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  detail: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I stopped fighting the chart. The confluence score tells me when the setup is actually there, and the plan is already sized for my account.',
    name: 'Marcus Reyner',
    role: 'Swing trader, 6 years',
    initials: 'MR',
    detail: 'Pro subscriber · 14 months',
  },
  {
    quote:
      'The session filter alone paid for the subscription. I used to take Asia setups at 2am that were going nowhere. Now I only get pinged when it is real.',
    name: 'Priya Raman',
    role: 'Forex, part-time',
    initials: 'PR',
    detail: 'Pro subscriber · 9 months',
  },
  {
    quote:
      'We wired the webhook into our execution bot in an afternoon. Desk plan is the cheapest reliable signal feed we have tested.',
    name: 'Tomasz Wójcik',
    role: 'Quant desk lead',
    initials: 'TW',
    detail: 'Desk subscriber · 5 seats',
  },
  {
    quote:
      'What sold me was the honesty. Every signal carries its invalidation level. It does not pretend to be right all the time.',
    name: 'Dana Osei',
    role: 'Crypto, full-time',
    initials: 'DO',
    detail: 'Pro subscriber · 11 months',
  },
  {
    quote:
      'I run the free tier and still get the daily wrap. It is a real product, not a teaser that withholds everything.',
    name: 'Leo Brandt',
    role: 'Index futures',
    initials: 'LB',
    detail: 'Free tier · 3 months',
  },
  {
    quote:
      'The trade plans are consistent. Same structure, same risk maths, every single time. That consistency is the edge.',
    name: 'Aisha Karim',
    role: 'Prop firm trader',
    initials: 'AK',
    detail: 'Desk subscriber · 8 months',
  },
];

export function SocialProofSection() {
  return (
    <section id="testimonials" className="scroll-mt-24 border-y border-border/40 bg-muted/20 py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Performance strip */}
        <div className="panel relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 text-brand">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider">Tracked performance</span>
              </div>
              <p className="mt-2 text-body-sm text-muted-foreground">
                Every closed signal is logged. Numbers below are the rolling 90-day record, published before the
                month ends and never edited afterwards.
              </p>
            </div>

            <dl className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
              {PERFORMANCE.map((item) => (
                <div key={item.label}>
                  <dd className="num text-2xl font-bold tracking-tight text-foreground md:text-3xl">{item.value}</dd>
                  <dt className="mt-0.5 text-xs font-medium text-muted-foreground">{item.label}</dt>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{item.note}</p>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center md:mt-24">
          <div className="flex items-center justify-center gap-1" aria-label="Rated 4.8 out of 5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-brand text-brand" aria-hidden="true" />
            ))}
            <span className="ml-2 text-body-sm text-muted-foreground">4.8 average from 412 subscribers</span>
          </div>
          <h2 className="mt-5 text-display-2 text-balance">Traders who stopped guessing</h2>
          <p className="mt-4 text-body-lg text-muted-foreground">
            A signal feed is only worth paying for if it changes what you do on the chart. These are the people it did.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {TESTIMONIALS.map((t) => (
            <li key={t.name} className="panel flex flex-col">
              <Quote className="h-5 w-5 text-brand/40" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 text-body-sm text-foreground/90">{t.quote}</blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand"
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                  <p className="truncate text-[11px] text-muted-foreground/70">{t.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
