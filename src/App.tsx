import React, { useState, useEffect } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { DownloadProvider } from './context/DownloadContext';
import { JamProvider } from './context/JamContext';
import { JamSync } from './components/JamSync';
import { Splash } from './screens/Splash';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { JamScreen } from './screens/JamScreen';
import { GlobalBackground } from './components/GlobalBackground';
import { FloatingDock } from './components/FloatingDock';
import { PlayerBar } from './components/PlayerBar';
import { View } from './types';
import { motion, AnimatePresence } from 'motion/react';

import { AuthScreen } from './screens/AuthScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token && token !== 'undefined';
  });
  const [currentView, setCurrentView] = useState<View>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('jam')) {
      return 'jam';
    }
    return 'home';
  });
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail?.userId) {
        setTargetProfileId(e.detail.userId);
        setCurrentView('profile');
      }
    };
    window.addEventListener('navigateProfile', handleNav as EventListener);
    return () => window.removeEventListener('navigateProfile', handleNav as EventListener);
  }, []);

  return (
    <JamProvider>
      <PlayerProvider>
        <DownloadProvider>
          <JamSync />
          <div className="relative min-h-screen overflow-x-hidden selection:bg-primary/30">
        <AnimatePresence>
          {showSplash && (
            <Splash onComplete={() => setShowSplash(false)} />
          )}
        </AnimatePresence>

        <GlobalBackground />

        <AnimatePresence>
          {!showSplash && !isAuthenticated && (
            <AuthScreen onLogin={() => setIsAuthenticated(true)} />
          )}
        </AnimatePresence>

        {isAuthenticated && (
          <>
            <main className="relative z-10">
              <AnimatePresence mode="wait">
                {currentView === 'home' && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <HomeScreen onSearchClick={() => setCurrentView('search')} />
                  </motion.div>
                )}
                {currentView === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <SearchScreen />
                  </motion.div>
                )}
                {currentView === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProfileScreen userId={targetProfileId} />
                  </motion.div>
                )}
                {currentView === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <LibraryScreen />
                  </motion.div>
                )}
                {currentView === 'jam' && (
                  <motion.div
                    key="jam"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <JamScreen />
                  </motion.div>
                )}
                {/* Other views would be added here */}
                {currentView !== 'home' && currentView !== 'profile' && currentView !== 'search' && currentView !== 'library' && currentView !== 'jam' && (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-screen flex items-center justify-center"
                  >
                    <h1 className="text-3xl font-bold opacity-30 italic">{currentView.toUpperCase()} COMING SOON</h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            <PlayerBar onOpenPlayer={() => setIsPlayerOpen(true)} />
            <FloatingDock currentView={currentView} setCurrentView={setCurrentView} />
            
            <PlayerScreen isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} />
          </>
        )}
      </div>
      </DownloadProvider>
    </PlayerProvider>
    </JamProvider>
  );
}
