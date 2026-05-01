
import { useState } from 'react';
import { createAIPlaylist } from '../../services/api';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  onSuccess: () => void;
}

export default function CreatePlaylistModal({ isOpen, onClose, onSubmit, onSuccess }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNormalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      await onSubmit(name.trim());
      resetAndClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !aiQuery.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      await createAIPlaylist(name.trim(), aiQuery.trim());
      onSuccess();
      resetAndClose();
    } catch (err: any) {
      setError(err.message || 'AI Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setName('');
    setAiQuery('');
    setIsAiMode(false);
    setError('');
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={resetAndClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">
            {isAiMode ? ' Create AI Playlist' : 'Create playlist'}
          </p>
          <button className="delete" aria-label="close" onClick={resetAndClose}></button>
        </header>
        <section className="modal-card-body">
          {error && <div className="notification is-danger is-light">{error}</div>}
          
          <div className="field">
            <label className="label">Playlist name</label>
            <div className="control">
              <input
                className="input"
                type="text"
                placeholder="e.g., My Top, For Workout..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {isAiMode && (
            <div className="field fade-in">
              <label className="label">What music should be here? (AI Prompt)</label>
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="e.g., calm music for studying, 80s rock for road trip..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  required
                ></textarea>
              </div>
              <p className="help">AI will find ~15 tracks based on your description.</p>
            </div>
          )}
        </section>
        <footer className="modal-card-foot" style={{ justifyContent: 'space-between' }}>
          <div>
            {!isAiMode ? (
              <button 
                className="button is-info is-light" 
                onClick={() => setIsAiMode(true)}
                style={{ backgroundColor: '#e0f7fa', color: '#006064', borderColor: '#b2ebf2' }}
              >
                 Create with AI
              </button>
            ) : (
              <button className="button is-text" onClick={() => setIsAiMode(false)}>
                Back to normal
              </button>
            )}
          </div>
          <div className="buttons">
            <button 
              onClick={isAiMode ? handleAiSubmit : handleNormalSubmit}
              className={`button is-danger ${isLoading ? 'is-loading' : ''}`}
              disabled={!name.trim() || (isAiMode && !aiQuery.trim()) || isLoading}
            >
              {isAiMode ? 'Generate' : 'Create'}
            </button>
            <button className="button" onClick={resetAndClose} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
