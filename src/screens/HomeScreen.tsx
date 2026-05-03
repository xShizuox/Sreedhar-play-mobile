import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Music, Search, Heart, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { MOCK_TRACKS } from '../constants';
import { usePlayer } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { TouchableScale } from '../components/TouchableScale';

interface HomeScreenProps {
  onSearchClick: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSearchClick }) => {
  const { playTrack, currentTrack, isPlaying, toggleLike } = usePlayer();
  const { downloadedTracks } = useDownload();
  const [activeTab, setActiveTab] = React.useState('Global');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchTracks = async (pageNum: number) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const endpoint = activeTab === 'Global' ? `/api/v1/feed?page=${pageNum}&limit=10` : `/api/v1/songs?page=${pageNum}&limit=10`;
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setTracks(prev => pageNum === 1 ? [...data, ...MOCK_TRACKS] : [...prev, ...data]);
          if (data.length < 10) setHasMore(false);
        } else {
          setHasMore(false);
          if (pageNum === 1) setTracks(MOCK_TRACKS);
        }
      } else {
        if (pageNum === 1) setTracks(MOCK_TRACKS);
      }
    } catch (err) {
      if (pageNum === 1) setTracks(MOCK_TRACKS);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchTracks(1);
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      if (isLoading || isLoadingMore || !hasMore) return;
      
      const target = e.target.scrollingElement || document.documentElement;
      const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
      
      if (bottom) {
        setPage(prev => {
          fetchTracks(prev + 1);
          return prev + 1;
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isLoading, isLoadingMore, hasMore, activeTab]);

  const filteredTracks = React.useMemo(() => {
    if (activeTab === 'Global') return tracks;
    if (activeTab === 'Following') return tracks.filter((_, i) => i % 2 === 0);
    if (activeTab === 'Genres') return tracks.slice().sort(() => 0.5 - Math.random());
    return tracks;
  }, [activeTab, tracks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-[240px] pt-10 px-6 max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center p-0.5 shadow-lg">
             <Play size={20} className="ml-1" fill="currentColor" />
           </div>
           <span className="font-bold tracking-tight text-lg">SREEDHAR PLAY</span>
        </div>
        <TouchableScale 
          onClick={onSearchClick}
          className="w-12 h-12 flex items-center justify-center rounded-full glass border-white/10"
        >
          <Search size={22} />
        </TouchableScale>
      </motion.div>

      {/* Offline/Online Banner */}
      <motion.div 
        variants={itemVariants}
        className={`mb-10 p-4 rounded-3xl border flex items-center justify-between backdrop-blur-md transition-all ${
          isOnline 
          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
          : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}
      >
        <div className="flex items-center gap-3 ml-1">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse'}`}></div>
          <span className="text-xs font-bold tracking-wider font-mono">
            {isOnline ? 'Cloud Synchronized' : 'Offline Mode (Local tracks only)'}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5 select-none">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-14">
        <h1 className="text-6xl md:text-7xl font-black mb-1 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/30">
          Discover
        </h1>
        <p className="text-white/40 text-sm font-medium mb-8 ml-1 tracking-wide">Find your new favorite sound</p>
        
        {/* Tabs */}
        <div className="flex gap-3 mb-2 overflow-x-auto no-scrollbar pb-2">
          <TouchableScale onClick={() => setActiveTab('Global')}>
            <div className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-colors border ${activeTab === 'Global' ? 'active-pill shadow-[0_0_20px_-5px_rgba(147,51,234,0.4)] border-white/10 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60 border-transparent'}`}>Global</div>
          </TouchableScale>
          <TouchableScale onClick={() => setActiveTab('Following')}>
            <div className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-colors border ${activeTab === 'Following' ? 'active-pill shadow-[0_0_20px_-5px_rgba(147,51,234,0.4)] border-white/10 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60 border-transparent'}`}>Following</div>
          </TouchableScale>
          <TouchableScale onClick={() => setActiveTab('Genres')}>
            <div className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-colors border ${activeTab === 'Genres' ? 'active-pill shadow-[0_0_20px_-5px_rgba(147,51,234,0.4)] border-white/10 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60 border-transparent'}`}>Genres</div>
          </TouchableScale>
        </div>
      </motion.div>

      {/* Featured Tracks */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black tracking-widest text-white/50 uppercase">Trending Now</h2>
          <span onClick={onSearchClick} className="text-xs font-bold text-purple-400 cursor-pointer hover:text-purple-300 transition-colors">SEE ALL</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="glass p-4 rounded-[28px] flex flex-col gap-4 border border-white/10 animate-pulse h-full">
                <div className="w-full aspect-square rounded-[20px] bg-white/5" />
                <div className="px-2 pb-2 space-y-2">
                  <div className="w-3/4 h-6 bg-white/10 rounded-full" />
                  <div className="w-1/2 h-4 bg-white/5 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            tracks.slice(0, 3).map((track) => (
              <motion.div key={track.id} variants={itemVariants}>
                <TouchableScale onClick={() => playTrack(track)} className="w-full text-left" scale={0.97}>
                  <div className="glass p-4 rounded-[28px] flex flex-col gap-4 shadow-2xl border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.05] transition-all group h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="w-full aspect-square rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                        <img src={track.cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={track.title} />
                        {currentTrack?.id === track.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                             <div className="flex gap-1.5 items-end h-8">
                               <motion.div animate={{ height: isPlaying ? [16, 32, 20, 32] : 16 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.5 }} className="w-1.5 bg-purple-400 rounded-full shadow-[0_0_10px_#c084fc]" />
                               <motion.div animate={{ height: isPlaying ? [24, 12, 24, 16] : 24 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.6 }} className="w-1.5 bg-purple-400 rounded-full shadow-[0_0_10px_#c084fc]" />
                               <motion.div animate={{ height: isPlaying ? [12, 24, 32, 12] : 12 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.7 }} className="w-1.5 bg-purple-400 rounded-full shadow-[0_0_10px_#c084fc]" />
                             </div>
                          </div>
                        )}
                      </div>
                      {/* Now pill */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        Hot
                      </div>
                    </div>
                    <div className="relative z-10 px-2 pb-2">
                      <h3 className={`text-xl md:text-2xl font-black truncate tracking-tight mb-1 ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>{track.title}</h3>
                      <p className="text-white/40 text-sm font-medium">{track.artist}</p>
                    </div>
                  </div>
                </TouchableScale>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* Track List */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black tracking-widest text-white/50 uppercase">{activeTab} Tracks</h2>
          <span className="text-xs font-bold text-white/30 tracking-widest">TOP LIST</span>
        </div>
        <div className="flex flex-col gap-2">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-[20px] border border-transparent bg-white/[0.02] animate-pulse">
                <div className="w-6 h-4 bg-white/5 rounded shrink-0" />
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 rounded-[14px] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-5 bg-white/10 rounded-full" />
                  <div className="w-1/3 h-4 bg-white/5 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            filteredTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <motion.div key={track.id} variants={itemVariants}>
                  <TouchableScale onClick={() => playTrack(track)} className="w-full text-left" scale={0.98}>
                    <div className={`flex items-center gap-4 p-3 rounded-[20px] transition-all group relative overflow-hidden ${isCurrent ? 'bg-white/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] border border-white/10' : 'hover:bg-white/[0.04] border border-transparent'}`}>
                    
                    {/* Index Number */}
                    <div className="w-6 shrink-0 flex justify-center">
                      <span className={`text-sm font-black font-mono transition-colors ${isCurrent ? 'text-purple-400' : 'text-white/20 group-hover:text-white/50'}`}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
                      <img src={track.cover} className="w-full h-full object-cover rounded-[14px] shadow-lg border border-white/10 group-hover:border-white/20 transition-colors" alt={track.title} />
                      {currentTrack?.id === track.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-[14px]">
                           <div className="flex gap-1 items-end h-4">
                             <motion.div animate={{ height: isPlaying ? [6, 14, 8, 14] : 6 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.5 }} className="w-1 bg-purple-400 rounded-full shadow-[0_0_5px_#c084fc]" />
                             <motion.div animate={{ height: isPlaying ? [10, 5, 10, 7] : 10 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.6 }} className="w-1 bg-purple-400 rounded-full shadow-[0_0_5px_#c084fc]" />
                             <motion.div animate={{ height: isPlaying ? [5, 10, 14, 5] : 5 }} transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.7 }} className="w-1 bg-purple-400 rounded-full shadow-[0_0_5px_#c084fc]" />
                           </div>
                        </div>
                      )}
                      {downloadedTracks.includes(track.id) && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center border-2 border-black shadow-sm">
                          <CheckCircle2 size={10} color="white" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className={`font-bold text-base md:text-lg truncate tracking-tight mb-0.5 transition-colors ${isCurrent ? 'text-purple-400' : 'text-white group-hover:text-purple-200'}`}>{track.title}</h4>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('navigateProfile', { detail: { userId: track.userId || track.id } }));
                          }}
                          className="text-xs md:text-sm text-white/40 font-medium truncate hover:text-white hover:underline transition-colors"
                        >
                          {track.artist}
                        </button>
                        <span className="text-[10px] text-white/20 hidden sm:inline">•</span>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <Heart size={10} className="text-white/20 fill-white/20" />
                          <span className="text-[10px] text-white/40 font-black">{track.likes || '1.2K'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5 md:gap-6 text-white/30 shrink-0 pr-2">
                      <span className="text-[11px] font-mono font-bold tracking-wider hidden sm:block">{track.plays}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className="hover:scale-125 transition-transform active:scale-95 p-2 rounded-full hover:bg-white/10"
                      >
                        <Heart 
                          size={18} 
                          className={track.isLiked || (isCurrent && currentTrack?.isLiked) ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-white/30'} 
                        />
                      </button>
                    </div>
                    
                    {/* Active Track Highlight Gradient */}
                    {isCurrent && (
                      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-purple-500/20 to-transparent pointer-events-none" />
                    )}
                  </div>
                </TouchableScale>
              </motion.div>
            );
          }))}
        </div>
        
        {isLoadingMore && (
          <div className="flex justify-center mt-8 py-4">
            <Loader2 size={32} className="animate-spin text-purple-400 opacity-50" />
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};
