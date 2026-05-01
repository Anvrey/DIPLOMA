import { useState, useEffect } from 'react';
import { getPlaylists } from '../../services/api';
import type { Playlist } from '../../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (playlistId: string) => Promise<void>;
  onCreateNew: () => void;
}

export default function AddToPlaylistModal({ isOpen, onClose, onSelect, onCreateNew }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data.playlists);
    } catch (err) {
      console.error('Error loading playlists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    setActionLoadingId(id);
    try {
      await onSelect(id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Add to playlist</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {isLoading ? (
            <div className="loader is-loading" style={{ margin: 'auto' }}></div>
          ) : playlists.length === 0 ? (
            <div className="has-text-centered">
              <p className="mb-4">You don't have any playlists yet.</p>
            </div>
          ) : (
            <div className="list is-hoverable">
              {playlists.map(p => (
                <button
                  key={p.id}
                  className={`list-item button is-fullwidth is-justify-content-space-between mb-2 ${actionLoadingId === p.id ? 'is-loading' : ''}`}
                  onClick={() => handleSelect(p.id)}
                  disabled={!!actionLoadingId}
                >
                  <span>{p.name}</span>
                  <span className="tag is-rounded">{p.trackIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        <footer className="modal-card-foot is-justify-content-space-between">
          <button className="button is-primary" onClick={() => { onClose(); onCreateNew(); }}>
            <i className="fas fa-plus mr-2"></i> Create new
          </button>
          <button className="button" onClick={onClose}>Cancel</button>
        </footer>
      </div>
    </div>
  );
}
