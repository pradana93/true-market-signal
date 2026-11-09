'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, LayoutDashboard, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Board', icon: LayoutDashboard },
  { href: '/watchlist', label: 'Watchlist', icon: ListFilter },
  { href: '/alerts', label: 'Alerts', icon: Bell },
] as const;

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-brand/10 text-brand'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTab({
  href,
  label,
  Icon,
}: {
  href: (typeof NAV_ITEMS)[number]['href'];
  label: string;
  Icon: typeof LayoutDashboard;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
          active ? 'text-brand' : 'text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}
