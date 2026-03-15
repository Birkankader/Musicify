import { SignJWT, importPKCS8 } from 'jose';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { AppleMusicTrack } from '@/types';

const APPLE_MUSIC_API = 'https://api.music.apple.com';
const STOREFRONT = process.env.APPLE_MUSIC_STOREFRONT || 'us';

// --- Developer token (cached in-memory) ---

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function generateDeveloperToken(): Promise<string> {
  // Return cached if still valid (1hr buffer)
  if (cachedToken && Date.now() / 1000 < cachedToken.expiresAt - 3600) {
    return cachedToken.token;
  }

  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;

  if (!teamId || !keyId) {
    throw new Error('Apple Music credentials not configured (APPLE_TEAM_ID or APPLE_KEY_ID)');
  }

  let privateKeyPem: string;
  const keyFilePath = join(process.cwd(), `AuthKey_${keyId}.p8`);

  try {
    privateKeyPem = readFileSync(keyFilePath, 'utf-8');
  } catch {
    const envKey = process.env.APPLE_PRIVATE_KEY;
    if (!envKey) {
      throw new Error('Apple Music private key not found (file or APPLE_PRIVATE_KEY env)');
    }
    privateKeyPem = envKey.replace(/\\n/g, '\n').trim();
  }

  const privateKey = await importPKCS8(privateKeyPem, 'ES256');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 180; // 180 days

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);

  cachedToken = { token, expiresAt: exp };
  return token;
}

// --- Apple Music API helpers ---

async function apiFetch(path: string): Promise<unknown> {
  const token = await generateDeveloperToken();
  const res = await fetch(`${APPLE_MUSIC_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apple Music API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Batch ISRC lookup — max 25 ISRCs per call.
 * Returns all matching songs (one ISRC can match multiple versions).
 */
export async function searchByIsrc(isrcs: string[]): Promise<AppleMusicTrack[]> {
  if (isrcs.length === 0) return [];
  if (isrcs.length > 25) throw new Error('Max 25 ISRCs per request');

  const param = isrcs.join(',');
  const json = (await apiFetch(
    `/v1/catalog/${STOREFRONT}/songs?filter[isrc]=${encodeURIComponent(param)}`
  )) as { data?: AppleMusicTrack[] };

  return json.data ?? [];
}

/**
 * Term search — returns top matches for "artist title" queries.
 */
export async function searchByTerm(term: string, limit = 5): Promise<AppleMusicTrack[]> {
  if (!term.trim()) return [];

  const json = (await apiFetch(
    `/v1/catalog/${STOREFRONT}/search?term=${encodeURIComponent(term)}&types=songs&limit=${limit}`
  )) as { results?: { songs?: { data?: AppleMusicTrack[] } } };

  return json.results?.songs?.data ?? [];
}
