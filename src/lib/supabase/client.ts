'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * One browser client for the whole tab. Creating a client per component would
 * spawn a second GoTrue instance and duplicate auth listeners.
 *
 * The type is pinned to `SupabaseClient` on purpose: `ReturnType<typeof
 * createBrowserClient>` collapses to `any` because that function is generic
 * over the schema, and every `auth.*` callback then loses its parameter types.
 */
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}