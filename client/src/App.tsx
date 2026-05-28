import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import TrackList from './components/TrackList/TrackList';
import PlaylistView from './components/Playlist/PlaylistView';
import HomeView from './components/Home/HomeView';
import DiscoverView from './components/Discover/DiscoverView';
import CreatePlaylistModal from './components/Playlist/CreatePlaylistModal';
import AddToPlaylistModal from './components/Playlist/AddToPlaylistModal';
import MobileNav from './components/MobileNav/MobileNav';
import Player from './components/Player/Player';
import AuthModal from './components/Auth/AuthModal';
import UploadTrackModal from './components/Upload/UploadTrackModal';
import { useAuth } from './context/AuthContext';
import { searchTracks, getTracks, createPlaylist as apiCreatePlaylist, getPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, sendFeedback } from './services/api';
import type { Track } from './types';

export default function App() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState(() =>
    localStorage.getItem('token') ? 'home' : 'search'
  );
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistRefreshKey, setPlaylistRefreshKey] = useState(0);
  const [trackToAdd, setTrackToAdd] = useState<number | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<number>>(new Set());
  const [showUpload, setShowUpload] = useState(false);

  const prevUserRef = useRef(user);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    if (user) {
      if (!prevUser) {
        setActiveView('home');
      }
      getPlaylists().then(data => {
        const likedPlaylist = data.playlists.find(p => p.name === 'Liked Tracks' || p.name === ' ');
        if (likedPlaylist) {
          setLikedTrackIds(new Set(likedPlaylist.trackIds));
        }
      }).catch(console.error);
    } else {
      // Switch view only on actual logout (was logged in, now null)
      if (prevUser) {
        setActiveView('search');
      }
      Promise.resolve().then(() => {
        setLikedTrackIds(prev => prev.size === 0 ? prev : new Set());
      });
    }
  }, [user]);


  const handleSearch = useCallback(async (query: string, diversity: number = 0) => {
    setIsLoading(true);
    setSearchQuery(query);
    setActiveView('search');
    try {
      const result = await searchTracks(query, 20, diversity);
      setTracks(result.tracks);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleBrowse = useCallback(async () => {
    setIsLoading(true);
    setActiveView('browse');
    try {
      const result = await getTracks(1, 100);
      setTracks(result.tracks);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleViewChange = useCallback((view: string) => {
    setActiveView(view);
    setSearchQuery('');

    if (view === 'browse') {
      handleBrowse();
    } else if (view === 'home') {

      setTracks([]);
    } else {
      setTracks([]);
    }
  }, [handleBrowse]);





  const handleCreatePlaylistClick = useCallback(() => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowCreatePlaylist(true);
  }, [user]);

  const handleUploadClick = useCallback(() => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowUpload(true);
  }, [user]);

  const handlePlaylistSubmit = useCallback(async (name: string) => {
    try {
      await apiCreatePlaylist(name);
      setPlaylistRefreshKey(Date.now());
      if (activeView !== 'playlists') {
        handleViewChange('playlists');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }, [activeView, handleViewChange]);


  const handleAddToPlaylistClick = useCallback((trackId: number) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setTrackToAdd(trackId);
  }, [user]);

  const handlePlaylistSelect = useCallback(async (playlistId: string) => {
    if (!trackToAdd) return;
    try {
      await addTrackToPlaylist(playlistId, trackToAdd);
      setPlaylistRefreshKey(Date.now());
      alert('Track added to playlist!');
    } catch (error) {
      console.error('Error adding to playlist:', error);
      alert('Error adding track');
    } finally {
      setTrackToAdd(null);
    }
  }, [trackToAdd]);

  const handleLikeToggle = useCallback(async (track: Track, isLiked: boolean) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const { playlists } = await getPlaylists();
      let likedPlaylist = playlists.find(p => p.name === 'Liked Tracks' || p.name === ' ');

      if (isLiked) {
        setLikedTrackIds(prev => new Set([...prev, track.id]));
        await sendFeedback(track.id, 'like').catch(() => { });

        if (!likedPlaylist) {
          likedPlaylist = await apiCreatePlaylist('Liked Tracks');
        }
        await addTrackToPlaylist(likedPlaylist.id, track.id);
      } else {
        setLikedTrackIds(prev => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });

        if (likedPlaylist) {
          await removeTrackFromPlaylist(likedPlaylist.id, track.id);
        }
      }
      setPlaylistRefreshKey(Date.now());
    } catch (err) {
      console.error('Error saving like:', err);
    }
  }, [user]);




  return (
    <>
      <Header onAuthClick={() => setShowAuth(true)} />

      <div className="app-layout">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          onCreatePlaylist={handleCreatePlaylistClick}
          onUpload={handleUploadClick}
        />

        <main className="app-main">
          {activeView === 'home' && (
            <HomeView
              likedTrackIds={likedTrackIds}
              onAddToPlaylist={handleAddToPlaylistClick}
              onLikeToggle={handleLikeToggle}
            />
          )}

          {activeView === 'search' && (
            <DiscoverView
              onSearch={handleSearch}
              tracks={tracks}
              isLoading={isLoading}
              searchQuery={searchQuery}
              likedTrackIds={likedTrackIds}
              onAddToPlaylist={handleAddToPlaylistClick}
              onLikeToggle={handleLikeToggle}
            />
          )}

          {activeView === 'playlists' && (
            <PlaylistView
              refreshKey={playlistRefreshKey}
              likedTrackIds={likedTrackIds}
              onAddToPlaylist={handleAddToPlaylistClick}
              onLikeToggle={handleLikeToggle}
              onCreatePlaylist={handleCreatePlaylistClick}
            />
          )}

          {activeView === 'browse' && (
            <>
              <h2 className="title is-4" style={{ marginBottom: '1rem' }}>All Tracks</h2>
              <TrackList
                tracks={tracks}
                isLoading={isLoading}
                likedTrackIds={likedTrackIds}
                onAddToPlaylist={handleAddToPlaylistClick}
                onLikeToggle={handleLikeToggle}
              />
            </>
          )}
        </main>
      </div>

      <Player />
      <MobileNav activeView={activeView} onViewChange={handleViewChange} onUploadClick={handleUploadClick} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onSubmit={handlePlaylistSubmit}
        onSuccess={() => {
          setPlaylistRefreshKey(Date.now());
          if (activeView !== 'playlists') {
            handleViewChange('playlists');
          }
        }}
      />
      <AddToPlaylistModal
        isOpen={!!trackToAdd}
        onClose={() => setTrackToAdd(null)}
        onSelect={handlePlaylistSelect}
        onCreateNew={() => setShowCreatePlaylist(true)}
      />
      <UploadTrackModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          if (activeView === 'browse') handleBrowse();
          alert('Track uploaded successfully!');
        }}
      />
    </>
  );
}
