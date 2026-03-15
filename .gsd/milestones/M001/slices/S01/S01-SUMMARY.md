---
id: S01
parent: M001
provides:
  - Spotify OAuth 2.0 flow (login, callback, token exchange, refresh)
  - SpotifyClient class with authenticated API methods and full pagination
  - Apple Music developer token generation (JWT ES256 via jose)
  - MusicKit JS v3 initialization and user authorization hook
  - AuthContext with unified dual-platform connection state
requires: []
affects: [S02, S03, S04, S05]
key_files:
  - src/lib/spotify.ts
  - src/app/api/auth/spotify/route.ts
  - src/app/api/auth/spotify/callback/route.ts
  - src/app/api/auth/spotify/status/route.ts
  - src/app/api/auth/apple-music/token/route.ts
  - src/hooks/useAppleMusic.ts
  - src/contexts/AuthContext.tsx
  - src/components/AuthStatus.tsx
  - src/types/index.ts
  - src/types/musickit.d.ts
key_decisions:
  - "jose v5 over v6: v6 is pure ESM webapi-only, breaks Next.js webpack bundling"
  - "HTTP-only cookies for Spotify tokens: secure, survives page refresh"
  - "force-dynamic on API routes: env vars not available at build time"
  - "Dynamic import for HomePage: prevents MusicKit/jose SSR issues during prerender"
patterns_established:
  - "API route pattern at src/app/api/auth/<platform>/ with status endpoint"
  - "React hook pattern for platform auth: useAppleMusic, useAuth"
  - "AuthContext wrapping the app for unified auth state"
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-PLAN.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-PLAN.md
duration: 40min
verification_result: pass
completed_at: 2026-03-15T14:45:00Z
---

# S01: Dual Platform Authentication

**Next.js 15 app with Spotify OAuth and Apple Music MusicKit JS auth, unified in a dark-themed connection UI**

## What Happened

Scaffolded a Next.js 15 project with TypeScript and Tailwind CSS 4. Built Spotify OAuth 2.0 with a three-route pattern (redirect → callback → status) and token storage in HTTP-only cookies. SpotifyClient class wraps all API calls with pagination support for playlists and liked songs.

Apple Music auth uses MusicKit JS v3 loaded via CDN script tag. Server generates developer tokens (JWT signed with ES256 via jose library). The useAppleMusic hook manages MusicKit initialization, user authorization, and auth state.

AuthContext unifies both platform states and exposes them via useAuth hook. AuthStatus component renders side-by-side platform cards with connection status, user profile info, and connect/authorize buttons.

Hit a jose v6 incompatibility with webpack — v6 exports only webapi runtime which doesn't bundle correctly in Next.js server components. Pinned to jose v5 which has proper Node.js exports. Also required force-dynamic on API routes and dynamic imports for the home page to avoid prerender failures when env vars aren't set at build time.

## Deviations

- Used jose v5 instead of v6 due to webpack bundling issues
- Added dynamic import wrapper for HomePage to prevent SSR issues with MusicKit JS
- Added force-dynamic to API routes that depend on runtime env vars

## Files Created/Modified

- `src/lib/spotify.ts` — SpotifyClient class, OAuth helpers, token cookie encoding
- `src/app/api/auth/spotify/route.ts` — Spotify OAuth redirect
- `src/app/api/auth/spotify/callback/route.ts` — OAuth code exchange
- `src/app/api/auth/spotify/status/route.ts` — Connection status + token refresh
- `src/app/api/auth/apple-music/token/route.ts` — Developer token generation
- `src/hooks/useAppleMusic.ts` — MusicKit JS initialization and auth hook
- `src/contexts/AuthContext.tsx` — Unified auth provider
- `src/components/AuthStatus.tsx` — Platform connection cards
- `src/components/HomePage.tsx` — Main page with auth UI
- `src/types/index.ts` — Shared TypeScript interfaces
- `src/types/musickit.d.ts` — MusicKit JS type declarations
- `src/app/globals.css` — Dark theme with grain, platform-colored cards, animations
