import { usePlayer } from '../../context/PlayerContext';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { currentTrack, isPlaying, progress, duration, volume, isShuffle, isRepeat, togglePlay, seek, setVolume, next, prev, toggleShuffle, toggleRepeat } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const hasCover = currentTrack.albumCoverUrl && !currentTrack.albumCoverUrl.includes('placeholder');

  return (
    <div className="player-bar">
      <div className="player-track-info">
        {hasCover ? (
          <img
            src={currentTrack.albumCoverUrl}
            alt={currentTrack.title}
          />
        ) : (
          <div className="player-track-placeholder">
            <i className="fas fa-music"></i>
          </div>
        )}
        <div>
          <div className="player-track-name">{currentTrack.title}</div>
          <div className="player-track-artist">{currentTrack.artist}</div>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button title="Shuffle" onClick={toggleShuffle} style={{ color: isShuffle ? '#ff3860' : 'inherit' }}>
            <i className="fas fa-random"></i>
          </button>
          <button title="Previous" onClick={prev}>
            <i className="fas fa-step-backward"></i>
          </button>
          <button className="play-pause-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          <button title="Next" onClick={next}>
            <i className="fas fa-step-forward"></i>
          </button>
          <button title="Repeat" onClick={toggleRepeat} style={{ color: isRepeat ? '#ff3860' : 'inherit' }}>
            <i className="fas fa-redo"></i>
          </button>
        </div>

        <div className="player-progress">
          <span className="time">{formatTime(progress)}</span>
          <progress
            className="progress is-danger is-small"
            value={progressPercent}
            max="100"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              seek(percent * duration);
            }}
          >
            {progressPercent}%
          </progress>
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}
