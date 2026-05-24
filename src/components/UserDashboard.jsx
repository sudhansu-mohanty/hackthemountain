import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader,
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function UserDashboard({ activeUser, onShowProfileModal, onSwitchTab }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Accumulated engagement metrics
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    postCount: 0
  });

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchUserData = async () => {
    if (!isSupabaseConfigured || !activeUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch user's own community posts
      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', activeUser.id)
        .order('created_at', { ascending: false });

      if (postsErr) throw postsErr;

      // Fetch comment counts for each of the user's posts
      let accumulatedCommentsCount = 0;
      let accumulatedLikesCount = 0;

      const postsWithComments = await Promise.all((postsData || []).map(async (post) => {
        const { count, error: countError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        const commentCount = countError ? 0 : (count || 0);
        accumulatedCommentsCount += commentCount;
        accumulatedLikesCount += post.likes_count || 0;

        return {
          ...post,
          comments_count: commentCount
        };
      }));

      setPosts(postsWithComments);

      // 2. Set overall engagement stats
      setStats({
        totalLikes: accumulatedLikesCount,
        totalComments: accumulatedCommentsCount,
        postCount: postsWithComments.length
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Could not query database. Ensure tables exist and Supabase integration is correct.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [activeUser]);

  // Format timestamp helper
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--aura-border-soft)' }}>
        <div>
          <p className="eyebrow-muted" style={{ marginBottom: '6px' }}>Performance Vault & History</p>
          <h1 className="h-title" style={{ fontSize: '28px', margin: 0 }}>
            My Dashboard
          </h1>
        </div>

        {activeUser && (
          <div className="pill pill-emerald">
            <span className="dot" />
            {activeUser.username}
          </div>
        )}
      </div>

      {/* REGISTRATION DRAWER FOR GUESTS */}
      {!activeUser && isSupabaseConfigured && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', borderLeft: '3px solid var(--aura-cyan)' }}>
          <Flame size={32} style={{ color: 'var(--aura-cyan)', margin: '0 auto 16px' }} />
          <div className="h-title" style={{ fontSize: 18, marginBottom: 8 }}>Profile Setup Required</div>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--aura-muted)', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
            Sign in to access your performance vault, community posts, and AI review history.
          </p>
          <button className="btn-gold" style={{ width: 'auto', padding: '12px 24px', margin: '0 auto', display: 'inline-flex' }} onClick={onShowProfileModal}>
            Create Profile <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--aura-rose)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={14} style={{ color: 'var(--aura-rose)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="label-syne" style={{ fontSize: 11, color: 'var(--aura-rose)', marginBottom: 4 }}>Data Fetch Failed</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', marginBottom: 10 }}>{error}</p>
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 10 }} onClick={fetchUserData}>Retry</button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && isSupabaseConfigured && activeUser && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
          <Loader size={24} style={{ color: 'var(--aura-cyan)', animation: 'auraSpin 1s linear infinite' }} />
          <span className="eyebrow-muted">Loading vault...</span>
        </div>
      )}

      {/* ACTIVE DASHBOARD CONTAINER */}
      {!loading && isSupabaseConfigured && activeUser && (
        <div className="flex flex-col gap-8">
          
          {/* STATS OVERVIEW CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { v: stats.postCount, l: 'Posts Shared', watermark: '📹' },
              { v: stats.totalLikes, l: 'Total Likes', watermark: '♥' },
              { v: stats.totalComments, l: 'Comments', watermark: '💬' },
            ].map((s) => (
              <div key={s.l} className="card" style={{ position: 'relative', overflow: 'hidden', padding: '16px 14px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontSize: 30, color: 'var(--aura-gold)', lineHeight: 1 }}>{s.v}</div>
                <div className="eyebrow-muted" style={{ marginTop: 4, fontSize: 9 }}>{s.l}</div>
                <div style={{ position: 'absolute', right: -4, bottom: -12, fontSize: 56, opacity: 0.04, pointerEvents: 'none', fontFamily: 'DM Sans', fontWeight: 800, color: 'var(--aura-gold)' }}>{s.watermark}</div>
              </div>
            ))}
          </div>

          {/* Dashboard Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="section-head">My Posts ({posts.length})</div>

            {posts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', marginBottom: 14 }}>No community posts yet.</p>
                <button className="btn-ghost" style={{ fontSize: 10, padding: '8px 14px' }} onClick={() => onSwitchTab('feed')}>Go to Feed</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {posts.map((post) => {
                  const isVocals = post.description?.startsWith('[Vocals]') || post.media_type === 'audio';
                  let cleanDesc = post.description || '';
                  if (cleanDesc.startsWith('[Vocals]') || cleanDesc.startsWith('[Dancing]')) {
                    cleanDesc = cleanDesc.replace(/^\[(Vocals|Dancing)\]\s*/, '');
                  }
                  return (
                    <div key={post.id} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${isVocals ? 'var(--aura-cyan)' : 'var(--aura-emerald)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <div className="label-syne" style={{ fontSize: 12, color: 'var(--aura-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                        <span className={isVocals ? 'pill pill-cyan' : 'pill pill-emerald'} style={{ fontSize: 8, flexShrink: 0 }}>{isVocals ? 'Vocals' : 'Dancing'}</span>
                      </div>
                      {cleanDesc && <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 8 }}>{cleanDesc}</p>}
                      {post.media_type === 'video' ? (
                        <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid var(--aura-border-soft)' }}>
                          <video controls style={{ width: '100%', maxHeight: 160, background: 'var(--aura-bg)', display: 'block' }} src={post.media_url} />
                        </div>
                      ) : (
                        <audio controls style={{ width: '100%' }} src={post.media_url} />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 10, fontFamily: 'DM Sans', fontSize: 10, color: 'var(--aura-muted)' }}>
                          <span><ThumbsUp size={10} style={{ marginRight: 3 }} />{post.likes_count}</span>
                          <span><MessageSquare size={10} style={{ marginRight: 3 }} />{post.comments_count}</span>
                        </div>
                        <span className="eyebrow-muted" style={{ fontSize: 8 }}>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER INSTRUCTION IF NOT CONFIGURED AT ALL */}
      {!isSupabaseConfigured && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--aura-muted)', fontStyle: 'italic' }}>Configure Supabase environment variables to enable dashboard features.</p>
        </div>
      )}

    </div>
  );
}
