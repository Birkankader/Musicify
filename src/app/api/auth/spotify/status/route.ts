import { NextRequest, NextResponse } from 'next/server';
import { SpotifyClient, decodeTokenCookie, refreshSpotifyToken, encodeTokenCookie } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('spotify_tokens')?.value;

  if (!cookie) {
    return NextResponse.json({ connected: false }, { status: 200 });
  }

  const tokens = decodeTokenCookie(cookie);
  if (!tokens) {
    return NextResponse.json({ connected: false }, { status: 200 });
  }

  let accessToken = tokens.access_token;

  // Refresh if expired (with 60s buffer)
  if (Date.now() > tokens.expires_at - 60_000) {
    try {
      const refreshed = await refreshSpotifyToken(tokens.refresh_token);
      accessToken = refreshed.access_token;
      const newExpiresAt = Date.now() + refreshed.expires_in * 1000;

      const response = NextResponse.json({ connected: true, user: null });
      response.cookies.set('spotify_tokens', encodeTokenCookie({
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

      const client = new SpotifyClient(accessToken);
      const user = await client.getProfile();
      return NextResponse.json({ connected: true, user, accessToken });
    } catch (err) {
      console.error('Token refresh failed:', err);
      const response = NextResponse.json({ connected: false }, { status: 200 });
      response.cookies.delete('spotify_tokens');
      return response;
    }
  }

  try {
    const client = new SpotifyClient(accessToken);
    const user = await client.getProfile();
    return NextResponse.json({ connected: true, user, accessToken });
  } catch (err) {
    console.error('Profile fetch failed:', err);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete('spotify_tokens');
  return response;
}
