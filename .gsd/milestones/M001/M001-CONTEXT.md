# M001: Spotify → Apple Music Migration Tool

**Gathered:** 2026-03-15
**Status:** Ready for planning

## Project Description

A personal web app that migrates Spotify playlists and liked songs to Apple Music. Uses ISRC-based matching with metadata fallback for high accuracy. Shows album art flow animation during transfer and reports unmatched songs at the end. Built with Next.js, personal use only.

## Why This Milestone

This is the only milestone — it delivers the complete migration tool. The user is actively switching from Spotify to Apple Music and needs to move years of accumulated playlists and liked songs.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Sign in with Spotify, authorize Apple Music, select playlists, and watch them transfer with album art animations
- Transfer liked songs separately, then see a clear report of everything that couldn't be matched

### Entry point / environment

- Entry point: http://localhost:3000
- Environment: local dev (Next.js dev server)
- Live dependencies involved: Spotify Web API, Apple Music API (MusicKit JS + REST)

## Completion Class

- Contract complete means: Auth flows work, matching logic returns correct results, playlists created on Apple Music
- Integration complete means: Full flow from Spotify login → playlist selection → Apple Music transfer works end-to-end
- Operational complete means: none (personal tool, no production deployment)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A real Spotify playlist with 10+ songs can be selected and transferred to Apple Music with correct song matches
- Liked songs transfer creates favorites in Apple Music
- The unmatched report accurately lists songs not found on Apple Music
- Album art animation plays smoothly during transfer

## Risks and Unknowns

- **Apple Music Developer Token complexity** — Requires Apple Developer account, private key, JWT generation. If the user doesn't have Apple Developer credentials, this blocks everything
- **ISRC matching accuracy** — Some tracks may have missing or inconsistent ISRCs across platforms. Metadata fallback helps but fuzzy matching adds complexity
- **Apple Music API rate limits** — Unknown rate limits for personal use. Large playlists (hundreds of songs) may need throttling
- **MusicKit JS browser compatibility** — MusicKit JS requires specific browser setup and may have CORS or cookie requirements

## Existing Codebase / Prior Art

- Empty project — no existing code. Fresh scaffold needed

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001–R002 — Dual platform authentication foundation
- R003–R005 — Playlist discovery and song matching pipeline
- R006, R008, R009 — Transfer execution with visual feedback
- R007 — Liked songs as separate transfer path
- R010 — Unmatched song reporting
- R011 — Duplicate awareness across transfers

## Scope

### In Scope

- Spotify OAuth 2.0 sign-in with playlist and library read scopes
- Apple Music MusicKit JS authorization for library write access
- Playlist listing with cover art, name, track count
- Selective playlist transfer (user picks which ones)
- ISRC-based song matching with artist+title metadata fallback
- Apple Music playlist creation with matched songs
- Liked songs transfer as separate step
- Album art flow animation during transfer (each song's cover slides from Spotify→Apple Music side)
- Transfer progress tracking (count, percentage)
- Unmatched song report grouped by source playlist
- Duplicate detection (skip songs already in Apple Music library)

### Out of Scope / Non-Goals

- Multi-user support, rate limiting, user accounts
- Reverse migration (Apple Music → Spotify)
- Music playback
- Friend list migration (deferred — no official Spotify API)
- Playlist metadata transfer (description, cover image — deferred)
- Production deployment

## Technical Constraints

- Apple Music Developer Token requires Apple Developer Program membership and a MusicKit private key
- Spotify OAuth requires registered app at developer.spotify.com
- MusicKit JS v3 runs client-side only — server handles token generation
- Apple Music catalog search: max 25 ISRCs per batch request
- Spotify API: max 50 items per page for playlists and liked songs

## Integration Points

- **Spotify Web API** — OAuth 2.0 auth, GET /me/playlists, GET /me/tracks, GET /playlists/{id}/tracks
- **Apple Music API** — MusicKit JS for user auth, REST API for catalog search (ISRC), playlist creation, library add
- **Apple Developer** — JWT token generation with MusicKit private key (server-side)

## Open Questions

- Does the user have Apple Developer Program credentials? — Will surface during S01 when setting up MusicKit. If not, we'll need to guide setup
- Optimal batch size for Apple Music writes? — Will discover during S03 implementation. Start conservative, increase if stable
