# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Spotify OAuth Authentication
- Class: core-capability
- Status: active
- Description: User can sign in with their Spotify account via OAuth 2.0 to grant read access to playlists and liked songs
- Why it matters: Without Spotify auth, no data can be read from the source platform
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Requires Spotify Developer app credentials. Scopes: user-library-read, playlist-read-private, playlist-read-collaborative

### R002 — Apple Music MusicKit Authorization
- Class: core-capability
- Status: active
- Description: User can authorize Apple Music access via MusicKit JS to allow playlist creation and library modifications
- Why it matters: Without Apple Music auth, no data can be written to the destination platform
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Requires Apple Developer token (JWT signed with MusicKit private key). MusicKit JS handles user-facing auth flow

### R003 — Playlist Discovery & Selection
- Class: primary-user-loop
- Status: active
- Description: User sees all their Spotify playlists listed and can select which ones to transfer
- Why it matters: Users have many playlists — selective transfer prevents unwanted clutter in Apple Music
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Spotify API returns playlists paginated (50/page). Show playlist name, track count, cover art

### R004 — ISRC-based Song Matching
- Class: core-capability
- Status: active
- Description: Each Spotify track is matched to an Apple Music track using its ISRC code as the primary identifier
- Why it matters: ISRC is the international standard recording code — same recording gets the same code across platforms, giving high-accuracy matches
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Apple Music catalog search supports ISRC filter. Batch up to 25 ISRCs per request

### R005 — Metadata Fallback Matching
- Class: core-capability
- Status: active
- Description: When ISRC matching fails (missing ISRC or no Apple Music result), fall back to searching by artist name + track title
- Why it matters: Some tracks lack ISRC codes or have platform-inconsistent codes. Fallback matching significantly improves overall match rate
- Source: research
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Fuzzy matching needed for slight title variations (feat. vs featuring, remix labels, etc.)

### R006 — Playlist Creation on Apple Music
- Class: primary-user-loop
- Status: active
- Description: Selected Spotify playlists are recreated on Apple Music with the same name and matched songs
- Why it matters: This is the core action — the whole point of the tool
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Apple Music API: POST /v1/me/library/playlists. Songs added via catalog IDs

### R007 — Liked Songs Transfer
- Class: primary-user-loop
- Status: active
- Description: User can transfer their Spotify liked songs to Apple Music favorites as a separate step from playlist transfer
- Why it matters: Liked songs are a distinct collection in Spotify — users want these preserved separately
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Spotify liked songs paginated (50/page). Apple Music: POST /v1/me/library to add songs

### R008 — Album Art Migration Animation
- Class: differentiator
- Status: active
- Description: During transfer, album artwork visually flows from a Spotify side to an Apple Music side for each song being transferred
- Why it matters: User specifically wants the migration process to feel engaging, not boring — "craft feel" during the wait
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Each track transfer shows its album art sliding/flowing across. Real-time progress, not a spinner

### R009 — Transfer Progress Tracking
- Class: primary-user-loop
- Status: active
- Description: User can see how many songs have been transferred, how many remain, and estimated time during migration
- Why it matters: Large playlists take time — user needs to know the process is working and how long to wait
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Progress bar or counter alongside the album art animation

### R010 — Unmatched Song Report
- Class: primary-user-loop
- Status: active
- Description: After transfer completes, a report shows all songs that could not be found on Apple Music — with song name, artist, and source playlist
- Why it matters: User needs to know what was lost so they can manually find alternatives or accept the gaps
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Report shown after all transfers complete. Grouped by source playlist for clarity

### R011 — Duplicate Awareness
- Class: quality-attribute
- Status: active
- Description: Songs already present in the user's Apple Music library are detected and skipped during transfer
- Why it matters: Prevents duplicate entries when running transfer multiple times or when liked songs overlap with playlists
- Source: research
- Primary owning slice: M001/S03
- Supporting slices: M001/S04
- Validation: unmapped
- Notes: Check Apple Music library before adding. Report skipped duplicates separately from unmatched

## Validated

(none yet)

## Deferred

### R020 — Friend List Migration
- Class: core-capability
- Status: deferred
- Description: Check if Spotify friends have Apple Music accounts and show their profiles
- Why it matters: Social connections are part of the music experience
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred because Spotify does not expose friend list via official API. Revisit if official support added

### R021 — Playlist Metadata Transfer
- Class: quality-attribute
- Status: deferred
- Description: Transfer playlist descriptions, cover images, and other metadata alongside songs
- Why it matters: Playlists are more than song lists — metadata gives them identity
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to focus on core song transfer first. Apple Music API supports setting playlist description and artwork

## Out of Scope

### R030 — Multi-user Support
- Class: constraint
- Status: out-of-scope
- Description: No user accounts, rate limiting, or multi-tenant infrastructure
- Why it matters: Prevents scope creep — this is a personal tool
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Personal use only

### R031 — Reverse Migration (Apple→Spotify)
- Class: anti-feature
- Status: out-of-scope
- Description: No support for migrating from Apple Music back to Spotify
- Why it matters: Prevents building unnecessary bidirectional complexity
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: User is moving to Apple Music, not back

### R032 — Music Playback
- Class: anti-feature
- Status: out-of-scope
- Description: No music playback functionality — this is a migration tool, not a player
- Why it matters: Prevents feature creep into player territory
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: MusicKit JS supports playback but we don't need it

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M001/S01 | none | unmapped |
| R002 | core-capability | active | M001/S01 | none | unmapped |
| R003 | primary-user-loop | active | M001/S02 | none | unmapped |
| R004 | core-capability | active | M001/S02 | none | unmapped |
| R005 | core-capability | active | M001/S02 | none | unmapped |
| R006 | primary-user-loop | active | M001/S03 | none | unmapped |
| R007 | primary-user-loop | active | M001/S04 | none | unmapped |
| R008 | differentiator | active | M001/S03 | none | unmapped |
| R009 | primary-user-loop | active | M001/S03 | none | unmapped |
| R010 | primary-user-loop | active | M001/S05 | none | unmapped |
| R011 | quality-attribute | active | M001/S03 | M001/S04 | unmapped |
| R020 | core-capability | deferred | none | none | unmapped |
| R021 | quality-attribute | deferred | none | none | unmapped |
| R030 | constraint | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |
| R032 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 11
- Mapped to slices: 11
- Validated: 0
- Unmapped active requirements: 0
