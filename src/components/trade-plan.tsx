'use client';

import { ArrowDownRight, ArrowUpRight, ShieldAlert, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TradePlan, TradeDirection } from '@/lib/trade-levels';

interface TradePlanLadderProps {
  plan: TradePlan | null;
  bias: TradeDirection;
  /** Variant: 'compact' (dashboard cards) or 'full' (detail page). */
  variant?: 'compact' | 'full';
  /** Optional title text for the full variant. */
  title?: string;
  /** Show derivation note in full variant. */
  showDerivation?: boolean;
  className?: string;
}

/**
 * Targets are always profit and the stop is always loss, whichever way the
 * trade points — colouring a short's targets red makes a winner look like a
 * loser. Only the arrow direction follows the bias.
 */
const ARROWS = {
  long: { target: ArrowUpRight, sl: ArrowDownRight },
  short: { target: ArrowDownRight, sl: ArrowUpRight },
} as const;

function fmtPrice(price: number, precision: number) {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

function fmtPct(pct: number) {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

function fmtR(r: number) {
  return `${r.toFixed(1)}R`;
}

export function TradePlanLadder({
  plan,
  bias,
  variant = 'full',
  title = 'Execution plan',
  showDerivation = true,
  className,
}: TradePlanLadderProps) {
  if (!plan || (bias !== 'long' && bias !== 'short')) {
    return (
      <div className={cn('px-1 py-6 text-center', className)}>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium">No active trade plan</p>
        <p className="mx-auto mt-1 max-w-xs text-body-sm text-muted-foreground">
          This signal is standing aside. No entry, stop or target levels are generated for a neutral reading.
        </p>
      </div>
    );
  }

  const { target: TargetArrow, sl: SlArrow } = ARROWS[bias];
  const { entry, stop, targets, riskPct, maxR, derivation, precision } = plan;
  // Every level formats at the plan's own precision; two fixed decimals would
  // flatten an FX ladder into three identical "1.11" labels.
  const fp = (v: number) => fmtPrice(v, precision);

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3 text-brand" aria-hidden="true" />
            Plan: TP / SL
          </span>
          <span className="num font-mono text-brand">{fmtR(maxR)} max</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {targets.map((target, index) => (
            <div
              key={target.price}
              className="rounded-lg border border-border/50 bg-muted/40 p-2 text-center"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                TP{index + 1}
              </span>
              <span className="num mt-0.5 block font-mono text-xs font-semibold text-brand">
                ${fp(target.price)}
              </span>
              <span className="num block font-mono text-[10px] text-muted-foreground">
                +{fmtR(target.rMultiple ?? 0)}
              </span>
            </div>
          ))}

          <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-2 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              SL
            </span>
            <span className="num mt-0.5 block font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
              ${fp(stop.price)}
            </span>
            <span className="num block font-mono text-[10px] text-rose-600/80 dark:text-rose-400/80">
              -{Math.abs(riskPct).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full variant — vertical ladder with a connecting track.
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <p className="flex items-center gap-1.5 text-body-sm font-semibold">
          <Target className="h-4 w-4 text-brand" aria-hidden="true" />
          {title}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="num font-mono">Risk {Math.abs(riskPct).toFixed(2)}%</span>
          <span className="num font-mono">Max {fmtR(maxR)}</span>
        </div>
      </div>

      <div className="relative pl-10">
        <span
          className="absolute bottom-2 left-4 top-2 w-px bg-gradient-to-b from-brand/40 via-border to-rose-500/40"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {[...targets].reverse().map((target, index) => {
            const label = `TP${targets.length - index}`;
            return (
              <div key={label} className="relative flex items-center gap-4">
                <span
                  className="absolute -left-10 flex h-3 w-3 items-center justify-center rounded-full border-2 border-card bg-brand"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand">{label}</span>
                    <Badge variant="outline" className="num h-5 px-2 font-mono text-[10px]">
                      +{fmtR(target.rMultiple ?? 0)}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-body-sm">
                    <span className="num font-mono font-semibold">${fp(target.price)}</span>
                    <span className="flex items-center gap-0.5 text-body-sm text-brand">
                      <TargetArrow className="h-3 w-3" aria-hidden="true" />
                      {fmtPct(target.distancePct)} from entry
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="relative flex items-center gap-4">
            <span
              className="absolute -left-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card bg-foreground ring-2 ring-foreground/15"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Entry</span>
                <Badge variant="secondary" className="num h-5 px-2 font-mono text-[10px]">
                  {fmtPct(0)}
                </Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-body-sm">
                <span className="num font-mono font-bold">${fp(entry.price)}</span>
                <span className="text-muted-foreground">Market entry at last close</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-4">
            <span
              className="absolute -left-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card bg-rose-500 ring-2 ring-rose-500/20"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Stop loss
                </span>
                <Badge variant="destructive" className="num h-5 px-2 font-mono text-[10px]">
                  -{fmtPct(riskPct)}
                </Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-body-sm">
                <span className="num font-mono font-semibold text-rose-600 dark:text-rose-400">
                  ${fp(stop.price)}
                </span>
                <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                  <SlArrow className="h-3 w-3" aria-hidden="true" />
                  {fmtPct(-riskPct)} from entry
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDerivation && derivation && (
        <p className="border-t border-border/60 pt-3 text-body-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Derivation: </span>
          {derivation}
        </p>
      )}
    </div>
  );
}