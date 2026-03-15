# S02: Playlist Discovery & Song Matching

**Goal:** User sees all their Spotify playlists, selects one, and sees match results — how many songs found on Apple Music via ISRC + fallback
**Demo:** Connect both platforms → playlist grid appears → click a playlist → match results show per-song ISRC/metadata/unmatched status with stats summary

## Must-Haves

- Spotify playlists fetched and displayed in a selectable grid
- Apple Music catalog search via ISRC (primary) and artist+title (fallback)
- Match results displayed per-song with match type indicators
- Stats summary: total, ISRC matched, metadata matched, unmatched
- Liked songs count shown separately (not transferred here, just visible)

## Proof Level

- This slice proves: integration — real Spotify playlists matched against real Apple Music catalog
- Real runtime required: yes — both platform APIs must return real data
- Human/UAT required: yes — verify match accuracy on a real playlist

## Verification

- Dev server running, both platforms connected → playlist grid renders with real playlists
- Select a playlist → match results appear with correct per-song status
- `src/lib/matching.ts` exports `matchTracks()` returning `MatchResult[]`
- Unmatched songs show with reason; ISRC matches show high confidence (1.0), metadata matches show lower confidence
- Browser assertions: playlist grid visible, match results visible after selection

## Observability / Diagnostics

- Runtime signals: console logs for match attempts (ISRC hit/miss, fallback attempt, final status per track)
- Inspection surfaces: match stats summary visible in UI
- Failure visibility: API errors surfaced in UI with message, failed matches show track info for manual inspection
- Redaction constraints: no secrets — only public catalog data and user playlist names

## Integration Closure

- Upstream surfaces consumed: `SpotifyClient` (playlist/track fetching), `useAuth` (connection state, musicInstance), `useAppleMusic` (MusicKit instance for API calls)
- New wiring introduced: API route for Apple Music catalog search, matching engine, playlist selection state, match results UI
- What remains before milestone is truly usable: S03 (actual transfer to Apple Music), S04 (liked songs), S05 (unmatched report)

## Tasks

- [ ] **T01: Apple Music catalog search API route and matching engine** `est:45m`
  - Why: Core matching logic — everything downstream depends on being able to search Apple Music and match tracks
  - Files: `src/lib/matching.ts`, `src/app/api/apple-music/search/route.ts`
  - Do:
    - Create API route that proxies Apple Music catalog search (by ISRC and by term) using the developer token
    - Build `matchTracks(spotifyTracks: SpotifyTrack[], musicInstance: MusicKit.MusicKitInstance): Promise<MatchResult[]>` in `src/lib/matching.ts`
    - ISRC match: search Apple Music catalog with `filter[isrc]` parameter → confidence 1.0
    - Metadata fallback: search by `{artist} {title}` → compare duration (within 3s tolerance) and artist similarity → confidence 0.5-0.9
    - Return `MatchResult[]` with spotifyTrack, appleMusicId, appleMusicTrack, matchType, confidence
    - Log match attempts to console for debugging (ISRC hit/miss, fallback result)
    - Handle rate limiting gracefully — sequential requests with small delay between batches
  - Verify: Import and call `matchTracks` with a small test array, confirm it returns typed MatchResult[]
  - Done when: `matchTracks()` correctly returns ISRC, metadata, and unmatched results for a real playlist

- [ ] **T02: Spotify playlist fetching API route and playlist grid UI** `est:40m`
  - Why: User needs to see and select their playlists before matching can happen
  - Files: `src/app/api/spotify/playlists/route.ts`, `src/components/PlaylistGrid.tsx`, `src/components/HomePage.tsx`
  - Do:
    - Create API route at `/api/spotify/playlists` that reads Spotify token cookie, creates SpotifyClient, fetches all playlists
    - Build `PlaylistGrid` component: responsive grid of playlist cards with cover art, name, track count, owner
    - Cards are selectable (click to select, highlight selected)
    - Show liked songs as a separate card with heart icon and count (fetched from `/me/tracks` total)
    - Loading skeleton while playlists fetch
    - Only render playlist grid when `bothConnected` is true
    - Integrate into HomePage: after both platforms connected, show playlist grid
  - Verify: Dev server → connect both platforms → playlist grid appears with real Spotify playlists
  - Done when: User sees all their Spotify playlists in a grid and can click to select one

- [ ] **T03: Match results view and playlist-level matching flow** `est:40m`
  - Why: Wires everything together — selecting a playlist triggers matching and shows results
  - Files: `src/components/MatchResults.tsx`, `src/components/PlaylistGrid.tsx`, `src/components/HomePage.tsx`
  - Do:
    - When user selects a playlist, fetch its tracks via new API route `/api/spotify/playlists/[id]/tracks`
    - Create API route that returns playlist tracks using SpotifyClient
    - Pass tracks to `matchTracks()` (called client-side using MusicKit instance)
    - Build `MatchResults` component: list of songs with match status icon (green check = ISRC, yellow = metadata, red X = unmatched)
    - Show album art, song name, artist, match type badge, and confidence for each song
    - Stats bar at top: "23/25 matched (20 ISRC, 3 metadata, 2 unmatched)"
    - Loading state during matching with progress indicator (X of Y songs checked)
    - Wire into HomePage: playlist grid → select playlist → match results panel slides in
  - Verify: Select a real playlist → match results appear with per-song status → stats are accurate
  - Done when: Full flow works — playlist grid → select → matching progress → results with stats

## Files Likely Touched

- `src/lib/matching.ts` (new)
- `src/app/api/apple-music/search/route.ts` (new)
- `src/app/api/spotify/playlists/route.ts` (new)
- `src/app/api/spotify/playlists/[id]/tracks/route.ts` (new)
- `src/components/PlaylistGrid.tsx` (new)
- `src/components/MatchResults.tsx` (new)
- `src/components/HomePage.tsx` (modified)
- `src/types/index.ts` (may extend)
