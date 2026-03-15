'use client';

import { useAuth } from '@/contexts/AuthContext';

export function AuthStatus() {
  const {
    isSpotifyConnected,
    spotifyUser,
    spotifyLoading,
    loginSpotify,
    isAppleMusicInitialized,
    isAppleMusicConnected,
    appleMusicError,
    authorizeAppleMusic,
    bothConnected,
  } = useAuth();

  return (
    <div className="w-full">
      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Spotify Card */}
        <div className={`card platform-card spotify ${isSpotifyConnected ? 'connected' : ''} p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--spotify-green)">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span className="text-xl font-semibold">Spotify</span>
          </div>

          {spotifyLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
            </div>
          ) : isSpotifyConnected && spotifyUser ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {spotifyUser.images?.[0] && (
                  <img
                    src={spotifyUser.images[0].url}
                    alt={spotifyUser.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-medium">{spotifyUser.display_name}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {spotifyUser.product === 'premium' ? 'Premium' : 'Free'} account
                  </div>
                </div>
              </div>
              <div className="status-badge connected">
                <span className="pulse-dot bg-[var(--spotify-green)]" />
                Connected
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Connect your Spotify account to access your playlists and liked songs.
              </p>
              <button onClick={loginSpotify} className="btn-spotify">
                Connect Spotify
              </button>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="hidden md:flex flex-col items-center gap-2">
          <div className="arrow-animate" style={{ color: bothConnected ? 'var(--spotify-green)' : 'var(--text-muted)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            migrate
          </span>
        </div>

        {/* Apple Music Card */}
        <div className={`card platform-card apple ${isAppleMusicConnected ? 'connected' : ''} p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <svg width="32" height="32" viewBox="0 0 361 361" fill="var(--apple-pink)">
              <path d="M255.5 0h-150C47.3 0 0 47.3 0 105.5v150C0 313.7 47.3 361 105.5 361h150c58.2 0 105.5-47.3 105.5-105.5v-150C361 47.3 313.7 0 255.5 0zM296 257.7c0 21.1-17.1 38.3-38.3 38.3H103.2c-21.1 0-38.3-17.1-38.3-38.3V121.3L180.5 64l115.5 57.3V257.7z" opacity="0.15"/>
              <path d="M233 130.2c0-2.7-1.6-5.2-4.1-6.4L183 100.5c-3.7-1.8-8.1-1.8-11.8 0l-45.9 23.3c-2.5 1.2-4.1 3.7-4.1 6.4v79.6c0 17.4 14.1 31.5 31.5 31.5h17c17.4 0 31.5-14.1 31.5-31.5v-49.3h-20v49.3c0 6.3-5.2 11.5-11.5 11.5h-17c-6.3 0-11.5-5.2-11.5-11.5v-73.2l38.5-19.5L219 136v73.8c0 6.3-5.2 11.5-11.5 11.5h-2c-6.3 0-11.5-5.2-11.5-11.5v-5h-20v5c0 17.4 14.1 31.5 31.5 31.5h2c17.4 0 31.5-14.1 31.5-31.5V130.2z"/>
            </svg>
            <span className="text-xl font-semibold">Apple Music</span>
          </div>

          {isAppleMusicConnected ? (
            <div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Apple Music authorized and ready for transfer.
              </p>
              <div className="status-badge connected" style={{ background: 'rgba(252, 60, 68, 0.12)', color: 'var(--apple-pink)' }}>
                <span className="pulse-dot bg-[var(--apple-pink)]" />
                Connected
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {isSpotifyConnected
                  ? 'Authorize Apple Music to start transferring your library.'
                  : 'Connect Spotify first, then authorize Apple Music.'}
              </p>
              {appleMusicError && (
                <p className="text-sm mb-4" style={{ color: 'var(--apple-pink)' }}>
                  {appleMusicError}
                </p>
              )}
              <button
                onClick={authorizeAppleMusic}
                className="btn-apple"
                disabled={!isAppleMusicInitialized || !isSpotifyConnected}
                style={{
                  opacity: (!isAppleMusicInitialized || !isSpotifyConnected) ? 0.4 : 1,
                  cursor: (!isAppleMusicInitialized || !isSpotifyConnected) ? 'not-allowed' : 'pointer',
                }}
              >
                {!isAppleMusicInitialized ? 'Loading MusicKit...' : 'Authorize Apple Music'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status hint */}
      <div className="text-center mt-12">
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {bothConnected
            ? 'Both platforms connected — ready to migrate your music'
            : isSpotifyConnected
              ? 'Spotify connected — authorize Apple Music to begin migration'
              : 'Connect both platforms to start migrating your music'}
        </p>
      </div>
    </div>
  );
}
