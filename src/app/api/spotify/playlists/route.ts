import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SpotifyClient, decodeTokenCookie, refreshSpotifyToken, encodeTokenCookie } from '@/lib/spotify';
import type { SpotifyPlaylist } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('spotify_tokens')?.value;

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Not authenticated with Spotify' }, { status: 401 });
    }

    const tokens = decodeTokenCookie(tokenCookie);
    if (!tokens) {
      return NextResponse.json({ error: 'Invalid token cookie' }, { status: 401 });
    }

    let accessToken = tokens.access_token;

    // Refresh if expired (60s buffer)
    if (Date.now() > tokens.expires_at - 60_000) {
      try {
        const refreshed = await refreshSpotifyToken(tokens.refresh_token);
        accessToken = refreshed.access_token;
      } catch (err) {
        console.error('[spotify/playlists] Token refresh failed:', err);
        return NextResponse.json({ error: 'Session expired — please reconnect Spotify' }, { status: 401 });
      }
    }

    const client = new SpotifyClient(accessToken);
    const playlists = await client.getAllPlaylists();
    const profile = await client.getProfile();

    // Normalize: Spotify returns track count under 'items' or 'tracks'
    const normalizedPlaylists = playlists.map((p) => {
      const raw = p as unknown as Record<string, unknown>;
      if (!p.tracks && raw.items && typeof raw.items === 'object') {
        p.tracks = raw.items as SpotifyPlaylist['tracks'];
      }
      return p;
    });

    // Also fetch liked songs count
    const likedPage = await client.getLikedSongs(1, 0);

    return NextResponse.json({
      playlists: normalizedPlaylists,
      likedSongsTotal: likedPage.total,
      userId: profile.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[spotify/playlists]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
