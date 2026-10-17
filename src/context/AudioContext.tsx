import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track } from '../types/music';
import { getDirectAudioUrl } from '../utils/dropbox';
import { extractYouTubeVideoId, isYouTubeUrl } from '../utils/youtube';

export type RepeatMode = 'off' | 'all' | 'one';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

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
  isYouTubeTrack: boolean;
  youtubeVideoId: string | null;

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
  const ytPlayerRef = useRef<any>(null);
  const ytIntervalRef = useRef<number | null>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const pendingYtVideoIdRef = useRef<string | null>(null);
  const pendingYtStartTimeRef = useRef<number>(0);

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
  const [isYouTubeTrack, setIsYouTubeTrack] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  // Initialize YouTube IFrame API Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initYT = () => {
      if (window.YT && window.YT.Player) {
        setupYTPlayer();
        return;
      }

      if (!document.getElementById('habajaba-youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'habajaba-youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        setupYTPlayer();
      };
    };

    const setupYTPlayer = () => {
      if (ytPlayerRef.current || !window.YT || !window.YT.Player) return;
      const hostEl = document.getElementById('habajaba-yt-iframe');
      if (!hostEl) return;

      try {
        ytPlayerRef.current = new window.YT.Player('habajaba-yt-iframe', {
          height: '180',
          width: '320',
          videoId: pendingYtVideoIdRef.current || 'dQw4w9WgXcQ',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              isYtReadyRef.current = true;
              event.target.setVolume(Math.round(volume * 100));
              if (pendingYtVideoIdRef.current) {
                if (pendingYtStartTimeRef.current > 0) {
                  event.target.loadVideoById({
                    videoId: pendingYtVideoIdRef.current,
                    startSeconds: pendingYtStartTimeRef.current,
                  });
                } else {
                  event.target.loadVideoById(pendingYtVideoIdRef.current);
                }
                event.target.playVideo();
                pendingYtVideoIdRef.current = null;
                pendingYtStartTimeRef.current = 0;
              }
            },
            onStateChange: (event: any) => {
              // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
              if (event.data === 1) {
                // Playing
                setIsPlaying(true);
                setIsLoading(false);
                setError(null);
                const dur = ytPlayerRef.current?.getDuration();
                if (dur && isFinite(dur) && dur > 0) {
                  setDuration(dur);
                }
              } else if (event.data === 2) {
                // Paused
                setIsPlaying(false);
                setIsLoading(false);
              } else if (event.data === 3) {
                // Buffering
                setIsLoading(true);
              } else if (event.data === 0) {
                // Ended
                setIsPlaying(false);
                onTrackEnded();
              }
            },
            onError: (errEvent: any) => {
              console.warn('YouTube Player error:', errEvent);
              setIsLoading(false);
              setIsPlaying(false);
              setError('ইউটিউব অডিও স্ট্রিম লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে লিংকটি পরীক্ষা করুন।');
            },
          },
        });
      } catch (e) {
        console.warn('Failed to init YT.Player:', e);
      }
    };

    initYT();

    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    };
  }, []);

  // Poll YouTube player for real-time currentTime and duration when playing
  useEffect(() => {
    if (isYouTubeTrack && isPlaying) {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
      ytIntervalRef.current = window.setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime();
            if (typeof cur === 'number' && !isNaN(cur)) {
              setCurrentTime(cur);
            }
            const dur = ytPlayerRef.current.getDuration();
            if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
              setDuration(dur);
            }
          } catch {}
        }
      }, 350);
    } else {
      if (ytIntervalRef.current) {
        clearInterval(ytIntervalRef.current);
        ytIntervalRef.current = null;
      }
    }

    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    };
  }, [isYouTubeTrack, isPlaying]);

  // Initialize shared HTML5 audio element for Dropbox & direct MP3 streams
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.85;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isYouTubeTrack) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isYouTubeTrack) {
        if (isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
        setIsLoading(false);
      }
    };

    const handleDurationChange = () => {
      if (!isYouTubeTrack) {
        if (isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      }
    };

    const handleWaiting = () => {
      if (!isYouTubeTrack) setIsLoading(true);
    };

    const handlePlaying = () => {
      if (!isYouTubeTrack) {
        setIsLoading(false);
        setIsPlaying(true);
        setError(null);
      }
    };

    const handlePause = () => {
      if (!isYouTubeTrack) {
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      if (!isYouTubeTrack) {
        setIsPlaying(false);
        onTrackEnded();
      }
    };

    const handleError = () => {
      if (!isYouTubeTrack) {
        setIsLoading(false);
        setIsPlaying(false);
        const audioErr = audio.error;
        let message = 'অডিও স্ট্রিম চালাতে সমস্যা হয়েছে।';
        if (audioErr?.code === 4) {
          message = 'ড্রপবক্স অডিও ফাইল এক্সেস করা যায়নি। অনুগ্রহ করে লিংকটি পাবলিক কিনা দেখুন।';
        } else if (audioErr?.code === 2) {
          message = 'নেটওয়ার্ক সংযোগ ত্রুটি হয়েছে।';
        }
        setError(message);
      }
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
  }, [isYouTubeTrack]);

  // Update MediaSession API for mobile lockscreen & hardware controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Habajaba Studio LIVE',
        artwork: [
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '512x512', type: 'image/jpeg' },
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

  // Unified Track Playback Execution (Auto routes to YouTube Player or HTML5 Audio)
  const startPlayback = (track: Track) => {
    setError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    setCurrentTime(0);

    // Check if this track is from YouTube
    const ytId = track.youtubeId || extractYouTubeVideoId(track.audioUrl);
    const isYt = !!ytId || isYouTubeUrl(track.audioUrl) || track.sourceType === 'youtube';

    if (isYt && ytId) {
      // 1. YouTube Audio Mode
      setIsYouTubeTrack(true);
      setYoutubeVideoId(ytId);

      // Stop HTML5 audio completely
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const startSeconds = typeof track.startTime === 'number' && track.startTime > 0 ? track.startTime : 0;

      if (isYtReadyRef.current && ytPlayerRef.current) {
        try {
          if (startSeconds > 0) {
            ytPlayerRef.current.loadVideoById({
              videoId: ytId,
              startSeconds: startSeconds,
            });
          } else {
            ytPlayerRef.current.loadVideoById(ytId);
          }
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          setIsLoading(false);
        } catch (e) {
          console.warn('YouTube load error:', e);
          pendingYtVideoIdRef.current = ytId;
          pendingYtStartTimeRef.current = startSeconds;
        }
      } else {
        pendingYtVideoIdRef.current = ytId;
        pendingYtStartTimeRef.current = startSeconds;
      }
    } else {
      // 2. HTML5 Audio Mode (Dropbox or direct MP3)
      setIsYouTubeTrack(false);
      setYoutubeVideoId(null);

      // Stop YouTube player if playing
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      const audio = audioRef.current;
      if (!audio) return;

      const directUrl = getDirectAudioUrl(track.audioUrl);
      if (!directUrl) {
        setError('এই গানের জন্য কোনো কার্যকর অডিও লিঙ্ক পাওয়া যায়নি।');
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }

      audio.pause();
      audio.src = directUrl;
      audio.currentTime = 0;
      audio.volume = isMuted ? 0 : volume;

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
            if (err.name !== 'AbortError') {
              setError('ব্রাউজার দ্বারা প্লেব্যাক ব্লক হয়েছে বা অডিও লিঙ্কটি কাজ করছে না।');
            }
          });
      }
    }
  };

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      setQueue((prev) => {
        if (prev.some((t) => t.id === track.id)) {
          return prev;
        }
        return [track, ...prev];
      });
      setQueueIndex(0);
    }

    startPlayback(track);
  }, [volume, isMuted]);

  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    setQueue(tracks);
    setQueueIndex(validIndex);
    startPlayback(tracks[validIndex]);
  }, [volume, isMuted]);

  const pause = useCallback(() => {
    if (isYouTubeTrack) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    setIsPlaying(false);
  }, [isYouTubeTrack]);

  const resume = useCallback(() => {
    if (isYouTubeTrack) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch {}
      }
    } else {
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
    }
  }, [isYouTubeTrack, currentTrack]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const seek = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return;
    const target = Math.max(0, Math.min(seconds, duration || 0));

    if (isYouTubeTrack) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(target, true);
          setCurrentTime(target);
        } catch {}
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = target;
        setCurrentTime(target);
      }
    }
  }, [isYouTubeTrack, duration]);

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

    if (currentTime > 3) {
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
  }, [queue, queueIndex, repeatMode, currentTime, seek]);

  const onTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      seek(0);
      resume();
      return;
    }
    playNext();
  }, [repeatMode, currentTrack, playNext, resume, seek]);

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const cycleRepeat = () => {
    setRepeatMode((prev) => {
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

    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(Math.round(clamped * 100));
      } catch {}
    }

    if (clamped === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoreVol = volume > 0 ? volume : 0.85;
      if (audioRef.current) audioRef.current.volume = restoreVol;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        try {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(restoreVol * 100));
        } catch {}
      }
      setIsMuted(false);
    } else {
      if (audioRef.current) audioRef.current.volume = 0;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        try {
          ytPlayerRef.current.mute();
        } catch {}
      }
      setIsMuted(true);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => {
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

  // Keyboard accessibility shortcuts
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
        isYouTubeTrack,
        youtubeVideoId,
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
      {/* Off-screen dedicated YouTube Player Host for high-fidelity audio stream */}
      <div
        id="habajaba-yt-player-container"
        style={{
          position: 'fixed',
          bottom: -9999,
          right: -9999,
          width: 320,
          height: 180,
          opacity: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div id="habajaba-yt-iframe" />
      </div>
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
