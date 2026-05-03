import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface TouchableScaleProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  scale?: number;
  disabled?: boolean;
}

export const TouchableScale: React.FC<TouchableScaleProps> = ({ 
  children, 
  onClick, 
  className = "", 
  scale = 0.95,
  disabled = false,
  ...rest
}) => {
  return (
    <motion.div
      whileTap={disabled ? undefined : { scale }}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      className={`focus:outline-none bg-transparent border-none p-0 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
