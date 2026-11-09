'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileTab, NAV_ITEMS, NavLinks } from '@/components/nav-links';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background">
      <div className="ambient" aria-hidden="true" />

      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 md:h-16 md:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2"
            aria-label="True Market Signal home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand/70 text-[11px] font-bold text-brand-foreground shadow-sm">
              TMS
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">True Market Signal</span>
          </Link>

          <span className="hidden h-5 w-px bg-border md:block" aria-hidden="true" />

          <NavLinks className="hidden md:flex" />

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Link href="/#pricing" className="hidden sm:block">
              <Button size="sm" className="h-9 bg-brand px-4 text-brand-foreground hover:opacity-90">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Upgrade to Pro
              </Button>
            </Link>
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <main
        id="app-main"
        className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-10 lg:px-8"
      >
        {children}
      </main>

      {/* Mobile tab bar — the primary navigation on phones. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg items-stretch">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <MobileTab key={href} href={href} label={label} Icon={Icon} />
          ))}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
      </nav>
    </div>
  );
}
