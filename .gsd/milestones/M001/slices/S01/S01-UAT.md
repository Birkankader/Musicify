# S01: Dual Platform Authentication — UAT

## Setup
1. Run `npm run dev` — app should start on http://localhost:3000
2. Ensure `.env.local` has Spotify and Apple Music credentials set

## Tests

### 1. Spotify Connection
- [ ] Page loads with "Connect Spotify" button visible
- [ ] Clicking "Connect Spotify" redirects to Spotify login page
- [ ] After authorizing on Spotify, redirected back to app
- [ ] Spotify card shows your display name and "Connected" badge
- [ ] Refresh the page — Spotify stays connected (cookie persists)

### 2. Apple Music Connection
- [ ] Apple Music card shows "Authorize Apple Music" button (disabled until Spotify is connected)
- [ ] After Spotify connects, Apple Music button becomes active
- [ ] Clicking "Authorize Apple Music" opens Apple ID sign-in
- [ ] After authorizing, Apple Music card shows "Connected" badge

### 3. Both Connected
- [ ] Both cards show green/red "Connected" badges
- [ ] Footer text updates to "Both platforms connected — ready to migrate your music"
- [ ] Arrow between cards turns green when both connected
