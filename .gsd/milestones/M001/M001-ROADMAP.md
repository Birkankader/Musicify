# M001: Spotify → Apple Music Migration Tool

**Vision:** A personal web app that lets the user sign in to Spotify, select playlists and liked songs, and transfer them to Apple Music with high-accuracy ISRC matching, engaging album art animations during transfer, and a clear report of unmatched songs.

## Success Criteria

- User can authenticate with both Spotify and Apple Music in one flow
- User can browse all their Spotify playlists and select which ones to transfer
- Selected playlists are recreated on Apple Music with correctly matched songs
- Liked songs can be transferred as a separate step
- Transfer shows album art flowing from Spotify to Apple Music per song
- Songs not found on Apple Music are reported with song name, artist, and source playlist
- Duplicate songs already in Apple Music library are detected and skipped

## Key Risks / Unknowns

- **Dual auth complexity** — Two different OAuth/auth systems (Spotify OAuth 2.0 + Apple MusicKit JS) must both work in the same session. If either fails, nothing works
- **ISRC matching gaps** — Not all tracks have ISRCs, and some ISRCs differ across platforms. Metadata fallback matching quality is uncertain until tested with real data

## Proof Strategy

- Dual auth complexity → retire in S01 by proving both auth flows complete successfully and tokens are usable for API calls
- ISRC matching gaps → retire in S02 by proving match rate on a real playlist with 20+ songs, measuring ISRC hit rate vs fallback hit rate

## Verification Classes

- Contract verification: Unit tests for matching logic, API response parsing
- Integration verification: Real Spotify API calls returning real playlists, real Apple Music playlist creation
- Operational verification: none (personal tool)
- UAT / human verification: Full flow walkthrough — login → select → transfer → report

## Milestone Definition of Done

This milestone is complete only when all are true:

- Both auth flows work and maintain valid sessions
- Playlist listing, selection, and transfer work end-to-end
- Liked songs transfer works independently
- Album art animation plays during transfer
- Unmatched report displays after transfer completion
- At least one real playlist has been transferred successfully from Spotify to Apple Music

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011
- Partially covers: none
- Leaves for later: R020, R021
- Orphan risks: none

## Slices

- [ ] **S01: Dual Platform Authentication** `risk:high` `depends:[]`
  > After this: User can sign in with Spotify and authorize Apple Music — both connections shown as active on the UI

- [ ] **S02: Playlist Discovery & Song Matching** `risk:high` `depends:[S01]`
  > After this: User sees all their Spotify playlists, selects one, and sees match results — how many songs found on Apple Music via ISRC + fallback

- [ ] **S03: Playlist Transfer & Migration Animation** `risk:medium` `depends:[S02]`
  > After this: Selected playlists are created on Apple Music with matched songs, album art flows across the screen during transfer, progress is tracked

- [ ] **S04: Liked Songs Transfer** `risk:low` `depends:[S02]`
  > After this: User can transfer liked songs to Apple Music favorites as a separate step with progress tracking

- [ ] **S05: Unmatched Report & Final Polish** `risk:low` `depends:[S03,S04]`
  > After this: After all transfers, a detailed report shows unmatched songs grouped by source — full end-to-end flow is polished and complete

## Boundary Map

### S01 → S02

Produces:
- `lib/spotify.ts` → `getSpotifyToken()`, `SpotifyClient` class with authenticated API methods
- `lib/apple-music.ts` → `getAppleMusicToken()`, MusicKit JS initialization and user auth helpers
- `types/index.ts` → `SpotifyTrack`, `SpotifyPlaylist`, `AppleMusicTrack` interfaces
- Auth state management — React context or hooks exposing `isSpotifyConnected`, `isAppleMusicConnected`
- Next.js API routes for Spotify OAuth callback and Apple Music developer token

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- `lib/matching.ts` → `matchTracks(spotifyTracks[]) → MatchResult[]` with ISRC primary + metadata fallback
- `MatchResult` type → `{ spotifyTrack, appleMusicId, matchType: 'isrc' | 'metadata' | 'unmatched', confidence }`
- Playlist selection state — which playlists are selected for transfer, with pre-computed match results
- `lib/spotify.ts` additions → `getPlaylistTracks(id)`, `getLikedSongs()` with full pagination

Consumes from S01:
- `SpotifyClient` → authenticated API calls
- `getAppleMusicToken()` → Apple Music catalog search
- `SpotifyTrack`, `SpotifyPlaylist` interfaces

### S02 → S04

Produces:
- `lib/matching.ts` → same `matchTracks()` function reused for liked songs
- `lib/spotify.ts` → `getLikedSongs()` with pagination

Consumes from S01:
- `SpotifyClient` → authenticated API calls
- `getAppleMusicToken()` → Apple Music catalog search

### S03 → S05

Produces:
- Transfer results — `TransferResult[]` with per-song status (transferred, skipped-duplicate, unmatched)
- `lib/apple-music.ts` additions → `createPlaylist()`, `addSongsToLibrary()`
- Album art animation component — reusable for liked songs transfer display

Consumes from S02:
- `MatchResult[]` → matched songs to transfer
- Playlist selection state

### S04 → S05

Produces:
- Liked songs transfer results — same `TransferResult[]` shape
- Liked songs transfer state (completed, count, unmatched)

Consumes from S02:
- `matchTracks()` → for liked songs matching
- `getLikedSongs()` → paginated liked songs

Consumes from S01:
- Apple Music auth → for adding to favorites
