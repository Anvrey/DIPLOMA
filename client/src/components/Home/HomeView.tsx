
import { useEffect, useState } from 'react';
import type { Track } from '../../types';
import TrackList from '../TrackList/TrackList';
import { getTracks } from '../../services/api';

interface HomeViewProps {
  likedTrackIds: Set<number>;
  onAddToPlaylist: (trackId: number) => void;
  onLikeToggle: (track: Track, isLiked: boolean) => void;
}

interface Collection {
  id: string;
  name: string;
  type: 'genre' | 'artist';
  color: string;
  icon: string;
}

export default function HomeView({ likedTrackIds, onAddToPlaylist, onLikeToggle }: HomeViewProps) {
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      setIsLoading(true);
      try {
        const result = await getTracks(1, 200); 
        const tracks = result.tracks;
        setAllTracks(tracks);

        
        setRecommendations([...tracks].sort(() => 0.5 - Math.random()).slice(0, 6));

        
        const historyIds: number[] = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
        const historyTracks = historyIds
          .map(id => tracks.find(t => t.id === id))
          .filter((t): t is Track => !!t);
        setRecentlyPlayed(historyTracks);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const collections: Collection[] = [
    { id: 'jazz', name: 'Jazz', type: 'genre', color: '#6c5ce7', icon: 'fa-sax-hot' },
    { id: 'rock', name: 'Rock', type: 'genre', color: '#ff7675', icon: 'fa-guitar' },
    { id: 'coltrane', name: 'John Coltrane', type: 'artist', color: '#00b894', icon: 'fa-user' },
    { id: 'donomar', name: 'Don Omar', type: 'artist', color: '#0984e3', icon: 'fa-user-ninja' }
  ];

  const getFilteredTracks = () => {
    if (!selectedCollection) return [];
    if (selectedCollection.type === 'genre') {
      return allTracks.filter(t => t.genre?.toLowerCase() === selectedCollection.name.toLowerCase());
    } else {
      return allTracks.filter(t => t.artist?.toLowerCase().includes(selectedCollection.name.toLowerCase()));
    }
  };

  if (selectedCollection) {
    return (
      <div className="collection-detail fade-in">
        <button className="button is-ghost mb-4" onClick={() => setSelectedCollection(null)} style={{ paddingLeft: 0, color: '#6200EE' }}>
          <span className="icon"><i className="fas fa-arrow-left"></i></span>
          <span>Back to Home</span>
        </button>

        <div className="detail-header is-flex is-align-items-center mb-5">
          <div className="collection-icon-large mr-4" style={{ backgroundColor: selectedCollection.color }}>
            <i className={`fas ${selectedCollection.icon}`}></i>
          </div>
          <div>
            <h1 className="title is-2">{selectedCollection.name}</h1>
            <p className="subtitle is-6 has-text-grey">Curated collection of {selectedCollection.type} hits</p>
          </div>
        </div>

        <TrackList
          tracks={getFilteredTracks()}
          isLoading={false}
          likedTrackIds={likedTrackIds}
          onAddToPlaylist={onAddToPlaylist}
          onLikeToggle={onLikeToggle}
        />
      </div>
    );
  }

  return (
    <div className="home-view fade-in">
      <header className="home-header" style={{ marginBottom: '2rem' }}>
        <h1 className="title is-2">Welcome Back</h1>
        <p className="subtitle is-6 has-text-grey">Your personalized music dashboard.</p>
      </header>

      <section className="home-section">
        <h2 className="title is-4">Recommended for You</h2>
        <TrackList
          tracks={recommendations}
          isLoading={isLoading}
          likedTrackIds={likedTrackIds}
          onAddToPlaylist={onAddToPlaylist}
          onLikeToggle={onLikeToggle}
        />
      </section>

      {recentlyPlayed.length > 0 && (
        <section className="home-section" style={{ marginTop: '2.5rem' }}>
          <h2 className="title is-4">Recently Played</h2>
          <TrackList
            tracks={recentlyPlayed}
            isLoading={false}
            likedTrackIds={likedTrackIds}
            onAddToPlaylist={onAddToPlaylist}
            onLikeToggle={onLikeToggle}
          />
        </section>
      )}

      <section className="home-section" style={{ marginTop: '2.5rem' }}>
        <h2 className="title is-4">Explore Collections</h2>
        <div className="columns is-multiline">
          {collections.map(col => (
            <div key={col.id} className="column is-3">
              <div className="collection-card" style={{ backgroundColor: col.color }} onClick={() => setSelectedCollection(col)}>
                <i className={`fas ${col.icon}`}></i>
                <span>{col.name}</span>
                <small style={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 400 }}>{col.type === 'genre' ? 'Genre' : 'Artist'}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
