import type { SpotifyTrack, AppleMusicTrack, MatchResult } from '@/types';

// --- Config ---

const BATCH_SIZE = 25; // Apple Music ISRC API max
const BATCH_DELAY_MS = 200; // Rate limiting between batches
const DURATION_TOLERANCE_MS = 3000; // ±3 seconds for metadata match

// --- Public API ---

export type MatchProgress = {
  phase: 'isrc' | 'metadata';
  completed: number;
  total: number;
};

/**
 * Match Spotify tracks to Apple Music catalog.
 *
 * Strategy:
 *  1. Batch ISRC lookup for all tracks with ISRCs (fast, high confidence)
 *  2. Term search fallback for tracks without ISRCs or no ISRC hit (slower, lower confidence)
 *
 * The onProgress callback fires after each phase/batch so the UI can show progress.
 */
export async function matchTracks(
  tracks: SpotifyTrack[],
  onProgress?: (progress: MatchProgress) => void
): Promise<MatchResult[]> {
  if (tracks.length === 0) return [];

  const results: MatchResult[] = new Array(tracks.length);

  // ------ Phase 1: ISRC batch lookup ------

  // Build ISRC → track index map (skip tracks without ISRCs or with local-only ISRCs)
  const isrcToIndices = new Map<string, number[]>();
  const noIsrcIndices: number[] = [];

  for (let i = 0; i < tracks.length; i++) {
    const isrc = tracks[i].external_ids?.isrc;
    if (isrc) {
      const existing = isrcToIndices.get(isrc);
      if (existing) {
        existing.push(i);
      } else {
        isrcToIndices.set(isrc, [i]);
      }
    } else {
      noIsrcIndices.push(i);
    }
  }

  const allIsrcs = Array.from(isrcToIndices.keys());
  const isrcHitSet = new Set<string>(); // Track which ISRCs got hits

  // Batch ISRC requests
  for (let i = 0; i < allIsrcs.length; i += BATCH_SIZE) {
    const batch = allIsrcs.slice(i, i + BATCH_SIZE);

    try {
      const songs = await apiSearchIsrc(batch);

      // Map results back to tracks
      for (const song of songs) {
        const songIsrc = song.attributes?.isrc;
        if (!songIsrc) continue;

        const indices = isrcToIndices.get(songIsrc);
        if (!indices) continue;

        isrcHitSet.add(songIsrc);

        for (const idx of indices) {
          // Only set if not already matched (first match wins for duplicates)
          if (!results[idx]) {
            results[idx] = {
              spotifyTrack: tracks[idx],
              appleMusicId: song.id,
              appleMusicTrack: song,
              matchType: 'isrc',
              confidence: 1.0,
            };
            console.log(`[match] ISRC hit: "${tracks[idx].name}" → ${song.id}`);
          }
        }
      }
    } catch (err) {
      console.warn(`[match] ISRC batch failed (${batch.length} ISRCs):`, err);
      // Continue — these tracks will fall through to metadata search
    }

    onProgress?.({ phase: 'isrc', completed: Math.min(i + BATCH_SIZE, allIsrcs.length), total: allIsrcs.length });

    if (i + BATCH_SIZE < allIsrcs.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // ------ Phase 2: Metadata fallback for unmatched ------

  // Collect indices that need metadata search
  const metadataIndices: number[] = [...noIsrcIndices];
  for (const [isrc, indices] of isrcToIndices.entries()) {
    if (!isrcHitSet.has(isrc)) {
      metadataIndices.push(...indices);
    }
  }
  // Also pick up any that had ISRC but didn't get matched for some reason
  for (let i = 0; i < tracks.length; i++) {
    if (!results[i] && !metadataIndices.includes(i)) {
      metadataIndices.push(i);
    }
  }

  for (let j = 0; j < metadataIndices.length; j++) {
    const idx = metadataIndices[j];
    const track = tracks[idx];

    try {
      const match = await metadataSearch(track);
      results[idx] = match;
    } catch (err) {
      console.warn(`[match] Metadata search failed for "${track.name}":`, err);
      results[idx] = unmatchedResult(track);
    }

    onProgress?.({ phase: 'metadata', completed: j + 1, total: metadataIndices.length });

    if (j + 1 < metadataIndices.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Fill any remaining gaps (shouldn't happen, but defensive)
  for (let i = 0; i < tracks.length; i++) {
    if (!results[i]) {
      results[i] = unmatchedResult(tracks[i]);
    }
  }

  return results;
}

/**
 * Quick stats from match results.
 */
export function matchStats(results: MatchResult[]) {
  const stats = { total: results.length, isrc: 0, metadata: 0, unmatched: 0 };
  for (const r of results) {
    if (r.matchType === 'isrc') stats.isrc++;
    else if (r.matchType === 'metadata') stats.metadata++;
    else stats.unmatched++;
  }
  return stats;
}

// --- Internals ---

async function apiSearchIsrc(isrcs: string[]): Promise<AppleMusicTrack[]> {
  const res = await fetch('/api/apple-music/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'isrc', isrcs }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ISRC search failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.data ?? [];
}

async function apiSearchTerm(term: string): Promise<AppleMusicTrack[]> {
  const res = await fetch('/api/apple-music/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'term', term, limit: 5 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Term search failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.data ?? [];
}

async function metadataSearch(track: SpotifyTrack): Promise<MatchResult> {
  const artist = track.artists[0]?.name ?? '';
  const title = track.name;
  const searchTerm = `${artist} ${title}`.trim();

  if (!searchTerm) return unmatchedResult(track);

  const candidates = await apiSearchTerm(searchTerm);

  if (candidates.length === 0) {
    console.log(`[match] No results: "${searchTerm}"`);
    return unmatchedResult(track);
  }

  // Score each candidate
  let bestMatch: AppleMusicTrack | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreCandidate(track, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    console.log(`[match] Metadata hit: "${title}" → ${bestMatch.id} (score: ${bestScore.toFixed(2)})`);
    return {
      spotifyTrack: track,
      appleMusicId: bestMatch.id,
      appleMusicTrack: bestMatch,
      matchType: 'metadata',
      confidence: bestScore,
    };
  }

  console.log(`[match] Unmatched: "${title}" (best score: ${bestScore.toFixed(2)})`);
  return unmatchedResult(track);
}

function scoreCandidate(spotifyTrack: SpotifyTrack, amTrack: AppleMusicTrack): number {
  let score = 0;

  // Artist similarity (weight: 0.4)
  const spotifyArtist = spotifyTrack.artists[0]?.name.toLowerCase() ?? '';
  const amArtist = amTrack.attributes.artistName.toLowerCase();
  score += stringSimilarity(spotifyArtist, amArtist) * 0.4;

  // Title similarity (weight: 0.4)
  const spotifyTitle = normalizeTitle(spotifyTrack.name);
  const amTitle = normalizeTitle(amTrack.attributes.name);
  score += stringSimilarity(spotifyTitle, amTitle) * 0.4;

  // Duration match (weight: 0.2)
  const durationDiff = Math.abs(spotifyTrack.duration_ms - amTrack.attributes.durationInMillis);
  if (durationDiff <= DURATION_TOLERANCE_MS) {
    score += 0.2;
  } else if (durationDiff <= DURATION_TOLERANCE_MS * 2) {
    score += 0.1;
  }

  return Math.round(score * 100) / 100; // Avoid float weirdness
}

/**
 * Simple similarity based on overlapping words + length ratio.
 * Not a full Levenshtein — fast and good enough for artist/title matching.
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : overlap / union;
}

/**
 * Normalize title: lowercase, strip common suffixes like "(Remastered)", "- Live", etc.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[\-–—]\s*(remaster(ed)?|deluxe|live|acoustic|remix|radio edit|single version|bonus track).*$/i, '')
    .replace(/\s*\((remaster(ed)?|deluxe|live|acoustic|remix|radio edit|single version|bonus track|feat\.?[^)]*)\)\s*$/i, '')
    .replace(/\s*\[(remaster(ed)?|deluxe|live|acoustic|remix|radio edit|single version|bonus track|feat\.?[^]]*)\]\s*$/i, '')
    .trim();
}

function unmatchedResult(track: SpotifyTrack): MatchResult {
  return {
    spotifyTrack: track,
    appleMusicId: null,
    appleMusicTrack: null,
    matchType: 'unmatched',
    confidence: 0,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
