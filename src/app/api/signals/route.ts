import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { planFromSignal } from '@/lib/trade-levels';

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
    
    // Fetch recent history rather than a flat 50 rows. A flat limit returns old
    // runs of the same instrument alongside the current one, so the board shows
    // each symbol two or three times with a stale row next to the live one.
    // We pull enough history to guarantee a current row per instrument, then
    // collapse to one row per (instrument, timeframe) below.
    let query = supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    
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

    // Collapse to the newest signal per (instrument, timeframe). Signals is an
    // append-only history table; without this the board renders every historical
    // score as if it were current, duplicating each instrument.
    const latestByKey = new Map<string, any>();
    for (const signal of signals) {
      const key = `${signal.instrument_id}:${signal.tf}`;
      const existing = latestByKey.get(key);
      if (!existing || new Date(signal.created_at) > new Date(existing.created_at)) {
        latestByKey.set(key, signal);
      }
    }

    // An instrument scored on both 1h and 1d would otherwise appear twice; keep
    // the single most recent reading per instrument for the board.
    const latestByInstrument = new Map<number, any>();
    for (const signal of latestByKey.values()) {
      const existing = latestByInstrument.get(signal.instrument_id);
      if (!existing || new Date(signal.created_at) > new Date(existing.created_at)) {
        latestByInstrument.set(signal.instrument_id, signal);
      }
    }

    const mergedData = [...latestByInstrument.values()]
      .map(signal => ({
        ...signal,
        instrument: instrumentsMap.get(signal.instrument_id),
        // Stop loss and TP1/TP2/TP3, derived from this signal's own ATR,
        // invalidation and regime. Null when the signal stands aside.
        plan: planFromSignal(signal),
      }))
      // Drop rows whose instrument was deleted, so the UI never renders UNKNOWN.
      .filter(s => s.instrument)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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