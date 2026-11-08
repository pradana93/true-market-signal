'use client';

import { TrendingUp, TrendingDown, ShieldAlert, ArrowRight, ArrowLeft, Minus, Plus, Target, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TradePlan, TradeDirection } from '@/lib/trade-levels';

interface TradePlanLadderProps {
  plan: TradePlan | null;
  bias: TradeDirection;
  /** Variant: 'compact' (dashboard cards) or 'full' (detail page). */
  variant?: 'compact' | 'full';
  /** Optional title override for the full variant. */
  title?: string;
  /** Show derivation note in full variant. */
  showDerivation?: boolean;
  className?: string;
}

const ARROW_MAP = {
  long: { target: ArrowUpRight, sl: ArrowDownRight, targetColor: 'text-emerald-600 dark:text-emerald-400', slColor: 'text-rose-600 dark:text-rose-400' },
  short: { target: ArrowDownRight, sl: ArrowUpRight, targetColor: 'text-rose-600 dark:text-rose-400', slColor: 'text-emerald-600 dark:text-emerald-400' },
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
  title = 'Execution Plan',
  showDerivation = true,
  className,
}: TradePlanLadderProps) {
  if (!plan || (bias !== 'long' && bias !== 'short')) {
    return (
      <div className={cn('panel p-4 text-center mobile-card premium-shadow', className)}>
        <div className="w-12 h-12 mx-auto rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <p className="text-body-md font-medium">No Active Trade Plan</p>
        <p className="text-body-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          This signal is standing aside. No entry, stop or target levels are generated for neutral readings.
        </p>
      </div>
    );
  }

  const { targetColor, slColor, target: TargetIcon, sl: SlIcon } = ARROW_MAP[bias];
  const { entry, stop, targets, riskPct, maxR, derivation, precision } = plan;
  // Every level on this plan formats at the plan's own precision; a fixed two
  // decimals would flatten an FX ladder into three identical "1.11" labels.
  const fp = (v: number) => fmtPrice(v, precision);

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3 text-primary" />
            Plan: TP/SL
          </span>
          <span className="font-mono text-body-sm text-primary">{fmtR(maxR)} Max</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <div className="p-1.5 rounded bg-muted/60 border border-border/40 text-center">
            <span className="text-body-sm uppercase tracking-wider text-muted-foreground block font-medium">TP1</span>
            <span className="text-body-sm font-mono font-semibold num block mt-0.5 text-emerald-600 dark:text-emerald-400">
              ${fp(targets[0].price)}
            </span>
            <span className="text-body-sm font-mono text-muted-foreground">+{fmtR(targets[0].rMultiple!)}</span>
          </div>

          <div className="p-1.5 rounded bg-muted/60 border border-border/40 text-center">
            <span className="text-body-sm uppercase tracking-wider text-muted-foreground block font-medium">TP2</span>
            <span className="text-body-sm font-mono font-semibold num block mt-0.5 text-emerald-600 dark:text-emerald-400">
              ${fp(targets[1].price)}
            </span>
            <span className="text-body-sm font-mono text-muted-foreground">+{fmtR(targets[1].rMultiple!)}</span>
          </div>

          <div className="p-1.5 rounded bg-muted/60 border border-border/40 text-center">
            <span className="text-body-sm uppercase tracking-wider text-muted-foreground block font-medium">TP3</span>
            <span className="text-body-sm font-mono font-semibold num block mt-0.5 text-emerald-600 dark:text-emerald-400">
              ${fp(targets[2].price)}
            </span>
            <span className="text-body-sm font-mono text-muted-foreground">+{fmtR(targets[2].rMultiple!)}</span>
          </div>

          <div className="p-1.5 rounded bg-rose-500/5 border border-rose-500/20 text-center">
            <span className="text-body-sm uppercase tracking-wider text-rose-600 dark:text-rose-400 block font-medium">SL</span>
            <span className="text-body-sm font-mono font-semibold num block mt-0.5 text-rose-600 dark:text-rose-400">
              ${fp(stop.price)}
            </span>
            <span className="text-body-sm font-mono text-rose-600/80">-{riskPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Full variant — vertical ladder with visual track and distances
  return (
    <div className={cn('panel space-y-4 mobile-card premium-shadow', className)}>
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-semibold text-h3 flex items-center gap-1.5">
          <Target className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
          <span className="font-mono num">Risk: {fmtPct(riskPct)}</span>
          <span className="font-mono num">Max R: {fmtR(maxR)}</span>
        </div>
      </div>

      {/* Ladder */}
      <div className="relative pl-12">
        {/* Visual track */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-rose-500/30" />

        <div className="space-y-4">
          {/* TP3 */}
          <div className="flex items-center gap-4 group relative">
            <div className="absolute left-5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card z-10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">TP3</span>
                <Badge variant="outline" className="text-body-sm font-mono h-5 px-2">
                  +{fmtR(targets[2].rMultiple!)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <span className="font-mono num font-semibold text-foreground">${fp(targets[2].price)}</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TargetIcon className="h-3 w-3" />
                  <span>{fmtPct(targets[2].distancePct)} from entry</span>
                </span>
              </div>
            </div>
          </div>

          {/* TP2 */}
          <div className="flex items-center gap-4 group relative">
            <div className="absolute left-5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card z-10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">TP2</span>
                <Badge variant="outline" className="text-body-sm font-mono h-5 px-2">
                  +{fmtR(targets[1].rMultiple!)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <span className="font-mono num font-semibold text-foreground">${fp(targets[1].price)}</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TargetIcon className="h-3 w-3" />
                  <span>{fmtPct(targets[1].distancePct)} from entry</span>
                </span>
              </div>
            </div>
          </div>

          {/* TP1 */}
          <div className="flex items-center gap-4 group relative">
            <div className="absolute left-5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card z-10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">TP1</span>
                <Badge variant="outline" className="text-body-sm font-mono h-5 px-2">
                  +{fmtR(targets[0].rMultiple!)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <span className="font-mono num font-semibold text-foreground">${fp(targets[0].price)}</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TargetIcon className="h-3 w-3" />
                  <span>{fmtPct(targets[0].distancePct)} from entry</span>
                </span>
              </div>
            </div>
          </div>

          {/* ENTRY */}
          <div className="flex items-center gap-4 relative">
            <div className="absolute left-5 w-3 h-3 rounded-full bg-primary border-2 border-card z-10 ring-2 ring-primary/20" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body-sm font-bold uppercase tracking-wider text-primary">Entry</span>
                <Badge variant="secondary" className="text-body-sm font-mono h-5 px-2">
                  {fmtPct(0)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <span className="font-mono num font-bold text-foreground">${fp(entry.price)}</span>
                <span>Market entry at last close</span>
              </div>
            </div>
          </div>

          {/* STOP LOSS */}
          <div className="flex items-center gap-4 relative -ml-0.5">
            <div className="absolute left-5 w-3 h-3 rounded-full bg-rose-500 border-2 border-card z-10 ring-2 ring-rose-500/20" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">SL</span>
                <Badge variant="destructive" className="text-body-sm font-mono h-5 px-2">
                  -{fmtPct(riskPct)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <span className="font-mono num font-semibold text-rose-600 dark:text-rose-400">${fp(stop.price)}</span>
                <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                  <SlIcon className="h-3 w-3" />
                  <span>{fmtPct(-riskPct)} from entry</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Derivation Note */}
      {showDerivation && derivation && (
        <div className="pt-2 border-t border-border/40">
          <p className="text-body-md text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Derivation:</span> {derivation}
          </p>
        </div>
      )}
    </div>
  );
}