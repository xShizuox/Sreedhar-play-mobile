import React from 'react';
import { motion } from 'motion/react';
import { Home, Search, Library, User, Users } from 'lucide-react';
import { View } from '../types';
import { TouchableScale } from './TouchableScale';
import { Avatar } from './Avatar';

interface FloatingDockProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({ currentView, setCurrentView }) => {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const loadUser = () => {
      try {
        const userItem = localStorage.getItem('user');
        if (userItem && userItem !== 'undefined') {
          setUser(JSON.parse(userItem));
        }
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    };
    
    loadUser();

    // Listen for custom event from ProfileScreen
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, []);

  const tabs = [
    { id: 'home' as View, icon: Home, label: 'Home' },
    { id: 'search' as View, icon: Search, label: 'Search' },
    { id: 'jam' as View, icon: Users, label: 'Jam' },
    { id: 'library' as View, icon: Library, label: 'Library' },
    { id: 'profile' as View, icon: User, label: 'You' },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="glass px-2 py-1.5 rounded-full flex items-center justify-around shadow-2xl pointer-events-auto w-full max-w-[360px] min-h-[56px]">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;
          const sizeContent = isActive ? 20 : 22;

          return (
            <TouchableScale key={tab.id} onClick={() => setCurrentView(tab.id)}>
              <motion.div
                layout
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-full transition-all duration-300 ${
                  isActive ? 'active-pill shadow-lg shadow-purple-900/20' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.id === 'profile' && user?.image_file ? (
                  <Avatar src={user.image_file} alt={user.username} fallbackText={user.username} size={sizeContent} className={isActive ? 'border-2 border-white' : 'opacity-50'} />
                ) : (
                  <Icon size={sizeContent} className={`shrink-0 flex items-center justify-center ${isActive ? 'text-white' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                )}
              </motion.div>
            </TouchableScale>
          );
        })}
      </div>
    </div>
  );
};
