import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track } from '../types/music';
import { getDirectAudioUrl } from '../utils/dropbox';

export type RepeatMode = 'off' | 'all' | 'one';

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isLoading: boolean;
  error: string | null;
  isExpanded: boolean;
  
  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsExpanded: (expanded: boolean) => void;
  clearError: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Initialize shared audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.85;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Determine what to do next based on repeatMode
      onTrackEnded();
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      
      const audioErr = audio.error;
      let message = 'Unable to play this audio stream.';
      if (audioErr?.code === 4) {
        message = 'Format not supported or audio link is restricted / missing CORS permissions. Check your Dropbox link configuration.';
      } else if (audioErr?.code === 2) {
        message = 'Network connection error while fetching audio file.';
      } else if (audioErr?.code === 3) {
        message = 'Audio decoding failed.';
      }
      setError(message);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Update MediaSession API for mobile lockscreen & hardware controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Habajaba Studio LIVE',
        artwork: [
          { src: currentTrack.coverUrl || '/placeholder-cover.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => resume());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [currentTrack]);

  // Track playback execution
  const startPlayback = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setIsLoading(true);
    setCurrentTrack(track);

    const directUrl = getDirectAudioUrl(track.audioUrl);
    if (!directUrl) {
      setError('No playable audio link configured for this track.');
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }

    audio.pause();
    audio.src = directUrl;
    audio.currentTime = 0;
    setCurrentTime(0);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Playback initiation error:', err);
          setIsPlaying(false);
          setIsLoading(false);
          // Only show error if it wasn't a deliberate user pause
          if (err.name !== 'AbortError') {
            setError('Playback blocked by browser or audio resource unavailable.');
          }
        });
    }
  };

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      // If no new queue provided, ensure track is in queue
      setQueue(prev => {
        if (prev.some(t => t.id === track.id)) {
          return prev;
        }
        return [track, ...prev];
      });
      setQueueIndex(0);
    }

    startPlayback(track);
  }, []);

  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    setQueue(tracks);
    setQueueIndex(validIndex);
    startPlayback(tracks[validIndex]);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Resume error:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [currentTrack]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current && isFinite(seconds)) {
      const target = Math.max(0, Math.min(seconds, duration || 0));
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  }, [duration]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const nextRandom = Math.floor(Math.random() * queue.length);
      setQueueIndex(nextRandom);
      startPlayback(queue[nextRandom]);
      return;
    }

    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      startPlayback(queue[nextIndex]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      startPlayback(queue[0]);
    } else {
      pause();
    }
  }, [queue, queueIndex, isShuffle, repeatMode, pause]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;

    // If current time > 3s, restart current track first (standard player UX)
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }

    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      startPlayback(queue[prevIndex]);
    } else if (repeatMode === 'all') {
      const lastIndex = queue.length - 1;
      setQueueIndex(lastIndex);
      startPlayback(queue[lastIndex]);
    } else {
      seek(0);
    }
  }, [queue, queueIndex, repeatMode, seek]);

  const onTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      seek(0);
      resume();
      return;
    }
    playNext();
  }, [repeatMode, currentTrack, playNext, resume, seek]);

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const cycleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (index === queueIndex) {
        if (updated.length > 0) {
          const nextIdx = Math.min(index, updated.length - 1);
          setQueueIndex(nextIdx);
          startPlayback(updated[nextIdx]);
        } else {
          pause();
          setCurrentTrack(null);
          setQueueIndex(-1);
        }
      } else if (index < queueIndex) {
        setQueueIndex(queueIndex - 1);
      }
      return updated;
    });
  };

  const clearQueue = () => {
    pause();
    setQueue([]);
    setQueueIndex(-1);
    setCurrentTrack(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Keyboard accessibility listeners (Space, ArrowLeft, ArrowRight, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        playNext();
      } else if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        playPrevious();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, playNext, playPrevious, toggleMute]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        isShuffle,
        repeatMode,
        isLoading,
        error,
        isExpanded,
        playTrack,
        playQueue,
        togglePlay,
        pause,
        resume,
        seek,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeat,
        setVolume,
        toggleMute,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setIsExpanded,
        clearError,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
