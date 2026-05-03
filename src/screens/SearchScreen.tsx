import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, X, Play, Heart, CheckCircle2 } from 'lucide-react';
import { MOCK_TRACKS } from '../constants';
import { usePlayer } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { TouchableScale } from '../components/TouchableScale';

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { playTrack, currentTrack, toggleLike } = usePlayer();
  const { downloadedTracks } = useDownload();
  const [tracks, setTracks] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const addSearch = (q: string) => {
    if (!q.trim()) return;
    const filtered = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 5);
    setRecentSearches(filtered);
    localStorage.setItem('recentSearches', JSON.stringify(filtered));
  };

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch('/api/v1/songs');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setTracks(data);
          } else {
            setTracks(MOCK_TRACKS);
          }
        } else {
          setTracks(MOCK_TRACKS);
        }
      } catch (err) {
        setTracks(MOCK_TRACKS);
      }
    };
    fetchTracks();
  }, []);

  const filteredTracks = searchQuery.trim() === '' 
    ? [] 
    : tracks.filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-[240px] pt-10 px-6 max-w-4xl mx-auto w-full"
    >
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-8">Search</h1>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/30">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search for tracks or artists"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addSearch(searchQuery);
              }
            }}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-14 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-5 flex items-center text-white/30 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {searchQuery.trim() === '' ? (
          <div className="flex flex-col gap-8">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Recent Searches</span>
                  <button onClick={() => { setRecentSearches([]); localStorage.setItem('recentSearches', '[]'); }} className="text-[10px] text-white/30 hover:text-white uppercase font-black">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(term)}
                      className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors font-medium flex items-center gap-2"
                    >
                      <Search size={12} className="opacity-50" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Played */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Recently Listened</p>
              <div className="flex flex-col gap-2">
                {(tracks.length > 0 ? tracks : MOCK_TRACKS).slice(0, 3).map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <TouchableScale key={track.id} onClick={() => playTrack(track)} className="w-full text-left" scale={0.98}>
                      <div className={`flex items-center gap-4 p-3 rounded-[20px] transition-all border ${isCurrent ? 'bg-white/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] border-white/10' : 'hover:bg-white/[0.04] border-transparent'}`}>
                        <div className="relative w-12 h-12 shrink-0">
                          <img src={track.cover} className="w-full h-full object-cover rounded-[14px] shadow-lg border border-white/10" alt={track.title} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`font-bold truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-xs text-white/40 font-medium">{track.artist}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Play size={16} className="ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </TouchableScale>
                  );
                })}
              </div>
            </div>
          </div>
        ) : filteredTracks.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Search Results ({filteredTracks.length})</p>
            {filteredTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <motion.div key={track.id} variants={itemVariants}>
                  <TouchableScale onClick={() => playTrack(track)} className="w-full text-left" scale={0.98}>
                    <div className={`flex items-center gap-4 p-4 rounded-[20px] transition-all ${isCurrent ? 'glass border-purple-500/30' : 'bg-white/[0.03] hover:bg-white/[0.05]'}`}>
                      <div className="relative w-14 h-14 shrink-0">
                        <img src={track.cover} className="w-full h-full object-cover rounded-xl shadow-lg border border-white/10" alt={track.title} />
                        {downloadedTracks.includes(track.id) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center border-2 border-black">
                            <CheckCircle2 size={10} color="white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{track.title}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-white/40 font-medium">{track.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-white/30">
                        <span className="text-[10px] font-bold tracking-wider">{track.plays}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track.id);
                          }}
                          className="hover:scale-110 transition-transform active:scale-95"
                        >
                          <Heart 
                            size={18} 
                            className={track.isLiked || (isCurrent && currentTrack?.isLiked) ? 'text-purple-400 fill-purple-400' : ''} 
                          />
                        </button>
                      </div>
                    </div>
                  </TouchableScale>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-white/30 font-medium">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
