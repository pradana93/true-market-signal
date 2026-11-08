'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Board' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/alerts', label: 'Alerts' },
] as const;

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-1", className)} aria-label="Main navigation">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'relative px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            pathname === item.href
              ? 'text-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          aria-current={pathname === item.href ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="ambient" />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="flex h-16 items-center px-4 md:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center space-x-2 shrink-0" aria-label="True Market Signal Home">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">TMS</span>
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:block">True Market Signal</span>
          </Link>

          <NavLinks className="hidden md:flex ml-8" />

          <div className="flex-1" />

          <div className="flex items-center space-x-3 shrink-0">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 md:py-8 px-4 md:px-6 lg:px-8 max-w-full">
        {children}
      </main>
    </div>
  );
}