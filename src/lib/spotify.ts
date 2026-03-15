import type {
  SpotifyUser,
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyPlaylistTrackItem,
  SpotifyPaginatedResponse,
} from '@/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const SCOPES = [
  'user-read-private',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

export function getSpotifyAuthUrl(): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/spotify/callback';

  if (!clientId) {
    throw new Error('SPOTIFY_CLIENT_ID is not set');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    show_dialog: 'true',
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeSpotifyCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/spotify/callback';

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token exchange failed: ${response.status} — ${error}`);
  }

  return response.json();
}

export async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.status}`);
  }

  return response.json();
}

export class SpotifyClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${SPOTIFY_API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Spotify API error: ${response.status} ${endpoint} — ${error}`);
    }

    return response.json();
  }

  async getProfile(): Promise<SpotifyUser> {
    return this.fetch<SpotifyUser>('/me');
  }

  async getPlaylists(limit = 50, offset = 0): Promise<SpotifyPaginatedResponse<SpotifyPlaylist>> {
    return this.fetch<SpotifyPaginatedResponse<SpotifyPlaylist>>('/me/playlists', {
      limit: String(limit),
      offset: String(offset),
    });
  }

  async getAllPlaylists(): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const page = await this.getPlaylists(limit, offset);
      playlists.push(...page.items);
      if (!page.next) break;
      offset += limit;
    }

    return playlists;
  }

  async getPlaylistTracks(playlistId: string, limit = 50, offset = 0): Promise<SpotifyPaginatedResponse<SpotifyPlaylistTrackItem>> {
    return this.fetch<SpotifyPaginatedResponse<SpotifyPlaylistTrackItem>>(
      `/playlists/${playlistId}/tracks`,
      {
        limit: String(limit),
        offset: String(offset),
      }
    );
  }

  async getAllPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const page = await this.getPlaylistTracks(playlistId, limit, offset);
      for (const item of page.items) {
        // Skip local files and null tracks (deleted/unavailable)
        if (!item.is_local && item.track) {
          tracks.push(item.track);
        }
      }
      if (!page.next) break;
      offset += limit;
    }

    return tracks;
  }

  async getLikedSongs(limit = 50, offset = 0): Promise<SpotifyPaginatedResponse<{ added_at: string; track: SpotifyTrack }>> {
    return this.fetch<SpotifyPaginatedResponse<{ added_at: string; track: SpotifyTrack }>>('/me/tracks', {
      limit: String(limit),
      offset: String(offset),
    });
  }

  async getAllLikedSongs(): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const page = await this.getLikedSongs(limit, offset);
      tracks.push(...page.items.map((item) => item.track));
      if (!page.next) break;
      offset += limit;
    }

    return tracks;
  }
}

// Cookie helpers for token storage
export function encodeTokenCookie(data: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeTokenCookie(cookie: string): {
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null {
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString());
  } catch {
    return null;
  }
}
