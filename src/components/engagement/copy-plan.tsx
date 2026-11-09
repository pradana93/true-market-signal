'use client';

import { useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TradePlan } from '@/lib/trade-levels';

interface CopyPlanButtonProps {
  plan: TradePlan | null;
  symbol: string;
  direction: 'long' | 'short' | 'neutral';
  className?: string;
}

function buildPlanText(plan: TradePlan, symbol: string, direction: 'long' | 'short') {
  const fp = (value: number) => value.toFixed(plan.precision);
  const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const targets = plan.targets
    .map(
      (target, index) =>
        `TP${index + 1}: ${fp(target.price)} (${pct(target.distancePct)}, +${(target.rMultiple ?? 0).toFixed(1)}R)`
    )
    .join('\n');

  return [
    `${symbol} — ${direction.toUpperCase()} plan (True Market Signal)`,
    `Entry: ${fp(plan.entry.price)}`,
    `Stop:  ${fp(plan.stop.price)} (${pct(-Math.abs(plan.riskPct))})`,
    targets,
    `Max: ${plan.maxR.toFixed(1)}R at full target`,
    plan.derivation ? `Basis: ${plan.derivation}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Older Safari and non-secure origins have no async clipboard.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
}

/** Copies the ladder as plain text so a trader can paste it into a broker ticket. */
export function CopyPlanButton({ plan, symbol, direction, className }: CopyPlanButtonProps) {
  const [copied, setCopied] = useState(false);

  const disabled = !plan || (direction !== 'long' && direction !== 'short');

  const onCopy = async () => {
    if (!plan || disabled) return;
    try {
      await copyText(buildPlanText(plan, symbol, direction));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={onCopy} disabled={disabled} className="h-9">
        {copied ? (
          <Check className="mr-2 h-4 w-4 text-brand" aria-hidden="true" />
        ) : (
          <ClipboardCopy className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {copied ? 'Copied' : 'Copy plan'}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Trade plan copied to clipboard' : ''}
      </span>
    </div>
  );
}