import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Sliders, Music, Download, Bell, Palette, 
  Shield, Info, LogOut, Check, Wifi, ShieldCheck, Trash 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';
import { TouchableScale } from '../components/TouchableScale';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { crossfadeDuration, setCrossfadeDuration } = usePlayer();
  const { settings, updateSetting, clearListeningHistory } = useSettings();
  const [activePreset, setActivePreset] = useState<string>('Flat');
  const [clearConfirmed, setClearConfirmed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="pb-[240px] pt-16 px-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <TouchableScale onClick={onBack}>
          <button className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-105 active:scale-95 text-white">
            <ArrowLeft size={20} />
          </button>
        </TouchableScale>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-white/40 font-semibold tracking-wide uppercase mt-1">Configure your Sreedhar Play experience</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">

        {/* Playback Section */}
        <div className="glass p-6 rounded-[28px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Sliders className="text-purple-400" size={20} />
            <h2 className="text-base font-bold">Playback</h2>
          </div>

          {/* Crossfade */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-white/50">Crossfade Duration</label>
              <span className="text-xs font-black text-purple-400">{crossfadeDuration}s</span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={12} 
              step={1}
              value={crossfadeDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCrossfadeDuration(val);
                localStorage.setItem('crossfadeDuration', val.toString());
              }}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-white/30">
              <span>OFF</span>
              <span>1s</span>
              <span>3s</span>
              <span>6s</span>
              <span>9s</span>
              <span>12s</span>
            </div>
          </div>

          {/* Gapless Playback Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-white">Gapless Playback</p>
              <p className="text-xs text-white/40 font-medium">Remove the silence between tracks</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => {
                  const newVal = !settings.gaplessPlayback;
                  updateSetting('gaplessPlayback', newVal);
                  localStorage.setItem('gaplessEnabled', String(newVal));
                }}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.gaplessPlayback ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.gaplessPlayback ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* Audio Quality Selector */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Audio Quality</p>
              <p className="text-xs text-white/40 font-medium">Set your default streaming quality</p>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(['low', 'normal', 'high', 'veryHigh'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => updateSetting('audioQuality', q)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center border transition-all ${settings.audioQuality === q ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  {q === 'veryHigh' ? 'Very High' : q}
                </button>
              ))}
            </div>
          </div>

          {/* Equalizer link */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Equalizer Presets</p>
              <p className="text-xs text-white/40 font-medium">Shape your listening profile</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Flat', 'Bass Boost', 'Vocal Clarity', 'Electronic'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setActivePreset(preset)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border ${activePreset === preset ? 'bg-white/10 border-white/30 text-white' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Timer */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Sleep Timer</p>
              <p className="text-xs text-white/40 font-medium">Turn off playback after a set time</p>
            </div>
            <select 
              value={settings.sleepTimer || ''}
              onChange={(e) => updateSetting('sleepTimer', e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-white focus:border-purple-500/50"
            >
              <option value="">Off</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
            </select>
          </div>

          {/* Normalize Volume toggle */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Normalize Volume</p>
              <p className="text-xs text-white/40 font-medium">Same volume level for all tracks</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('normalizeVolume', !settings.normalizeVolume)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.normalizeVolume ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.normalizeVolume ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>
        </div>

        {/* Downloads Section */}
        <div className="glass p-6 rounded-[28px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Download className="text-purple-400" size={20} />
            <h2 className="text-base font-bold">Downloads</h2>
          </div>

          {/* WiFi Only Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-white">Download on Wi-Fi Only</p>
              <p className="text-xs text-white/40 font-medium">Saves cellular data usage</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('wifiOnly', !settings.wifiOnly)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.wifiOnly ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.wifiOnly ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* Download Quality Selector */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Download Quality</p>
              <p className="text-xs text-white/40 font-medium">File quality for cached tracks</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['standard', 'high', 'maximum'] as const).map((dq) => (
                <button
                  key={dq}
                  onClick={() => updateSetting('downloadQuality', dq)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center border transition-all ${settings.downloadQuality === dq ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  {dq}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-download Liked Tracks Toggle */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Auto-Download Likes</p>
              <p className="text-xs text-white/40 font-medium">Save all your liked tracks instantly</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('autoDownloadLikes', !settings.autoDownloadLikes)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.autoDownloadLikes ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.autoDownloadLikes ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* Storage Used Progress bar */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Device Storage used</span>
              <span className="font-semibold text-white/40">1.2 GB of 5 GB used</span>
            </div>
            <div className="w-full bg-white/5 border border-white/10 rounded-full h-2.5 relative overflow-hidden">
              <div className="bg-purple-600 h-full w-[24%] rounded-full transition-all" />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass p-6 rounded-[28px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Bell className="text-purple-400" size={20} />
            <h2 className="text-base font-bold">Notifications</h2>
          </div>

          {/* Notification toggles */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white">New Releases</p>
                <p className="text-xs text-white/40 font-medium">Followed artists new tracks</p>
              </div>
              <TouchableScale>
                <button 
                  onClick={() => updateSetting('notifNewReleases', !settings.notifNewReleases)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.notifNewReleases ? 'bg-purple-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.notifNewReleases ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </TouchableScale>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <div>
                <p className="text-sm font-bold text-white">Milestones</p>
                <p className="text-xs text-white/40 font-medium">Special play count notifications</p>
              </div>
              <TouchableScale>
                <button 
                  onClick={() => updateSetting('notifMilestones', !settings.notifMilestones)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.notifMilestones ? 'bg-purple-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.notifMilestones ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </TouchableScale>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <div>
                <p className="text-sm font-bold text-white">Jam Room Invites</p>
                <p className="text-xs text-white/40 font-medium">Real-time room invitations</p>
              </div>
              <TouchableScale>
                <button 
                  onClick={() => updateSetting('notifJamInvites', !settings.notifJamInvites)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.notifJamInvites ? 'bg-purple-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.notifJamInvites ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </TouchableScale>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <div>
                <p className="text-sm font-bold text-white">Fan Messages</p>
                <p className="text-xs text-white/40 font-medium">Reach out direct responses</p>
              </div>
              <TouchableScale>
                <button 
                  onClick={() => updateSetting('notifFanMessages', !settings.notifFanMessages)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.notifFanMessages ? 'bg-purple-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.notifFanMessages ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </TouchableScale>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="glass p-6 rounded-[28px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Palette className="text-purple-400" size={20} />
            <h2 className="text-base font-bold">Appearance</h2>
          </div>

          {/* Dynamic cover colors */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-white">Dynamic Cover Colors</p>
              <p className="text-xs text-white/40 font-medium">Match backgrounds to album cover art</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('dynamicColors', !settings.dynamicColors)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.dynamicColors ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.dynamicColors ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* Ambient Mode toggle */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Ambient Mode</p>
              <p className="text-xs text-white/40 font-medium">Breathing screensaver mode when docked</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('ambientMode', !settings.ambientMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.ambientMode ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.ambientMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* Text size scaling */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">App Font Scaling</p>
              <p className="text-xs text-white/40 font-medium">Proportionally scale all typography</p>
            </div>
            <div className="grid grid-cols-5 gap-1 mt-2">
              {(['xs', 'sm', 'default', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => updateSetting('textSize', sz)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold uppercase tracking-wider text-center border transition-all ${settings.textSize === sz ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="glass p-6 rounded-[28px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="text-purple-400" size={20} />
            <h2 className="text-base font-bold">Privacy & Security</h2>
          </div>

          {/* Private listening */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-white">Private Listening</p>
              <p className="text-xs text-white/40 font-medium">Hide your current streaming track</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('privateListening', !settings.privateListening)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.privateListening ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.privateListening ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* 2FA Status toggle */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">2FA Security Status</p>
              <p className="text-xs text-white/40 font-medium">Secure your credential access</p>
            </div>
            <TouchableScale>
              <button 
                onClick={() => updateSetting('twoFactorEnabled', !settings.twoFactorEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.twoFactorEnabled ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </TouchableScale>
          </div>

          {/* Clear Listening History button */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Clear Listening History</p>
              <p className="text-xs text-white/40 font-medium">Wipe your stored track streams completely</p>
            </div>
            <button 
              onClick={async () => {
                await clearListeningHistory();
                setClearConfirmed(true);
                setTimeout(() => setClearConfirmed(false), 3000);
              }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all"
            >
              {clearConfirmed ? 'Cleared!' : 'Clear'}
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="glass p-6 rounded-[28px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Info className="text-purple-400" size={20} />
            <h2 className="text-base font-bold">About</h2>
          </div>

          <div className="flex flex-col gap-2 text-xs font-medium text-white/50">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Sreedhar Play Version</span>
              <span className="font-bold text-white">2.4.0 (Aesthetic Core)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Terms & Services</span>
              <span className="font-bold text-purple-400 cursor-pointer hover:underline">Read online</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Privacy Policy</span>
              <span className="font-bold text-purple-400 cursor-pointer hover:underline">Review text</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Feedback & Ideas</span>
              <span className="font-bold text-purple-400 cursor-pointer hover:underline">Submit directly</span>
            </div>
          </div>
        </div>

        {/* Log out section */}
        <div className="pt-4">
          <TouchableScale className="w-full">
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-2xl font-bold transition-all shadow-xl shadow-red-950/20 text-sm flex items-center justify-center gap-3"
            >
              <LogOut size={18} />
              Sign Out of Sreedhar Play
            </button>
          </TouchableScale>
        </div>

      </div>
    </div>
  );
};
