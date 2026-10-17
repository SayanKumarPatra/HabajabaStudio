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

// 2-second inaudible 44.1kHz PCM silent WAV data URI to keep mobile OS background audio sessions active
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAAAAAAAAAAAAAAA';

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const carrierAudioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytIntervalRef = useRef<number | null>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const pendingYtVideoIdRef = useRef<string | null>(null);
  const pendingYtStartTimeRef = useRef<number>(0);

  // Background playback & lockscreen tracking refs
  const userInitiatedPauseRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isYouTubeTrackRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // Stable function delegate refs to avoid TDZ in early-registered effects
  const onTrackEndedRef = useRef<() => void>(() => {});
  const resumeRef = useRef<() => void>(() => {});
  const pauseRef = useRef<() => void>(() => {});
  const playPreviousRef = useRef<() => void>(() => {});
  const playNextRef = useRef<() => void>(() => {});
  const seekRef = useRef<(seconds: number) => void>(() => {});

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

  // Keep ref mirrors synchronized with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isYouTubeTrackRef.current = isYouTubeTrack;
  }, [isYouTubeTrack]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Starts native silent audio carrier to hold system audio focus on mobile when screen is off
  const startBackgroundCarrier = useCallback(() => {
    const carrier = carrierAudioRef.current;
    if (carrier) {
      try {
        carrier.volume = 0.01;
        const p = carrier.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      } catch {}
    }
  }, []);

  const stopBackgroundCarrier = useCallback(() => {
    const carrier = carrierAudioRef.current;
    if (carrier) {
      try {
        carrier.pause();
      } catch {}
    }
  }, []);

  // Update MediaSession Position State for lockscreen progress bar
  const updateMediaSessionPosition = useCallback((curr: number, dur: number) => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        if (dur > 0 && isFinite(dur) && curr >= 0 && curr <= dur) {
          navigator.mediaSession.setPositionState({
            duration: Math.max(dur, 0.1),
            playbackRate: 1,
            position: Math.min(Math.max(curr, 0), dur),
          });
        }
      } catch {}
    }
  }, []);

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
                userInitiatedPauseRef.current = false;
                startBackgroundCarrier();
                pendingYtVideoIdRef.current = null;
                pendingYtStartTimeRef.current = 0;
              }
            },
            onStateChange: (event: any) => {
              // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
              if (event.data === 1) {
                // Playing
                userInitiatedPauseRef.current = false;
                setIsPlaying(true);
                isPlayingRef.current = true;
                setIsLoading(false);
                setError(null);
                startBackgroundCarrier();
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'playing';
                }
                const dur = ytPlayerRef.current?.getDuration();
                if (dur && isFinite(dur) && dur > 0) {
                  setDuration(dur);
                  durationRef.current = dur;
                }
              } else if (event.data === 2) {
                // Paused event received from YouTube
                // Check if this pause was forced by mobile browser because screen turned off
                if (document.hidden && !userInitiatedPauseRef.current && isPlayingRef.current) {
                  // User DID NOT pause! Power button was pressed or screen locked.
                  // Keep playing state, keep carrier active, and re-trigger playVideo
                  startBackgroundCarrier();
                  try {
                    event.target.playVideo();
                  } catch {}
                  setTimeout(() => {
                    if (document.hidden && !userInitiatedPauseRef.current && isPlayingRef.current) {
                      try {
                        ytPlayerRef.current?.playVideo();
                      } catch {}
                    }
                  }, 250);
                  return;
                }

                if (userInitiatedPauseRef.current) {
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                  setIsLoading(false);
                  stopBackgroundCarrier();
                  if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'paused';
                  }
                }
              } else if (event.data === 3) {
                // Buffering
                setIsLoading(true);
              } else if (event.data === 0) {
                // Ended
                setIsPlaying(false);
                isPlayingRef.current = false;
                stopBackgroundCarrier();
                onTrackEndedRef.current();
              }
            },
            onError: (errEvent: any) => {
              console.warn('YouTube Player error:', errEvent);
              setIsLoading(false);
              setIsPlaying(false);
              stopBackgroundCarrier();
              setError('ইউটিউব অডিও লোড হতে সমস্যা হয়েছে। লিংকটি পরীক্ষা করুন।');
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
  }, [volume, startBackgroundCarrier, stopBackgroundCarrier]);

  // Global visibilitychange listener for mobile screen lock / power button press
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Screen was turned off (power button pressed) or tab minimized
        if (isPlayingRef.current && !userInitiatedPauseRef.current) {
          // Keep silent carrier audio active to hold OS audio session
          startBackgroundCarrier();

          // If YouTube track, ensure video is kept playing
          if (isYouTubeTrackRef.current && ytPlayerRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current && !userInitiatedPauseRef.current && ytPlayerRef.current) {
                try {
                  ytPlayerRef.current.playVideo();
                } catch {}
              }
            }, 120);
            setTimeout(() => {
              if (isPlayingRef.current && !userInitiatedPauseRef.current && ytPlayerRef.current) {
                try {
                  ytPlayerRef.current.playVideo();
                } catch {}
              }
            }, 500);
          }
        }
      } else {
        // Screen turned back on or tab focused
        if (isPlayingRef.current && !userInitiatedPauseRef.current) {
          if (isYouTubeTrackRef.current && ytPlayerRef.current) {
            try {
              ytPlayerRef.current.playVideo();
            } catch {}
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startBackgroundCarrier]);

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
              currentTimeRef.current = cur;
            }
            const dur = ytPlayerRef.current.getDuration();
            if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
              setDuration(dur);
              durationRef.current = dur;
              updateMediaSessionPosition(cur, dur);
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
  }, [isYouTubeTrack, isPlaying, updateMediaSessionPosition]);

  // Initialize shared HTML5 audio element for Dropbox & direct MP3 streams
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    (audio as any).playsInline = true;
    (audio as any).webkitPlaysInline = true;
    audio.volume = 0.85;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isYouTubeTrack) {
        setCurrentTime(audio.currentTime);
        currentTimeRef.current = audio.currentTime;
        updateMediaSessionPosition(audio.currentTime, audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isYouTubeTrack) {
        if (isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          durationRef.current = audio.duration;
        }
        setIsLoading(false);
      }
    };

    const handleDurationChange = () => {
      if (!isYouTubeTrack) {
        if (isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          durationRef.current = audio.duration;
        }
      }
    };

    const handleWaiting = () => {
      if (!isYouTubeTrack) setIsLoading(true);
    };

    const handlePlaying = () => {
      if (!isYouTubeTrack) {
        userInitiatedPauseRef.current = false;
        setIsLoading(false);
        setIsPlaying(true);
        isPlayingRef.current = true;
        setError(null);
        startBackgroundCarrier();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }
    };

    const handlePause = () => {
      if (!isYouTubeTrack) {
        // If paused because screen was locked and user did not click pause, re-trigger
        if (document.hidden && !userInitiatedPauseRef.current && isPlayingRef.current) {
          const p = audio.play();
          if (p !== undefined) p.catch(() => {});
          return;
        }

        if (userInitiatedPauseRef.current) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          stopBackgroundCarrier();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        }
      }
    };

    const handleEnded = () => {
      if (!isYouTubeTrack) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        stopBackgroundCarrier();
        onTrackEndedRef.current();
      }
    };

    const handleError = () => {
      if (!isYouTubeTrack) {
        setIsLoading(false);
        setIsPlaying(false);
        isPlayingRef.current = false;
        stopBackgroundCarrier();
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
  }, [isYouTubeTrack, startBackgroundCarrier, stopBackgroundCarrier, updateMediaSessionPosition]);

  // Update MediaSession API for mobile lockscreen & hardware controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Habajaba Studio LIVE',
        artwork: [
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '/banner-default.svg', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ['play', () => {
          userInitiatedPauseRef.current = false;
          resumeRef.current();
        }],
        ['pause', () => {
          userInitiatedPauseRef.current = true;
          pauseRef.current();
        }],
        ['previoustrack', () => playPreviousRef.current()],
        ['nexttrack', () => playNextRef.current()],
        ['seekto', (details) => {
          if (details.seekTime !== undefined) seekRef.current(details.seekTime);
        }],
        ['seekbackward', (details) => {
          seekRef.current(Math.max(currentTimeRef.current - (details.seekOffset || 10), 0));
        }],
        ['seekforward', (details) => {
          seekRef.current(Math.min(currentTimeRef.current + (details.seekOffset || 10), durationRef.current || 1000));
        }],
        ['stop', () => {
          userInitiatedPauseRef.current = true;
          pauseRef.current();
        }],
      ];

      for (const [action, handler] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {}
      }
    } catch (e) {
      console.warn('MediaSession configuration warning:', e);
    }
  }, [currentTrack, isPlaying]);

  // Unified Track Playback Execution (Auto routes to YouTube Player or HTML5 Audio)
  const startPlayback = (track: Track) => {
    setError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setCurrentTime(0);
    currentTimeRef.current = 0;
    userInitiatedPauseRef.current = false;

    // Start background audio carrier to maintain mobile audio focus when screen turns off
    startBackgroundCarrier();

    // Check if this track is from YouTube
    const ytId = track.youtubeId || extractYouTubeVideoId(track.audioUrl);
    const isYt = !!ytId || isYouTubeUrl(track.audioUrl) || track.sourceType === 'youtube';

    if (isYt && ytId) {
      // 1. YouTube Audio Mode
      setIsYouTubeTrack(true);
      isYouTubeTrackRef.current = true;
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
          isPlayingRef.current = true;
          setIsLoading(false);
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
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
      isYouTubeTrackRef.current = false;
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
        isPlayingRef.current = false;
        stopBackgroundCarrier();
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
            isPlayingRef.current = true;
            setIsLoading(false);
            startBackgroundCarrier();
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          })
          .catch((err) => {
            console.warn('Playback initiation error:', err);
            setIsPlaying(false);
            isPlayingRef.current = false;
            setIsLoading(false);
            stopBackgroundCarrier();
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
    userInitiatedPauseRef.current = true;
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
    isPlayingRef.current = false;
    stopBackgroundCarrier();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }, [isYouTubeTrack, stopBackgroundCarrier]);

  const resume = useCallback(() => {
    userInitiatedPauseRef.current = false;
    startBackgroundCarrier();
    if (isYouTubeTrack) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          isPlayingRef.current = true;
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        } catch {}
      }
    } else {
      if (audioRef.current && currentTrack) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              isPlayingRef.current = true;
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
            })
            .catch((err) => {
              console.warn('Resume error:', err);
              setIsPlaying(false);
              isPlayingRef.current = false;
              stopBackgroundCarrier();
            });
        }
      }
    }
  }, [isYouTubeTrack, currentTrack, startBackgroundCarrier, stopBackgroundCarrier]);

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

  // Synchronize delegate refs for early-registered effects and MediaSession action handlers
  useEffect(() => {
    resumeRef.current = resume;
    pauseRef.current = pause;
    playNextRef.current = playNext;
    playPreviousRef.current = playPrevious;
    seekRef.current = seek;
    onTrackEndedRef.current = onTrackEnded;
  }, [resume, pause, playNext, playPrevious, seek, onTrackEnded]);

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

      {/* Off-screen Background Audio Carrier to hold native OS AudioSession open when screen is off */}
      <audio
        ref={carrierAudioRef}
        id="habajaba-bg-carrier"
        playsInline
        loop
        preload="auto"
        src={SILENT_AUDIO_URI}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 2,
          height: 2,
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden="true"
      />

      {/* Viewport-anchored YouTube Player Host to prevent mobile browser offscreen media throttling */}
      <div
        id="habajaba-yt-player-container"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 2,
          height: 2,
          opacity: 0.01,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1,
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
