import { Track } from './types';

export const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=ffdfbf'
];

export const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Midnight City Reflections',
    artist: 'Synthetic Dreams',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
    quality: 'Lossless (HQ)',
    likes: 1240,
    plays: '2.4M'
  },
  {
    id: '2',
    title: 'Neon Horizon',
    artist: 'Synthwave Collective',
    cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 450,
    likes: 850,
    plays: '1.8M'
  },
  {
    id: '3',
    title: 'Void Walkers',
    artist: 'Deep Space Bass',
    cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 312,
    likes: 620,
    plays: '950K'
  },
  {
    id: '4',
    title: 'Acoustic Resonance',
    artist: 'Luna Fields',
    cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 280,
    likes: 2100,
    plays: '3.1M'
  }
];
