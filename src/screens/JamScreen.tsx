import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Pause, Plus, X, Crown, Search, SkipForward, Copy, Check, UserPlus, Share2 } from 'lucide-react';
import { useJam } from '../context/JamContext';
import { usePlayer } from '../context/PlayerContext';
import { TouchableScale } from '../components/TouchableScale';
import { MOCK_TRACKS } from '../constants'; 
import { Track } from '../types';

import { Avatar } from '../components/Avatar';

export const JamScreen: React.FC = () => {
  const { jamState, joinJam, leaveJam, addToQueue, removeFromQueue, nextTrack, syncPlayerState } = useJam();
  const { playTrack, togglePlay, currentTrack, isPlaying, setQueue } = usePlayer();
  
  const currentUserString = localStorage.getItem('user');
  const user = currentUserString ? JSON.parse(currentUserString) : null;
  const isHost = jamState?.hostId === user?.id;

  const [jamIdInput, setJamIdInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (showAddModal) {
      fetch('/api/v1/songs')
        .then(res => res.json())
        .then(data => setAvailableTracks([...data, ...MOCK_TRACKS]))
        .catch(() => setAvailableTracks(MOCK_TRACKS));
    }
  }, [showAddModal]);

  const handleCreateJam = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return;
    const user = JSON.parse(userString);
    const newJamId = Math.random().toString(36).substring(2, 9).toUpperCase();
    joinJam(newJamId, user);
  };

  const handleJoinJam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jamIdInput.trim()) return;
    const userString = localStorage.getItem('user');
    if (!userString) return;
    const user = JSON.parse(userString);
    joinJam(jamIdInput.toUpperCase(), user);
  };

  const copyJamId = () => {
    if (jamState) {
      navigator.clipboard.writeText(jamState.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleAddTrack = (track: Track) => {
    addToQueue(track);
    setShowAddModal(false);
  };

  React.useEffect(() => {
    // If I am the host and I play something, sync it to the Jam
    if (isHost && jamState) {
       syncPlayerState({
         isPlaying,
         currentTrack: currentTrack || null,
         progress: 0
       });
    }
  }, [isHost, currentTrack?.id, isPlaying]);

  if (!jamState) {
    return (
      <div className="pb-[240px] pt-16 px-6 max-w-2xl mx-auto w-full text-center">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(147,51,234,0.3)]">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4">Jam Sessions</h1>
          <p className="text-white/60 mb-8 max-w-sm mx-auto">
            Listen together with up to 32 friends in real-time. Anyone can add to the queue.
          </p>
          
          <TouchableScale onClick={handleCreateJam} className="w-full max-w-sm">
            <div className="w-full bg-white text-black font-bold py-4 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-8">
              Start a Jam
            </div>
          </TouchableScale>

          <div className="flex items-center gap-4 w-full max-w-sm mb-8">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-white/40 font-bold text-sm uppercase">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <form onSubmit={handleJoinJam} className="w-full max-w-sm relative">
            <input 
              type="text" 
              placeholder="Enter Jam Code" 
              value={jamIdInput}
              onChange={(e) => setJamIdInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-32 text-lg font-bold text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors uppercase tracking-widest text-center"
            />
            <button 
              type="submit"
              disabled={!jamIdInput.trim()}
              className="absolute right-2 top-2 bottom-2 bg-purple-500 text-white px-6 rounded-full font-bold disabled:opacity-50"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleShareJam = async () => {
    if (!jamState) return;
    const url = `${window.location.origin}?jam=${jamState.id}`;
    const shareData = {
      title: 'Join my Jam',
      text: `Join my jam session! Code: ${jamState.id}`,
      url: url
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-[240px] pt-16 px-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2">
            {jamState.name}
            {isHost && <Crown size={20} className="text-yellow-500" />}
          </h1>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-sm tracking-widest font-bold cursor-pointer" onClick={copyJamId}>
              CODE: {jamState.id}
              {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </div>
            <div className="flex items-center gap-2 text-white/50 text-xs font-bold cursor-pointer hover:text-white transition-colors" onClick={handleShareJam}>
              SHARE LINK
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TouchableScale onClick={leaveJam}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
              <X size={24} />
            </div>
          </TouchableScale>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Members ({jamState.members.length}/32)</h2>
          <TouchableScale onClick={handleShareJam}>
            <div className="flex items-center gap-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full font-bold text-sm hover:bg-purple-500/30 transition-colors">
              <UserPlus size={16} />
              <span>Invite</span>
            </div>
          </TouchableScale>
        </div>
        <div className="flex flex-wrap gap-2">
          {jamState.members.map(member => (
            <button 
              key={member.userId} 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigateProfile', { detail: { userId: member.userId || (member as any).id } }));
              }}
              className="flex items-center gap-3 bg-white/[0.08] px-3 py-2 rounded-full border border-white/10 pr-5 hover:bg-white/[0.16] transition-colors cursor-pointer active:scale-95"
            >
              <Avatar src={member.avatar_url || (member as any).image_file} alt={member.username} size={32} fallbackText={member.username ? member.username.charAt(0).toUpperCase() : '?'} className="shadow-lg border border-white/20" />
              <span className="text-sm font-bold text-white/90">{member.username}</span>
              {member.isHost && <Crown size={14} className="text-yellow-500 ml-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Up Next</h2>
        <TouchableScale onClick={() => setShowAddModal(true)}>
          <div className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-full font-bold text-sm">
            <Plus size={16} />
            Add Track
          </div>
        </TouchableScale>
      </div>

      {jamState.queue.length === 0 && !jamState.currentTrack ? (
        <div className="text-center py-12 text-white/40 font-medium">
          The queue is empty. Add a track to start the jam!
        </div>
      ) : (
        <div className="space-y-3">
          {jamState.currentTrack && (
            <div className="flex items-center gap-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl relative overflow-hidden group">
              <div className="relative w-14 h-14 shrink-0">
                <img src={jamState.currentTrack.cover} className="w-full h-full object-cover rounded-xl shadow-lg border border-white/10" alt={jamState.currentTrack.title} />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                  <div className="flex gap-1 items-end h-4">
                    <motion.div animate={{ height: jamState.isPlaying ? [6, 14, 8, 14] : 6 }} transition={{ repeat: jamState.isPlaying ? Infinity : 0, duration: 0.5 }} className="w-1 bg-purple-400 rounded-full" />
                    <motion.div animate={{ height: jamState.isPlaying ? [10, 5, 10, 7] : 10 }} transition={{ repeat: jamState.isPlaying ? Infinity : 0, duration: 0.6 }} className="w-1 bg-purple-400 rounded-full" />
                    <motion.div animate={{ height: jamState.isPlaying ? [5, 10, 14, 5] : 5 }} transition={{ repeat: jamState.isPlaying ? Infinity : 0, duration: 0.7 }} className="w-1 bg-purple-400 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-bold text-purple-400 truncate tracking-tight mb-0.5">{jamState.currentTrack.title}</h4>
                <p className="text-sm text-white/40 font-medium truncate">{jamState.currentTrack.artist}</p>
              </div>
              {isHost && (
                <div className="flex items-center gap-1">
                  <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full">
                    {jamState.isPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white ml-0.5" />}
                  </button>
                  <button onClick={nextTrack} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full">
                    <SkipForward size={20} />
                  </button>
                </div>
              )}
            </div>
          )}

          {jamState.queue.map((track, i) => (
             <div key={`${track.id}-${i}`} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl group transition-colors">
               <div className="w-6 text-center text-white/30 font-bold text-sm">
                 {i + 1}
               </div>
               <div className="relative w-12 h-12 shrink-0">
                 <img src={track.cover} className="w-full h-full object-cover rounded-xl" alt={track.title} />
               </div>
               <div className="flex-1 min-w-0 pr-4">
                 <h4 className="font-bold text-white truncate tracking-tight mb-0.5">{track.title}</h4>
                 <p className="text-sm text-white/40 font-medium truncate">{track.artist}</p>
               </div>
               {(isHost || track.id) && ( // Simplified permission
                 <button onClick={() => removeFromQueue(track.id)} className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                   <X size={20} />
                 </button>
               )}
             </div>
          ))}
        </div>
      )}

      {/* Add Track Modal (Mock) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[140px] sm:pb-[160px] bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#121212] border border-white/10 p-6 rounded-[32px] w-full max-w-md shadow-2xl relative max-h-full flex flex-col"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white shrink-0"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 tracking-tight shrink-0">Add to Queue</h2>
              
              <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pb-4">
                {availableTracks.map(track => (
                  <TouchableScale key={track.id} onClick={() => handleAddTrack(track)} className="w-full block">
                    <div className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-2xl group transition-colors text-left">
                      <div className="relative w-12 h-12 shrink-0">
                        <img src={track.cover} className="w-full h-full object-cover rounded-xl" alt={track.title} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate tracking-tight mb-0.5">{track.title}</h4>
                        <p className="text-sm text-white/40 font-medium truncate">{track.artist}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        <Plus size={16} />
                      </div>
                    </div>
                  </TouchableScale>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
