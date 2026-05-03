export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  duration: number; // in seconds
  quality?: string;
  likes?: number;
  plays?: string;
  isLiked?: boolean;
  updatedAt?: string;
  syncStatus?: 'up_to_date' | 'update_available' | 'checking';
}

export type View = 'home' | 'search' | 'library' | 'jam' | 'profile';
