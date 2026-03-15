import { NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUrl = getSpotifyAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Spotify auth redirect failed:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify auth' },
      { status: 500 }
    );
  }
}
