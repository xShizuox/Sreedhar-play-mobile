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
    const converted = [];
    for (const t of rawTracks) {
      let audioUrl = t.audioUrl;
      let cover = t.cover;
      
      if (t.audioBlob) {
        try {
          audioUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(t.audioBlob);
          });
        } catch (e) {
          console.error('Failed converting audio blob', e);
        }
      }
      if (t.coverBlob) {
        try {
          cover = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(t.coverBlob);
          });
        } catch (e) {
          console.error('Failed converting cover blob', e);
        }
      }
      converted.push({ ...t, audioUrl, cover });
    }
    return converted;
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
