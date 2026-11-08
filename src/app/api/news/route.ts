import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketNews } from '@/lib/news';

// The wire is shared by every reader and changes slowly; cache it per deployment
// region instead of hitting the upstream feed on each render.
export const revalidate = 300;

// GET /api/news — curated, score-ranked market news.
//   ?limit=12   how many stories to return
//   ?category=  restrict to one curated category
//   ?symbol=    stories that touch a specific instrument
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? 12);
  const category = searchParams.get('category') ?? undefined;
  const symbol = searchParams.get('symbol') ?? undefined;

  try {
    const { articles, sources, feeds } = await fetchMarketNews({
      limit: Number.isFinite(limit) ? limit : 12,
      category,
      symbol,
    });

    return NextResponse.json({
      data: articles,
      meta: {
        count: articles.length,
        sources,
        feeds,
        generatedAt: new Date().toISOString(),
        // Surfaced in the UI so a reader knows the ranking is a rule, not a mystery.
        ranking: 'impact score = market-term weight + market breadth - age decay',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        error: error instanceof Error ? error.message : 'Failed to load market news',
        meta: { count: 0, sources: 0, feeds: [] },
      },
      { status: 502 }
    );
  }
}