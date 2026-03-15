# Musicify

## What This Is

A personal web app for migrating music from Spotify to Apple Music. Transfers playlists and liked songs using ISRC-based matching with metadata fallback. Shows a satisfying album art flow animation during transfer and reports unmatched songs at the end.

## Core Value

Playlist and liked songs transfer from Spotify to Apple Music with high match accuracy and clear reporting of what couldn't be moved.

## Current State

Empty project — no code yet. Fresh Next.js app to be scaffolded.

## Architecture / Key Patterns

- **Framework:** Next.js (App Router)
- **Auth:** Spotify OAuth 2.0 + Apple MusicKit JS authorization
- **Matching:** ISRC-based primary matching, artist+title metadata fallback
- **Apple Music API:** MusicKit JS v3 for client-side auth, REST API via server routes for playlist creation
- **Scope:** Single-user personal tool, no multi-user infrastructure

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Spotify → Apple Music Migration Tool — Full migration flow: auth, playlist discovery, transfer with animation, liked songs, unmatched report
