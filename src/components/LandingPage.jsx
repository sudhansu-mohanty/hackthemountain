import React, { useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const withTimeout = (promise, timeoutMs = 15000, errorMsg = 'Connection timed out. Please check if your network connection, firewall, or an adblocker is blocking Supabase.') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs))
  ]);
};

export default function LandingPage({ onStartCapture }) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const cleanEmail = (email || '').trim();
      const cleanPassword = (password || '').trim();
      const cleanUsername = (username || '').trim();

      // DEV BYPASS
      if (activeTab === 'login' && cleanEmail.startsWith('admin') && cleanPassword === 'admin') {
        localStorage.setItem('bioform_dev_bypass', 'true');
        window.location.reload();
        return;
      }

      if (activeTab === 'login') {
        const { error: authError } = await withTimeout(
          supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword }),
          15000
        );
        if (authError) throw authError;
        // App.jsx will catch the auth state change
      } else {
        if (!cleanUsername || cleanUsername.length < 3) {
          setError('Username must be at least 3 characters.');
          setLoading(false);
          return;
        }

        const { data: existing, error: checkError } = await withTimeout(
          supabase.from('profiles').select('username').eq('username', cleanUsername),
          15000
        );

        if (checkError) throw checkError;
        if (existing && existing.length > 0) {
          setError('Username already taken.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await withTimeout(
          supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: { data: { username: cleanUsername } }
          }),
          15000
        );

        if (signUpError) throw signUpError;

        if (data?.user) {
          const { error: profileError } = await withTimeout(
            supabase.from('profiles').insert([{ id: data.user.id, username: cleanUsername }]),
            10000
          );
          if (profileError && profileError.code !== '23505') {
            console.error('Failed to create profile:', profileError);
          }
        }

        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists.');
        } else {
          setSuccessMessage('Account created successfully! You can now sign in.');
          setEmail('');
          setPassword('');
          setUsername('');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Soft Background Aura */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,225,109,0.05),transparent_60%)] pointer-events-none" 
      />

      {/* Massive Editorial Typography */}
      <div className="flex flex-col items-center text-center max-w-5xl w-full z-10 mb-16">
        <h1 className="font-serif text-[12vw] md:text-[10vw] lg:text-[130px] font-semibold tracking-tighter leading-[0.85] text-white/90 uppercase m-0">
          WE<br />
          CREATE<br />
          <span className="text-[#ffe16d]">HAR<span className="text-[#ffe16d] mx-2 font-sans text-[0.75em] align-middle drop-shadow-[0_0_20px_rgba(255,225,109,0.4)]">✦</span>ONIOUS</span><br />
          C<span className="text-white/40 mx-2 font-sans text-[0.75em] align-middle">✽</span>MMUNITIES
        </h1>
      </div>

      {/* Embedded Auth Panel */}
      <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-[#333] rounded-[32px] p-8 w-full max-w-md z-10 shadow-2xl">
        {successMessage ? (
          <div className="text-center py-8">
            <p className="font-sans text-sm text-white/80 leading-relaxed mb-6">
              {successMessage}
            </p>
            <button
              type="button"
              className="w-full py-4 rounded-full bg-[#111] text-[#ffe16d] text-xs font-medium tracking-widest hover:bg-[#0a0a0a] transition-all"
              onClick={() => { setSuccessMessage(null); setActiveTab('login'); }}
            >
              BACK TO SIGN IN
            </button>
          </div>
        ) : (
          <>
            <div className="flex bg-[#111] rounded-full p-1 w-full mb-8 border border-white/5">
              <button 
                className={`flex-1 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] transition-all duration-300 ${activeTab === 'login' ? 'bg-[#2a2a2a] text-[#ffe16d] shadow-sm' : 'text-white/40 hover:text-white/60'}`} 
                onClick={() => setActiveTab('login')}
              >
                SIGN IN
              </button>
              <button 
                className={`flex-1 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] transition-all duration-300 ${activeTab === 'register' ? 'bg-[#2a2a2a] text-[#ffe16d] shadow-sm' : 'text-white/40 hover:text-white/60'}`} 
                onClick={() => setActiveTab('register')}
              >
                REGISTER
              </button>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              {activeTab === 'register' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creator"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#ffe16d]/50 transition-colors"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#ffe16d]/50 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#ffe16d]/50 transition-colors"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-[#ff6b6b] rounded-xl p-3 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full mt-4 py-4 rounded-full bg-[#111] text-[#ffe16d] text-xs font-medium tracking-widest hover:bg-[#0a0a0a] transition-all flex items-center justify-center gap-2 border border-[#333]" 
                disabled={loading}
              >
                {loading ? (
                  <><Loader size={14} className="animate-spin" /> {activeTab === 'login' ? 'AUTHENTICATING...' : 'CREATING...'}</>
                ) : (
                  activeTab === 'login' ? 'ACCESS DASHBOARD' : 'JOIN NETWORK'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
