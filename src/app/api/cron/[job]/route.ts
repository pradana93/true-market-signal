import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { processCryptoSignals } from '@/engine/cron/crypto';
import { processStocksSignals } from '@/engine/cron/stocks';
import { processForexSignals } from '@/engine/cron/forex';

/**
 * POST|GET /api/cron/[job] — re-score the candles already stored for one market.
 * Ingestion itself lives in /api/cron/ingest; these jobs are kept for targeted
 * re-runs. Vercel Cron issues GET requests, so both verbs are accepted.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function secretsMatch(provided: string, expected: string | null | undefined): boolean {
  if (!expected) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : (request.headers.get('x-cron-token') ?? '').trim();

  if (!token) return false;
  // The service-role key is accepted so a scheduler already holding it does not
  // need a second secret; CRON_SECRET stays the preferred, rotatable option.
  return secretsMatch(token, process.env.CRON_SECRET) || secretsMatch(token, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function handle(request: NextRequest, params: Promise<{ job: string }>) {
  const { job } = await params;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Writes need the service role: RLS rejects inserts from the anon key.
    const supabase = createAdminClient();

    switch (job) {
      case 'crypto':
        await processCryptoSignals(supabase);
        break;
      case 'stocks':
        await processStocksSignals(supabase);
        break;
      case 'forex':
        await processForexSignals(supabase);
        break;
      default:
        return NextResponse.json({ error: 'Invalid job' }, { status: 400 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error(`Error processing cron job ${job}:`, error);
    return NextResponse.json({ error: 'Failed to process cron job' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  return handle(request, params);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  return handle(request, params);
}