import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, X, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const withTimeout = (promise, timeoutMs = 15000, errorMsg = 'Connection timed out. Please check if your network connection, firewall, or an adblocker is blocking Supabase.') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
};

export default function AuthGate({ onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const cleanEmail = (email || '').trim();
      const cleanPassword = (password || '').trim();
      const cleanUsername = (username || '').trim();

      if (activeTab === 'login') {
        // --- LOGIN FLOW ---
        const { data, error: authError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          }),
          15000
        );

        if (authError) throw authError;

        // Session resolved successfully. App.jsx's global onAuthStateChange
        // will trigger resolveActiveProfile and update activeUser.
        onClose();
      } else {
        // --- REGISTER FLOW ---
        if (!cleanUsername || cleanUsername.length < 3) {
          setError('Username must be at least 3 characters.');
          setLoading(false);
          return;
        }

        // Check duplicate username
        const { data: existing, error: checkError } = await withTimeout(
          supabase
            .from('profiles')
            .select('username')
            .eq('username', cleanUsername),
          15000
        );

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
          setError('Username already taken. Please choose another.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await withTimeout(
          supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: { username: cleanUsername }
            }
          }),
          15000
        );

        if (signUpError) throw signUpError;

        if (data?.user) {
          // Immediately write profile record to profiles table
          const { error: profileError } = await withTimeout(
            supabase
              .from('profiles')
              .insert([{
                id: data.user.id,
                username: cleanUsername
              }]),
            15000
          );

          if (profileError) {
            console.error('Failed to create public profiles record:', profileError);
          }

          // If email confirmation is enabled, the session is null initially
          if (data.session) {
            onAuthSuccess({ id: data.user.id, username: cleanUsername });
            onClose();
          } else {
            setSuccessMessage('Registration successful! Please check your email inbox to confirm your account.');
            // Clear inputs
            setEmail('');
            setPassword('');
            setUsername('');
          }
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errMsg = err?.message || err?.error_description || String(err) || 'Authentication operation failed. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md glassmorphism rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/30">
          <h3 className="font-orbitron font-extrabold text-slate-100 tracking-wider text-sm uppercase flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 animate-pulse" />
            ATHLETE PORTAL
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleAuth} className="p-6 flex flex-col gap-4 font-sans text-xs sm:text-sm">
          
          {/* Main Sign In / Sign Up tab switcher */}
          {!successMessage && (
            <div className="grid grid-cols-2 bg-slate-950 p-1 border border-slate-900 rounded-xl mb-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-orbitron font-bold tracking-wider transition-all select-none ${
                  activeTab === 'login'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-350 border border-transparent'
                }`}
                disabled={loading}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-orbitron font-bold tracking-wider transition-all select-none ${
                  activeTab === 'register'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-350 border border-transparent'
                }`}
                disabled={loading}
              >
                CREATE ACCOUNT
              </button>
            </div>
          )}

          {/* Success message banner */}
          {successMessage && (
            <div className="flex flex-col items-center gap-3 text-center bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl mt-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
              <div className="font-orbitron font-extrabold text-sm text-slate-100 uppercase tracking-wider">CHECK YOUR EMAIL</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {successMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage(null);
                  setActiveTab('login');
                }}
                className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 font-orbitron font-bold text-xs tracking-wider rounded-xl transition-colors"
              >
                BACK TO SIGN IN
              </button>
            </div>
          )}

          {!successMessage && (
            <>
              {/* Username field (Register Only) */}
              {activeTab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-orbitron font-bold text-[10px] text-slate-450 tracking-wider uppercase flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-500" /> Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FlexAthlete"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Email address field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-[10px] text-slate-455 tracking-wider uppercase flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
                  disabled={loading}
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-[10px] text-slate-455 tracking-wider uppercase flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" /> Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
                  disabled={loading}
                />
              </div>

              {/* Error panel */}
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs leading-normal">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-4 border-t border-slate-900/60 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 font-bold font-orbitron text-xs tracking-wider rounded-xl transition-colors"
                  disabled={loading}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 text-slate-950 font-orbitron font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                      <span>{activeTab === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}</span>
                    </>
                  ) : (
                    <span>{activeTab === 'login' ? 'SIGN IN' : 'CONFIRM REGISTER'}</span>
                  )}
                </button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
}
