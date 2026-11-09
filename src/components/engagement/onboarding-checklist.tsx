'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanUsage } from '@/lib/plan-usage';

const STORAGE_KEY = 'tms.onboarding.v1';

interface State {
  dismissed: boolean;
  done: string[];
}

const STEPS = [
  {
    id: 'plan',
    title: 'Open a trade plan',
    detail: 'Pick any card on the board — entry, stops and targets are already written.',
    href: '/dashboard',
    cta: 'Go to board',
  },
  {
    id: 'alerts',
    title: 'Check what is firing now',
    detail: 'High-conviction reads and positions sitting at their invalidation level.',
    href: '/alerts',
    cta: 'Open alerts',
  },
  {
    id: 'pro',
    title: 'Decide on Pro',
    detail: 'Remove the daily cap and turn on push, email and webhook alerts.',
    href: '/#pricing',
    cta: 'Compare plans',
  },
] as const;

function load(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: false, done: [] };
    const parsed = JSON.parse(raw) as State;
    return { dismissed: Boolean(parsed.dismissed), done: Array.isArray(parsed.done) ? parsed.done : [] };
  } catch {
    return { dismissed: false, done: [] };
  }
}

function save(state: State) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures — the checklist is a nudge, not a dependency.
  }
}

/** Activation checklist; the plan step ticks itself once a plan has been opened. */
export function OnboardingChecklist({ className }: { className?: string }) {
  const { ready, used } = usePlanUsage();
  const [state, setState] = useState<State>({ dismissed: false, done: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(load());
    setMounted(true);
  }, []);

  const update = (next: State) => {
    setState(next);
    save(next);
  };

  const done = new Set(state.done);
  if (ready && used > 0) done.add('plan');
  const completed = STEPS.filter((step) => done.has(step.id)).length;

  if (!mounted || state.dismissed || completed === STEPS.length) return null;

  return (
    <section aria-labelledby="onboarding-heading" className={cn('panel relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="onboarding-heading" className="text-sm font-semibold">
            Your first three minutes
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completed} of {STEPS.length} done — the rest takes about a minute.
          </p>
        </div>
        <button
          type="button"
          onClick={() => update({ ...state, dismissed: true })}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss getting-started checklist"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${(completed / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2.5">
        {STEPS.map((step) => {
          const complete = done.has(step.id);
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                onClick={() => update({ ...state, done: [...new Set([...state.done, step.id])] })}
                className="group flex items-start gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    complete ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-muted-foreground'
                  )}
                  aria-hidden="true"
                >
                  {complete ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-xs font-semibold',
                      complete ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{step.detail}</span>
                </span>
                <ArrowRight
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}