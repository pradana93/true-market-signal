import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runFullIngest } from '@/engine/cron/ingest';

/**
 * GET|POST /api/cron/ingest
 *
 * The scheduled entry point for the engine: pull fresh candles for every
 * enabled instrument and score it. Vercel Cron and the Supabase pg_cron job
 * both call this with a shared token.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Don't start a second pass while the previous one is still writing. */
const MIN_GAP_MS = 4 * 60 * 1000;

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function secretsMatch(provided: string, expected: string | null | undefined): boolean {
  if (!expected) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') ?? '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim() || null;
  return request.headers.get('x-cron-token')?.trim() || null;
}

async function storedCronToken(): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('app_secrets').select('value').eq('name', 'cron_token').maybeSingle();
    return data?.value ?? null;
  } catch {
    // A missing table must not break scheduled runs; env token still applies.
    return null;
  }
}

async function minutesSinceLastSignal(): Promise<number | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('signals')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) return null;
  return (Date.now() - new Date(data.created_at).getTime()) / 60000;
}

async function handle(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbToken = await storedCronToken();
  const authorized = secretsMatch(token, process.env.CRON_SECRET) || secretsMatch(token, dbToken);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === '1';
  if (!force) {
    const age = await minutesSinceLastSignal();
    if (age !== null && age * 60000 < MIN_GAP_MS) {
      return NextResponse.json({ skipped: true, reason: 'recent run', minutesSinceLastSignal: Number(age.toFixed(2)) });
    }
  }

  const startedAt = Date.now();
  const results = await runFullIngest();
  const succeeded = results.filter((r) => r.ok).length;

  return NextResponse.json({
    ok: succeeded > 0,
    ran_at: new Date(startedAt).toISOString(),
    duration_ms: Date.now() - startedAt,
    scored: succeeded,
    total: results.length,
    results,
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}