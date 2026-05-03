import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Track } from '../types';

interface JamState {
  id: string;
  hostId: string;
  name: string;
  members: { userId: string; username: string; isHost: boolean; avatar_url?: string }[];
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
}

interface JamContextType {
  jamState: JamState | null;
  joinJam: (jamId: string, user: any) => void;
  leaveJam: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  nextTrack: () => void;
  syncPlayerState: (state: Partial<JamState>) => void;
}

const JamContext = createContext<JamContextType | undefined>(undefined);

export const JamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jamState, setJamState] = useState<JamState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    socketRef.current = io(window.location.origin);
    
    socketRef.current.on('jam-update', (state: JamState) => {
      setJamState(state);
    });

    socketRef.current.on('jam-sync', (syncData: Partial<JamState>) => {
      setJamState(prev => {
        if (!prev) return prev;
        return { ...prev, ...syncData };
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinJam = (jamId: string, user: any) => {
    setCurrentUser(user);
    if (socketRef.current) {
      socketRef.current.emit('join-jam', { jamId, user });
    }
  };

  const leaveJam = () => {
    if (socketRef.current && jamState && currentUser) {
      socketRef.current.emit('leave-jam', { jamId: jamState.id, userId: currentUser.id || currentUser.userId });
      setJamState(null);
    }
  };

  const addToQueue = (track: Track) => {
    if (socketRef.current && jamState) {
      socketRef.current.emit('add-to-queue', { jamId: jamState.id, track });
    }
  };

  const removeFromQueue = (trackId: string) => {
    if (socketRef.current && jamState) {
      socketRef.current.emit('remove-from-queue', { jamId: jamState.id, trackId });
    }
  };

  const nextTrack = () => {
    if (socketRef.current && jamState) {
      socketRef.current.emit('next-track', { jamId: jamState.id });
    }
  };

  const syncPlayerState = (state: Partial<JamState>) => {
    if (socketRef.current && jamState) {
      socketRef.current.emit('player-state-change', { jamId: jamState.id, state });
    }
  };

  return (
    <JamContext.Provider value={{ jamState, joinJam, leaveJam, addToQueue, removeFromQueue, nextTrack, syncPlayerState }}>
      {children}
    </JamContext.Provider>
  );
};

export const useJam = () => {
  const context = useContext(JamContext);
  if (context === undefined) {
    throw new Error('useJam must be used within a JamProvider');
  }
  return context;
};
