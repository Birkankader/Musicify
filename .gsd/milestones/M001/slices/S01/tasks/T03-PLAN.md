---
estimated_steps: 6
estimated_files: 5
---

# T03: Auth State Management & Connection Status UI

**Slice:** S01 — Dual Platform Authentication
**Milestone:** M001

## Description

Unify both auth flows into a single state management layer and build the connection status UI. This is the user-facing proof that both platforms are connected and ready for migration.

## Steps

1. Create AuthContext providing unified auth state for both platforms
2. Create useAuth hook exposing: isSpotifyConnected, isAppleMusicConnected, spotifyUser, loginSpotify(), authorizeAppleMusic()
3. On page load, check for existing Spotify token in cookies — if present, fetch profile to validate and populate state
4. Build AuthStatus component — two cards side by side (Spotify / Apple Music), each showing connect button or connected status with user info
5. Wire AuthStatus into main page as the primary entry point
6. Test full flow: fresh load (both disconnected) → connect Spotify → connect Apple Music → both show connected

## Must-Haves

- [ ] AuthContext provides reactive state for both platform connections
- [ ] Fresh page load shows both platforms as "not connected" with connect buttons
- [ ] After Spotify login, Spotify card shows user display name and "connected"
- [ ] After Apple Music auth, Apple Music card shows "connected"
- [ ] Both connections survive page refresh (Spotify via cookie, Apple Music via MusicKit session)
- [ ] UI is clean, readable, and matches the "basit ama ilgi çekici" design intent

## Verification

- Full browser walkthrough: fresh page → connect Spotify → connect Apple Music → both connected
- Page refresh preserves Spotify connection (token in cookie)
- Apple Music re-authorizes on refresh (MusicKit handles this)
- Both disconnect if tokens expire/are cleared

## Inputs

- T01 output: Spotify OAuth flow, SpotifyClient
- T02 output: Apple Music token endpoint, useAppleMusic hook, MusicKit init

## Expected Output

- `src/contexts/AuthContext.tsx` — Unified auth provider
- `src/hooks/useAuth.ts` — Convenience hook for auth state
- `src/components/AuthStatus.tsx` — Connection status UI
- `src/app/page.tsx` — Updated with AuthProvider and AuthStatus
- `src/app/layout.tsx` — Wrapped with AuthProvider if needed
