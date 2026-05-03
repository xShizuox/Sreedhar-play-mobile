import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Pause, X, Crown, Copy, Check, Radio } from 'lucide-react';
import { useJamRoom } from '../hooks/useJamRoom';
import { usePlayer } from '../context/PlayerContext';
import { TouchableScale } from '../components/TouchableScale';

export const JamScreen: React.FC = () => {
  const { 
    roomCode, 
    isHost, 
    isInRoom, 
    participants, 
    errorMsg, 
    createRoom, 
    joinRoom, 
    leaveRoom 
  } = useJamRoom();

  const { currentTrack, isPlaying, togglePlay } = usePlayer();

  const [jamIdInput, setJamIdInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateJam = () => {
    createRoom();
  };

  const handleJoinJam = (e: React.FormEvent) => {
    e.preventDefault();
    if (jamIdInput.trim().length !== 6) return;
    joinRoom(jamIdInput.toUpperCase().trim());
  };

  const copyJamId = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isInRoom) {
    return (
      <div className="pb-[240px] pt-16 px-6 max-w-2xl mx-auto w-full text-center">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(147,51,234,0.3)]">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">Jam Session</h1>
          <p className="text-white/60 mb-8 max-w-sm mx-auto text-sm">
            Listen together in real-time with your friends. Create a new room or join an existing one using a code.
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold w-full max-w-sm">
              {errorMsg}
            </div>
          )}

          <TouchableScale onClick={handleCreateJam} className="w-full max-w-sm">
            <div className="w-full bg-white text-black font-extrabold py-4 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-8 select-none hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer">
              Start a Jam
            </div>
          </TouchableScale>

          <div className="flex items-center gap-4 w-full max-w-sm mb-8">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-white/40 font-bold text-sm uppercase select-none">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <form onSubmit={handleJoinJam} className="w-full max-w-sm relative">
            <input 
              type="text" 
              placeholder="Enter 6-digit Code" 
              value={jamIdInput}
              onChange={(e) => setJamIdInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-32 text-lg font-bold text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors uppercase tracking-widest text-center"
            />
            <button 
              type="submit"
              disabled={jamIdInput.trim().length !== 6}
              className="absolute right-2 top-2 bottom-2 bg-purple-500 hover:bg-purple-600 text-white px-6 rounded-full font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all select-none cursor-pointer"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[240px] pt-16 px-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-black tracking-widest uppercase animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              LIVE
            </span>
            <span className="text-white/40 text-xs font-bold font-mono">
              {participants} Listening
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2 select-none">
            {isHost ? 'Your Jam Room' : 'Jam Session'}
            {isHost && <Crown size={20} className="text-yellow-500" />}
          </h1>
          <div className="flex items-center gap-2 text-purple-400 font-mono text-sm tracking-widest font-bold cursor-pointer hover:text-purple-300 transition-colors" onClick={copyJamId}>
            CODE: {roomCode}
            {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </div>
        </div>

        <TouchableScale onClick={leaveRoom}>
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-all active:scale-95" title="Leave room">
            <X size={22} />
          </div>
        </TouchableScale>
      </div>

      <div className="glass p-6 rounded-[32px] border border-white/5 mb-8">
        {!isHost && (
          <div className="flex items-center gap-2 mb-4 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider">
            <Radio size={16} className="animate-pulse" />
            <span>Listening with the Host</span>
          </div>
        )}
        {currentTrack ? (
          <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden group">
            <div className="relative w-14 h-14 shrink-0">
              <img src={currentTrack.cover} className="w-full h-full object-cover rounded-xl shadow-lg border border-white/10" alt={currentTrack.title} />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                <div className="flex gap-1 items-end h-4">
                  <motion.div animate={{ height: isPlaying ? [6, 14, 8, 14] : 6 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.5 }} className="w-1 bg-purple-400 rounded-full" />
                  <motion.div animate={{ height: isPlaying ? [10, 5, 10, 7] : 10 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.6 }} className="w-1 bg-purple-400 rounded-full" />
                  <motion.div animate={{ height: isPlaying ? [5, 10, 14, 5] : 5 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.7 }} className="w-1 bg-purple-400 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="font-bold text-white truncate tracking-tight mb-0.5">{currentTrack.title}</h4>
              <p className="text-sm text-white/40 font-medium truncate">{currentTrack.artist}</p>
            </div>
            {isHost && (
              <TouchableScale onClick={togglePlay}>
                <button className="w-11 h-11 flex items-center justify-center bg-white text-black hover:bg-white/90 rounded-full shadow-lg transition-colors cursor-pointer select-none">
                  {isPlaying ? <Pause size={20} className="fill-black text-black" /> : <Play size={20} className="fill-black text-black ml-0.5" />}
                </button>
              </TouchableScale>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-white/40 font-medium">
            Nothing playing right now.
          </div>
        )}
      </div>
    </div>
  );
};
