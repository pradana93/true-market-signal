'use client';

import { useEffect, useState } from 'react';
import { Check, Gift, Link2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tms.referral.v1';

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * Referral nudge. The code is generated per browser and kept in localStorage;
 * there is no referral ledger yet, so the copy promises only what the checkout
 * page can actually honour.
 */
export function InviteCard({ className }: { className?: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const next = saved || makeCode();
      if (!saved) window.localStorage.setItem(STORAGE_KEY, next);
      setCode(next);
    } catch {
      setCode(makeCode());
    }
  }, []);

  const link = code && typeof window !== 'undefined' ? `${window.location.origin}/?ref=${code}` : '';

  const share = async () => {
    if (!link) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'True Market Signal',
          text: 'Deterministic trade plans with entry, stops and targets already written.',
          url: link,
        });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A dismissed share sheet is not an error worth reporting.
    }
  };

  return (
    <section
      aria-labelledby="invite-heading"
      className={cn('rounded-xl border border-border/70 bg-card p-4', className)}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Gift className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="invite-heading" className="text-sm font-semibold">
            Give a month, get a month
          </h2>
          <p className="mt-0.5 text-body-sm leading-relaxed text-muted-foreground">
            Share your link with a trader. When they subscribe, you both get 30 days of Pro.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-border/70 bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
              {link || 'Generating link…'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={share}
              disabled={!link}
              className="h-8 shrink-0 px-2.5 text-xs"
            >
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5 text-brand" aria-hidden="true" />
              ) : (
                <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Share'}
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3" aria-hidden="true" />
            Credit is applied at checkout. One reward per referred account.
          </p>
        </div>
      </div>
    </section>
  );
}