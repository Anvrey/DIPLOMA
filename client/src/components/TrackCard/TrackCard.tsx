import { useState } from 'react';
import type { Track } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { sendFeedback } from '../../services/api';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  isLiked?: boolean;
  onAddToPlaylist?: (trackId: number) => void;
  onLikeToggle?: (track: Track, isLiked: boolean) => void;
  onRemoveFromPlaylist?: (trackId: number) => void;
  index?: number;
}

export default function TrackCard({ track, queue, isLiked = false, onAddToPlaylist, onLikeToggle, onRemoveFromPlaylist, index = 0 }: TrackCardProps) {
  const { play, togglePlay, currentTrack, isPlaying } = usePlayer();
  const { user } = useAuth();
  const [disliked, setDisliked] = useState(false);

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
