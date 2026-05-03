import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track } from '../types';
import * as offlineStore from '../lib/offlineStore';

interface DownloadContextType {
  downloadedTracks: string[];
  isDownloading: string[];
  downloadTrack: (track: Track) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  getOfflineTracks: () => Promise<Track[]>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloadedTracks, setDownloadedTracks] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<string[]>([]);

  useEffect(() => {
    refreshDownloadedList();
  }, []);

  const refreshDownloadedList = async () => {
    const tracks = await offlineStore.getOfflineTracks();
    setDownloadedTracks(tracks.map(t => t.id));
  };

  const downloadTrack = async (track: Track) => {
    if (downloadedTracks.includes(track.id)) return;
    
    setIsDownloading(prev => [...prev, track.id]);
    try {
      await offlineStore.saveTrackOffline(track);
      setDownloadedTracks(prev => [...prev, track.id]);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(prev => prev.filter(id => id !== track.id));
    }
  };

  const removeDownload = async (id: string) => {
    await offlineStore.removeOfflineTrack(id);
    setDownloadedTracks(prev => prev.filter(tId => tId !== id));
  };

  const getOfflineTracks = async () => {
    const rawTracks = await offlineStore.getOfflineTracks();
    return rawTracks.map(t => ({
      ...t,
      // Create object URLs for blobs so they can be played
      audioUrl: URL.createObjectURL(t.audioBlob),
      cover: URL.createObjectURL(t.coverBlob),
    }));
  };

  return (
    <DownloadContext.Provider value={{
      downloadedTracks,
      isDownloading,
      downloadTrack,
      removeDownload,
      getOfflineTracks
    }}>
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (!context) throw new Error('useDownload must be used within DownloadProvider');
  return context;
};
