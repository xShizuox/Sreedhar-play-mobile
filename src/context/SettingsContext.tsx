import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SettingsType {
  gaplessPlayback: boolean;
  audioQuality: 'low' | 'normal' | 'high' | 'veryHigh';
  sleepTimer: number | null;
  normalizeVolume: boolean;
  wifiOnly: boolean;
  downloadQuality: 'standard' | 'high' | 'maximum';
  autoDownloadLikes: boolean;
  notifNewReleases: boolean;
  notifMilestones: boolean;
  notifJamInvites: boolean;
  notifFanMessages: boolean;
  dynamicColors: boolean;
  ambientMode: boolean;
  textSize: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  privateListening: boolean;
  twoFactorEnabled: boolean;
}

export interface SettingsContextType {
  settings: SettingsType;
  updateSetting: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => void;
  clearListeningHistory: () => Promise<void>;
}

const defaultSettings: SettingsType = {
  gaplessPlayback: true,
  audioQuality: 'high',
  sleepTimer: null,
  normalizeVolume: false,
  wifiOnly: false,
  downloadQuality: 'high',
  autoDownloadLikes: false,
  notifNewReleases: true,
  notifMilestones: true,
  notifJamInvites: true,
  notifFanMessages: true,
  dynamicColors: true,
  ambientMode: false,
  textSize: 'default',
  privateListening: false,
  twoFactorEnabled: false
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsType>(() => {
    const saved = localStorage.getItem('sreedhar_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('sreedhar_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const clearListeningHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/history', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      localStorage.removeItem('recentSearches');
      localStorage.removeItem('lastTrack');
    } catch (e) {
      console.error('Failed to clear listening history:', e);
    }
  };

  // Sync font size scaling
  useEffect(() => {
    const sizeMap: Record<SettingsType['textSize'], string> = {
      xs: '12px',
      sm: '14px',
      default: '16px',
      lg: '18px',
      xl: '20px'
    };
    document.documentElement.style.fontSize = sizeMap[settings.textSize] || '16px';
  }, [settings.textSize]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, clearListeningHistory }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
