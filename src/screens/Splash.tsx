import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full"
      />

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Box */}
        <motion.div
           initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
           animate={{ scale: 1, opacity: 1, rotate: 0 }}
           transition={{ duration: 0.8, type: 'spring' }}
           className="relative mb-8"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-purple-500/30 overflow-hidden relative group p-1">
             <div className="w-full h-full border-[3px] border-white/20 rounded-[28px] overflow-hidden relative flex items-center justify-center bg-black/20">
               {/* Shimmer Effect */}
               <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
               />
               <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                 <Play size={32} fill="currentColor" className="ml-1.5" />
               </div>
             </div>
          </div>
        </motion.div>

        {/* Text Animation */}
        <div className="overflow-hidden h-[72px] flex items-center justify-center">
          <motion.h1
            initial={{ y: 72 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2"
          >
            SREEDHAR<span className="text-purple-400">PLAY</span>
          </motion.h1>
        </div>

        {/* Diagonal Line Sweeps */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ duration: 1.2, delay: 0.8, ease: "circOut" }}
          className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent mt-4 opacity-50"
        />
      </div>
    </div>
  );
};
