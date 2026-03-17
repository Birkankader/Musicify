# Musicify

Transfer your Spotify playlists and liked songs to Apple Music.

Built with Next.js 15, React 19, TypeScript, and Tailwind CSS 4.

## Features

- **Playlist transfer** — select any Spotify playlist and create it on Apple Music with matched tracks
- **Liked songs transfer** — add your Spotify liked songs to Apple Music favorites (loved songs)
- **ISRC matching** — high-confidence matching using international standard recording codes
- **Metadata fallback** — artist + title + duration scoring for tracks without ISRC matches
- **Live progress** — real-time progress bar with album art animation during transfer
- **Dual auth** — Spotify OAuth + Apple Music MusicKit JS authorization

## How It Works

1. Connect your Spotify and Apple Music accounts
2. Browse your playlists or select "Liked Songs"
3. Musicify matches each track to the Apple Music catalog (ISRC first, metadata fallback)
4. Review match results — see ISRC hits, metadata matches, and unmatched tracks
5. Transfer — playlists are created on Apple Music; liked songs are added to your favorites

## Setup

### Prerequisites

- Node.js 18+
- A [Spotify Developer](https://developer.spotify.com/dashboard) app
- An [Apple Developer](https://developer.apple.com/account) account with a MusicKit key

### 1. Clone and install

```bash
git clone https://github.com/birkankader/Musicify.git
cd Musicify
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Apple Music
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_musickit_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Optional
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/spotify/callback
APPLE_MUSIC_STOREFRONT=us
```

**Spotify setup:**
1. Create an app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add `http://127.0.0.1:3000/api/auth/spotify/callback` as a redirect URI
3. Copy your Client ID and Client Secret

**Apple Music setup:**
1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)
2. Create a MusicKit key — download the `.p8` file
3. Note your Team ID and Key ID

You can either place the `.p8` file in the project root (named `AuthKey_{KEY_ID}.p8`) or paste the key contents into `APPLE_PRIVATE_KEY`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript |
| Spotify Auth | OAuth 2.0 (Authorization Code) |
| Apple Music Auth | MusicKit JS + JWT (ES256) |
| Token Signing | jose |

## License

MIT
