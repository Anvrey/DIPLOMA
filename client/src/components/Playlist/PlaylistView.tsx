import { useState, useEffect } from 'react';
import { getPlaylists, getPlaylist, deletePlaylist, removeTrackFromPlaylist } from '../../services/api';
import type { Playlist, Track } from '../../types';
import TrackList from '../TrackList/TrackList';
import ConfirmModal from '../common/ConfirmModal';

interface PlaylistViewProps {
  refreshKey?: number;
  likedTrackIds?: Set<number>;
  onAddToPlaylist?: (trackId: number) => void;
  onLikeToggle?: (track: Track, isLiked: boolean) => void;
  onCreatePlaylist?: () => void;
}

export default function PlaylistView({ refreshKey = 0, likedTrackIds, onAddToPlaylist, onLikeToggle, onCreatePlaylist }: PlaylistViewProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, [refreshKey]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data.playlists);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    setIsLoading(true);
    try {
      const p = await getPlaylist(id);
      setSelectedPlaylist(p);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!playlistToDelete) return;
    try {
      await deletePlaylist(playlistToDelete);
      if (selectedPlaylist?.id === playlistToDelete) {
        setSelectedPlaylist(null);
      }
      loadPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    } finally {
      setPlaylistToDelete(null);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistToDelete(id);
  };

  const handleRemoveTrack = async (trackId: number) => {
    if (!selectedPlaylist) return;
    try {
      await removeTrackFromPlaylist(selectedPlaylist.id, trackId);
      
      const p = await getPlaylist(selectedPlaylist.id);
      setSelectedPlaylist(p);
      loadPlaylists(); 
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  };

  if (isLoading && playlists.length === 0 && !selectedPlaylist) {
    return <div className="loader is-loading" style={{ margin: 'auto' }}></div>;
  }

  if (selectedPlaylist) {
    return (
      <div className="playlist-detail">
        <button className="button is-text" onClick={() => setSelectedPlaylist(null)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <h2 className="title is-3" style={{ marginTop: '1rem' }}>{selectedPlaylist.name}</h2>
        <TrackList 
          tracks={selectedPlaylist.tracks || []} 
          isLoading={isLoading} 
          likedTrackIds={likedTrackIds}
          onAddToPlaylist={onAddToPlaylist}
          onLikeToggle={onLikeToggle}
          onRemoveTrack={handleRemoveTrack}
        />
      </div>
    );
  }

  return (
    <div className="playlists-container">
      <h2 className="title is-4">Your Playlists</h2>
      {playlists.length === 0 ? (
        <p>You don't have any playlists yet.</p>
      ) : (
        <div className="columns is-multiline">
          {playlists.map(p => (
            <div className="column is-3-desktop is-4-tablet is-12-mobile" key={p.id}>
              <div className="card" onClick={() => handleSelect(p.id)} style={{ cursor: 'pointer' }}>
                <div className="card-content">
                  <p className="title is-5">{p.name}</p>
                  <p className="subtitle is-6">{p.trackIds.length} tracks</p>
                </div>
                <footer className="card-footer">
                  <button className="card-footer-item button is-danger is-light" onClick={(e) => handleDeleteClick(p.id, e)}>
                    Delete
                  </button>
                </footer>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {}
      {onCreatePlaylist && !selectedPlaylist && (
        <button 
          className="button is-primary is-rounded fab-create"
          onClick={onCreatePlaylist}
          title="Create Playlist"
        >
          <i className="fas fa-plus"></i>
        </button>
      )}

      <ConfirmModal 
        isOpen={!!playlistToDelete}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPlaylistToDelete(null)}
      />
    </div>
  );
}
