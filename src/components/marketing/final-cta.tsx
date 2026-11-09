import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-card py-20 md:py-28">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-[140px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          No repainting · No deleted calls
        </span>

        <h2 className="mt-6 text-display-1 text-balance">Trade the plan, not the noise</h2>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-muted-foreground">
          Start free, see exactly how the engine scores a setup, and upgrade the day the free tier stops being
          enough. Seven days of Pro, no card required.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="group h-12 w-full bg-brand px-8 text-brand-foreground hover:opacity-90 sm:w-auto">
              Open the dashboard
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="#pricing" className="w-full sm:w-auto">
            <Button variant="outline" className="h-12 w-full px-8 sm:w-auto">
              Compare plans
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/70">
          Cancel in two clicks. Signals are research, not investment advice.
        </p>
      </div>
    </section>
  );
}
