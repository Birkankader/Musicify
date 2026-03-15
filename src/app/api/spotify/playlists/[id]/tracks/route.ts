import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SpotifyClient, decodeTokenCookie } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('spotify_tokens')?.value;

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Not authenticated with Spotify' }, { status: 401 });
    }

    const tokens = decodeTokenCookie(tokenCookie);
    if (!tokens) {
      return NextResponse.json({ error: 'Invalid token cookie' }, { status: 401 });
    }

    const client = new SpotifyClient(tokens.access_token);

    // Special case: liked songs
    if (id === '__liked__') {
      const tracks = await client.getAllLikedSongs();
      return NextResponse.json({ tracks });
    }

    const tracks = await client.getAllPlaylistTracks(id);
    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[spotify/playlists/${(await params).id}/tracks]`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
