import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/signals/[symbol] - Get signals for specific instrument
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  try {
    const supabase = createClient();
    
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '1h';
    
    // First get the instrument ID
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('instruments')
      .select('id')
      .eq('symbol', symbol)
      .single();
    
    if (instrumentError || !instrumentData) {
      return NextResponse.json(
        { error: 'Instrument not found' }, 
        { status: 404 }
      );
    }
    
    // Then get signals for this instrument
    const { data, error } = await supabase
      .from('signals')
      .select(`
        *,
        instruments(symbol, market, exchange)
      `)
      .eq('instrument_id', instrumentData.id)
      .eq('tf', timeframe)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching signals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch signals' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /api/signals/[symbol]:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}