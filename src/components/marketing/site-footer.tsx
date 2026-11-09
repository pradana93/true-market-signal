import Link from 'next/link';
import { Send, Globe, MessageSquare } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Live signals', href: '/signals/BTCUSD' },
      { label: 'Watchlist', href: '/watchlist' },
      { label: 'Alerts', href: '/alerts' },
    ],
  },
  {
    title: 'Plans',
    links: [
      { label: 'Free', href: '#pricing' },
      { label: 'Pro', href: '#pricing' },
      { label: 'Desk', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Performance log', href: '#testimonials' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Contact', href: 'mailto:support@truemarketsignal.com' },
      { label: 'Status', href: '/dashboard' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2" aria-label="True Market Signal home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand/70 text-[11px] font-bold text-brand-foreground">
                TMS
              </span>
              <span className="text-sm font-semibold tracking-tight">True Market Signal</span>
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-muted-foreground">
              A deterministic multi-method signal engine for traders who want a plan, not a prediction.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Send, label: 'Telegram', href: 'https://t.me' },
                { icon: MessageSquare, label: 'Community', href: 'https://x.com' },
                { icon: Globe, label: 'Repository', href: 'https://github.com/pradana93/true-market-signal' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as any}
                      className="text-body-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} True Market Signal. All rights reserved.</p>
          <p className="max-w-xl leading-relaxed">
            Signals are research output, not investment advice. Trading involves substantial risk of loss.
          </p>
        </div>
      </div>
    </footer>
  );
}
