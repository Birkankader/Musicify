import { NextRequest, NextResponse } from 'next/server';
import { exchangeSpotifyCode, encodeTokenCookie } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    console.error('Spotify auth denied:', error);
    return NextResponse.redirect(new URL('/?error=spotify_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const tokens = await exchangeSpotifyCode(code);
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    const cookieValue = encodeTokenCookie({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('spotify_tokens', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error('Spotify token exchange failed:', err);
    return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
  }
}
