import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import { TouchableScale } from '../components/TouchableScale';

interface AuthScreenProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !username)) return;

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/signup';
      const payload = mode === 'login' ? { email, password } : { email, password, username };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md glass p-8 rounded-[40px] shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block mb-4 p-3 rounded-2xl active-pill shadow-lg shadow-purple-900/40"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Lock size={20} fill="white" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join the Sonic'}
          </h1>
          <p className="text-white/50 text-sm font-medium">
            {mode === 'login' ? 'Sign in to continue your journey' : 'Experience music in higher definition'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-xl text-center">
              {error}
            </div>
          )}
          {mode === 'signup' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30">
                <User size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Full Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium"
              />
            </motion.div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30">
              <Mail size={18} />
            </div>
            <input 
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-14 pr-14 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all font-medium"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-white/30 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'login' && (
            <div className="flex justify-end pr-2">
              <button type="button" className="text-xs font-bold text-purple-400 hover:text-purple-300">Forgot Password?</button>
            </div>
          )}

          <TouchableScale disabled={isSubmitting} className="w-full pt-4">
            <button disabled={isSubmitting} type="submit" className={`w-full py-4 rounded-2xl font-bold shadow-xl text-white transition-all ${isSubmitting ? 'bg-white/10 text-white/50 cursor-wait' : 'active-pill shadow-purple-900/20'}`}>
              {isSubmitting ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
            </button>
          </TouchableScale>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Or Continue With</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex justify-center gap-4">
            <TouchableScale>
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <Chrome size={22} />
              </div>
            </TouchableScale>
            <TouchableScale>
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <Github size={22} />
              </div>
            </TouchableScale>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-white/40">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-purple-400 font-bold hover:underline"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
