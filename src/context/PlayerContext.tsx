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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>(MOCK_TRACKS.slice(1));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | undefined>(undefined);

  const safePlay = () => {
    if (audioRef.current) {
      const promise = audioRef.current.play();
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
    if (audioRef.current) {
      if (playPromiseRef.current !== undefined) {
        playPromiseRef.current.then(() => {
          audioRef.current?.pause();
        }).catch(() => {
          // Ignored
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const nextTrackRef = useRef<() => void>(() => {});

  const prevTrackRef = useRef<() => void>(() => {});
  const togglePlayRef = useRef<() => void>(() => {});
  const seekRef = useRef<(time: number) => void>(() => {});

  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);

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
      if (nextTrackRef.current) {
        nextTrackRef.current();
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio play error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('error', handleError);

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
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('error', handleError);
      if (playPromiseRef.current !== undefined) {
        playPromiseRef.current.then(() => {
          audio.pause();
        }).catch(() => {});
      } else {
        audio.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      // We check if it should be playing. We don't add isPlaying to deps because 
      // we only want to change src when currentTrack changes.
      if (isPlaying) {
        safePlay();
      }
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: 'Sreedhar Play',
          artwork: [
            { src: currentTrack.cover || '/static/default_cover.jpg', sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.audioUrl]);


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
      setIsPlaying
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
