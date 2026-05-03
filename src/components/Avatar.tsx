import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number | string;
  className?: string;
  fallbackText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 40, className = '', fallbackText }) => {
  const [error, setError] = React.useState(false);

  const style = typeof size === 'number' ? { width: size, height: size } : {};

  if (!src || error) {
    const fontSize = typeof size === 'number' ? Math.max(10, size * 0.4) : 'inherit';
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold shrink-0 overflow-hidden ${className}`}
        style={style}
      >
        {fallbackText ? (
          <span className="uppercase leading-none" style={{ fontSize }}>{fallbackText.substring(0, 2)}</span>
        ) : (
          <User size={typeof size === 'number' ? size * 0.6 : '60%'} />
        )}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt || 'avatar'} 
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={style}
      onError={() => setError(true)}
    />
  );
};
