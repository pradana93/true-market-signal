'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/user-nav';
import { Menu, X, Globe, Building2, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Reviews' },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 md:h-18 items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center space-x-2 shrink-0 group"
            aria-label="True Market Signal Home"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
              <span className="text-white font-bold text-sm tracking-tight">TMS</span>
              <span
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-30 blur animate-pulse-ring"
                aria-hidden="true"
              />
            </div>
            <span className="font-semibold text-xl md:text-2xl tracking-tight text-foreground">True Market Signal</span>
          </Link>

          {/* Desktop Nav + CTAs */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <div className="flex items-center space-x-1">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 rounded-lg px-3 py-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3 ml-4 border-l border-border pl-4">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 px-3">
                  Sign In
                </Button>
              </Link>
              <Link href="#pricing">
                <Button className="h-9 px-5 bg-brand text-brand-foreground hover:opacity-90 shadow-md hover:shadow-lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-background border-t border-border',
            mobileOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
          )}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col space-y-2 px-2">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg px-3 py-3"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-4 border-t border-border mt-2">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full justify-start h-11">
                  Sign In
                </Button>
              </Link>
              <Link href="#pricing" onClick={() => setMobileOpen(false)}>
                <Button className="w-full justify-start h-11 bg-brand text-brand-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}