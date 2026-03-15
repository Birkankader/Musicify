import { NextRequest, NextResponse } from 'next/server';
import { exchangeSpotifyCode, encodeTokenCookie } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    console.error('Spotify auth denied:', error);
    return NextResponse.redirect('http://127.0.0.1:3000/?error=spotify_denied');
  }

  if (!code) {
    return NextResponse.redirect('http://127.0.0.1:3000/?error=no_code');
  }

  try {
    const tokens = await exchangeSpotifyCode(code);

    const expiresAt = Date.now() + tokens.expires_in * 1000;

    const cookieValue = encodeTokenCookie({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    // Always redirect to 127.0.0.1 to match cookie domain
    const redirectUrl = 'http://127.0.0.1:3000/';
    const response = NextResponse.redirect(redirectUrl);
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
    return NextResponse.redirect('http://127.0.0.1:3000/?error=token_exchange_failed');
  }
}
