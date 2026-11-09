import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const PROOF = [
  'Entry, invalidation and three targets on every signal',
  'Twelve methods fused into one confidence score',
  'Alerts that fire the moment a level breaks',
];

/**
 * Two-pane shell for every auth screen. The left pane carries the pitch so a
 * visitor arriving from an email link still sees what they are signing into;
 * it drops away below `lg` where the form needs the whole screen.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(224_40%_8%)] p-10 text-white lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
          aria-hidden="true"
        />

        <Link href="/" className="relative flex items-center gap-2.5" aria-label="True Market Signal home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand/60 text-[11px] font-bold text-brand-foreground shadow-sm">
            TMS
          </span>
          <span className="text-sm font-semibold tracking-tight">True Market Signal</span>
        </Link>

        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            The desk, not the noise
          </p>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight xl:text-3xl">
            Every call already has an entry, a stop and three targets.
          </h2>
          <ul className="mt-6 space-y-3">
            {PROOF.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">
          18 instruments · 12 methods · re-scored continuously
        </p>
      </aside>

      <main className="relative flex min-h-dvh flex-col bg-background">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 lg:invisible" aria-label="True Market Signal home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand/70 text-[11px] font-bold text-brand-foreground shadow-sm">
              TMS
            </span>
            <span className="text-sm font-semibold tracking-tight">True Market Signal</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to site
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-14 pt-2 md:px-6">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
