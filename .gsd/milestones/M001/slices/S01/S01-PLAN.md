# S01: Dual Platform Authentication

**Goal:** Both Spotify and Apple Music auth flows working, tokens usable for API calls.
**Demo:** User can sign in with Spotify and authorize Apple Music — both connections shown as active on the UI.

## Must-Haves

- Spotify OAuth 2.0 login redirects to Spotify, callback stores access token + refresh token
- Apple Music developer token generated server-side from MusicKit private key
- MusicKit JS initializes and user can authorize Apple Music access
- UI shows connection status for both platforms (connected / not connected)
- Tokens are usable — a test API call to each platform succeeds

## Proof Level

- This slice proves: integration
- Real runtime required: yes (both platform APIs)
- Human/UAT required: yes (OAuth redirect requires browser interaction)

## Verification

- `npm run dev` starts without errors
- Spotify login flow completes: click → redirect → callback → token stored
- Apple Music auth flow completes: MusicKit init → authorize → user token received
- Both connection statuses show "connected" in UI after auth
- A test Spotify API call (GET /me) returns user profile
- A test Apple Music API call returns a valid response

## Observability / Diagnostics

- Runtime signals: Console logs for auth flow steps (token received, auth failed, etc.)
- Inspection surfaces: Browser dev tools network tab for API calls, React state for auth status
- Failure visibility: Auth errors displayed in UI with descriptive messages
- Redaction constraints: Never log tokens or secrets

## Integration Closure

- Upstream surfaces consumed: none (first slice)
- New wiring introduced: Spotify OAuth routes, Apple Music token endpoint, MusicKit JS init
- What remains before milestone is truly usable end-to-end: playlist discovery, matching, transfer, report

## Tasks

- [x] **T01: Next.js Scaffold & Spotify OAuth** `est:45m`
  - Why: Foundation — project needs scaffolding and Spotify is the source platform. OAuth is the first auth wall to prove.
  - Files: `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/auth/spotify/route.ts`, `src/app/api/auth/spotify/callback/route.ts`, `src/lib/spotify.ts`, `src/types/index.ts`
  - Do: Scaffold Next.js with TypeScript + Tailwind. Create Spotify OAuth login route (redirects to Spotify authorize URL with scopes: user-library-read, playlist-read-private, playlist-read-collaborative). Create callback route that exchanges code for tokens and stores in cookie/session. Create SpotifyClient class with authenticated fetch. Define shared types (SpotifyTrack, SpotifyPlaylist). Collect Spotify credentials via secure_env_collect.
  - Verify: `npm run build` succeeds. Visiting /api/auth/spotify redirects to Spotify. After callback, token is stored and GET /me returns user profile.
  - Done when: Spotify OAuth round-trip works end-to-end — login, callback, token stored, API call succeeds.

- [x] **T02: Apple Music Developer Token & MusicKit Authorization** `est:45m`
  - Why: Apple Music is the destination platform — user auth is required to write playlists and add songs to library.
  - Files: `src/app/api/auth/apple-music/token/route.ts`, `src/lib/apple-music.ts`, `src/hooks/useAppleMusic.ts`
  - Do: Create API route that generates Apple Music developer token (JWT signed with MusicKit private key, ES256 algorithm). Initialize MusicKit JS v3 on client side using the developer token. Implement user authorization flow (music.authorize()). Create useAppleMusic hook exposing isAuthorized, authorize(), and musicKit instance. Collect Apple Music credentials via secure_env_collect (team ID, key ID, private key).
  - Verify: Developer token endpoint returns valid JWT. MusicKit.configure() succeeds in browser. music.authorize() opens Apple ID sign-in and returns user token.
  - Done when: Apple Music user authorization completes — MusicKit initialized, user signed in, user token available for API calls.

- [x] **T03: Auth State Management & Connection Status UI** `est:30m`
  - Why: Both auth flows need to be unified into a single UI that shows connection status and provides login/authorize actions.
  - Files: `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/components/AuthStatus.tsx`, `src/app/page.tsx`
  - Do: Create AuthContext that tracks both Spotify and Apple Music connection state. Create useAuth hook that exposes isSpotifyConnected, isAppleMusicConnected, loginSpotify(), authorizeAppleMusic(). Build AuthStatus component showing both platforms with connect/connected state, user profile info where available. Wire into main page as the entry point of the app.
  - Verify: Fresh page load shows both platforms as "not connected". After Spotify login, Spotify shows "connected" with user name. After Apple Music auth, Apple Music shows "connected". Both can be connected in the same session.
  - Done when: Both platforms show connected status in UI, and the auth state persists across page navigation.

## Files Likely Touched

- `package.json`, `tsconfig.json`, `tailwind.config.ts`
- `src/app/layout.tsx`, `src/app/page.tsx`
- `src/app/api/auth/spotify/route.ts`
- `src/app/api/auth/spotify/callback/route.ts`
- `src/app/api/auth/apple-music/token/route.ts`
- `src/lib/spotify.ts`
- `src/lib/apple-music.ts`
- `src/types/index.ts`
- `src/hooks/useAppleMusic.ts`, `src/hooks/useAuth.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/AuthStatus.tsx`
- `.env.local`
