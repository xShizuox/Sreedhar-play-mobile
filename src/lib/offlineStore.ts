import { openDB, IDBPDatabase } from 'idb';
import { Track } from '../types';

const DB_NAME = 'sreedhar_play_offline';
const STORE_NAME = 'tracks';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveTrackOffline = async (track: Track) => {
  const db = await getDB();
  
  if (!track.audioUrl) {
    console.error('Cannot download track without audioUrl:', track);
    throw new Error('Track has no audio URL');
  }

  console.log('Downloading track:', track.audioUrl, track.cover);
  
  const getFetchUrl = (url: string) => {
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      return `/api/v1/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Fetch the audio and cover
  const [audioRes, coverRes] = await Promise.all([
    fetch(getFetchUrl(track.audioUrl)).catch(e => { console.error('Audio fetch failed:', track.audioUrl, e); throw new Error(`Audio fetch failed: ${e.message}`); }),
    track.cover ? fetch(getFetchUrl(track.cover)).catch(e => { console.error('Cover fetch failed:', track.cover, e); return null; }) : Promise.resolve(null)
  ]);

  if (!audioRes || !audioRes.ok) {
    throw new Error(`Audio fetch failed with status ${audioRes?.status}`);
  }

  const audioBlob = await audioRes.blob();
  const coverBlob = coverRes && coverRes.ok ? await coverRes.blob() : null;

  await db.put(STORE_NAME, {
    ...track,
    audioBlob,
    coverBlob,
    offlineDate: new Date(),
  });
};

export const getOfflineTracks = async (): Promise<any[]> => {
  const db = await getDB();
  return db.getAll(STORE_NAME);
};

export const removeOfflineTrack = async (id: string) => {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
};

export const isTrackOffline = async (id: string): Promise<boolean> => {
  const db = await getDB();
  const track = await db.get(STORE_NAME, id);
  return !!track;
};
