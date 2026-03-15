# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | arch | Web framework | Next.js (App Router) | OAuth callback handling, API routes for token generation, SSR capability | No |
| D002 | M001 | arch | Song matching strategy | ISRC primary + artist/title metadata fallback | ISRC is cross-platform standard, fallback catches missing ISRCs | No |
| D003 | M001 | arch | Apple Music client integration | MusicKit JS v3 (client-side auth) + REST API (server-side operations) | MusicKit handles Apple ID auth flow, server generates developer tokens | No |
| D004 | M001 | scope | Application scope | Personal single-user tool | No multi-user infra, rate limiting, or deployment needed | Yes — if shared with others |
| D005 | M001 | scope | Friend list migration | Deferred | Spotify has no official API for friend list access | Yes — if Spotify adds official API |
| D006 | M001 | convention | Transfer UX pattern | Album art flow animation per song + progress counter | User explicitly wants engaging visual during transfer, not a spinner | No |
| D007 | M001 | convention | Unmatched handling | Post-transfer report (not inline interruption) | User chose end-of-transfer report over per-song alerts | No |
| D008 | M001 | convention | Liked songs handling | Separate step from playlist transfer | User wants explicit control over liked songs vs playlist migration | No |
