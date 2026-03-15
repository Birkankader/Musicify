import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SpotifyClient, decodeTokenCookie, refreshSpotifyToken, encodeTokenCookie } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

async function getValidClient(): Promise<{ client: SpotifyClient; response?: NextResponse }> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('spotify_tokens')?.value;

  if (!tokenCookie) throw new Error('Not authenticated with Spotify');

  const tokens = decodeTokenCookie(tokenCookie);
  if (!tokens) throw new Error('Invalid token cookie');

  let accessToken = tokens.access_token;
  let refreshedResponse: NextResponse | undefined;

  // Refresh if expired (60s buffer)
  if (Date.now() > tokens.expires_at - 60_000) {
    const refreshed = await refreshSpotifyToken(tokens.refresh_token);
    accessToken = refreshed.access_token;
    const newExpiresAt = Date.now() + refreshed.expires_in * 1000;

    refreshedResponse = NextResponse.json({});
    refreshedResponse.cookies.set('spotify_tokens', encodeTokenCookie({
      access_token: accessToken,
      refresh_token: tokens.refresh_token,
      expires_at: newExpiresAt,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return { client: new SpotifyClient(accessToken), response: refreshedResponse };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { client } = await getValidClient();

    // Special case: liked songs
    if (id === '__liked__') {
      const tracks = await client.getAllLikedSongs();
      return NextResponse.json({ tracks });
    }

    const tracks = await client.getAllPlaylistTracks(id);
    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const { id } = await params;
    console.error(`[spotify/playlists/${id}/tracks]`, message);

    if (message.includes('Not authenticated') || message.includes('Invalid token')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
