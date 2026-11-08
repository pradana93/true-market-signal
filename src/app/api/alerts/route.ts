import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .limit(20);
      
    if (error || !alerts) {
      return NextResponse.json({ data: [] });
    }
    
    if (alerts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const instrumentIds = [...new Set(alerts.map(a => a.instrument_id))];
    const { data: instruments } = await supabase
      .from('instruments')
      .select('id, symbol, market')
      .in('id', instrumentIds);

    const instrumentsMap = new Map((instruments || []).map(i => [i.id, i]));

    const mergedData = alerts.map(alert => ({
      ...alert,
      instrument: instrumentsMap.get(alert.instrument_id)
    }));
    
    return NextResponse.json({ data: mergedData });
  } catch (error: any) {
    return NextResponse.json({ data: [] });
  }
}
