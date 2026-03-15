---
estimated_steps: 6
estimated_files: 4
---

# T02: Apple Music Developer Token & MusicKit Authorization

**Slice:** S01 — Dual Platform Authentication
**Milestone:** M001

## Description

Implement Apple Music authentication: server-side developer token generation (JWT with MusicKit private key) and client-side user authorization via MusicKit JS v3. This proves the destination platform is accessible.

## Steps

1. Collect Apple Music credentials via secure_env_collect (APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY)
2. Create `/api/auth/apple-music/token` route — generates JWT developer token (ES256, iss: team ID, iat: now, exp: 6 months, sub: key ID)
3. Create `src/lib/apple-music.ts` — MusicKit JS initialization helper, developer token fetching, user authorization wrapper
4. Create `src/hooks/useAppleMusic.ts` — React hook wrapping MusicKit init, auth state, authorize() action
5. Add MusicKit JS v3 script tag to layout (CDN: https://js-cdn.music.apple.com/musickit/v3/musickit.js)
6. Test: page loads MusicKit → fetch developer token → authorize → user token received

## Must-Haves

- [ ] Developer token endpoint returns valid JWT signed with ES256
- [ ] MusicKit JS initializes successfully in the browser
- [ ] User can click "Authorize Apple Music" and complete Apple ID sign-in
- [ ] After authorization, MusicKit instance has valid user token
- [ ] useAppleMusic hook exposes: isAuthorized, isInitialized, authorize(), musicInstance

## Verification

- `/api/auth/apple-music/token` returns a JWT that decodes to valid claims (iss, iat, exp)
- MusicKit.configure() completes without error in browser console
- music.authorize() triggers Apple ID sign-in popup and resolves with user token
- After auth, `music.api.music('v1/me/library/songs', { limit: 1 })` returns a response (proves token works)

## Inputs

- T01 output: working Next.js app with layout, Tailwind, types
- Apple Developer credentials (collected via secure_env_collect)

## Expected Output

- `src/app/api/auth/apple-music/token/route.ts` — Developer token generation
- `src/lib/apple-music.ts` — MusicKit helpers
- `src/hooks/useAppleMusic.ts` — React hook for Apple Music auth
- `src/app/layout.tsx` — Updated with MusicKit JS script
