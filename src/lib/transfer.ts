import type { MatchResult, TransferResult, TransferItem } from '@/types';

const BATCH_SIZE = 100; // Apple Music allows ~100 tracks per add request
const BATCH_DELAY_MS = 300;

export type TransferProgress = {
  phase: 'creating-playlist' | 'adding-tracks' | 'done';
  completed: number;
  total: number;
  currentTrack?: string;
};

/**
 * Transfer matched tracks to Apple Music by creating a playlist and adding songs.
 * Runs client-side using MusicKit JS user token.
 */
export async function transferPlaylist(
  playlistName: string,
  sourcePlaylistId: string,
  matchResults: MatchResult[],
  musicUserToken: string,
  developerToken: string,
  onProgress?: (progress: TransferProgress) => void
): Promise<TransferResult> {
  const matched = matchResults.filter((r) => r.appleMusicId);
  const unmatched = matchResults.filter((r) => !r.appleMusicId);

  const items: TransferItem[] = matchResults.map((r) => ({
    matchResult: r,
    status: r.appleMusicId ? 'pending' : 'unmatched',
  }));

  if (matched.length === 0) {
    return buildResult(playlistName, sourcePlaylistId, undefined, items);
  }

  // Phase 1: Create playlist
  onProgress?.({ phase: 'creating-playlist', completed: 0, total: matched.length });

  const playlistId = await createAppleMusicPlaylist(
    playlistName,
    `Transferred from Spotify via Musicify`,
    musicUserToken,
    developerToken
  );

  // Phase 2: Add tracks in batches
  const trackIds = matched.map((r) => r.appleMusicId!);

  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE);

    try {
      await addTracksToPlaylist(playlistId, batch, musicUserToken, developerToken);

      // Mark these as transferred
      for (let j = i; j < i + batch.length; j++) {
        const matchIdx = matchResults.indexOf(matched[j]);
        if (matchIdx >= 0) {
          items[matchIdx].status = 'transferred';
        }
      }
    } catch (err) {
      console.error(`[transfer] Batch failed at ${i}:`, err);
      // Mark batch as failed
      for (let j = i; j < i + batch.length; j++) {
        const matchIdx = matchResults.indexOf(matched[j]);
        if (matchIdx >= 0) {
          items[matchIdx].status = 'failed';
          items[matchIdx].error = err instanceof Error ? err.message : 'Unknown error';
        }
      }
    }

    const completed = Math.min(i + batch.length, trackIds.length);
    const currentTrack = matched[Math.min(completed - 1, matched.length - 1)]?.spotifyTrack.name;
    onProgress?.({ phase: 'adding-tracks', completed, total: trackIds.length, currentTrack });

    if (i + BATCH_SIZE < trackIds.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  onProgress?.({ phase: 'done', completed: trackIds.length, total: trackIds.length });

  return buildResult(playlistName, sourcePlaylistId, playlistId, items);
}

/**
 * Add songs directly to Apple Music library (for liked songs transfer).
 */
export async function addToLibrary(
  matchResults: MatchResult[],
  musicUserToken: string,
  developerToken: string,
  onProgress?: (progress: TransferProgress) => void
): Promise<TransferResult> {
  const matched = matchResults.filter((r) => r.appleMusicId);

  const items: TransferItem[] = matchResults.map((r) => ({
    matchResult: r,
    status: r.appleMusicId ? 'pending' : 'unmatched',
  }));

  if (matched.length === 0) {
    return buildResult('Liked Songs', '__liked__', undefined, items);
  }

  const trackIds = matched.map((r) => r.appleMusicId!);

  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE);

    try {
      await addSongsToLibrary(batch, musicUserToken, developerToken);

      for (let j = i; j < i + batch.length; j++) {
        const matchIdx = matchResults.indexOf(matched[j]);
        if (matchIdx >= 0) {
          items[matchIdx].status = 'transferred';
        }
      }
    } catch (err) {
      console.error(`[transfer] Library add failed at ${i}:`, err);
      for (let j = i; j < i + batch.length; j++) {
        const matchIdx = matchResults.indexOf(matched[j]);
        if (matchIdx >= 0) {
          items[matchIdx].status = 'failed';
          items[matchIdx].error = err instanceof Error ? err.message : 'Unknown error';
        }
      }
    }

    const completed = Math.min(i + batch.length, trackIds.length);
    onProgress?.({ phase: 'adding-tracks', completed, total: trackIds.length });

    if (i + BATCH_SIZE < trackIds.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  onProgress?.({ phase: 'done', completed: trackIds.length, total: trackIds.length });

  return buildResult('Liked Songs', '__liked__', undefined, items);
}

// --- Apple Music API calls (client-side, using user token) ---

const AM_API = 'https://api.music.apple.com';

async function amFetch(
  path: string,
  musicUserToken: string,
  developerToken: string,
  options?: { method?: string; body?: unknown }
): Promise<unknown> {
  const res = await fetch(`${AM_API}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${developerToken}`,
      'Music-User-Token': musicUserToken,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apple Music API ${res.status}: ${body.slice(0, 300)}`);
  }

  // Some endpoints return 201/204 with no body
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function createAppleMusicPlaylist(
  name: string,
  description: string,
  musicUserToken: string,
  developerToken: string
): Promise<string> {
  const result = (await amFetch('/v1/me/library/playlists', musicUserToken, developerToken, {
    method: 'POST',
    body: {
      attributes: { name, description },
    },
  })) as { data?: { id: string }[] };

  const id = result.data?.[0]?.id;
  if (!id) {
    throw new Error('Failed to create playlist — no ID returned');
  }

  console.log(`[transfer] Created Apple Music playlist: ${name} (${id})`);
  return id;
}

async function addTracksToPlaylist(
  playlistId: string,
  trackIds: string[],
  musicUserToken: string,
  developerToken: string
): Promise<void> {
  await amFetch(`/v1/me/library/playlists/${playlistId}/tracks`, musicUserToken, developerToken, {
    method: 'POST',
    body: {
      data: trackIds.map((id) => ({ id, type: 'songs' })),
    },
  });

  console.log(`[transfer] Added ${trackIds.length} tracks to playlist ${playlistId}`);
}

async function addSongsToLibrary(
  trackIds: string[],
  musicUserToken: string,
  developerToken: string
): Promise<void> {
  const ids = trackIds.join(',');
  await amFetch(`/v1/me/library?ids[songs]=${encodeURIComponent(ids)}`, musicUserToken, developerToken, {
    method: 'POST',
  });

  console.log(`[transfer] Added ${trackIds.length} songs to library`);
}

// --- Helpers ---

function buildResult(
  playlistName: string,
  sourcePlaylistId: string,
  appleMusicPlaylistId: string | undefined,
  items: TransferItem[]
): TransferResult {
  const stats = { total: items.length, transferred: 0, skipped: 0, unmatched: 0, failed: 0 };
  for (const item of items) {
    if (item.status === 'transferred') stats.transferred++;
    else if (item.status === 'skipped-duplicate') stats.skipped++;
    else if (item.status === 'unmatched') stats.unmatched++;
    else if (item.status === 'failed') stats.failed++;
  }

  return { playlistName, sourcePlaylistId, appleMusicPlaylistId, items, stats };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
