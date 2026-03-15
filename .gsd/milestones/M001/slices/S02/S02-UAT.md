# S02: Playlist Discovery & Song Matching — UAT

## Setup
1. Run `npm run dev` — app on http://localhost:3000
2. Both Spotify and Apple Music must be connected (S01 prerequisite)

## Tests

### 1. Playlist Grid
- [ ] After both platforms connected, playlist grid appears below auth cards
- [ ] All Spotify playlists visible with cover art, name, track count
- [ ] Liked songs shown as a separate card with heart icon
- [ ] Clicking a playlist highlights/selects it

### 2. Song Matching
- [ ] After selecting a playlist, matching begins with progress indicator
- [ ] Progress shows "Matching X of Y songs..."
- [ ] Songs with ISRC show green check icon and "ISRC" badge
- [ ] Songs matched by metadata show yellow icon and "Metadata" badge  
- [ ] Unmatched songs show red X icon

### 3. Match Stats
- [ ] Stats bar shows total, ISRC matched, metadata matched, unmatched counts
- [ ] Numbers are accurate — spot check a few songs manually
- [ ] ISRC matches show confidence 1.0, metadata matches show 0.5-0.9

### 4. Edge Cases
- [ ] Empty playlist shows "No tracks" message
- [ ] Playlist with only local files shows appropriate message
- [ ] Large playlist (100+ songs) completes matching without timeout
- [ ] Selecting a different playlist clears previous results and starts fresh
