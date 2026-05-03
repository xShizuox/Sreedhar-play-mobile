import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, Heart, Shuffle } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { TouchableScale } from './TouchableScale';

interface PlayerBarProps {
  onOpenPlayer: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ onOpenPlayer }) => {
  const { currentTrack, isPlaying, togglePlay, nextTrack, progress, duration, isShuffle, toggleShuffle } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = (progress / duration) * 100 || 0;

  return (
    <div className="fixed bottom-[84px] sm:bottom-[96px] left-0 right-0 z-40 px-4 flex justify-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ backdropFilter: 'blur(30px)' }}
        className="w-full max-w-[360px] h-14 sm:h-16 glass rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group border-white/10"
      >
        <div 
          className="flex items-center justify-between px-3 sm:px-4 h-full cursor-pointer relative"
          onClick={onOpenPlayer}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shadow-lg shrink-0"
            />
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs sm:text-sm font-bold truncate text-white">
                {currentTrack.title}
              </span>
              <span className="text-[10px] sm:text-[11px] text-white/50 uppercase tracking-widest truncate">
                {currentTrack.artist}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0 z-10">
            <TouchableScale 
              onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
              className={`hidden sm:block ${isShuffle ? 'text-primary' : 'text-white/20'}`}
            >
              <Shuffle size={16} />
            </TouchableScale>
            
            <TouchableScale onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white text-black shadow-lg">
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </div>
            </TouchableScale>
            
            <TouchableScale onClick={(e) => { e.stopPropagation(); nextTrack(); }}>
              <SkipForward size={16} className="text-white" />
            </TouchableScale>
          </div>

          {/* 2px Progress Bar at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div 
              className="h-full progress-gradient relative shadow-[0_0_10px_#8b5cf6]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
