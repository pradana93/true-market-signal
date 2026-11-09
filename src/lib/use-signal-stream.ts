'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Pushes a refresh whenever the engine writes new signals.
 *
 * A single ingest pass inserts one row per instrument, so callbacks are
 * coalesced: without the debounce one scoring run would fire ~18 overlapping
 * refetches per open tab. Reconnect is handled by the Supabase client, and the
 * manual Refresh button stays as the escape hatch if the socket is dead.
 */
export function useSignalStream(onChange: () => void) {
  const latest = useRef(onChange);

  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      // Unique name per mount: reusing one would collide with another tab.
      .channel(`signals-live-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals' },
        () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            timer = null;
            latest.current();
          }, 600);
        }
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, []);
}