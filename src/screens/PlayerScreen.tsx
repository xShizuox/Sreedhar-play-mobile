import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SkipBack, SkipForward, Play, Pause, Shuffle, Download, Share2, ListMusic, ChevronDown, ChevronUp, Heart, Loader2, Mic2, MessageCircle, Send } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { TouchableScale } from '../components/TouchableScale';
import { GoogleGenAI } from "@google/genai";

interface PlayerScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ isOpen, onClose }) => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    progress, 
    duration, 
    seek,
    isShuffle,
    toggleShuffle,
    toggleLike,
    queue,
    removeFromQueue,
    reorderQueue
  } = usePlayer();
  const { downloadedTracks, isDownloading, downloadTrack } = useDownload();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (showComments && currentTrack) {
      setLoadingComments(true);
      fetch(`/api/v1/songs/${currentTrack.id}/comments`)
        .then(res => res.json())
        .then(data => {
          setComments(Array.isArray(data) ? data : []);
          setLoadingComments(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingComments(false);
        });
    }
  }, [showComments, currentTrack]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem('sreedhar_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/songs/${currentTrack.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const added = await res.json();
        setComments([added, ...comments]);
      } else {
        // Fallback for mock tracks when backend auth fails
        setComments([{ id: Date.now().toString(), content: newComment, user: { username: 'You', image_file: '/default.svg' } }, ...comments]);
      }
      setNewComment('');
    } catch (err) {
      console.error(err);
      // Fallback for mock tracks
      setComments([{ id: Date.now().toString(), content: newComment, user: { username: 'You', image_file: '/default.svg' } }, ...comments]);
      setNewComment('');
    }
  };

  useEffect(() => {
    let active = true;
    if (showLyrics && currentTrack) {
      setLoadingLyrics(true);
      
      const fetchLyrics = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const prompt = `Can you provide the lyrics for the song "${currentTrack.title}" by ${currentTrack.artist}? Please only output the lyrics text, no extra conversational filler. If you can't find it just say "Lyrics not found."`;
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
          });

          if (active) {
            setLyrics(response.text || 'Lyrics not found.');
            setLoadingLyrics(false);
          }
        } catch (e) {
          console.error('Gemini API Error:', e);
          if (active) {
            setLyrics('Failed to load lyrics. Please try again.');
            setLoadingLyrics(false);
          }
        }
      };

      fetchLyrics();
    }
    return () => { active = false; };
  }, [showLyrics, currentTrack]);

  if (!currentTrack) return null;

  const [showShareToast, setShowShareToast] = useState(false);
  const isDownloaded = downloadedTracks.includes(currentTrack.id);
  const downloading = isDownloading.includes(currentTrack.id);

  const handleShare = async () => {
    const shareData = {
      title: currentTrack.title,
      text: `Listen to ${currentTrack.title} by ${currentTrack.artist}`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const progressPercent = (progress / duration) * 100 || 0;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerVariants = {
    hidden: { y: '100%' },
    visible: { 
      y: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 250,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { 
      y: '100%',
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 250
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const artworkVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring', 
        damping: 20, 
        stiffness: 150,
        delay: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] bg-black isolate overflow-hidden"
        >
          {/* Liquid Background */}
          <div className="absolute inset-0 -z-10 bg-black">
            <motion.img
              src={currentTrack.cover}
              alt="ambient"
              className="w-full h-full object-cover opacity-60 scale-110"
            />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
          </div>

          <div className="h-full flex flex-col p-4 pt-10 sm:p-8 max-w-xl mx-auto w-full h-screen overflow-y-auto no-scrollbar pb-10">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex justify-between items-center mb-6 sm:mb-8 shrink-0">
              <TouchableScale onClick={onClose}>
                <ChevronDown size={28} />
              </TouchableScale>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Playing From</span>
                <span className="text-xs font-bold text-primary">Discover Feed</span>
              </div>
              <TouchableScale>
                <div className="w-10 h-10 flex items-center justify-center rounded-full glass">
                  <span className="text-xs font-bold">...</span>
                </div>
              </TouchableScale>
            </motion.div>

            {/* Main Content Area */}
            {showLyrics ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="flex-1 flex flex-col min-h-0 mb-8 bg-black/40 rounded-3xl p-6 backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Lyrics</h2>
                  <TouchableScale onClick={() => setShowLyrics(false)}><X size={24} className="text-white/60" /></TouchableScale>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar text-center text-white/80 font-medium text-lg leading-relaxed whitespace-pre-wrap">
                  {loadingLyrics ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                      <Loader2 size={32} className="animate-spin" />
                      <p className="text-sm animate-pulse font-bold tracking-widest uppercase">Uncovering Lyrics</p>
                    </div>
                  ) : (
                    lyrics
                  )}
                </div>
              </motion.div>
            ) : showQueue ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="flex-1 flex flex-col min-h-0 mb-8 bg-black/40 rounded-3xl p-6 backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Now Playing Queue</h2>
                  <TouchableScale onClick={() => setShowQueue(false)}><X size={24} className="text-white/60" /></TouchableScale>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                  {queue.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {queue.map((track, idx) => (
                        <div key={`${track.id}-${idx}`} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 group transition-colors hover:bg-white/10">
                          <img src={track.cover} className="w-14 h-14 rounded-xl object-cover shadow-md" alt={track.title} />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-sm truncate text-white">{track.title}</h4>
                             <p className="text-xs text-white/50 truncate font-medium">{track.artist}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                               <button 
                                 disabled={idx === 0} 
                                 onClick={() => reorderQueue(idx, idx - 1)} 
                                 className="disabled:opacity-20 text-white/60 hover:text-white p-1"
                               >
                                 <ChevronUp size={18} />
                               </button>
                               <button 
                                 disabled={idx === queue.length - 1} 
                                 onClick={() => reorderQueue(idx, idx + 1)} 
                                 className="disabled:opacity-20 text-white/60 hover:text-white p-1"
                               >
                                 <ChevronDown size={18} />
                               </button>
                            </div>
                            <TouchableScale onClick={() => removeFromQueue(idx)}>
                              <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                                <X size={18} className="text-white/60 group-hover:text-red-400" />
                              </div>
                            </TouchableScale>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
                      <ListMusic size={48} className="opacity-20" />
                      <p className="font-medium text-sm">Your queue is empty</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : showComments ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="flex-1 flex flex-col min-h-0 mb-8 bg-black/40 rounded-3xl p-6 backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Comments <span className="text-sm text-white/40 ml-2 font-normal">{comments.length}</span></h2>
                  <TouchableScale onClick={() => setShowComments(false)}><X size={24} className="text-white/60" /></TouchableScale>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4 flex flex-col gap-4">
                  {loadingComments ? (
                    <div className="flex items-center justify-center h-32"><Loader2 size={24} className="animate-spin text-white/40" /></div>
                  ) : comments.length > 0 ? (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                        <img src={c.user?.image_file || '/default.svg'} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-white/60 mb-0.5">{c.user?.username || 'Unknown'}</p>
                          <p className="text-sm text-white/90 leading-snug">{c.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2">
                      <MessageCircle size={32} className="opacity-20" />
                      <p className="text-sm">Be the first to comment!</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-end gap-2 bg-white/5 p-1.5 rounded-full border border-white/10">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    className="flex-1 bg-transparent text-sm text-white px-3 py-2 outline-none"
                  />
                  <TouchableScale onClick={handlePostComment}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${newComment.trim() ? 'bg-primary text-white' : 'bg-white/10 text-white/40'}`}>
                      <Send size={16} className={newComment.trim() ? "ml-0.5" : ""} />
                    </div>
                  </TouchableScale>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Artwork Container */}
                <div className="flex-1 flex items-center justify-center relative mb-8">
                   <motion.div
                    animate={{
                      scale: isPlaying ? [1, 1.03, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
                  </motion.div>
                  
                  <motion.div 
                    variants={artworkVariants}
                    className="relative w-full aspect-square rounded-3xl overflow-hidden glass p-2 max-w-[320px]"
                  >
                    <img 
                      src={currentTrack.cover} 
                      className="w-full h-full object-cover rounded-2xl shadow-2xl" 
                      alt={currentTrack.title}
                    />
                  </motion.div>
                </div>

                {/* Metadata */}
                <motion.div variants={itemVariants} className="flex flex-col mb-10">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold truncate text-white">{currentTrack.title}</h1>
                        {currentTrack.quality && (
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex-shrink-0 ${currentTrack.quality.includes('Lossless') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/10 text-white/60'}`}>
                            {currentTrack.quality}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new CustomEvent('navigateProfile', { detail: { userId: currentTrack.userId || currentTrack.id } }));
                        }}
                        className="text-white/60 font-medium tracking-wide text-left hover:text-white hover:underline transition-colors w-fit"
                      >
                        {currentTrack.artist}
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <TouchableScale onClick={() => {
                        setShowComments(!showComments);
                        if (!showComments) { setShowQueue(false); setShowLyrics(false); }
                      }}>
                        <MessageCircle size={28} className="text-white/40 hover:text-white transition-colors" />
                      </TouchableScale>
                      <TouchableScale onClick={() => toggleLike()}>
                        <Heart 
                          size={28} 
                          className={currentTrack.isLiked ? "text-primary fill-primary" : "text-white/40 hover:text-white transition-colors"} 
                        />
                      </TouchableScale>
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {/* Custom Scrubber */}
            <motion.div variants={itemVariants} className="w-full mb-10 px-2">
              <div className="relative h-[3px] bg-white/10 rounded-full group cursor-pointer">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="1"
                  value={progress}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <motion.div 
                  className="absolute top-0 left-0 h-full progress-gradient rounded-full shadow-[0_0_10px_#8b5cf6]"
                  style={{ width: `${progressPercent}%` }}
                />
                <div 
                  className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-150"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-white/40 tracking-widest uppercase">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-10 sm:mb-12">
              <TouchableScale 
                onClick={toggleShuffle}
                className={isShuffle ? 'text-primary' : 'text-white/40'}
              >
                <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
              </TouchableScale>
              <div className="flex items-center gap-6 sm:gap-8">
                <TouchableScale onClick={prevTrack}><SkipBack className="w-6 h-6 sm:w-8 sm:h-8" fill="white" strokeWidth={0} /></TouchableScale>
                
                <TouchableScale onClick={togglePlay} scale={0.9}>
                  <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full active-pill flex items-center justify-center shadow-2xl shadow-purple-900/40 border border-white/20">
                    {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10" fill="white" strokeWidth={0} /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 sm:ml-2" fill="white" strokeWidth={0} />}
                  </div>
                </TouchableScale>
                
                <TouchableScale onClick={nextTrack}><SkipForward className="w-6 h-6 sm:w-8 sm:h-8" fill="white" strokeWidth={0} /></TouchableScale>
              </div>
              <TouchableScale 
                onClick={() => !isDownloaded && !downloading && downloadTrack(currentTrack)} 
                className={isDownloaded ? 'text-[#10b981]' : downloading ? 'animate-pulse text-primary' : 'text-white/40'}
              >
                {downloading ? <Loader2 size={24} className="animate-spin" /> : <Download className="w-5 h-5 sm:w-6 sm:h-6" fill={isDownloaded ? "currentColor" : "none"} />}
              </TouchableScale>
            </motion.div>

            {/* Footer Actions */}
            <motion.div variants={itemVariants} className="flex justify-between items-center text-white/40 px-6">
              <TouchableScale onClick={handleShare}><Share2 size={20} /></TouchableScale>
              <TouchableScale 
                onClick={() => {
                  setShowLyrics(!showLyrics);
                  if (!showLyrics) { setShowQueue(false); setShowComments(false); }
                }}
                className={showLyrics ? 'text-primary' : ''}
              >
                <Mic2 size={20} />
              </TouchableScale>
              <TouchableScale 
                onClick={() => {
                  setShowQueue(!showQueue);
                  if (!showQueue) { setShowLyrics(false); setShowComments(false); }
                }}
                className={showQueue ? 'text-primary' : ''}
              >
                <ListMusic size={20} />
              </TouchableScale>
            </motion.div>
          </div>
          
          <AnimatePresence>
            {showShareToast && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass bg-black/50 border border-white/20 text-white text-sm whitespace-nowrap z-50 pointer-events-none"
              >
                Link copied to clipboard!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
