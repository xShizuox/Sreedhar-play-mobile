import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Music, Image as ImageIcon, CheckCircle2, Loader2, X, AlertCircle, Trash2, HardDrive, CheckSquare, Square, Download as DownloadIcon, Play, Pause, MoreVertical, Calendar, FileAudio, Cloud, RefreshCw } from 'lucide-react';
import { TouchableScale } from '../components/TouchableScale';
import { useDownload } from '../context/DownloadContext';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

export const LibraryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'downloads'>('upload');
  
  // Upload State
  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Drag State
  const [songDragActive, setSongDragActive] = useState(false);
  const [coverDragActive, setCoverDragActive] = useState(false);

  const MAX_AUDIO_SIZE = 250 * 1024 * 1024; // 250MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  // Downloads State
  const { downloadedTracks, removeDownload, getOfflineTracks } = useDownload();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [offlineTracksList, setOfflineTracksList] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (activeTab === 'downloads') {
      loadOfflineTracks();
    }
  }, [activeTab, downloadedTracks.length]);

  const loadOfflineTracks = async () => {
    const tracks = await getOfflineTracks();
    setOfflineTracksList(tracks.map(t => ({ ...t, syncStatus: 'checking' })));

    if (tracks.length > 0) {
      try {
        const res = await fetch('/api/v1/songs/check_updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songIds: tracks.map((t: Track) => t.id) })
        });
        if (res.ok) {
          const updates = await res.json();
          setOfflineTracksList((prev: Track[]) => prev.map(t => {
            if (updates[t.id]) {
              const cloudUpdated = new Date(updates[t.id]).getTime();
              const localUpdated = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
              const status = cloudUpdated > localUpdated ? 'update_available' : 'up_to_date';
              return { ...t, syncStatus: status };
            }
            return { ...t, syncStatus: 'up_to_date' };
          }));
        } else {
           setOfflineTracksList((prev: Track[]) => prev.map(t => ({ ...t, syncStatus: 'up_to_date' })));
        }
      } catch (err) {
        console.error('Failed to check sync status', err);
        setOfflineTracksList((prev: Track[]) => prev.map(t => ({ ...t, syncStatus: 'up_to_date' })));
      }
    }
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTracks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const removeSelectedTracks = async () => {
    setIsRemoving(true);
    for (const id of selectedTracks) {
      await removeDownload(id);
    }
    setSelectedTracks([]);
    setIsRemoving(false);
  };

  const storageUsedMB = (downloadedTracks.length * 5.2).toFixed(1);

  const songInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const validateAudioFile = (file: File) => {
    const allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.dsf', '.dff', '.ape', '.ogg', '.aac', '.alac'];
    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
    
    const isAudioMime = file.type.startsWith('audio/') || file.type === 'video/mp4';
    const isValidExt = allowedExtensions.includes(ext);
    
    if (!isAudioMime && !isValidExt) {
      return 'Please select a valid audio file.';
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return 'Audio file exceeds 250MB limit.';
    }
    return null;
  };

  const validateImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image file exceeds 5MB limit.';
    }
    return null;
  };

  const handleSongSelection = (file?: File) => {
    if (file) {
      const error = validateAudioFile(file);
      if (error) {
        setValidationError(error);
        setTimeout(() => setValidationError(''), 5000);
        return;
      }
      setValidationError('');
      setSongFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleSongSelection(file);
  };

  const handleSongDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSongDragActive(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    handleSongSelection(file);
  };

  const handleCoverSelection = (file?: File) => {
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        setValidationError(error);
        setTimeout(() => setValidationError(''), 5000);
        return;
      }
      setValidationError('');
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleCoverSelection(file);
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCoverDragActive(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    handleCoverSelection(file);
  };

  const resetForm = () => {
    setSongFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setTitle('');
    setArtist('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setValidationError('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songFile) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(10); // Initial progress

    const formData = new FormData();
    formData.append('song', songFile);
    if (coverFile) formData.append('cover', coverFile);
    formData.append('title', title);
    formData.append('artist', artist);

    try {
      const token = localStorage.getItem('token');
      
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open('POST', '/api/v1/songs/upload');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject({ status: xhr.status, responseText: xhr.responseText });
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      await uploadPromise;
      
      setUploadProgress(100);
      setUploadStatus('success');
      setTimeout(() => {
        resetForm();
        setIsUploading(false);
      }, 2000);

    } catch (err: any) {
      let errorMsg = 'Upload failed';
      
      if (err.status === 401) {
        errorMsg = 'Session expired. Please log out and log in again.';
      } else if (err.status) {
        try {
          const errorData = JSON.parse(err.responseText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          if (err.status === 413) {
            errorMsg = 'File is too large. Server limit exceeded.';
          } else {
            errorMsg = `Server error code: ${err.status}`;
          }
        }
      } else {
        errorMsg = err.message || errorMsg;
      }
      
      console.error('Upload error:', err);
      setUploadStatus('error');
      setErrorMessage(errorMsg || 'Network error occurred. Please try again.');
      setIsUploading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-[240px] pt-16 px-6 max-w-2xl mx-auto w-full"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-5xl font-black tracking-tight mb-2">Library</h1>
          <div className="flex items-center gap-6 mt-6">
            <button 
              onClick={() => setActiveTab('upload')}
              className={`text-lg font-bold transition-colors ${activeTab === 'upload' ? 'text-white border-b-2 border-purple-500 pb-1' : 'text-white/40 hover:text-white/80'}`}
            >
              Upload
            </button>
            <button 
              onClick={() => setActiveTab('downloads')}
              className={`text-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'downloads' ? 'text-white border-b-2 border-purple-500 pb-1' : 'text-white/40 hover:text-white/80'}`}
            >
              Downloads
              {downloadedTracks.length > 0 && (
                <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full">{downloadedTracks.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleUpload} className="space-y-8">
              {validationError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3"
                >
                  <AlertCircle size={18} />
                  {validationError}
                </motion.div>
              )}

              {/* Audio File Selection */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setSongDragActive(true); }}
                onDragLeave={() => setSongDragActive(false)}
                onDrop={handleSongDrop}
                onClick={() => !isUploading && songInputRef.current?.click()}
                className={`relative group cursor-pointer h-56 xl:h-64 glass rounded-[40px] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden ${
                  songDragActive ? 'border-purple-500 bg-purple-500/10' :
                  songFile ? 'border-primary/50' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <AnimatePresence>
                  {coverPreview && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${coverPreview})`,
                        filter: 'blur(30px) brightness(1.5)',
                        transform: 'scale(1.2)'
                      }}
                    />
                  )}
                </AnimatePresence>
                
                <input 
                  ref={songInputRef}
                  type="file" 
                  accept="audio/*,.mp3,.wav,.flac,.m4a,.dsf,.dff,.ape,.ogg,.aac,.alac" 
                  className="hidden" 
                  onChange={handleSongChange}
                />
                {songFile ? (
                  <div className="text-center px-6 w-full relative z-10 flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-6 h-12">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 8 }}
                          animate={{ height: [8, 24 + Math.random() * 24, 8] }}
                          transition={{
                            duration: 0.8 + Math.random() * 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                          className="w-1.5 bg-primary/80 rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-xl font-black truncate max-w-md text-white px-4">{songFile.name}</p>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-[0.2em] mt-3">
                      {(songFile.size / (1024 * 1024)).toFixed(2)} MB • Tap to Change
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Upload className="text-white/40" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white/60">
                        {songDragActive ? 'Drop audio file here' : 'Select Audio File'}
                      </p>
                      <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-1">MP3, WAV, FLAC, M4A, OGG (Max 250MB)</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {/* Metadata */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Song Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={isUploading}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
                      placeholder="Ex: Midnight Melancholy"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Artist Name</label>
                    <input 
                      type="text" 
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      required
                      disabled={isUploading}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium disabled:opacity-50"
                      placeholder="Your Stage Name"
                    />
                  </div>
                </div>

                {/* Cover Art selection */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Cover Art</label>
                   <div 
                    onClick={() => !isUploading && coverInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setCoverDragActive(true); }}
                    onDragLeave={() => setCoverDragActive(false)}
                    onDrop={handleCoverDrop}
                    className={`relative aspect-square glass rounded-[28px] overflow-hidden cursor-pointer group transition-all border-2 ${
                      coverDragActive ? 'border-purple-500 bg-purple-500/10 border-dashed' : 'border-white/10 border-solid'
                    }`}
                   >
                      <input 
                        ref={coverInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleCoverChange}
                      />
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon size={32} />
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-white/20 group-hover:text-white/40 transition-colors">
                          <ImageIcon size={48} strokeWidth={1} className={coverDragActive ? 'text-purple-400' : ''} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                            {coverDragActive ? 'Drop image here' : 'Select Artwork'}
                            <br />
                            <span className="font-medium text-[8px] opacity-70">JPG, PNG (Max 5MB)</span>
                          </span>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Upload Button */}
              <div className="pt-8">
                 <TouchableScale disabled={!songFile || isUploading} className="w-full">
                  <button 
                    type="submit"
                    disabled={!songFile || isUploading}
                    className={`w-full py-5 rounded-[24px] font-black text-lg tracking-tight shadow-2xl transition-all relative overflow-hidden ${
                      !songFile ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed' :
                      isUploading ? 'bg-white/10 text-white cursor-wait' :
                      'active-pill text-white shadow-purple-900/40'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-3">
                          <Loader2 size={24} className="animate-spin" />
                          <span>Uploading...</span>
                        </div>
                        <span className="text-xs text-white/50 font-bold font-mono">{uploadProgress}%</span>
                        <div 
                          className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 to-primary transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    ) : (
                      'Publish Track'
                    )}
                  </button>
                 </TouchableScale>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="downloads"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Storage Info */}
            <div className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <HardDrive size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">Storage Used</h3>
                  <p className="text-sm text-white/40">{storageUsedMB} MB from {downloadedTracks.length} tracks</p>
                </div>
              </div>
              {selectedTracks.length > 0 && (
                <button 
                  onClick={removeSelectedTracks}
                  disabled={isRemoving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
                >
                  {isRemoving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>Remove ({selectedTracks.length})</span>
                </button>
              )}
            </div>

            {/* Offline Tracks List */}
            {offlineTracksList.length > 0 ? (
              <div className="flex flex-col gap-3">
                {offlineTracksList.map(track => {
                  const isSelected = selectedTracks.includes(track.id);
                  return (
                    <div 
                      key={track.id} 
                      className={`flex items-center gap-4 p-4 rounded-[20px] transition-all cursor-pointer ${
                        isSelected ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.05]'
                      }`}
                      onClick={() => toggleTrackSelection(track.id)}
                    >
                      <div className="text-white/40 shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleTrackSelection(track.id); }}>
                        {isSelected ? <CheckSquare className="text-purple-400" size={20} /> : <Square size={20} />}
                      </div>
                      <div className="relative w-16 h-16 shrink-0 group">
                        <img src={track.cover} className="w-full h-full object-cover rounded-[14px] shadow-lg border border-white/10 group-hover:border-white/20 transition-colors" alt={track.title} />
                        <div 
                          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-[14px] flex items-center justify-center transition-all duration-300 ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          onClick={(e) => { e.stopPropagation(); currentTrack?.id === track.id ? togglePlay() : playTrack(track); }}
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause size={24} className="text-white fill-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                          ) : (
                            <Play size={24} className="text-white fill-white ml-1 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className={`font-bold text-lg truncate tracking-tight mb-0.5 transition-colors ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white group-hover:text-purple-200'}`}>{track.title}</h4>
                        <p className="text-sm text-white/40 font-medium truncate mb-2">{track.artist}</p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-white/30 uppercase tracking-wider font-bold">
                          <span className="flex items-center gap-1.5"><FileAudio size={12} className="text-white/20" /> {(5.2).toFixed(1)} MB</span>
                          <span className="w-1 h-1 rounded-full bg-white/10"></span>
                          <span className="flex items-center gap-1.5">
                            {track.syncStatus === 'checking' && <RefreshCw size={12} className="animate-spin text-white/40" />}
                            {track.syncStatus === 'up_to_date' && <CheckCircle2 size={12} className="text-green-500" />}
                            {track.syncStatus === 'update_available' && <Cloud size={12} className="text-yellow-500" />}
                            <span className={track.syncStatus === 'update_available' ? 'text-yellow-500/80' : track.syncStatus === 'up_to_date' ? 'text-green-500/80' : 'text-white/40'}>
                              {track.syncStatus === 'update_available' ? 'Update Available' : track.syncStatus === 'up_to_date' ? 'Up to date' : 'Checking sync...'}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                           <DownloadIcon size={16} className="text-green-500" strokeWidth={2.5} />
                         </div>
                         <button 
                           className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-all"
                           onClick={(e) => { e.stopPropagation(); }}
                         >
                           <MoreVertical size={20} />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full glass border border-white/5 flex items-center justify-center text-white/20 mb-6">
                  <DownloadIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Downloads</h3>
                <p className="text-white/40 font-medium max-w-[240px] mx-auto text-sm leading-relaxed">
                  Tracks you download will appear here for offline listening.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Modals */}
      <AnimatePresence>
        {uploadStatus !== 'idle' && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => uploadStatus === 'error' && setUploadStatus('idle')}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass p-10 rounded-[48px] shadow-2xl border-white/10 max-w-sm w-full text-center"
            >
              {uploadStatus === 'success' ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-green-500" size={48} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Success!</h3>
                  <p className="text-white/40 font-medium leading-relaxed">Your track has been published and is now live on Sreedhar Play.</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-red-500" size={48} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Upload Failed</h3>
                  <p className="text-white/40 font-medium leading-relaxed mb-6">{errorMessage}</p>
                  <TouchableScale onClick={() => setUploadStatus('idle')} className="w-full">
                    <button className="w-full py-4 glass rounded-2xl font-bold text-white/70 hover:text-white transition-colors">
                      Try Again
                    </button>
                  </TouchableScale>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
