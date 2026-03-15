'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAppleMusicReturn {
  isInitialized: boolean;
  isAuthorized: boolean;
  authorize: () => Promise<void>;
  unauthorize: () => Promise<void>;
  musicInstance: MusicKit.MusicKitInstance | null;
  error: string | null;
}

export function useAppleMusic(): UseAppleMusicReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const musicRef = useRef<MusicKit.MusicKitInstance | null>(null);
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    initMusicKit();
  }, []);

  async function initMusicKit() {
    try {
      // Wait for MusicKit JS to load
      if (typeof window === 'undefined') return;

      await waitForMusicKit();

      // Fetch developer token from our API
      const res = await fetch('/api/auth/apple-music/token');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch developer token');
      }

      const { token } = await res.json();

      // Configure MusicKit
      await window.MusicKit.configure({
        developerToken: token,
        app: {
          name: 'Musicify',
          build: '1.0.0',
        },
      });

      const music = window.MusicKit.getInstance();
      musicRef.current = music;
      setIsInitialized(true);
      setIsAuthorized(music.isAuthorized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MusicKit initialization failed';
      console.error('MusicKit init error:', message);
      setError(message);
    }
  }

  const authorize = useCallback(async () => {
    if (!musicRef.current) {
      setError('MusicKit not initialized');
      return;
    }

    try {
      setError(null);
      const userToken = await musicRef.current.authorize();
      if (userToken) {
        setIsAuthorized(true);
      } else {
        setError('Authorization was cancelled');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authorization failed';
      console.error('Apple Music auth error:', message);
      setError(message);
    }
  }, []);

  const unauthorize = useCallback(async () => {
    if (!musicRef.current) return;

    try {
      await musicRef.current.unauthorize();
      setIsAuthorized(false);
    } catch (err) {
      console.error('Apple Music unauthorize error:', err);
    }
  }, []);

  return {
    isInitialized,
    isAuthorized,
    authorize,
    unauthorize,
    musicInstance: musicRef.current,
    error,
  };
}

function waitForMusicKit(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MusicKit) {
      resolve();
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (window.MusicKit) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error('MusicKit JS failed to load — check if the script tag is present'));
      }
    }, 100);
  });
}
