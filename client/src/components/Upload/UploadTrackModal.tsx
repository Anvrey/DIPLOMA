
import { useState, useRef } from 'react';
import { uploadTrack } from '../../services/api';

interface UploadTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadTrackModal({ isOpen, onClose, onSuccess }: UploadTrackModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !artist) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('genre', genre || 'Local');

    try {
      await uploadTrack(formData);
      setTitle('');
      setArtist('');
      setGenre('');
      setFile(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload track');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Upload your track</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {error && <div className="notification is-danger is-light">{error}</div>}
          
          <form id="upload-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Audio File (.mp3, .wav)</label>
              <div className="control">
                <div className="file has-name is-fullwidth">
                  <label className="file-label">
                    <input 
                      className="file-input" 
                      type="file" 
                      accept=".mp3,.wav"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                    <span className="file-cta">
                      <span className="file-icon">
                        <i className="fas fa-upload"></i>
                      </span>
                      <span className="file-label">Choose a file</span>
                    </span>
                    <span className="file-name">
                      {file ? file.name : 'No file selected'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Title</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Track title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Artist</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Artist name"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Genre (optional)</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="e.g., Hip-Hop, Rock"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button 
            type="submit" 
            form="upload-form" 
            className={`button is-danger ${isLoading ? 'is-loading' : ''}`}
            disabled={!file || !title || !artist || isLoading}
          >
            Upload
          </button>
          <button className="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
