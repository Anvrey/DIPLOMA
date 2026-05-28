import { useState, useEffect } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import TrackList from '../TrackList/TrackList';
import type { Track } from '../../types';
import { getSearchVibe } from '../../services/api';

interface Vibe {
  mood: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
}

interface DiscoverViewProps {
  onSearch: (query: string, diversity: number) => void;
  tracks: Track[];
  isLoading: boolean;
  searchQuery: string;
  likedTrackIds: Set<number>;
  onAddToPlaylist: (trackId: number) => void;
  onLikeToggle: (track: Track, isLiked: boolean) => void;
}

export default function DiscoverView({
  onSearch,
  tracks,
  isLoading,
  searchQuery,
  likedTrackIds,
  onAddToPlaylist,
  onLikeToggle
}: DiscoverViewProps) {
  const [diversity, setDiversity] = useState(0);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [vibeError, setVibeError] = useState(false);

  // Fetch vibe whenever search query and results change
  useEffect(() => {
    if (!searchQuery || tracks.length === 0) {
      setVibe(null);
      setVibeError(false);
      return;
    }
    let cancelled = false;
    setVibeLoading(true);
    setVibeError(false);
    getSearchVibe(searchQuery)
      .then(res => {
        if (!cancelled) {
          // Suppress fallback 'neutral' vibe (shown on API errors/rate limits)
          if (res.vibe.mood === 'neutral') {
            setVibeError(true);
          } else {
            setVibe(res.vibe);
          }
        }
      })
      .catch(() => { if (!cancelled) setVibeError(true); })
      .finally(() => { if (!cancelled) setVibeLoading(false); });
    return () => { cancelled = true; };
  }, [searchQuery, tracks]);

  const vibeStyle = vibe ? {
    background: `linear-gradient(135deg, ${vibe.gradientFrom} 0%, ${vibe.gradientTo} 100%)`,
    borderRadius: '16px',
    padding: '2rem',
    transition: 'background 0.8s ease',
  } : {};

  return (
    <div className="discover-view fade-in">
      <header className="discover-header" style={{ marginBottom: '2rem' }}>
        <h1 className="title is-2">Discover</h1>
        <p className="subtitle is-6 has-text-grey">Search for mood, genre, or anything you feel like hearing.</p>
      </header>

      <div className="discover-search-container" style={{ marginBottom: '3rem' }}>
        <SearchBar onSearch={(q) => onSearch(q, diversity)} isLoading={isLoading} />

        <div style={{ marginTop: '1.5rem', maxWidth: '400px', margin: '1.5rem auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>
            <span><i className="fas fa-bullseye"></i> Precision</span>
            <span>Discovery <i className="fas fa-random"></i></span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={diversity}
            onChange={(e) => setDiversity(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
            {diversity === 0 ? 'Exact matches only' : `Diversity level: ${Math.round(diversity * 100)}%`}
          </p>
        </div>
      </div>

      {searchQuery && (
        <section className="search-results">
          {/* Variant G: Visual Vibe Banner */}
          {vibe && !vibeLoading && (
            <div style={{
              ...vibeStyle,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '2.5rem' }}>{vibe.emoji}</span>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                  {vibe.mood.charAt(0).toUpperCase() + vibe.mood.slice(1)} Vibe
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                  AI-generated mood palette for "{searchQuery}"
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                {[vibe.gradientFrom, vibe.gradientTo, vibe.accent].map((c, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: c, border: '2px solid rgba(255,255,255,0.3)'
                  }} title={c} />
                ))}
              </div>
            </div>
          )}
          {vibeLoading && (
            <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.85rem' }}>
              <i className="fas fa-magic fa-spin"></i> Generating mood palette...
            </div>
          )}
          {vibeError && !vibeLoading && (
            <div style={{ marginBottom: '1rem', color: '#aaa', fontSize: '0.8rem', fontStyle: 'italic' }}>
              <i className="fas fa-palette"></i> Mood palette unavailable (Gemini quota)
            </div>
          )}

          <h2 className="title is-4">Results for "{searchQuery}"</h2>
          <TrackList
            tracks={tracks}
            isLoading={isLoading}
            likedTrackIds={likedTrackIds}
            onAddToPlaylist={onAddToPlaylist}
            onLikeToggle={onLikeToggle}
            searchQuery={searchQuery}
          />
        </section>
      )}

      {!searchQuery && !isLoading && (
        <div className="discover-empty has-text-centered" style={{ padding: '4rem 0' }}>
          <i className="fas fa-search-location" style={{ fontSize: '4rem', color: '#eee', marginBottom: '1.5rem' }}></i>
          <p className="has-text-grey">Type something above to start your AI-powered music journey.</p>
        </div>
      )}
    </div>
  );
}
