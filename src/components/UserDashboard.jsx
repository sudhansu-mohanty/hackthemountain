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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Accumulated engagement metrics
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    postCount: 0
  });

  // Keep track of which AI reviews are expanded
  const [expandedReviews, setExpandedReviews] = useState({});

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

      // 2. Fetch user's AI review vault records
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('ai_reviews')
        .select('*')
        .eq('user_id', activeUser.id)
        .order('created_at', { ascending: false });

      if (reviewsErr) throw reviewsErr;
      setReviews(reviewsData || []);

      // 3. Set overall engagement stats
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

  // Toggle AI critique review block
  const toggleReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };


  // Custom markdown critique formatter
  const formatCritiqueMarkdown = (text) => {
    if (!text) return null;
    const cleanedText = text.replace(/^SCORE:\s*\d+\/\d+\s*/i, '').trim();

    return cleanedText.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: 6 }} />;

      if (trimmed.startsWith('###')) {
        return <p key={idx} className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>{trimmed.replace('###', '').trim()}</p>;
      }

      if (trimmed.includes('=== CONDENSED ===')) {
        return <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--aura-border-soft)' }} />
          <span className="eyebrow-muted" style={{ fontSize: 8 }}>Condensed</span>
          <div style={{ flex: 1, height: 1, background: 'var(--aura-border-soft)' }} />
        </div>;
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <div key={idx} style={{ display: 'flex', gap: 6, margin: '4px 0' }}>
          <span style={{ color: 'var(--aura-gold)', flexShrink: 0, marginTop: 1 }}>›</span>
          <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-cream)', lineHeight: 1.5 }}>{trimmed.substring(1).trim()}</span>
        </div>;
      }

      return <p key={idx} style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-muted)', lineHeight: 1.5, margin: '3px 0' }}>{trimmed}</p>;
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

          {/* TWO COLUMNS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

            {/* LEFT: My Community Posts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="section-head">My Posts ({posts.length})</div>

              {posts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', marginBottom: 14 }}>No community posts yet.</p>
                  <button className="btn-ghost" style={{ fontSize: 10, padding: '8px 14px' }} onClick={() => onSwitchTab('feed')}>Go to Feed</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 560, overflowY: 'auto' }}>
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
                        <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid var(--aura-border-soft)' }}>
                          {post.media_type === 'video'
                            ? <video controls style={{ width: '100%', maxHeight: 160, background: 'var(--aura-bg)', display: 'block' }} src={post.media_url} />
                            : <audio controls style={{ width: '100%' }} src={post.media_url} />}
                        </div>
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

            {/* RIGHT: AI Review Vault */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="section-head">AI Vault ({reviews.length})</div>

              {reviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', marginBottom: 14 }}>No AI reviews yet.</p>
                  <button className="btn-ghost" style={{ fontSize: 10, padding: '8px 14px' }} onClick={() => onSwitchTab('coach')}>Run Assessment</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 560, overflowY: 'auto' }}>
                  {reviews.map((review) => {
                    const isExpanded = expandedReviews[review.id];
                    const s = review.score;
                    const scoreColor = s >= 85 ? 'var(--aura-emerald)' : s >= 70 ? 'var(--aura-cyan)' : s >= 55 ? 'var(--aura-amber)' : 'var(--aura-rose)';
                    return (
                      <div key={review.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div onClick={() => toggleReview(review.id)} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' }}>
                          <div style={{ minWidth: 0 }}>
                            <div className="label-syne" style={{ fontSize: 12, color: 'var(--aura-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.exercise_type}</div>
                            <div className="eyebrow-muted" style={{ fontSize: 9, marginTop: 2 }}>{formatTime(review.created_at)}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${scoreColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 14, fontWeight: 600, color: scoreColor }}>{s}</div>
                            {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--aura-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--aura-muted)' }} />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid var(--aura-border-soft)', padding: '12px 14px', background: 'var(--aura-bg)' }}>
                            {review.media_url && (
                              <div style={{ borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                                <video controls style={{ width: '100%', maxHeight: 200, background: 'var(--aura-bg)', display: 'block' }} src={review.media_url} />
                              </div>
                            )}
                            <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-cream)', lineHeight: 1.6 }}>
                              {formatCritiqueMarkdown(review.feedback_markdown)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
