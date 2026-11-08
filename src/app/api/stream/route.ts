import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/stream - SSE endpoint for realtime signal updates
export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');
  
  // Create a ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = createClient();
        
        // Subscribe to Supabase Realtime
        const channel = supabase
          .channel('signals')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'signals',
              filter: 'created_at=gt.now()',
            },
            (payload) => {
              // Send the new signal as an SSE event
              const data = JSON.stringify(payload.new);
              const chunk = `data: ${data}\n\n`;
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          )
          .subscribe();
        
        // Handle connection close
        request.signal.addEventListener('abort', () => {
          channel.unsubscribe();
          controller.close();
        });
        
      } catch (error) {
        console.error('Error setting up SSE:', error);
        controller.error(error);
      }
    },
  });
  
  return new NextResponse(stream, { headers });
}