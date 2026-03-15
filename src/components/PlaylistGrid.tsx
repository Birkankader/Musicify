'use client';

import { useState, useEffect } from 'react';
import type { SpotifyPlaylist } from '@/types';

interface PlaylistGridProps {
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void;
  onSelectLikedSongs: () => void;
  selectedPlaylistId: string | null;
}

interface PlaylistData {
  playlists: SpotifyPlaylist[];
  likedSongsTotal: number;
  userId: string;
}

export function PlaylistGrid({ onSelectPlaylist, onSelectLikedSongs, selectedPlaylistId }: PlaylistGridProps) {
  const [data, setData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  async function fetchPlaylists() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/spotify/playlists');
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Failed to fetch playlists (${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlists';
      setError(message);
      console.error('[PlaylistGrid]', message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fade-in">
        <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          Your Playlists
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="aspect-square rounded-lg mb-3" style={{ background: 'var(--border-subtle)' }} />
              <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--border-subtle)' }} />
              <div className="h-3 rounded w-1/2" style={{ background: 'var(--border-subtle)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--apple-pink)' }}>{error}</p>
        <button
          onClick={fetchPlaylists}
          className="text-sm font-medium px-4 py-2 rounded-full"
          style={{ background: 'var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Separate own playlists from followed ones
  const ownPlaylists = data.playlists.filter((p) => p.owner?.id === data.userId);
  const followedPlaylists = data.playlists.filter((p) => p.owner?.id !== data.userId);

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Your Playlists
        </h2>
        <span className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {ownPlaylists.length} own · {followedPlaylists.length} followed
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Liked Songs card */}
        <button
          onClick={onSelectLikedSongs}
          className="playlist-card text-left"
          data-selected={selectedPlaylistId === '__liked__' || undefined}
        >
          <div
            className="aspect-square rounded-lg mb-3 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5b47e0, #b347e0)' }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="font-medium text-sm truncate">Liked Songs</div>
          <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
            {data.likedSongsTotal.toLocaleString()} songs
          </div>
        </button>

        {/* Own playlists */}
        {ownPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            isOwn={true}
            isSelected={selectedPlaylistId === playlist.id}
            onSelect={() => onSelectPlaylist(playlist)}
          />
        ))}
      </div>

      {/* Followed playlists (shown but marked as restricted) */}
      {followedPlaylists.length > 0 && (
        <>
          <div className="flex items-center gap-3 mt-8 mb-4">
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Followed Playlists
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(250, 204, 21, 0.12)', color: '#facc15', fontFamily: 'var(--font-mono)' }}
            >
              limited access
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Spotify API restricts track access for playlists you don&apos;t own. These may not be transferable.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {followedPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                isOwn={false}
                isSelected={selectedPlaylistId === playlist.id}
                onSelect={() => onSelectPlaylist(playlist)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlaylistCard({
  playlist,
  isOwn,
  isSelected,
  onSelect,
}: {
  playlist: SpotifyPlaylist;
  isOwn: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="playlist-card text-left"
      data-selected={isSelected || undefined}
      style={{ opacity: isOwn ? 1 : 0.6 }}
    >
      <div className="aspect-square rounded-lg mb-3 overflow-hidden relative" style={{ background: 'var(--border-subtle)' }}>
        {playlist.images?.[0] ? (
          <img
            src={playlist.images[0].url}
            alt={playlist.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        {!isOwn && (
          <div
            className="absolute bottom-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--text-muted)' }}
          >
            followed
          </div>
        )}
      </div>
      <div className="font-medium text-sm truncate">{playlist.name}</div>
      <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
        {playlist.tracks?.total ?? 0} songs · {playlist.owner?.display_name ?? ''}
      </div>
    </button>
  );
}
