
import SearchBar from '../SearchBar/SearchBar';
import TrackList from '../TrackList/TrackList';
import type { Track } from '../../types';

interface DiscoverViewProps {
  onSearch: (query: string) => void;
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
  return (
    <div className="discover-view fade-in">
      <header className="discover-header" style={{ marginBottom: '2rem' }}>
        <h1 className="title is-2">Discover</h1>
        <p className="subtitle is-6 has-text-grey">Search for mood, genre, or anything you feel like hearing.</p>
      </header>

      <div className="discover-search-container" style={{ marginBottom: '3rem' }}>
        <SearchBar onSearch={onSearch} isLoading={isLoading} />
      </div>

      {searchQuery && (
        <section className="search-results">
          <h2 className="title is-4">Results for "{searchQuery}"</h2>
          <TrackList
            tracks={tracks}
            isLoading={isLoading}
            likedTrackIds={likedTrackIds}
            onAddToPlaylist={onAddToPlaylist}
            onLikeToggle={onLikeToggle}
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
