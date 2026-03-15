'use client';

import { useState, useEffect, useRef } from 'react';
import type { SpotifyTrack, MatchResult } from '@/types';
import { matchTracks, matchStats, type MatchProgress } from '@/lib/matching';

interface MatchResultsProps {
  playlistId: string;
  playlistName: string;
  onBack: () => void;
  onMatchComplete?: (results: MatchResult[]) => void;
  onTransfer?: (results: MatchResult[]) => void;
}

type Phase = 'loading-tracks' | 'matching' | 'done' | 'error';

export function MatchResults({ playlistId, playlistName, onBack, onMatchComplete, onTransfer }: MatchResultsProps) {
  const [phase, setPhase] = useState<Phase>('loading-tracks');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [progress, setProgress] = useState<MatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'isrc' | 'metadata' | 'unmatched'>('all');
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    startMatching();

    return () => {
      abortRef.current = true;
    };
  }, [playlistId]);

  async function startMatching() {
    try {
      // Phase 1: Fetch tracks
      setPhase('loading-tracks');
      setResults([]);
      setProgress(null);
      setError(null);

      const res = await fetch(`/api/spotify/playlists/${playlistId}/tracks`);
      if (!res.ok) {
        const body = await res.json();
        const msg = body.error || `Failed to fetch tracks (${res.status})`;
        // Detect Spotify 403 — API restriction on non-owned playlists
        if (msg.includes('403') || msg.includes('Forbidden')) {
          throw new Error('Spotify restricts track access for playlists you don\'t own. Try one of your own playlists or Liked Songs.');
        }
        throw new Error(msg);
      }

      const { tracks: fetchedTracks } = await res.json();
      if (abortRef.current) return;

      setTracks(fetchedTracks);

      if (fetchedTracks.length === 0) {
        setPhase('done');
        return;
      }

      // Phase 2: Match tracks
      setPhase('matching');

      const matchResults = await matchTracks(fetchedTracks, (p) => {
        if (!abortRef.current) setProgress(p);
      });

      if (abortRef.current) return;

      setResults(matchResults);
      setPhase('done');
      onMatchComplete?.(matchResults);
    } catch (err) {
      if (abortRef.current) return;
      const message = err instanceof Error ? err.message : 'Matching failed';
      setError(message);
      setPhase('error');
      console.error('[MatchResults]', message);
    }
  }

  const stats = results.length > 0 ? matchStats(results) : null;

  const filteredResults = filter === 'all'
    ? results
    : results.filter((r) => r.matchType === filter);

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'var(--border-subtle)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1 min-w-0">
          <h2
            className="text-2xl font-semibold truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {playlistName}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {tracks.length > 0 ? `${tracks.length} tracks` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Progress / Loading */}
      {(phase === 'loading-tracks' || phase === 'matching') && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-[var(--spotify-green)] rounded-full animate-spin" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {phase === 'loading-tracks'
                ? 'Fetching tracks from Spotify...'
                : progress
                  ? `${progress.phase === 'isrc' ? 'ISRC lookup' : 'Metadata search'}: ${progress.completed} / ${progress.total}`
                  : 'Starting match...'}
            </span>
          </div>
          {progress && (
            <div className={`match-progress-bar ${phase === 'matching' ? 'active' : ''}`}>
              <div
                className="fill"
                style={{ width: `${Math.round((progress.completed / Math.max(progress.total, 1)) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="card p-6 mb-6">
          <p className="text-sm mb-4" style={{ color: 'var(--apple-pink)' }}>{error}</p>
          <button
            onClick={startMatching}
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{ background: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats bar */}
      {stats && phase === 'done' && (
        <div className="stats-bar mb-6">
          <div className="stat-item">
            <div className="stat-dot" style={{ background: 'var(--text-primary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>{stats.total} total</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: 'var(--spotify-green)' }} />
            <span style={{ color: 'var(--spotify-green)' }}>{stats.isrc} ISRC</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#facc15' }} />
            <span style={{ color: '#facc15' }}>{stats.metadata} metadata</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: 'var(--apple-pink)' }} />
            <span style={{ color: 'var(--apple-pink)' }}>{stats.unmatched} unmatched</span>
          </div>
        </div>
      )}

      {/* Transfer button */}
      {stats && phase === 'done' && (stats.isrc + stats.metadata) > 0 && onTransfer && (
        <div className="mb-6">
          <button
            onClick={() => onTransfer(results)}
            className="btn-apple w-full py-3.5 text-base"
          >
            Transfer {stats.isrc + stats.metadata} songs to Apple Music
          </button>
        </div>
      )}

      {/* Filter tabs */}
      {stats && phase === 'done' && (
        <div className="flex gap-2 mb-4">
          {(['all', 'isrc', 'metadata', 'unmatched'] as const).map((f) => {
            const count = f === 'all' ? stats.total
              : f === 'isrc' ? stats.isrc
              : f === 'metadata' ? stats.metadata
              : stats.unmatched;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  background: filter === f ? 'var(--border-glow)' : 'transparent',
                  color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: `1px solid ${filter === f ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                }}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results list */}
      {phase === 'done' && filteredResults.length > 0 && (
        <div className="space-y-1">
          {filteredResults.map((result, i) => (
            <MatchRow key={`${result.spotifyTrack.id}-${i}`} result={result} />
          ))}
        </div>
      )}

      {/* Empty filtered */}
      {phase === 'done' && filteredResults.length === 0 && results.length > 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No tracks match this filter.
          </p>
        </div>
      )}

      {/* Empty playlist */}
      {phase === 'done' && tracks.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            This playlist has no tracks.
          </p>
        </div>
      )}
    </div>
  );
}

function MatchRow({ result }: { result: MatchResult }) {
  const { spotifyTrack, matchType, confidence, appleMusicTrack } = result;
  const albumArt = spotifyTrack.album.images[spotifyTrack.album.images.length - 1]?.url
    ?? spotifyTrack.album.images[0]?.url;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg transition-colors"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Album art */}
      <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0" style={{ background: 'var(--border-subtle)' }}>
        {albumArt ? (
          <img src={albumArt} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{spotifyTrack.name}</div>
        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {spotifyTrack.artists.map((a) => a.name).join(', ')}
        </div>
      </div>

      {/* Apple Music match info */}
      {appleMusicTrack && (
        <div className="hidden sm:block text-xs text-right flex-shrink-0 max-w-[160px] truncate" style={{ color: 'var(--text-muted)' }}>
          {appleMusicTrack.attributes.name}
        </div>
      )}

      {/* Match badge */}
      <div className={`match-badge ${matchType} flex-shrink-0`}>
        {matchType === 'isrc' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {matchType === 'metadata' && '~'}
        {matchType === 'unmatched' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
        {matchType === 'unmatched' ? 'miss' : matchType}
        {matchType === 'metadata' && ` ${Math.round(confidence * 100)}%`}
      </div>
    </div>
  );
}
