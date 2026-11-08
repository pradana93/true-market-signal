import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processCryptoSignals } from '@/engine/cron/crypto';
import { processStocksSignals } from '@/engine/cron/stocks';
import { processForexSignals } from '@/engine/cron/forex';

// POST /api/cron/[job] - Cron job handler
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  const { job } = await params;
  try {
    const supabase = createClient();
    
    // Verify auth token for cron jobs
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    // In production, validate the token against a secret
    
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
        return NextResponse.json(
          { error: 'Invalid job' }, 
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true, job: job });
  } catch (error) {
    console.error(`Error processing cron job ${job}:`, error);
    return NextResponse.json(
      { error: 'Failed to process cron job' }, 
      { status: 500 }
    );
  }
}