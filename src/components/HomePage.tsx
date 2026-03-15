'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthStatus } from '@/components/AuthStatus';
import { PlaylistGrid } from '@/components/PlaylistGrid';
import { useState, useEffect, useCallback } from 'react';
import type { SpotifyPlaylist } from '@/types';

function HomeContent() {
  const { bothConnected } = useAuth();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);

  const handleSelectPlaylist = useCallback((playlist: SpotifyPlaylist) => {
    setSelectedPlaylistId(playlist.id);
    setSelectedPlaylist(playlist);
    // T03 will wire this to matching
  }, []);

  const handleSelectLikedSongs = useCallback(() => {
    setSelectedPlaylistId('__liked__');
    setSelectedPlaylist(null);
    // T03 will wire this to liked songs matching
  }, []);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 fade-in">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--spotify-green)] to-[var(--apple-pink)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Musicify
            </span>
          </div>
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Spotify → Apple Music
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero — compact when both connected */}
          <div className={`text-center fade-in fade-in-delay-1 ${bothConnected ? 'mb-8' : 'mb-16 mt-[12vh]'}`}>
            <h1
              className={`font-bold tracking-tight mb-4 ${bothConnected ? 'text-3xl' : 'text-5xl'}`}
              style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}
            >
              {bothConnected ? 'Select playlists to transfer' : 'Move your music.'}
            </h1>
            {!bothConnected && (
              <p className="text-lg" style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                Transfer playlists and liked songs from Spotify to Apple Music. Fast, accurate, and satisfying to watch.
              </p>
            )}
          </div>

          {/* Auth Status */}
          <div className={`fade-in fade-in-delay-2 ${bothConnected ? 'mb-10' : ''}`}>
            <AuthStatus />
          </div>

          {/* Playlist Grid — shows when both connected */}
          {bothConnected && (
            <div className="fade-in fade-in-delay-3 mt-4">
              <PlaylistGrid
                onSelectPlaylist={handleSelectPlaylist}
                onSelectLikedSongs={handleSelectLikedSongs}
                selectedPlaylistId={selectedPlaylistId}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-8 py-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--spotify-green)] to-[var(--apple-pink)]" />
              <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Musicify
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="max-w-5xl w-full">
            <div className="text-center mb-16">
              <div className="h-12 w-64 mx-auto mb-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)' }} />
              <div className="h-6 w-96 mx-auto rounded animate-pulse" style={{ background: 'var(--border-subtle)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
              <div className="card p-8 h-48 animate-pulse" />
              <div className="hidden md:block w-8" />
              <div className="card p-8 h-48 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
