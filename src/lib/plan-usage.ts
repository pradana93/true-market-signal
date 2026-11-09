'use client';

import { useEffect, useState } from 'react';

/**
 * Free-tier metering, kept in localStorage because the app has no sign-in
 * yet. Everything here is deliberately best-effort: a blocked storage API
 * must never break the board, so every read falls back to an empty day.
 */
export const FREE_DAILY_SIGNAL_LIMIT = 5;

const STORAGE_KEY = 'tms.plan.usage.v1';

export interface UsageSnapshot {
  /** ISO date (YYYY-MM-DD) the symbols were recorded on. */
  date: string;
  /** Distinct instrument symbols opened that day, in visit order. */
  symbols: string[];
}

const EMPTY: UsageSnapshot = { date: '', symbols: [] };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function readUsage(): UsageSnapshot {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), symbols: [] };
    const parsed = JSON.parse(raw) as UsageSnapshot;
    if (parsed?.date !== today() || !Array.isArray(parsed.symbols)) {
      return { date: today(), symbols: [] };
    }
    return parsed;
  } catch {
    return { date: today(), symbols: [] };
  }
}

function writeUsage(snapshot: UsageSnapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private-mode storage failures are not worth surfacing to a trader.
  }
}

/** Records a signal-detail visit and returns the updated snapshot. */
export function recordSignalView(symbol: string): UsageSnapshot {
  const current = readUsage();
  const symbols = current.symbols.includes(symbol) ? current.symbols : [...current.symbols, symbol];
  const next = { date: today(), symbols };
  writeUsage(next);
  return next;
}

/**
 * Reads usage after mount so the server-rendered markup never disagrees with
 * the first client render (which would trigger a hydration mismatch).
 */
export function usePlanUsage() {
  const [snapshot, setSnapshot] = useState<UsageSnapshot>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSnapshot(readUsage());
    setReady(true);

    const refresh = () => setSnapshot(readUsage());
    window.addEventListener('storage', refresh);
    window.addEventListener('tms:usage', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('tms:usage', refresh);
    };
  }, []);

  const used = snapshot.symbols.length;
  const remaining = Math.max(FREE_DAILY_SIGNAL_LIMIT - used, 0);

  return { ready, used, remaining, limit: FREE_DAILY_SIGNAL_LIMIT, symbols: snapshot.symbols };
}

/** Lets components on the same tab notify each other after a recorded view. */
export function notifyUsageChanged() {
  window.dispatchEvent(new Event('tms:usage'));
}