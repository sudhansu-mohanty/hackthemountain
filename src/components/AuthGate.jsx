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
  
  const [email, setEmail] = useState('rs00dhunna@gmail.com');
  const [password, setPassword] = useState('qwerty');
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
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '360px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={13} style={{ color: 'var(--aura-gold)' }} />
              <div className="label-syne" style={{ fontSize: 11, color: 'var(--aura-gold)' }}>Member Portal</div>
            </div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 500, color: 'var(--aura-body)', margin: 0 }}>
              {successMessage ? 'Check your email' : activeTab === 'register' ? 'Create Account' : 'Welcome back'}
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={loading}>
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        {!successMessage && (
          <div className="seg" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={activeTab === 'login' ? 'active' : ''}
              onClick={() => { setActiveTab('login'); setError(null); }}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={activeTab === 'register' ? 'active' : ''}
              onClick={() => { setActiveTab('register'); setError(null); }}
              disabled={loading}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success state */}
        {successMessage && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--aura-emerald)', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--aura-cream)', lineHeight: 1.6, marginBottom: '20px' }}>
              {successMessage}
            </p>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%' }}
              onClick={() => { setSuccessMessage(null); setActiveTab('login'); }}
            >
              Back to Sign In
            </button>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {activeTab === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="eyebrow-muted">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YourName"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="aura-input"
                  disabled={loading}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="eyebrow-muted">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="aura-input"
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="eyebrow-muted">Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="aura-input"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="pill pill-rose" style={{ borderRadius: '4px', padding: '10px 12px', fontSize: '12px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-gold" style={{ flex: 2 }} disabled={loading}>
                {loading ? (
                  <><Loader size={14} style={{ animation: 'auraSpin 1s linear infinite' }} /> {activeTab === 'login' ? 'Signing in...' : 'Creating...'}</>
                ) : (
                  activeTab === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
