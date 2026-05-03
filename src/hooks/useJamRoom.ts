import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePlayer } from '../context/PlayerContext';

export function useJamRoom() {
  const { playTrack, currentTrack, isPlaying, seek, currentTime } = usePlayer();
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const [participants, setParticipants] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    socketRef.current = io(window.location.origin);

    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('room-created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setIsHost(true);
      setIsInRoom(true);
      setParticipants(1);
    });

    socketRef.current.on('room-state', ({ roomCode, currentSong, isPlaying, currentTime, participantsCount }) => {
      setRoomCode(roomCode);
      setIsHost(false);
      setIsInRoom(true);
      setParticipants(participantsCount || 1);

      if (currentSong) {
        isSyncingRef.current = true;
        playTrack(currentSong);
        setTimeout(() => {
          seek(currentTime);
          isSyncingRef.current = false;
        }, 400);
      }
    });

    socketRef.current.on('join-error', ({ message }) => {
      setErrorMsg(message);
    });

    socketRef.current.on('playback-sync', ({ isPlaying: serverPlaying, currentTime: serverTime, song }) => {
      isSyncingRef.current = true;
      if (song && (!currentTrack || currentTrack.id !== song.id)) {
        playTrack(song);
      }
      setTimeout(() => {
        seek(serverTime);
        isSyncingRef.current = false;
      }, 150);
    });

    socketRef.current.on('user-joined', () => {
      setParticipants(prev => prev + 1);
    });

    socketRef.current.on('user-left', () => {
      setParticipants(prev => Math.max(1, prev - 1));
    });

    socketRef.current.on('room-closed', () => {
      alert('The host ended the Jam session');
      setRoomCode('');
      setIsInRoom(false);
      setIsHost(false);
      setParticipants(1);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [playTrack, seek, currentTrack]);

  // Sync effect when host plays, pauses, or seeks
  useEffect(() => {
    if (isHost && isInRoom && !isSyncingRef.current) {
      if (socketRef.current) {
        socketRef.current.emit('playback-update', {
          roomCode,
          isPlaying,
          currentTime,
          song: currentTrack || null
        });
      }
    }
  }, [isHost, isInRoom, isPlaying, currentTime, currentTrack, roomCode]);

  const createRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('create-room');
    }
  };

  const joinRoom = (code: string) => {
    if (socketRef.current) {
      setErrorMsg(null);
      socketRef.current.emit('join-room', { roomCode: code.toUpperCase().trim() });
    }
  };

  const leaveRoom = () => {
    if (socketRef.current && roomCode) {
      socketRef.current.emit('leave-room', { roomCode });
      setRoomCode('');
      setIsInRoom(false);
      setIsHost(false);
      setParticipants(1);
    }
  };

  return {
    roomCode,
    isHost,
    isInRoom,
    participants,
    connectionStatus,
    errorMsg,
    createRoom,
    joinRoom,
    leaveRoom
  };
}
