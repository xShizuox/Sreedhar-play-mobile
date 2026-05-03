import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, Music, Users, Heart, Share2, ListMusic, X, Camera, Loader2, CheckCircle2, Download, Plus, Trash2, MoreVertical, Shuffle, LogOut } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { TouchableScale } from '../components/TouchableScale';
import { Avatar } from '../components/Avatar';
import { Track } from '../types';
import { DEFAULT_AVATARS } from '../constants';

export const ProfileScreen: React.FC<{ userId?: string | null }> = ({ userId }) => {
  const { playTrack, currentTrack, toggleLike } = usePlayer();
  const { downloadedTracks, getOfflineTracks } = useDownload();
  const [activeTab, setActiveTab] = useState<'uploads' | 'playlists' | 'likes' | 'offline'>('uploads');
  const [profileData, setProfileData] = useState<any>(null);
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<{id: string, name: string} | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Track | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [showFollowModal, setShowFollowModal] = useState<boolean>(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [showShareToast, setShowShareToast] = useState<boolean>(false);

  let currentUser: any = {};
  try {
    const userItem = localStorage.getItem('user');
    if (userItem && userItem !== 'undefined') {
      currentUser = JSON.parse(userItem);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
  }
  const [viewingUserId, setViewingUserId] = useState<string>(userId || currentUser.id);

  useEffect(() => {
    if (userId) setViewingUserId(userId);
  }, [userId]);


  const selectedPlaylist = profileData?.playlists?.find((p: any) => p.id === selectedPlaylistId);
  const isOwnProfile = profileData?.id === currentUser.id;

  useEffect(() => {
    const fetchOffline = async () => {
      if (activeTab === 'offline') {
        const tracks = await getOfflineTracks();
        setOfflineTracks(tracks);
      }
    };
    fetchOffline();
  }, [activeTab, downloadedTracks]);

  const handleInitiateDeletePlaylist = (e: React.MouseEvent, playlistId: string, playlistName: string) => {
    e.stopPropagation();
    if (isDeletingId) return;
    setPlaylistToDelete({ id: playlistId, name: playlistName });
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    setIsDeletingId(playlistToDelete.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/delete_playlist/${playlistToDelete.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProfileData({
          ...profileData,
          playlists: profileData.playlists.filter((p: any) => p.id !== playlistToDelete.id)
        });
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    } finally {
      setIsDeletingId(null);
      setPlaylistToDelete(null);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!viewingUserId) return;

        const encodedId = encodeURIComponent(viewingUserId);
        const response = await fetch(`/api/v1/profile/${encodedId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          
          // Fetch followers count and check if following
          const followersRes = await fetch(`/api/v1/profile/${encodedId}/followers`);
          const followingRes = await fetch(`/api/v1/profile/${encodedId}/following`);
          
          if (followersRes.ok) {
            const followers = await followersRes.json();
            setFollowersList(followers);
            setIsFollowing(followers.some((f: any) => f.id === currentUser.id));
          }
          
          if (followingRes.ok) {
             const following = await followingRes.json();
             setFollowingList(following);
          }
        } else {
          // Fallback to mock data if API fails
          if (viewingUserId === currentUser.id && currentUser.id) {
            setProfileData({
              id: currentUser.id,
              username: currentUser.username || 'Guest',
              bio: 'Sonic Explorer | Digital Dreamer | Premium Music Enthusiast',
              image_file: currentUser.image_file || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
              uploads: [
                { id: '1', title: 'Midnight City Reflections', artist: currentUser.username || 'Artist', plays: '2.4M', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200' },
                { id: '2', title: 'Neon Horizon', artist: currentUser.username || 'Artist', plays: '1.8M', cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200' },
              ],
              playlists: [
                { 
                  id: 'p1', 
                  name: 'Late Night Vibes', 
                  description: 'Deep beats for dark nights', 
                  songs: 2, 
                  cover_image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200',
                  tracks: [
                    { id: '1', title: 'Midnight City Reflections', artist: currentUser.username || 'Artist', plays: '2.4M', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200' },
                    { id: '2', title: 'Neon Horizon', artist: currentUser.username || 'Artist', plays: '1.8M', cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200' },
                  ]
                }
              ],
              likes: []
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      if (viewingUserId === currentUser.id && currentUser.id) {
        setProfileData({
          id: currentUser.id,
          username: currentUser.username || 'Guest',
          bio: 'Sonic Explorer | Digital Dreamer | Premium Music Enthusiast',
          image_file: currentUser.image_file || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
          uploads: [
            { id: '1', title: 'Midnight City Reflections', artist: currentUser.username || 'Artist', plays: '2.4M', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200' },
            { id: '2', title: 'Neon Horizon', artist: currentUser.username || 'Artist', plays: '1.8M', cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200' },
          ],
          playlists: [
            { 
              id: 'p1', 
              name: 'Late Night Vibes', 
              description: 'Deep beats for dark nights', 
              songs: 2, 
              cover_image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200',
              tracks: [
                { id: '1', title: 'Midnight City Reflections', artist: currentUser.username || 'Artist', plays: '2.4M', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200' },
                { id: '2', title: 'Neon Horizon', artist: currentUser.username || 'Artist', plays: '1.8M', cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200' },
              ]
            }
          ],
          likes: []
        });
      } else {
          // generic fallback so the page doesn't crash on viewing other profiles during network drops
          setProfileData({
            id: viewingUserId,
            username: 'Unknown User',
            bio: 'Information unavailable.',
            image_file: 'default.svg',
            uploads: [],
            playlists: [],
            likes: []
          });
        }
      }
    };
    fetchProfile();
  }, [viewingUserId]);
  const handleDeleteSong = async (songId: string) => {
    try {
      const token = localStorage.getItem('sreedhar_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/songs/${songId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Always remove visually for a snappy UX and to handle mock data
      setProfileData((prev: any) => ({
        ...prev,
        uploads: prev.uploads.filter((t: any) => t.id !== songId)
      }));
    } catch (e) {
      console.error(e);
      // Fallback removal for mock data
      setProfileData((prev: any) => ({
        ...prev,
        uploads: prev.uploads.filter((t: any) => t.id !== songId)
      }));
    }
  };


  const handleToggleFollow = async () => {
    if (isOwnProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/toggle_follow/${profileData.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Refresh followers list
        const followersRes = await fetch(`/api/v1/profile/${profileData.id}/followers`);
        if (followersRes.ok) {
          const followers = await followersRes.json();
          setFollowersList(followers);
        }
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      // Mock fallback: instantly toggle UI
      if (isFollowing) {
        setFollowersList(prev => prev.filter(f => f.id !== currentUser.id));
        setIsFollowing(false);
      } else {
        setFollowersList(prev => [...prev, { 
          id: currentUser.id, 
          username: currentUser.username || 'You', 
          image_file: currentUser.image_file 
        }]);
        setIsFollowing(true);
      }
    }
  };

  const handleShareProfile = async () => {
    if (!profileData) return;
    const shareData = {
      title: profileData.username,
      text: `Check out ${profileData.username}'s profile on our app!`,
      url: window.location.href, // Since routing is mostly local states, it shares current URL
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

  const openFollowModal = (type: 'followers' | 'following') => {
    setFollowModalType(type);
    setShowFollowModal(true);
  };

  useEffect(() => {
    // Smoothly scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (!profileData) return null;

  const tabs = [
    { id: 'uploads' as const, label: 'Uploads', icon: Music },
    { id: 'playlists' as const, label: 'Playlists', icon: ListMusic },
    { id: 'likes' as const, label: 'Likes', icon: Heart },
    { id: 'offline' as const, label: 'Offline', icon: Download },
  ];

  return (
    <div className="pb-[240px] pt-16 px-6 max-w-4xl mx-auto w-full">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl"
          >
            <div className="w-full h-full rounded-full border-4 border-black overflow-hidden relative">
              <Avatar src={profileData.image_file} className="w-full h-full" alt={profileData.username} fallbackText={profileData.username} size="100%" />
            </div>
          </motion.div>
          <TouchableScale 
            onClick={() => setIsEditModalOpen(true)}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full glass flex items-center justify-center border-2 border-white/20 shadow-lg"
          >
            <Settings size={18} />
          </TouchableScale>
        </div>

        <h1 className="text-4xl font-bold mb-2 tracking-tight">{profileData.username}</h1>
        <p className="text-white/50 text-sm font-medium max-w-xs text-center leading-relaxed">
          {profileData.bio}
        </p>

        <div className="flex gap-4 mt-8 w-full max-w-sm px-4">
          <TouchableScale onClick={() => openFollowModal('followers')} className="flex-1">
            <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/5 cursor-pointer">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {followersList.length}
              </span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Followers</span>
            </div>
          </TouchableScale>

          <TouchableScale onClick={() => openFollowModal('following')} className="flex-1">
            <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/5 cursor-pointer">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {followingList.length}
              </span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Following</span>
            </div>
          </TouchableScale>
        </div>

        <div className="flex gap-4 mt-8 w-full max-w-sm px-4">
          {isOwnProfile ? (
            <>
              <TouchableScale className="flex-1" onClick={() => setIsEditModalOpen(true)}>
                <button className="w-full py-4 rounded-2xl active-pill font-bold shadow-xl shadow-purple-900/20 text-white">
                  Edit Profile
                </button>
              </TouchableScale>
              <TouchableScale className="w-14 h-14" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
              }}>
                <button className="w-full h-full rounded-2xl glass flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/10" title="Logout">
                  <LogOut size={20} />
                </button>
              </TouchableScale>
            </>
          ) : (
            <TouchableScale className="flex-1" onClick={handleToggleFollow}>
              <button className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all ${
                isFollowing 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'active-pill text-white shadow-purple-900/20'
              }`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </TouchableScale>
          )}
          <TouchableScale onClick={handleShareProfile}>
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-white/70 hover:text-white border-white/10">
              <Share2 size={20} />
            </div>
          </TouchableScale>
        </div>
      </div>

      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass bg-black/50 border border-white/20 text-white text-sm whitespace-nowrap z-50 pointer-events-none"
          >
            Profile link copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Glass Tabs */}
      <div className="flex gap-2 p-1.5 glass rounded-full border-white/10 mb-8 max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableScale key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 relative z-10">
              <div className={`py-3 rounded-full flex flex-col items-center justify-center transition-colors duration-500 relative ${
                isActive ? 'text-white' : 'text-white/40'
              }`}>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 active-pill rounded-full shadow-lg shadow-purple-900/20 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon size={18} className="mb-0.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </div>
            </TouchableScale>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0, scale: 0.98, y: 10 },
            visible: { 
              opacity: 1, 
              scale: 1,
              y: 0,
              transition: { 
                type: "spring",
                damping: 25,
                stiffness: 200,
                staggerChildren: 0.05,
                delayChildren: 0.1
              }
            },
            exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {activeTab === 'uploads' && profileData.uploads.map((track: any) => (
            <motion.div 
              key={track.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <SongItem 
                track={track} 
                isCurrent={currentTrack?.id === track.id} 
                onPlay={() => playTrack(track)} 
                onAddToPlaylist={() => setSongToAddToPlaylist(track)}
                onLike={() => toggleLike(track.id)}
                onDelete={() => handleDeleteSong(track.id)}
              />
            </motion.div>
          ))}
          
          {activeTab === 'likes' && profileData.likes.map((track: any) => (
            <motion.div 
              key={track.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <SongItem 
                track={track} 
                isCurrent={currentTrack?.id === track.id} 
                onPlay={() => playTrack(track)} 
                isDownloaded={downloadedTracks.includes(track.id)}
                onAddToPlaylist={() => setSongToAddToPlaylist(track)}
                onLike={() => toggleLike(track.id)}
              />
            </motion.div>
          ))}

          {activeTab === 'offline' && offlineTracks.map((track: any) => (
            <motion.div 
              key={track.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <SongItem 
                track={track} 
                isCurrent={currentTrack?.id === track.id} 
                onPlay={() => playTrack(track)} 
                isDownloaded={true}
                onAddToPlaylist={() => setSongToAddToPlaylist(track)}
                onLike={() => toggleLike(track.id)}
              />
            </motion.div>
          ))}

          {activeTab === 'playlists' && (
            <AnimatePresence mode="popLayout">
              {isOwnProfile && (
                <motion.div
                  layout
                  key="new-playlist"
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
                  }}
                >
                  <TouchableScale className="w-full text-left" onClick={() => setIsCreatePlaylistModalOpen(true)}>
                    <div className="glass p-4 rounded-[32px] flex items-center gap-5 border-dashed border-2 border-white/10 hover:border-purple-500/30 transition-all group h-[112px]">
                      <div className="w-20 h-20 shrink-0 glass rounded-2xl flex items-center justify-center border-white/5">
                        <Plus className="text-white/40 group-hover:text-purple-400 transition-colors" size={32} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-white/40 group-hover:text-white transition-colors">New Playlist</h4>
                        <p className="text-xs text-white/20">Create a new collection</p>
                      </div>
                    </div>
                  </TouchableScale>
                </motion.div>
              )}

              {profileData.playlists.map((playlist: any) => (
                <motion.div 
                  layout
                  key={playlist.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.8, x: -20, transition: { duration: 0.3 } }
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <TouchableScale className="w-full text-left" onClick={() => setSelectedPlaylistId(playlist.id)}>
                    <div className="glass p-4 rounded-[32px] flex items-center gap-5 border-white/5 hover:border-purple-500/30 transition-all group">
                      <div className="relative w-20 h-20 shrink-0">
                        <img src={playlist.cover_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200'} className="w-full h-full object-cover rounded-2xl shadow-xl transition-transform duration-500 group-hover:scale-105" alt={playlist.name} />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-2xl">
                          <ListMusic className="text-white/60" size={24} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-bold text-lg truncate text-white leading-tight mb-1">{playlist.name}</h4>
                        <p className="text-xs text-white/40 font-medium line-clamp-1 mb-2">{playlist.description}</p>
                        <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full uppercase tracking-widest">{playlist.songs || 0} Tracks</span>
                      </div>
                      {isOwnProfile && (
                        <button 
                          onClick={(e) => handleInitiateDeletePlaylist(e, playlist.id, playlist.name)}
                          disabled={isDeletingId === playlist.id}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all group/delete"
                        >
                          {isDeletingId === playlist.id ? (
                            <Loader2 size={18} className="animate-spin text-white/40" />
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </button>
                      )}
                    </div>
                  </TouchableScale>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Playlist Confirm Modal */}
      <AnimatePresence>
        {playlistToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] border border-white/10 p-6 rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Delete Playlist?</h2>
              <p className="text-white/60 mb-8">Are you sure you want to delete <span className="text-white font-bold">{playlistToDelete.name}</span>? This action cannot be undone.</p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setPlaylistToDelete(null)}
                  className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletePlaylist}
                  disabled={isDeletingId === playlistToDelete.id}
                  className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center justify-center min-w-[100px]"
                >
                  {isDeletingId === playlistToDelete.id ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal 
            onClose={() => setIsEditModalOpen(false)} 
            initialData={profileData} 
            onUpdate={(newData: any) => {
              const newProfileData = { ...profileData, ...newData };
              setProfileData(newProfileData);
              const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
              localStorage.setItem('user', JSON.stringify({ ...existingUser, ...newData }));
              window.dispatchEvent(new Event('userUpdated'));
              setIsEditModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {isCreatePlaylistModalOpen && (
          <CreatePlaylistModal 
            onClose={() => setIsCreatePlaylistModalOpen(false)}
            onCreated={(newPlaylist: any) => {
              setProfileData({
                ...profileData,
                playlists: [newPlaylist, ...profileData.playlists]
              });
              setIsCreatePlaylistModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add to Playlist Modal */}
      <AnimatePresence>
        {songToAddToPlaylist && (
          <AddToPlaylistModal
            song={songToAddToPlaylist}
            playlists={profileData.playlists}
            onClose={() => setSongToAddToPlaylist(null)}
            onCreateNew={() => {
              setSongToAddToPlaylist(null);
              setIsCreatePlaylistModalOpen(true);
            }}
            onAdded={() => {
              // Optionally show a toast or update song count
              setSongToAddToPlaylist(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Playlist Detail Modal */}
      <AnimatePresence>
        {selectedPlaylist && (
          <PlaylistDetailModal
            playlist={selectedPlaylist}
            onClose={() => setSelectedPlaylistId(null)}
            isOwnProfile={isOwnProfile}
            onRemoveTrack={async (playlistId, trackId) => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/v1/playlist/${playlistId}/remove_song`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ songId: trackId }),
                });

                if (response.ok) {
                  setProfileData({
                    ...profileData,
                    playlists: profileData.playlists.map((p: any) => {
                      if (p.id === playlistId) {
                        const updatedTracks = (p.tracks || []).filter((t: any) => t.id !== trackId);
                        return { ...p, tracks: updatedTracks, songs: updatedTracks.length };
                      }
                      return p;
                    })
                  });
                }
              } catch (err) {
                console.error(err);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Follow Lists Modal */}
      <AnimatePresence>
        {showFollowModal && (
          <FollowListsModal 
            onClose={() => setShowFollowModal(false)}
            type={followModalType}
            users={followModalType === 'followers' ? followersList : followingList}
            onUserClick={(user: any) => {
              setViewingUserId(user.id);
              setShowFollowModal(false);
              setActiveTab('uploads');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const FollowListsModal = ({ onClose, type, users, onUserClick }: any) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 pb-[140px] sm:pb-[160px]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md glass p-6 sm:p-8 rounded-[40px] shadow-2xl border-white/10 max-h-full flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold tracking-tight capitalize text-white">{type}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {users.map((user: any) => (
            <TouchableScale key={user.id} onClick={() => onUserClick(user)} className="w-full text-left">
              <div className="glass p-3 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                  <Avatar src={user.image_file} className="w-full h-full" alt={user.username} fallbackText={user.username} size="100%" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">{user.username}</h4>
                  <p className="text-[10px] text-white/40 truncate leading-tight">{user.bio || 'No bio yet'}</p>
                </div>
                <button className="px-4 py-1.5 rounded-full glass border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:border-purple-500/50 transition-all">
                  View
                </button>
              </div>
            </TouchableScale>
          ))}
          {users.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 text-white/10" size={48} />
              <p className="text-white/30 font-medium tracking-tight">No {type} yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const PlaylistDetailModal = ({ playlist, onClose, onRemoveTrack, isOwnProfile }: any) => {
  const { playTrack, currentTrack, isShuffle, toggleShuffle, toggleLike, addToQueue } = usePlayer();
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  const handleShufflePlay = () => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;
    if (!isShuffle) toggleShuffle();
    
    const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
    playTrack(playlist.tracks[randomIndex]);
  };

  return (
    <div className="fixed inset-0 z-[250] flex flex-col pt-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative flex-1 glass rounded-t-[48px] border-t border-white/10 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-8 py-6 sm:py-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative group">
            <img src={playlist.cover_image} className="w-full h-full object-cover" alt={playlist.name} />
          </div>
          <div className="flex-1 flex flex-col items-center sm:items-start">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">{playlist.name}</h2>
            <p className="text-white/40 font-medium mb-4 text-sm sm:text-base">{playlist.description}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-6">
               <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 px-3 py-1.5 rounded-full uppercase tracking-widest">{playlist.songs || 0} Tracks</span>
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">By {playlist.ownerName || 'User'}</span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <TouchableScale onClick={() => playlist.tracks?.[0] && playTrack(playlist.tracks[0])}>
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl active-pill font-bold shadow-xl shadow-purple-900/20 text-white flex items-center gap-2 text-sm sm:text-base">
                  <Play size={16} className="sm:w-[18px] sm:h-[18px]" fill="white" />
                  Play
                </button>
              </TouchableScale>
              
              <TouchableScale onClick={handleShufflePlay}>
                <button className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl glass flex items-center justify-center transition-all ${isShuffle ? 'text-purple-400 border-purple-500/50' : 'text-white/40 border-white/10 hover:text-white'}`}>
                  <Shuffle size={18} className="sm:w-5 sm:h-5" />
                </button>
              </TouchableScale>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 sm:relative sm:top-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto px-6 pb-[140px] sm:pb-[160px] custom-scrollbar">
          <div className="space-y-4 max-w-2xl mx-auto">
            {playlist.tracks?.map((track: any) => (
              <div key={track.id} className="flex items-center gap-4 group">
                <div className="flex-1">
                   <SongItem 
                    track={track} 
                    isCurrent={currentTrack?.id === track.id} 
                    onPlay={() => playTrack(track)} 
                    onLike={() => toggleLike(track.id)}
                   />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => addToQueue(track)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/40 hover:text-purple-400 hover:bg-purple-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Add to queue"
                  >
                    <ListMusic size={20} />
                  </button>
                  {isOwnProfile && (
                    <button 
                      id={`remove-track-${track.id}`}
                      onClick={async () => {
                        setIsRemovingId(track.id);
                        await onRemoveTrack(playlist.id, track.id);
                        setIsRemovingId(null);
                      }}
                      disabled={isRemovingId === track.id}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove from playlist"
                    >
                      {isRemovingId === track.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!playlist.tracks || playlist.tracks.length === 0) && (
              <div className="py-20 text-center">
                <Music className="mx-auto mb-4 text-white/10" size={64} />
                <p className="text-white/30 font-medium">No tracks in this playlist yet.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const EditProfileModal = ({ onClose, initialData, onUpdate }: any) => {
  const [username, setUsername] = useState(initialData.username);
  const [bio, setBio] = useState(initialData.bio);
  const [imagePreview, setImagePreview] = useState(initialData.image_file);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      if (imageFile) {
        formData.append('avatar', imageFile);
      } else if (imagePreview && imagePreview !== initialData.image_file) {
        // If image was changed to a default avatar (which is a URL)
        formData.append('image_url', imagePreview);
      }

      // In a real app, handle JWT token here
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/profile/edit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.user);
      } else {
        // Handle error - for demo purposes just update local state
        onUpdate({ username, bio, image_file: imagePreview });
      }
    } catch (err) {
      console.error(err);
      onUpdate({ username, bio, image_file: imagePreview });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 pb-[140px] sm:pb-[160px]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg glass p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl border-white/10 max-h-full flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-3xl font-bold tracking-tight">Edit Profile</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1 -mx-2 px-2 pb-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer w-24 h-24 mx-auto" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-br from-purple-600 to-blue-600">
                  <div className="w-full h-full rounded-full border-4 border-black overflow-hidden relative">
                    <Avatar src={imagePreview} className="w-full h-full" alt="preview" fallbackText={initialData.username} size="100%" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full active-pill flex items-center justify-center border-2 border-black shadow-lg">
                  <Camera size={14} />
                </div>
              </div>
              <p className="mt-4 mb-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Upload Custom Avatar</p>
              
              <div className="w-full">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 block text-left ml-4">Or choose default</label>
                <div className="flex flex-wrap justify-center gap-3 pb-4">
                  {DEFAULT_AVATARS.map((avatar, idx) => (
                    <button 
                      key={idx}
                      type="button" 
                      onClick={() => {
                        setImagePreview(avatar);
                        setImageFile(null); // Clear file so it picks up imagePreview URL 
                      }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full border-2 transition-all ${imagePreview === avatar ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/20' : 'border-white/10 hover:border-white/40 opacity-70 hover:opacity-100'}`}
                    >
                      <img src={avatar} className="w-full h-full rounded-full object-cover" alt={`Default Avatar ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Username</label>
              <input 
                type="text" 
                value={username || ''}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                placeholder="Your aesthetic name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">About You</label>
              <textarea 
                rows={3}
                value={bio || ''}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium resize-none"
                placeholder="Tell your story..."
              />
            </div>

            <TouchableScale className="w-full pt-4">
              <button 
                disabled={isUpdating}
                className="w-full py-4 rounded-2xl active-pill font-bold shadow-xl shadow-purple-900/20 text-white flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating...
                  </>
                ) : 'Store Changes'}
              </button>
            </TouchableScale>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const SongItem = ({ track, isCurrent, onPlay, isDownloaded, onAddToPlaylist, onLike, onDelete }: any) => (
  <TouchableScale onClick={onPlay} className="w-full text-left" scale={0.98}>
    <div className={`glass p-4 rounded-[28px] flex items-center gap-4 transition-all duration-300 ${
      isCurrent ? 'border-purple-500/40 shadow-xl shadow-purple-900/10 bg-white/[0.05]' : 'border-white/5 hover:bg-white/[0.05]'
    }`}>
      <div className="relative w-16 h-16 shrink-0">
        <img src={track.cover} className="w-full h-full object-cover rounded-xl shadow-lg" alt={track.title} />
        {isDownloaded && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center border-2 border-black">
            <CheckCircle2 size={10} color="white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`font-bold truncate leading-tight ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{track.title}</h4>
        <p className="text-xs text-white/40 font-semibold mb-1">{track.artist}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Play size={10} className="text-purple-400 fill-purple-400" />
            <span className="text-[10px] text-white/40 font-bold tracking-wider">{track.plays}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={10} className="text-white/20 fill-white/20" />
            <span className="text-[10px] text-white/40 font-bold tracking-wider">{track.likes || '1.2K'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist?.();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors"
        >
          <MoreVertical size={20} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onLike?.();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            track.isLiked || (isCurrent && track.isLiked) ? 'text-purple-400' : 'text-white/20 hover:text-primary hover:scale-110 active:scale-95'
          }`}
        >
          <Heart size={20} fill={track.isLiked || (isCurrent && track.isLiked) ? 'currentColor' : 'none'} />
        </button>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 transition-colors hover:scale-110"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </div>
  </TouchableScale>
);

const AddToPlaylistModal = ({ song, playlists, onClose, onAdded, onCreateNew }: any) => {
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleAdd = async (playlistId: string) => {
    setIsAdding(playlistId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/playlist/${playlistId}/add_song`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songId: song.id }),
      });

      if (response.ok) {
        onAdded();
      } else {
        // Mock success for demo
        onAdded();
      }
    } catch (err) {
      console.error(err);
      onAdded();
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md glass p-8 rounded-[40px] shadow-2xl border-white/10"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Add to Playlist</h2>
            <p className="text-white/40 text-sm font-medium mt-1">Select a destination for "{song.title}"</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <TouchableScale id="create-new-playlist-quick" className="w-full text-left" onClick={onCreateNew}>
            <div className="glass p-4 rounded-2xl flex items-center gap-4 border-dashed border-2 border-white/10 hover:border-purple-500/30 transition-all group">
              <div className="w-12 h-12 shrink-0 glass rounded-lg flex items-center justify-center border-white/5">
                <Plus size={24} className="text-white/40 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white/40 group-hover:text-white transition-colors">Create New Playlist</h4>
              </div>
            </div>
          </TouchableScale>

          {playlists.map((playlist: any) => (
            <TouchableScale key={playlist.id} className="w-full text-left" onClick={() => handleAdd(playlist.id)}>
              <div className="glass p-4 rounded-2xl flex items-center gap-4 border-white/5 hover:border-purple-500/30 transition-all group">
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden relative">
                  <img src={playlist.cover_image} className="w-full h-full object-cover" alt={playlist.name} />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Plus size={16} className="text-white/60 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-white">{playlist.name}</h4>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{playlist.songs} Tracks</p>
                </div>
                {isAdding === playlist.id && <Loader2 size={18} className="animate-spin text-purple-400" />}
              </div>
            </TouchableScale>
          ))}
          
          {playlists.length === 0 && (
            <div className="py-12 text-center text-white/30 font-medium">
              <ListMusic className="mx-auto mb-4 opacity-20" size={48} />
              <p>No playlists yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const CreatePlaylistModal = ({ onClose, onCreated }: any) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/playlist/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const data = await response.json();
        onCreated(data);
      } else {
        // Fallback for demo if backend fails
        onCreated({
          id: 'new-' + Date.now(),
          name,
          description,
          songs: 0,
          cover_image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 pb-[140px] sm:pb-[160px]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg glass p-8 rounded-[40px] shadow-2xl border-white/10 max-h-full flex flex-col"
      >
        <div className="flex justify-between items-center mb-10 shrink-0">
          <h2 className="text-3xl font-bold tracking-tight text-white">New Playlist</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form id="create-playlist-form" onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto no-scrollbar -mx-2 px-2 pb-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Playlist Name</label>
            <input 
              type="text" 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium text-white"
              placeholder="Vibe check..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Description</label>
            <textarea 
              rows={3}
              value={description || ''}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium resize-none text-white"
              placeholder="What's this mood about?"
            />
          </div>

          <TouchableScale className="w-full pt-4">
            <button 
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full py-4 rounded-2xl active-pill font-bold shadow-xl shadow-purple-900/20 text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : 'Create Playlist'}
            </button>
          </TouchableScale>
        </form>
      </motion.div>
    </div>
  );
};
