
import { useState } from 'react';
import { createAIPlaylist, curatePlaylist } from '../../services/api';
import type { Track } from '../../types';

interface CuratedSegment {
  label: string;
  tracks: Track[];
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  onSuccess: () => void;
}

type Mode = 'normal' | 'ai' | 'curate';

export default function CreatePlaylistModal({ isOpen, onClose, onSubmit, onSuccess }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [curateScenario, setCurateScenario] = useState('');
  const [mode, setMode] = useState<Mode>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [curateResult, setCurateResult] = useState<{ plan: { name: string; description: string }; segments: CuratedSegment[] } | null>(null);

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

  const handleCurateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curateScenario.trim()) return;
    setIsLoading(true);
    setError('');
    setCurateResult(null);
    try {
      const result = await curatePlaylist(curateScenario.trim());
      setCurateResult({ plan: result.plan, segments: result.segments });
      onSuccess(); // refresh playlists in sidebar
    } catch (err: any) {
      const status = (err as any).status;
      if (status === 429) {
        setError('⏳ Gemini API quota exceeded. The free tier allows ~15 requests/min. Please wait 1–2 minutes and try again.');
      } else {
        setError(err.message || 'Curation failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setName('');
    setAiQuery('');
    setCurateScenario('');
    setMode('normal');
    setError('');
    setCurateResult(null);
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={resetAndClose}></div>
      <div className="modal-card" style={{ maxWidth: mode === 'curate' ? '680px' : '480px', width: '90%' }}>
        <header className="modal-card-head" style={{
          background: mode === 'curate' ? 'linear-gradient(135deg, #1a0533, #2d1052)' : undefined
        }}>
          <p className="modal-card-title" style={{ color: mode === 'curate' ? '#fff' : undefined }}>
            {mode === 'normal' && 'Create Playlist'}
            {mode === 'ai' && '🤖 Create with AI'}
            {mode === 'curate' && '✨ AI Playlist Curator'}
          </p>
          <button className="delete" aria-label="close" onClick={resetAndClose}></button>
        </header>

        <section className="modal-card-body">
          {error && <div className="notification is-danger is-light">{error}</div>}

          {/* Normal mode */}
          {mode === 'normal' && (
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
                />
              </div>
            </div>
          )}

          {/* AI mode */}
          {mode === 'ai' && (
            <>
              <div className="field">
                <label className="label">Playlist name</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g., Rainy Day Vibes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="field fade-in">
                <label className="label">Describe the music (AI Prompt)</label>
                <div className="control">
                  <textarea
                    className="textarea"
                    placeholder="e.g., calm music for studying, 80s rock for road trip..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                  ></textarea>
                </div>
                <p className="help">AI will find ~15 tracks based on your description.</p>
              </div>
            </>
          )}

          {/* Curate mode */}
          {mode === 'curate' && !curateResult && (
            <div className="fade-in">
              <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                Describe your playlist scenario. Gemini will plan the structure and fill it with real tracks.
              </p>
              <div className="field">
                <label className="label">Describe your scenario</label>
                <div className="control">
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="e.g., Workout playlist: 3 warm-up tracks, 6 intense cardio, 2 cool-down&#10;&#10;Morning study session: focus ambient, concentration, lo-fi beats&#10;&#10;Road trip: energetic pop, classic rock anthems, sing-along hits"
                    value={curateScenario}
                    onChange={(e) => setCurateScenario(e.target.value)}
                    autoFocus
                  ></textarea>
                </div>
                <p className="help">
                  <i className="fas fa-magic"></i> Gemini plans the structure → HNSW finds matching tracks from your library
                </p>
              </div>
            </div>
          )}

          {/* Curate result */}
          {curateResult && (
            <div className="fade-in">
              <div style={{
                background: 'linear-gradient(135deg, #1a0533, #2d1052)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                color: '#fff',
              }}>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{curateResult.plan.name}</p>
                <p style={{ opacity: 0.75, fontSize: '0.85rem', margin: '4px 0 0' }}>{curateResult.plan.description}</p>
              </div>

              {curateResult.segments.map((seg, si) => (
                <div key={si} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#7c4dff', marginBottom: '0.4rem' }}>
                    {seg.label} <span style={{ color: '#aaa', fontWeight: 400 }}>({seg.tracks.length} tracks)</span>
                  </p>
                  {seg.tracks.map(t => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.3rem 0', borderBottom: '1px solid #f0f0f0'
                    }}>
                      {t.albumCoverUrl && !t.albumCoverUrl.includes('placeholder') ? (
                        <img src={t.albumCoverUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: '#2c3e50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-music" style={{ color: '#fff', fontSize: '0.7rem' }}></i>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</p>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.75rem' }}>{t.artist}</p>
                      </div>
                      {t.genre && <span style={{ fontSize: '0.7rem', color: '#7c4dff', background: '#f3e8ff', borderRadius: 4, padding: '1px 6px' }}>{t.genre}</span>}
                    </div>
                  ))}
                </div>
              ))}

              <div className="notification is-success is-light" style={{ marginTop: '1rem' }}>
                <i className="fas fa-check-circle"></i> Playlist saved to your library!
              </div>
            </div>
          )}
        </section>

        <footer className="modal-card-foot" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {mode !== 'curate' && (
              <button
                className="button"
                style={{ background: 'linear-gradient(135deg, #1a0533, #2d1052)', color: '#fff', border: 'none' }}
                onClick={() => setMode('curate')}
              >
                ✨ AI Curator
              </button>
            )}
            {mode === 'normal' && (
              <button className="button is-info is-light" onClick={() => setMode('ai')}>
                🤖 Quick AI
              </button>
            )}
            {(mode === 'ai' || mode === 'curate') && !curateResult && (
              <button className="button is-text" onClick={() => setMode('normal')}>
                ← Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!curateResult && (
              <button
                onClick={mode === 'normal' ? handleNormalSubmit : mode === 'ai' ? handleAiSubmit : handleCurateSubmit}
                className={`button is-danger ${isLoading ? 'is-loading' : ''}`}
                style={{ margin: 0 }}
                disabled={
                  isLoading ||
                  (mode === 'normal' && !name.trim()) ||
                  (mode === 'ai' && (!name.trim() || !aiQuery.trim())) ||
                  (mode === 'curate' && !curateScenario.trim())
                }
              >
                {mode === 'normal' && 'Create'}
                {mode === 'ai' && 'Generate'}
                {mode === 'curate' && '✨ Curate'}
              </button>
            )}
            <button className="button" style={{ margin: 0 }} onClick={resetAndClose} disabled={isLoading}>
              {curateResult ? 'Close' : 'Cancel'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
