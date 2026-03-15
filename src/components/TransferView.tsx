'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MatchResult, TransferResult } from '@/types';
import { transferPlaylist, addToLibrary, type TransferProgress } from '@/lib/transfer';
import { useAuth } from '@/contexts/AuthContext';

interface TransferViewProps {
  playlistId: string;
  playlistName: string;
  matchResults: MatchResult[];
  onBack: () => void;
  onComplete: (result: TransferResult) => void;
}

type Phase = 'ready' | 'transferring' | 'done' | 'error';

export function TransferView({ playlistId, playlistName, matchResults, onBack, onComplete }: TransferViewProps) {
  const { musicInstance } = useAuth();
  const [phase, setPhase] = useState<Phase>('ready');
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artQueue, setArtQueue] = useState<string[]>([]);
  const abortRef = useRef(false);

  const matched = matchResults.filter((r) => r.appleMusicId);
  const unmatched = matchResults.filter((r) => !r.appleMusicId);

  // Collect album art URLs for animation
  useEffect(() => {
    const arts = matched
      .map((r) => r.spotifyTrack.album.images[0]?.url)
      .filter(Boolean) as string[];
    // Deduplicate
    setArtQueue([...new Set(arts)]);
  }, [matchResults]);

  const startTransfer = useCallback(async () => {
    if (!musicInstance) {
      setError('Apple Music not connected');
      return;
    }

    setPhase('transferring');
    setError(null);
    abortRef.current = false;

    try {
      const devTokenRes = await fetch('/api/auth/apple-music/token');
      const { token: developerToken } = await devTokenRes.json();
      const musicUserToken = musicInstance.musicUserToken;

      if (!musicUserToken) {
        throw new Error('Apple Music user token not available — please re-authorize');
      }

      let transferResult: TransferResult;

      if (playlistId === '__liked__') {
        transferResult = await addToLibrary(
          matchResults,
          musicUserToken,
          developerToken,
          (p) => { if (!abortRef.current) setProgress(p); }
        );
      } else {
        transferResult = await transferPlaylist(
          playlistName,
          playlistId,
          matchResults,
          musicUserToken,
          developerToken,
          (p) => { if (!abortRef.current) setProgress(p); }
        );
      }

      if (abortRef.current) return;

      setResult(transferResult);
      setPhase('done');
      onComplete(transferResult);
    } catch (err) {
      if (abortRef.current) return;
      const message = err instanceof Error ? err.message : 'Transfer failed';
      console.error('[TransferView]', message);
      setError(message);
      setPhase('error');
    }
  }, [musicInstance, playlistId, playlistName, matchResults, onComplete]);

  return (
    <div className="fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'var(--border-subtle)' }}
          disabled={phase === 'transferring'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {phase === 'done' ? 'Transfer Complete' : `Transfer: ${playlistName}`}
          </h2>
        </div>
      </div>

      {/* Ready state — confirm before transfer */}
      {phase === 'ready' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Songs to transfer</span>
              <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{matched.length}</span>
            </div>
            {unmatched.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Unmatched (will be skipped)</span>
                <span className="text-lg" style={{ color: 'var(--apple-pink)', fontFamily: 'var(--font-mono)' }}>{unmatched.length}</span>
              </div>
            )}
          </div>

          {/* Art preview */}
          <div className="flex gap-2 overflow-hidden h-16">
            {artQueue.slice(0, 12).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                style={{ opacity: 1 - i * 0.06, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>

          <button onClick={startTransfer} className="btn-apple w-full py-4 text-base">
            {playlistId === '__liked__' ? 'Add to Apple Music Library' : 'Create Playlist on Apple Music'}
          </button>
        </div>
      )}

      {/* Transferring state — animation */}
      {phase === 'transferring' && (
        <div className="space-y-6">
          {/* Album art flow animation */}
          <div className="transfer-animation-container">
            <div className="transfer-art-flow">
              {artQueue.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="transfer-art-item"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    opacity: progress && progress.completed > i ? 1 : 0.3,
                  }}
                />
              ))}
            </div>

            {/* Platform icons */}
            <div className="transfer-platforms">
              <div className="transfer-platform-icon spotify-glow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--spotify-green)">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>

              <div className="transfer-arrow-flow">
                <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                  <path d="M0 12h44M38 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="transfer-platform-icon apple-glow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--apple-pink)">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Progress info */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-[var(--apple-pink)] rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {progress?.phase === 'creating-playlist' && 'Creating playlist on Apple Music...'}
                {progress?.phase === 'adding-tracks' && `Adding tracks: ${progress.completed} / ${progress.total}`}
                {progress?.phase === 'done' && 'Finishing up...'}
                {!progress && 'Starting transfer...'}
              </span>
            </div>
            {progress && progress.total > 0 && (
              <div className="match-progress-bar active">
                <div
                  className="fill"
                  style={{
                    width: `${Math.round((progress.completed / progress.total) * 100)}%`,
                    background: 'var(--apple-gradient)',
                  }}
                />
              </div>
            )}
            {progress?.currentTrack && (
              <p className="text-xs mt-2 truncate" style={{ color: 'var(--text-muted)' }}>
                ♫ {progress.currentTrack}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && result && (
        <div className="space-y-6">
          {/* Success card */}
          <div className="card p-8 text-center" style={{ borderColor: 'rgba(29, 185, 84, 0.3)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(29, 185, 84, 0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--spotify-green)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Transfer Complete
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {result.stats.transferred} songs added to Apple Music
            </p>
          </div>

          {/* Stats */}
          <div className="stats-bar justify-center">
            <div className="stat-item">
              <div className="stat-dot" style={{ background: 'var(--spotify-green)' }} />
              <span style={{ color: 'var(--spotify-green)' }}>{result.stats.transferred} transferred</span>
            </div>
            {result.stats.failed > 0 && (
              <div className="stat-item">
                <div className="stat-dot" style={{ background: 'var(--apple-pink)' }} />
                <span style={{ color: 'var(--apple-pink)' }}>{result.stats.failed} failed</span>
              </div>
            )}
            {result.stats.unmatched > 0 && (
              <div className="stat-item">
                <div className="stat-dot" style={{ background: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-muted)' }}>{result.stats.unmatched} unmatched</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="text-sm font-medium px-6 py-2.5 rounded-full"
              style={{ background: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              Transfer Another
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="card p-6">
          <p className="text-sm mb-4" style={{ color: 'var(--apple-pink)' }}>{error}</p>
          <div className="flex gap-3">
            <button
              onClick={startTransfer}
              className="text-sm font-medium px-4 py-2 rounded-full"
              style={{ background: 'var(--apple-pink)', color: '#fff' }}
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="text-sm font-medium px-4 py-2 rounded-full"
              style={{ background: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
