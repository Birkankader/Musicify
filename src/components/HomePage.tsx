'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthStatus } from '@/components/AuthStatus';
import { useState, useEffect } from 'react';

export function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      <main className="flex-1 flex items-center justify-center px-8 pb-16">
        <div className="max-w-5xl w-full">
          {/* Hero */}
          <div className="text-center mb-16 fade-in fade-in-delay-1">
            <h1
              className="text-5xl font-bold tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}
            >
              Move your music.
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              Transfer playlists and liked songs from Spotify to Apple Music. Fast, accurate, and satisfying to watch.
            </p>
          </div>

          {/* Auth Status — only render client-side */}
          <div className="fade-in fade-in-delay-2">
            {mounted ? (
              <AuthProvider>
                <AuthStatus />
              </AuthProvider>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                <div className="card p-8 h-48 animate-pulse" />
                <div className="hidden md:block w-8" />
                <div className="card p-8 h-48 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
