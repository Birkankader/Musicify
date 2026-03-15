// Spotify Types
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; width: number; height: number }[];
  product: string;
}

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  external_ids?: {
    isrc?: string;
  };
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
    href: string;
  };
  owner: {
    id: string;
    display_name: string;
  };
}

export interface SpotifyPlaylistTrackItem {
  added_at: string;
  track: SpotifyTrack | null; // null for deleted/unavailable tracks
  is_local: boolean;
}

export interface SpotifyPaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

// Apple Music Types
export interface AppleMusicTrack {
  id: string;
  type: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    artwork: {
      url: string;
      width: number;
      height: number;
    };
    durationInMillis: number;
    isrc?: string;
  };
}

// Matching Types
export type MatchType = 'isrc' | 'metadata' | 'unmatched';

export interface MatchResult {
  spotifyTrack: SpotifyTrack;
  appleMusicId: string | null;
  appleMusicTrack: AppleMusicTrack | null;
  matchType: MatchType;
  confidence: number; // 0-1
}

// Transfer Types
export type TransferStatus = 'pending' | 'transferring' | 'transferred' | 'skipped-duplicate' | 'unmatched' | 'failed';

export interface TransferItem {
  matchResult: MatchResult;
  status: TransferStatus;
  error?: string;
}

export interface TransferResult {
  playlistName: string;
  sourcePlaylistId: string;
  appleMusicPlaylistId?: string;
  items: TransferItem[];
  stats: {
    total: number;
    transferred: number;
    skipped: number;
    unmatched: number;
    failed: number;
  };
}

// Auth Types
export interface AuthState {
  spotify: {
    isConnected: boolean;
    user: SpotifyUser | null;
    accessToken: string | null;
  };
  appleMusic: {
    isConnected: boolean;
    isInitialized: boolean;
  };
}
