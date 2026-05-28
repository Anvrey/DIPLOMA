import type { Track } from '../../types';
import TrackCard from '../TrackCard/TrackCard';

interface TrackListProps {
  tracks: Track[];
  isLoading: boolean;
  likedTrackIds?: Set<number>;
  onAddToPlaylist?: (trackId: number) => void;
  onLikeToggle?: (track: Track, isLiked: boolean) => void;
  onRemoveTrack?: (trackId: number) => void;
  searchQuery?: string;
}

function SkeletonCard() {
  return (
    <div className="card track-card">
      <div className="card-image">
        <figure className="image is-square">
          <div className="skeleton" style={{ width: '100%', height: '100%', position: 'absolute' }}></div>
        </figure>
      </div>
      <div className="card-content">
        <div className="skeleton" style={{ height: '14px', width: '80%', marginBottom: '8px' }}></div>
        <div className="skeleton" style={{ height: '12px', width: '60%' }}></div>
      </div>
    </div>
  );
}

export default function TrackList({ tracks, isLoading, likedTrackIds, onAddToPlaylist, onLikeToggle, onRemoveTrack, searchQuery }: TrackListProps) {
  if (isLoading) {
    return (
      <div className="columns is-multiline">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="column is-3-desktop is-4-tablet is-6-mobile" key={i}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-music"></i>
        <p>Enter a query to find music</p>
      </div>
    );
  }

  return (
    <div className="columns is-multiline">
      {tracks.map((track, index) => (
        <div className="column is-3-desktop is-4-tablet is-6-mobile" key={track.id}>
          <TrackCard 
            track={track} 
            queue={tracks} 
            index={index} 
            isLiked={likedTrackIds?.has(track.id)}
            onAddToPlaylist={onAddToPlaylist} 
            onLikeToggle={onLikeToggle}
            onRemoveFromPlaylist={onRemoveTrack}
            searchQuery={searchQuery}
          />
        </div>
      ))}
    </div>
  );
}
