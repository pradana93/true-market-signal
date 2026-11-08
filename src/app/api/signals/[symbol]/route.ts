import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { planFromSignal } from '@/lib/trade-levels';

// GET /api/signals/[symbol] - Get signals for specific instrument
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  try {
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    // Optional: without it we return the latest signal across all timeframes,
    // which is what the detail page wants (equities are scored on 1d, crypto on 1h).
    const timeframe = searchParams.get('timeframe');

    const { data: instrumentData, error: instrumentError } = await supabase
      .from('instruments')
      .select('id, symbol, market, exchange')
      .eq('symbol', symbol)
      .single();

    if (instrumentError || !instrumentData) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }

    let query = supabase
      .from('signals')
      .select('*')
      .eq('instrument_id', instrumentData.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (timeframe) {
      query = query.eq('tf', timeframe);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching signals:', error);
      return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
    }

    const instrument = {
      id: instrumentData.id,
      symbol: instrumentData.symbol,
      market: instrumentData.market,
      exchange: instrumentData.exchange,
    };

    const merged = (data || []).map((s) => ({
      ...s,
      instrument,
      plan: planFromSignal(s),
    }));

    return NextResponse.json({ data: merged });
  } catch (error) {
    console.error('Unexpected error in GET /api/signals/[symbol]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
