import { NextRequest, NextResponse } from 'next/server';
import { searchByIsrc, searchByTerm } from '@/lib/apple-music';

export const dynamic = 'force-dynamic';

/**
 * POST /api/apple-music/search
 *
 * Body: { mode: 'isrc', isrcs: string[] }
 *    or { mode: 'term', term: string, limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.mode === 'isrc') {
      const isrcs: string[] = body.isrcs;
      if (!Array.isArray(isrcs) || isrcs.length === 0) {
        return NextResponse.json({ error: 'isrcs array required' }, { status: 400 });
      }

      // Batch in groups of 25
      const results = [];
      for (let i = 0; i < isrcs.length; i += 25) {
        const batch = isrcs.slice(i, i + 25);
        const songs = await searchByIsrc(batch);
        results.push(...songs);
      }

      return NextResponse.json({ data: results });
    }

    if (body.mode === 'term') {
      const term: string = body.term;
      if (!term?.trim()) {
        return NextResponse.json({ error: 'term required' }, { status: 400 });
      }

      const songs = await searchByTerm(term, body.limit ?? 5);
      return NextResponse.json({ data: songs });
    }

    return NextResponse.json({ error: 'mode must be "isrc" or "term"' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[apple-music/search]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
