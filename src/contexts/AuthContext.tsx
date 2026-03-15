'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAppleMusic } from '@/hooks/useAppleMusic';
import type { SpotifyUser } from '@/types';

interface AuthContextValue {
  // Spotify
  isSpotifyConnected: boolean;
  spotifyUser: SpotifyUser | null;
  spotifyLoading: boolean;
  loginSpotify: () => void;
  disconnectSpotify: () => Promise<void>;

  // Apple Music
  isAppleMusicInitialized: boolean;
  isAppleMusicConnected: boolean;
  appleMusicError: string | null;
  authorizeAppleMusic: () => Promise<void>;
  disconnectAppleMusic: () => Promise<void>;
  musicInstance: MusicKit.MusicKitInstance | null;

  // Combined
  bothConnected: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(true);

  const {
    isInitialized: isAppleMusicInitialized,
    isAuthorized: isAppleMusicConnected,
    authorize: authorizeAppleMusic,
    unauthorize: disconnectAppleMusic,
    musicInstance,
    error: appleMusicError,
  } = useAppleMusic();

  useEffect(() => {
    checkSpotifyStatus();
  }, []);

  async function checkSpotifyStatus() {
    try {
      const res = await fetch('/api/auth/spotify/status');
      const data = await res.json();
      setIsSpotifyConnected(data.connected);
      if (data.connected && data.user) {
        setSpotifyUser(data.user);
      }
    } catch (err) {
      console.error('Failed to check Spotify status:', err);
    } finally {
      setSpotifyLoading(false);
    }
  }

  const loginSpotify = useCallback(() => {
    window.location.href = '/api/auth/spotify';
  }, []);

  const disconnectSpotify = useCallback(async () => {
    try {
      await fetch('/api/auth/spotify/status', { method: 'DELETE' });
      setIsSpotifyConnected(false);
      setSpotifyUser(null);
    } catch (err) {
      console.error('Failed to disconnect Spotify:', err);
    }
  }, []);

  const value: AuthContextValue = {
    isSpotifyConnected,
    spotifyUser,
    spotifyLoading,
    loginSpotify,
    disconnectSpotify,
    isAppleMusicInitialized,
    isAppleMusicConnected,
    appleMusicError,
    authorizeAppleMusic,
    disconnectAppleMusic,
    musicInstance,
    bothConnected: isSpotifyConnected && isAppleMusicConnected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
