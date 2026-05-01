import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import type { Track } from '../types';
import { sendFeedback } from '../services/api';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: Track[];
  isShuffle: boolean;
  isRepeat: boolean;
  play: (track: Track, newQueue?: Track[]) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.7;

    audioRef.current.addEventListener('timeupdate', () => {
      setProgress(audioRef.current?.currentTime || 0);
    });

    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current?.duration || 0);
    });

    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      
      
      
      
    });
  }


  useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.onended = () => {
      if (isRepeat) {
        audioRef.current!.currentTime = 0;
        audioRef.current!.play();
      } else {
        next();
      }
    };
  }, [isRepeat]);

  const play = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (!audioRef.current) return;

    if (newQueue) {
      setQueue(newQueue);
    } else if (queue.length === 0) {
      setQueue([track]);
    }

    let urlToPlay = track.previewUrl;


    if (track.deezerLink) {
      const match = track.deezerLink.match(/track\/(\d+)/);
      if (match) {
        try {
          const res = await fetch(`/api/tracks/deezer/${match[1]}`);
          const data = await res.json();
          if (data.preview) {
            urlToPlay = data.preview;
          }
        } catch (error) {
          console.error('  previewUrl:', error);
        }
      }
    }
    if (urlToPlay && urlToPlay.startsWith('/uploads')) {
      const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      urlToPlay = `${serverUrl}${urlToPlay}`;
    }

    if (urlToPlay) {
      if (currentTrack?.id !== track.id) {
        audioRef.current.src = urlToPlay;
        audioRef.current.load();
      }
      audioRef.current.play().catch(e => console.error('Play error:', e));
      setCurrentTrack(track);
      setIsPlaying(true);


      sendFeedback(track.id, 'play').catch(() => {});

      
      const historyJson = localStorage.getItem('recentlyPlayed');
      let history: number[] = historyJson ? JSON.parse(historyJson) : [];
      
      history = [track.id, ...history.filter(id => id !== track.id)].slice(0, 10);
      localStorage.setItem('recentlyPlayed', JSON.stringify(history));
    }
  }, [currentTrack, queue.length]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;

    if (isPlaying) {
      pause();
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolumeState(vol);
    }
  }, []);

  const next = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = 0; 
    }

    play(queue[nextIndex]);
  }, [currentTrack, queue, isShuffle, play]);

  const prev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    

    if (progress > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1; 
    }

    play(queue[prevIndex]);
  }, [currentTrack, queue, progress, play]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat(prev => !prev);
  }, []);


  if (audioRef.current) {
    audioRef.current.onended = () => {
      if (isRepeat) {
        audioRef.current!.currentTime = 0;
        audioRef.current!.play();
        setIsPlaying(true);
      } else {
        next();
      }
    };
  }

  return (
    <PlayerContext.Provider value={{ 
      currentTrack, isPlaying, progress, duration, volume, queue, isShuffle, isRepeat,
      play, pause, togglePlay, seek, setVolume, next, prev, toggleShuffle, toggleRepeat
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
