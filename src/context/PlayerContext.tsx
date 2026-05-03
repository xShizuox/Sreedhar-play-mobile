import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { MOCK_TRACKS } from '../constants';

export interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  queue: Track[];
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  toggleLike: (trackId?: string) => Promise<void>;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  setQueue: (queue: Track[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  crossfadeDuration: number;
  setCrossfadeDuration: (duration: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    const saved = localStorage.getItem('lastTrack');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return MOCK_TRACKS[0];
      }
    }
    return MOCK_TRACKS[0];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>(MOCK_TRACKS.slice(1));
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(() => {
    const saved = localStorage.getItem('crossfadeDuration');
    return saved ? parseInt(saved, 10) : 5;
  });

  const crossfadeTriggeredRef = useRef(false);
  const gaplessBufferedRef = useRef(false);

  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeARef = useRef<GainNode | null>(null);
  const gainNodeBRef = useRef<GainNode | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | undefined>(undefined);

  const nextTrackRef = useRef<() => void>(() => {});
  const prevTrackRef = useRef<() => void>(() => {});
  const togglePlayRef = useRef<() => void>(() => {});
  const seekRef = useRef<(time: number) => void>(() => {});

  const crossfadeDurationRef = useRef(crossfadeDuration);
  crossfadeDurationRef.current = crossfadeDuration;

  const queueRef = useRef(queue);
  queueRef.current = queue;

  const setCurrentTrackRef = useRef(setCurrentTrack);
  setCurrentTrackRef.current = setCurrentTrack;

  const setQueueRef = useRef(setQueue);
  setQueueRef.current = setQueue;

  const safePlay = () => {
    const audio = activePlayer === 'A' ? audioRefA.current : audioRefB.current;
    if (audio) {
      const promise = audio.play();
      playPromiseRef.current = promise;
      if (promise !== undefined) {
        promise.catch((error) => {
          if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
            console.error("Audio play error:", error);
          }
        });
      }
    }
  };

  const safePause = () => {
    const audio = activePlayer === 'A' ? audioRefA.current : audioRefB.current;
    if (audio) {
      audio.pause();
    }
  };

  useEffect(() => {
    if (!audioRefA.current) {
      audioRefA.current = new Audio();
      audioRefA.current.crossOrigin = 'anonymous';
    }
    if (!audioRefB.current) {
      audioRefB.current = new Audio();
      audioRefB.current.crossOrigin = 'anonymous';
    }

    const initAudioContext = () => {
      if (!audioContextRef.current && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        if (audioRefA.current) {
          const sourceA = ctx.createMediaElementSource(audioRefA.current);
          const gainA = ctx.createGain();
          sourceA.connect(gainA);
          gainA.connect(ctx.destination);
          gainNodeARef.current = gainA;
        }

        if (audioRefB.current) {
          const sourceB = ctx.createMediaElementSource(audioRefB.current);
          const gainB = ctx.createGain();
          sourceB.connect(gainB);
          gainB.connect(ctx.destination);
          gainNodeBRef.current = gainB;
        }
      }
    };

    initAudioContext();

    const updateProgress = () => {
      const audio = activePlayer === 'A' ? audioRefA.current : audioRefB.current;
      if (!audio) return;
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);

      // Crossfade Handling
      const crossfadeDur = crossfadeDurationRef.current;
      const queueArr = queueRef.current;
      if (
        crossfadeDur > 0 &&
        !crossfadeTriggeredRef.current &&
        audio.duration > 0 &&
        audio.currentTime >= audio.duration - crossfadeDur
      ) {
        crossfadeTriggeredRef.current = true;
        if (queueArr.length > 0) {
          const nextTrack = queueArr[0];
          const idleAudio = activePlayer === 'A' ? audioRefB.current : audioRefA.current;
          
          if (idleAudio) {
            initAudioContext();
            const ctx = audioContextRef.current;
            const gainActive = activePlayer === 'A' ? gainNodeARef.current : gainNodeBRef.current;
            const gainIdle = activePlayer === 'A' ? gainNodeBRef.current : gainNodeARef.current;

            idleAudio.src = nextTrack.audioUrl;
            
            if (ctx && gainActive && gainIdle) {
              const now = ctx.currentTime;
              gainActive.gain.setValueAtTime(gainActive.gain.value, now);
              gainActive.gain.linearRampToValueAtTime(0, now + crossfadeDur);

              gainIdle.gain.setValueAtTime(0, now);
              gainIdle.gain.linearRampToValueAtTime(1, now + crossfadeDur);
            } else {
              idleAudio.volume = 0;
            }

            const p = idleAudio.play();
            if (p !== undefined) p.catch(() => {});

            if (!ctx) {
              let step = 0;
              const steps = (crossfadeDur * 1000) / 100;
              const fadeInterval = setInterval(() => {
                step++;
                const volOut = Math.max(0, 1 - (step / steps));
                const volIn = Math.min(1, (step / steps));
                if (audio) audio.volume = volOut;
                if (idleAudio) idleAudio.volume = volIn;
                if (step >= steps) clearInterval(fadeInterval);
              }, 100);
            }

            setTimeout(() => {
              setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
              setCurrentTrackRef.current(nextTrack);
              setQueueRef.current(prevQueue => prevQueue.slice(1));
              crossfadeTriggeredRef.current = false;
            }, crossfadeDur * 1000);
          }
        }
      }

      // Pre-load / Pre-fetch for gapless playback
      const gaplessEnabled = localStorage.getItem('gaplessEnabled') === 'true';
      if (
        gaplessEnabled &&
        !gaplessBufferedRef.current &&
        audio.duration > 0 &&
        audio.currentTime >= audio.duration * 0.8
      ) {
        gaplessBufferedRef.current = true;
        if (queueArr.length > 0) {
          const nextTrack = queueArr[0];
          const idleAudio = activePlayer === 'A' ? audioRefB.current : audioRefA.current;
          if (idleAudio) {
            idleAudio.src = nextTrack.audioUrl;
            idleAudio.load();
          }
        }
      }

      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
        try {
          if (!isNaN(audio.duration) && audio.duration > 0) {
            navigator.mediaSession.setPositionState({
              duration: audio.duration,
              playbackRate: audio.playbackRate,
              position: audio.currentTime
            });
          }
        } catch (error) {
          console.error("Error setting media session position state:", error);
        }
      }
    };

    const handleEnded = () => {
      const gaplessEnabled = localStorage.getItem('gaplessEnabled') === 'true';
      if (gaplessEnabled && gaplessBufferedRef.current && queueRef.current.length > 0) {
        const nextTrack = queueRef.current[0];
        const idleAudio = activePlayer === 'A' ? audioRefB.current : audioRefA.current;
        if (idleAudio) {
          setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
          setCurrentTrackRef.current(nextTrack);
          setQueueRef.current(prevQueue => prevQueue.slice(1));
          gaplessBufferedRef.current = false;
          const p = idleAudio.play();
          if (p !== undefined) p.catch(() => {});
          return;
        }
      }
      
      if (nextTrackRef.current) {
        nextTrackRef.current();
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio play error:', e);
      setIsPlaying(false);
    };

    const audioA = audioRefA.current;
    const audioB = audioRefB.current;
    if (audioA) {
      audioA.addEventListener('timeupdate', updateProgress);
      audioA.addEventListener('ended', handleEnded);
      audioA.addEventListener('loadedmetadata', updateProgress);
      audioA.addEventListener('error', handleError);
    }
    if (audioB) {
      audioB.addEventListener('timeupdate', updateProgress);
      audioB.addEventListener('ended', handleEnded);
      audioB.addEventListener('loadedmetadata', updateProgress);
      audioB.addEventListener('error', handleError);
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlayRef.current?.());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayRef.current?.());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrackRef.current?.());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrackRef.current?.());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seekRef.current?.(details.seekTime);
        }
      });
    }

    return () => {
      if (audioA) {
        audioA.removeEventListener('timeupdate', updateProgress);
        audioA.removeEventListener('ended', handleEnded);
        audioA.removeEventListener('loadedmetadata', updateProgress);
        audioA.removeEventListener('error', handleError);
      }
      if (audioB) {
        audioB.removeEventListener('timeupdate', updateProgress);
        audioB.removeEventListener('ended', handleEnded);
        audioB.removeEventListener('loadedmetadata', updateProgress);
        audioB.removeEventListener('error', handleError);
      }
    };
  }, [activePlayer]);

  useEffect(() => {
    if (crossfadeTriggeredRef.current) return;
    const audio = activePlayer === 'A' ? audioRefA.current : audioRefB.current;
    if (audio && currentTrack) {
      audio.src = currentTrack.audioUrl;
      if (isPlaying) {
        safePlay();
      }
      
      if ('mediaSession' in navigator) {
        let coverUrl = currentTrack.cover || 'https://sreedhar-play.onrender.com/static/default_cover.jpg';
        if (coverUrl.startsWith('/')) {
          coverUrl = 'https://sreedhar-play.onrender.com' + coverUrl;
        }
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: 'Sreedhar Play',
          artwork: [
            { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      }
    }
    if (currentTrack) {
      localStorage.setItem('lastTrack', JSON.stringify(currentTrack));
    }
  }, [currentTrack?.audioUrl, activePlayer]);


  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      safePause();
    } else {
      safePlay();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const nextTrack = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      
      setCurrentTrack(next);
      setIsPlaying(true);
      return;
    }

    const currentIndex = MOCK_TRACKS.findIndex(t => t.id === currentTrack?.id);
    let nextIndex;
    
    if (isShuffle) {
      if (MOCK_TRACKS.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * MOCK_TRACKS.length);
        } while (nextIndex === currentIndex);
      } else {
        nextIndex = currentIndex;
      }
    } else {
      nextIndex = (currentIndex + 1) % MOCK_TRACKS.length;
    }
    
    setCurrentTrack(MOCK_TRACKS[nextIndex]);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    const currentIndex = MOCK_TRACKS.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + MOCK_TRACKS.length) % MOCK_TRACKS.length;
    playTrack(MOCK_TRACKS[prevIndex]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  useEffect(() => {
    nextTrackRef.current = nextTrack;
    prevTrackRef.current = prevTrack;
    togglePlayRef.current = togglePlay;
    seekRef.current = seek;
  }, [nextTrack, prevTrack, togglePlay, seek]);

  const toggleShuffle = () => setIsShuffle(!isShuffle);

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const reorderQueue = (startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const toggleLike = async (trackId?: string) => {
    const id = trackId || currentTrack?.id;
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/songs/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { liked } = await response.json();
        
        // Update current track if it's the one liked
        if (currentTrack?.id === id) {
          setCurrentTrack({
            ...currentTrack,
            isLiked: liked,
            likes: (currentTrack.likes || 100) + (liked ? 1 : -1)
          });
        }
      } else {
        // Mock success for demo if no backend sync
        if (currentTrack?.id === id) {
           setCurrentTrack({
            ...currentTrack,
            isLiked: !currentTrack.isLiked,
            likes: (currentTrack.likes || 100) + (currentTrack.isLiked ? -1 : 1)
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      progress,
      duration,
      queue,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      isShuffle,
      toggleShuffle,
      toggleLike,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      setQueue,
      setIsPlaying,
      crossfadeDuration,
      setCrossfadeDuration
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
