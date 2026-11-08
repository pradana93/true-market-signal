import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/signals - Get latest signals
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    const timeframe = searchParams.get('timeframe');
    const direction = searchParams.get('direction');
    const confidence = searchParams.get('confidence');
    
    let query = supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (market) {
      // This filter needs to be applied after fetching instruments
    }
    
    if (timeframe) {
      query = query.eq('tf', timeframe);
    }
    
    if (direction) {
      query = query.eq('direction', direction);
    }
    
    if (confidence) {
      const conf = parseFloat(confidence);
      if (!isNaN(conf)) {
        query = query.gte('confidence', conf);
      }
    }
    
    const { data: signals, error } = await query;
    
    if (error) {
      console.error('Error fetching signals:', error);
      return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
    }
    
    if (!signals || signals.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const instrumentIds = [...new Set(signals.map(s => s.instrument_id))];
    const { data: instruments, error: instrumentError } = await supabase
      .from('instruments')
      .select('id, symbol, market')
      .in('id', instrumentIds);

    if (instrumentError) {
      console.error('Error fetching instruments:', instrumentError);
      return NextResponse.json({ error: 'Failed to fetch instruments' }, { status: 500 });
    }

    const instrumentsMap = new Map(instruments.map(i => [i.id, i]));

    const mergedData = signals.map(signal => ({
      ...signal,
      instrument: instrumentsMap.get(signal.instrument_id)
    }));

    // Now apply market filter if present
    const filteredData = market ? mergedData.filter(item => item.instrument?.market === market) : mergedData;

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error('Unexpected error in GET /api/signals:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/signals - Create new signal (for ingestion)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.instrument_id || !body.direction || !body.confidence || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: instrument_id, direction, confidence, reason' }, 
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('signals')
      .insert([
        {
          instrument_id: body.instrument_id,
          tf: body.tf || '1h',
          direction: body.direction,
          confidence: body.confidence,
          reason: body.reason,
          evidence: body.evidence || {},
          invalidation: body.invalidation,
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating signal:', error);
      return NextResponse.json(
        { error: 'Failed to create signal' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error('Unexpected error in POST /api/signals:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}