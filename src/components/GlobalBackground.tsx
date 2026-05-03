import React from 'react';
import { motion } from 'motion/react';

export const GlobalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Blob 1 */}
      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-[#9333ea] opacity-40 blur-[80px]"
      />

      {/* Blob 2 */}
      <motion.div
        animate={{
          x: [0, -40, 60, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[20%] -right-40 w-[600px] h-[600px] rounded-full bg-[#4f46e5] opacity-30 blur-[100px]"
      />

      {/* Blob 3 */}
      <motion.div
        animate={{
          x: [-30, 30, 0, -30],
          y: [30, -30, 0, 30],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-20 left-[20%] w-[400px] h-[400px] rounded-full bg-[#8b5cf6] opacity-20 blur-[80px]"
      />
    </div>
  );
};
