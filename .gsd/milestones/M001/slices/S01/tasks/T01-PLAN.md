---
estimated_steps: 8
estimated_files: 8
---

# T01: Next.js Scaffold & Spotify OAuth

**Slice:** S01 — Dual Platform Authentication
**Milestone:** M001

## Description

Scaffold the Next.js project and implement Spotify OAuth 2.0 login flow. This is the foundation — everything else builds on top. Spotify is the source platform, so proving we can authenticate and make API calls is the first risk to retire.

## Steps

1. Scaffold Next.js 14+ with TypeScript, Tailwind CSS, App Router
2. Define shared types in `src/types/index.ts` (SpotifyTrack, SpotifyPlaylist, AppleMusicTrack, MatchResult)
3. Collect Spotify API credentials via secure_env_collect (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)
4. Create `/api/auth/spotify` route — builds Spotify authorize URL with required scopes and redirects
5. Create `/api/auth/spotify/callback` route — exchanges authorization code for access/refresh tokens, stores in HTTP-only cookie
6. Create `SpotifyClient` class in `src/lib/spotify.ts` — authenticated fetch wrapper, token refresh, getProfile(), getPlaylists(), getPlaylistTracks(), getLikedSongs() method stubs
7. Create basic landing page with "Connect Spotify" button
8. Test: click connect → redirect → callback → profile displayed

## Must-Haves

- [ ] Next.js app builds and runs on localhost:3000
- [ ] Clicking "Connect Spotify" redirects to Spotify authorization page
- [ ] After authorizing, callback receives code, exchanges for tokens, stores securely
- [ ] SpotifyClient can make authenticated GET /me call and return user profile
- [ ] Shared types exported from src/types/index.ts

## Verification

- `npm run build` passes with zero errors
- `npm run dev` starts on port 3000
- Full OAuth round-trip: click → Spotify → callback → token stored → GET /me returns profile

## Inputs

- Empty project directory
- Spotify Developer app credentials (collected via secure_env_collect)

## Expected Output

- `package.json` — Next.js project with dependencies
- `src/app/layout.tsx` — Root layout with Tailwind
- `src/app/page.tsx` — Landing page with Spotify connect button
- `src/app/api/auth/spotify/route.ts` — OAuth redirect
- `src/app/api/auth/spotify/callback/route.ts` — Token exchange
- `src/lib/spotify.ts` — SpotifyClient class
- `src/types/index.ts` — Shared interfaces
