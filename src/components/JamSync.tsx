import React, { useEffect } from 'react';
import { useJam } from '../context/JamContext';
import { usePlayer } from '../context/PlayerContext';

export const JamSync: React.FC = () => {
  const { jamState } = useJam();
  const { setQueue, queue, currentTrack, playTrack, isPlaying, togglePlay, seek } = usePlayer();

  useEffect(() => {
    if (!jamState) return;

    // Get current user id from local storage
    const userStr = localStorage.getItem('user');
    let userId = '';
    if (userStr && userStr !== 'undefined') {
      try {
        userId = JSON.parse(userStr).id;
      } catch (e) {}
    }

    // Only sync if we are NOT the host
    if (jamState.hostId === userId) return;

    // Sync queue
    if (jamState.queue && JSON.stringify(jamState.queue) !== JSON.stringify(queue)) {
      setQueue(jamState.queue);
    }

    // Sync current track
    if (jamState.currentTrack) {
      if (!currentTrack || currentTrack.id !== jamState.currentTrack.id) {
        playTrack(jamState.currentTrack);
      }
    }

    // Sync play state (this is a bit simpler, might cause toggle loops if not careful)
    // we can skip full playback sync if it causes issues, but let's do our best
    if (jamState.isPlaying !== undefined && jamState.isPlaying !== isPlaying) {
        togglePlay(); // though technically we should have a generic setPlayState but togglePlay will flip it
    }

    // We can also sync progress if needed...
  }, [jamState, queue, currentTrack, isPlaying, setQueue, playTrack, togglePlay]);

  return null;
};
