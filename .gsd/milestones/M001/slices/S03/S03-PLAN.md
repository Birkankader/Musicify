# S03: Playlist Transfer & Migration Animation

**Goal:** Selected playlists are created on Apple Music with matched songs, album art flows across the screen during transfer, progress is tracked
**Demo:** Match results → click "Transfer" → album art animation plays → playlist created on Apple Music → success summary

## Tasks

- [ ] **T01: Apple Music playlist creation and transfer engine** `est:40m`
  - Create API route for Apple Music library operations (create playlist, add tracks)
  - Build `transferPlaylist()` in lib/transfer.ts that creates playlist + adds matched songs
  - Handle rate limiting, batch track additions (max ~100 per request)
  - Return TransferResult with per-song status

- [ ] **T02: Transfer UI with album art animation and progress** `est:45m`
  - Transfer button on MatchResults when matches exist
  - TransferView component: album art animation during transfer, progress bar
  - Success/completion summary with stats
  - Wire into HomePage flow: match results → transfer → completion
