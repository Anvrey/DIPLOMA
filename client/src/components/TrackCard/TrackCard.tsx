import { useState } from 'react';
import type { Track } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { sendFeedback, explainTrackMatch } from '../../services/api';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  isLiked?: boolean;
  onAddToPlaylist?: (trackId: number) => void;
  onLikeToggle?: (track: Track, isLiked: boolean) => void;
  onRemoveFromPlaylist?: (trackId: number) => void;
  index?: number;
  searchQuery?: string; // When provided, shows "Why this track?" button
}

export default function TrackCard({ track, queue, isLiked = false, onAddToPlaylist, onLikeToggle, onRemoveFromPlaylist, index = 0, searchQuery }: TrackCardProps) {
  const { play, togglePlay, currentTrack, isPlaying } = usePlayer();
  const { user } = useAuth();
  const [disliked, setDisliked] = useState(false);

  // Why this track? state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      play(track, queue);
    }
  };

  const handleLike = () => {
    if (!user) return;
    setDisliked(false);
    onLikeToggle?.(track, !isLiked);
  };

  const handleDislike = async () => {
    if (!user) return;
    setDisliked(!disliked);
    if (isLiked) {
      onLikeToggle?.(track, false);
    }
    try {
      await sendFeedback(track.id, disliked ? 'skip' : 'dislike');
    } catch { }
  };

  const handleExplain = async () => {
    if (!searchQuery || explanation || isExplaining) return;
    setIsExplaining(true);
    setExplainError(null);
    try {
      const res = await explainTrackMatch(searchQuery, {
        id: track.id,
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        mood: (track as any).mood,
      });
      setExplanation(res.explanation);
    } catch (err: any) {
      if (err.status === 429) {
        setExplainError('⏳ Quota limit, wait a moment');
      } else {
        setExplainError('Could not explain');
      }
    } finally {
      setIsExplaining(false);
    }
  };

  const isLocal = track.previewUrl?.startsWith('/uploads');
  const hasCover = track.albumCoverUrl && !track.albumCoverUrl.includes('placeholder');

  return (
    <div className="track-card card fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="card-image" onClick={handlePlay}>
        <figure className="image is-square" style={{ backgroundColor: isLocal || !hasCover ? '#2c3e50' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasCover ? (
            <img
              src={track.albumCoverUrl}
              alt={`${track.title} cover`}
              loading="lazy"
            />
          ) : (
            <div style={{ color: '#ecf0f1', fontSize: '3rem' }}>
              <i className="fas fa-music"></i>
            </div>
          )}
        </figure>
        <div className="play-overlay">
          <i className={`fas ${isCurrentTrack && isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
        </div>
      </div>

      <div className="card-content">
        <p className="track-title" title={track.title}>{track.title}</p>
        <p className="track-artist" title={track.artist}>{track.artist}</p>
        {track.genre && <span className="genre-tag">{track.genre}</span>}

        {/* Why this track? explanation area */}
        {searchQuery && (
          <div style={{ marginTop: '0.5rem' }}>
            {!explanation && !explainError && (
              <button
                onClick={handleExplain}
                disabled={isExplaining}
                style={{
                  background: 'none',
                  border: '1px solid rgba(124, 77, 255, 0.35)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  color: '#9c6dff',
                  cursor: isExplaining ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                title="Ask AI why this track was recommended"
              >
                {isExplaining
                  ? <><i className="fas fa-circle-notch fa-spin" style={{ fontSize: '0.65rem' }}></i> Thinking...</>
                  : <><i className="fas fa-magic" style={{ fontSize: '0.65rem' }}></i> Why this track?</>
                }
              </button>
            )}
            {explanation && (
              <p style={{
                fontSize: '0.72rem',
                color: '#7c4dff',
                background: 'linear-gradient(135deg, rgba(124,77,255,0.08), rgba(124,77,255,0.04))',
                border: '1px solid rgba(124,77,255,0.2)',
                borderRadius: '8px',
                padding: '6px 8px',
                margin: 0,
                lineHeight: 1.4,
                fontStyle: 'italic',
              }}>
                ✨ {explanation}
              </p>
            )}
            {explainError && (
              <p style={{ fontSize: '0.7rem', color: '#f14668', margin: 0 }}>{explainError}</p>
            )}
          </div>
        )}
      </div>

      <footer className="card-footer">
        <button className={`card-footer-item ${isLiked ? 'is-liked' : ''}`} onClick={handleLike} title="Like">
          <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
        </button>
        <button className={`card-footer-item ${disliked ? 'is-disliked' : ''}`} onClick={handleDislike} title="Dislike">
          <i className={`${disliked ? 'fas' : 'far'} fa-thumbs-down`}></i>
        </button>
        <button className="card-footer-item" onClick={() => onAddToPlaylist?.(track.id)} title="Add to playlist">
          <i className="fas fa-plus"></i>
        </button>
        {onRemoveFromPlaylist && (
          <button className="card-footer-item button is-text has-text-danger" onClick={() => onRemoveFromPlaylist(track.id)} title="Remove from playlist">
            <i className="fas fa-trash-alt"></i>
          </button>
        )}
      </footer>
    </div>
  );
}
