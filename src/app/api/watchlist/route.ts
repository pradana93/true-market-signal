import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // For demo purposes, we fetch all instruments, assuming a default watchlist view
    // In a real app, this would filter by user_id
    const { data, error } = await supabase
      .from('instruments')
      .select('id, symbol, market')
      .eq('enabled', true)
      .limit(10);
      
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
