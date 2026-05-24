import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  MessageSquare, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Activity, 
  Folder, 
  Loader, 
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp
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

  // Score circle styling selector
  const getScoreStyle = (score) => {
    if (score >= 90) return { border: 'border-emerald-500/30', text: 'text-emerald-400 bg-emerald-500/10', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]' };
    if (score >= 75) return { border: 'border-cyan-500/30', text: 'text-cyan-400 bg-cyan-500/10', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.25)]' };
    if (score >= 60) return { border: 'border-amber-500/30', text: 'text-amber-400 bg-amber-500/10', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]' };
    return { border: 'border-rose-500/30', text: 'text-rose-400 bg-rose-500/10', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]' };
  };

  // Custom markdown critique formatter
  const formatCritiqueMarkdown = (text) => {
    if (!text) return null;
    
    // Strip SCORE: line if present
    const cleanedText = text.replace(/^SCORE:\s*\d+\/\d+\s*/i, '').trim();

    return cleanedText.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Section headers (###)
      if (trimmed.startsWith('###')) {
        const title = trimmed.replace('###', '').trim();
        return (
          <h4 key={idx} className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest mt-4 mb-2 border-b border-slate-900 pb-1">
            {title}
          </h4>
        );
      }

      // Separator
      if (trimmed.includes('=== CONDENSED ===')) {
        return (
          <div key={idx} className="flex items-center gap-2 my-4">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[10px] font-orbitron font-bold text-slate-500 tracking-wider">CONDENSED SUMMARY</span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>
        );
      }

      // Bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.substring(1).trim();
        return (
          <div key={idx} className="flex items-start gap-2 my-2 text-slate-300 text-xs pl-1">
            <span className="text-cyan-400 select-none mt-0.5 shrink-0">➔</span>
            <span className="leading-relaxed">{content}</span>
          </div>
        );
      }

      // Standard text block
      return (
        <p key={idx} className="text-slate-400 text-xs leading-relaxed my-1.5">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-orbitron font-semibold tracking-widest text-cyan-400 uppercase mb-1">
            Performance Vault & History
          </div>
          <h1 className="text-3xl font-orbitron font-black text-slate-100 tracking-tight glow-cyan">
            MY DASHBOARD
          </h1>
        </div>

        {activeUser && (
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-400 font-orbitron">ATHLETE:</span>
            <span className="font-bold text-slate-200 font-orbitron">{activeUser.username}</span>
          </div>
        )}
      </div>

      {/* REGISTRATION DRAWER FOR GUESTS */}
      {!activeUser && isSupabaseConfigured && (
        <div className="glassmorphism rounded-2xl border border-cyan-500/20 p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-5 my-8">
          <Flame className="h-12 w-12 text-cyan-400 animate-pulse" />
          <div className="flex flex-col gap-1.5 max-w-md">
            <h3 className="font-orbitron font-bold text-lg text-slate-200 uppercase tracking-wider">
              Profile Setup Required
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your dashboard records community feedback, comments, and Gemini sports science reviews. Configure your active username to initialize your ledger.
            </p>
          </div>
          <button
            onClick={onShowProfileModal}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs tracking-wider rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 active:scale-95"
          >
            CREATE ACTIVE PROFILE
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="glassmorphism rounded-2xl border border-rose-500/20 p-6 flex items-start gap-4 text-slate-300">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-sm text-slate-200 uppercase tracking-wide">
              Data Fetch Failed
            </h3>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
            <button 
              onClick={fetchUserData}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-orbitron border border-slate-700 transition-colors"
            >
              RETRY FETCH
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && isSupabaseConfigured && activeUser && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader className="h-10 w-10 text-cyan-400 animate-spin" />
          <span className="text-xs font-orbitron font-bold text-slate-500 tracking-widest uppercase">
            COMPILING PERSONAL LEDGER...
          </span>
        </div>
      )}

      {/* ACTIVE DASHBOARD CONTAINER */}
      {!loading && isSupabaseConfigured && activeUser && (
        <div className="flex flex-col gap-8">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="glassmorphism rounded-2xl border border-slate-800/80 p-5 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors pointer-events-none">
                <Folder className="h-16 w-16" />
              </div>
              <div className="flex flex-col gap-1 z-10">
                <span className="text-[10px] font-orbitron font-bold text-slate-500 tracking-widest uppercase">POSTS SHARED</span>
                <span className="text-3xl font-orbitron font-extrabold text-slate-100">{stats.postCount}</span>
                <span className="text-[9px] text-slate-400 mt-1">Videos & audio track files</span>
              </div>
            </div>

            <div className="glassmorphism rounded-2xl border border-slate-800/80 p-5 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors pointer-events-none">
                <ThumbsUp className="h-16 w-16" />
              </div>
              <div className="flex flex-col gap-1 z-10">
                <span className="text-[10px] font-orbitron font-bold text-slate-500 tracking-widest uppercase">ACCUMULATED LIKES</span>
                <span className="text-3xl font-orbitron font-extrabold text-slate-100">{stats.totalLikes}</span>
                <span className="text-[9px] text-slate-400 mt-1">Community positive reactions</span>
              </div>
            </div>

            <div className="glassmorphism rounded-2xl border border-slate-800/80 p-5 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors pointer-events-none">
                <MessageSquare className="h-16 w-16" />
              </div>
              <div className="flex flex-col gap-1 z-10">
                <span className="text-[10px] font-orbitron font-bold text-slate-500 tracking-widest uppercase">TOTAL COMMENTS</span>
                <span className="text-3xl font-orbitron font-extrabold text-slate-100">{stats.totalComments}</span>
                <span className="text-[9px] text-slate-400 mt-1">Replies on shared submissions</span>
              </div>
            </div>

          </div>

          {/* SPLIT-SCREEN VIEW COLUMNS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: My Community Posts (Columns 1-6) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <h2 className="font-orbitron font-black text-sm text-slate-200 tracking-wider uppercase">
                  My Community Posts ({posts.length})
                </h2>
              </div>

              {posts.length === 0 ? (
                <div className="glassmorphism rounded-2xl border border-slate-850 p-8 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center gap-3">
                  <span>You haven't shared any community posts yet.</span>
                  <button
                    onClick={() => onSwitchTab('feed')}
                    className="not-italic px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 font-orbitron font-bold text-[10px] tracking-wider rounded-xl transition-colors"
                  >
                    GO TO FEED TO POST
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {posts.map((post) => {
                    const isVocals = post.description?.startsWith('[Vocals]') || post.media_type === 'audio';
                    let cleanDesc = post.description || '';
                    if (cleanDesc.startsWith('[Vocals]') || cleanDesc.startsWith('[Dancing]')) {
                      cleanDesc = cleanDesc.replace(/^\[(Vocals|Dancing)\]\s*/, '');
                    }

                    return (
                      <div key={post.id} className="glassmorphism rounded-xl border border-slate-850 p-4 hover:border-slate-800 transition-colors flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm text-slate-200 truncate pr-1">
                            {post.title}
                          </h4>
                          <span className={`text-[8px] font-orbitron font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                            isVocals ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {isVocals ? 'Vocals' : 'Dancing'}
                          </span>
                        </div>

                        {/* Description Preview */}
                        {cleanDesc && (
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                            {cleanDesc}
                          </p>
                        )}

                        {/* Embedded compact video/audio stream */}
                        <div className="w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-950 mt-1">
                          {post.media_type === 'video' ? (
                            <video 
                              controls 
                              className="w-full max-h-[180px] bg-slate-950 object-contain"
                              src={post.media_url}
                            />
                          ) : (
                            <audio 
                              controls 
                              className="w-full focus:outline-none p-2 scale-90"
                              src={post.media_url}
                            />
                          )}
                        </div>

                        {/* Footer counts */}
                        <div className="flex items-center justify-between text-[10px] font-orbitron text-slate-500 border-t border-slate-900 pt-2 mt-1">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-cyan-500/60" /> {post.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-cyan-500/60" /> {post.comments_count}
                            </span>
                          </div>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: My AI Review Vault (Columns 7-12) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
                <Award className="h-4 w-4 text-emerald-400" />
                <h2 className="font-orbitron font-black text-sm text-slate-200 tracking-wider uppercase">
                  My AI Review Vault ({reviews.length})
                </h2>
              </div>

              {reviews.length === 0 ? (
                <div className="glassmorphism rounded-2xl border border-slate-850 p-8 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center gap-3">
                  <span>No athletic reviews logged in your vault yet.</span>
                  <button
                    onClick={() => onSwitchTab('coach')}
                    className="not-italic px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 font-orbitron font-bold text-[10px] tracking-wider rounded-xl transition-colors"
                  >
                    RUN FIRST COACH ASSESSMENT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {reviews.map((review) => {
                    const isExpanded = expandedReviews[review.id];
                    const scoreStyle = getScoreStyle(review.score);

                    return (
                      <div 
                        key={review.id} 
                        className="glassmorphism rounded-xl border border-slate-850 hover:border-slate-800 transition-all duration-300 overflow-hidden"
                      >
                        {/* Header Block */}
                        <div 
                          onClick={() => toggleReview(review.id)}
                          className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/30 transition-colors"
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <h4 className="font-orbitron font-bold text-sm text-slate-200 truncate uppercase">
                              {review.exercise_type}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{formatTime(review.created_at)}</span>
                            </div>
                          </div>

                          {/* Score Pill / Circle */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-orbitron font-extrabold text-xs ${scoreStyle.border} ${scoreStyle.text} ${scoreStyle.glow}`}>
                              {review.score}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Critique Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-900/80 bg-slate-950/40 flex flex-col gap-3">
                            {review.media_url && (
                              <div className="w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900 mt-2">
                                <video 
                                  controls 
                                  className="w-full max-h-[220px] bg-slate-950 object-contain"
                                  src={review.media_url}
                                />
                              </div>
                            )}
                            <div className="font-sans">
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
        <div className="glassmorphism rounded-2xl border border-slate-850 p-8 text-center text-slate-500 text-xs italic">
          Please refer to the setup card above to connect your local environment variables to your database client.
        </div>
      )}

    </div>
  );
}
