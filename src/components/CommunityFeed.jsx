import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Plus, 
  X, 
  Send, 
  Music, 
  Film, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Loader, 
  Share2,
  Calendar,
  MessageCircle,
  FileVideo,
  Play
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function CommunityFeed({ activeUser, onShowProfileModal }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contentMedium, setContentMedium] = useState('Dancing'); // 'Dancing' | 'Vocals'
  
  // Expanded descriptions and Comments sections
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({}); // { [postId]: commentsArray }
  const [loadingComments, setLoadingComments] = useState({}); // { [postId]: boolean }
  const [newCommentTexts, setNewCommentTexts] = useState({}); // { [postId]: string }
  const [submittingComment, setSubmittingComment] = useState({}); // { [postId]: boolean }

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Fetch posts and join with profiles to get the author's username
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch comment counts for each post to display on the cards
      const postsWithCommentCounts = await Promise.all((data || []).map(async (post) => {
        const { count, error: countError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        return {
          ...post,
          comments_count: countError ? 0 : (count || 0),
          author_name: post.profiles?.username || 'Anonymous User'
        };
      }));

      setPosts(postsWithCommentCounts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to retrieve community posts. Ensure database migration script has been run.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Format timestamp helper
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Toggle description expansion
  const toggleDescription = (postId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Fetch comments for a specific post
  const fetchCommentsForPost = async (postId) => {
    if (!isSupabaseConfigured) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const { data, error: commentsErr } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsErr) throw commentsErr;
      
      setCommentsData(prev => ({
        ...prev,
        [postId]: data || []
      }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle comments panel
  const toggleComments = (postId) => {
    const isExpanding = !expandedComments[postId];
    setExpandedComments(prev => ({
      ...prev,
      [postId]: isExpanding
    }));

    if (isExpanding) {
      fetchCommentsForPost(postId);
    }
  };

  // Handle Likes / Dislikes with Optimistic UI updates
  const handleVote = async (postId, type) => {
    if (!isSupabaseConfigured) return;
    if (!activeUser) {
      onShowProfileModal();
      return;
    }

    // 1. Find target post in local state
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    // 2. Perform optimistic update
    const previousLikes = targetPost.likes_count;
    const previousDislikes = targetPost.dislikes_count;

    let updatedLikes = previousLikes;
    let updatedDislikes = previousDislikes;

    if (type === 'like') {
      updatedLikes += 1;
    } else {
      updatedDislikes += 1;
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes_count: updatedLikes,
          dislikes_count: updatedDislikes
        };
      }
      return p;
    }));

    // 3. Sync with database
    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          likes_count: updatedLikes,
          dislikes_count: updatedDislikes
        })
        .eq('id', postId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Failed to sync vote to database:', err);
      // Revert state on failure
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes_count: previousLikes,
            dislikes_count: previousDislikes
          };
        }
        return p;
      }));
    }
  };

  // Submit comment
  const handleAddComment = async (postId) => {
    if (!isSupabaseConfigured) return;
    if (!activeUser) {
      onShowProfileModal();
      return;
    }

    const commentText = newCommentTexts[postId]?.trim();
    if (!commentText) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: activeUser.id,
          text: commentText
        }])
        .select(`
          *,
          profiles (
            username
          )
        `);

      if (insertError) throw insertError;

      // Clear input
      setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));

      // Append comment to local state
      const addedComment = {
        ...data[0],
        profiles: {
          username: activeUser.username
        }
      };

      setCommentsData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), addedComment]
      }));

      // Increment comments_count locally
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments_count: (p.comments_count || 0) + 1
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Could not submit comment. Please try again.');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Create post submission (file upload + db insertion)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!activeUser) {
      onShowProfileModal();
      return;
    }

    if (!postTitle.trim()) {
      alert('Please enter a title for your post.');
      return;
    }

    if (!selectedFile) {
      alert('Please choose an audio or video file to share.');
      return;
    }

    setUploading(true);
    setUploadProgress(10); // Start progress bar

    try {
      // 1. Upload file to Supabase Storage Bucket 'community-media'
      const fileExt = selectedFile.name.split('.').pop();
      const randomId = Math.random().toString(36).substring(2, 10);
      const uniqueFileName = `${activeUser.id}/${Date.now()}-${randomId}.${fileExt}`;
      
      setUploadProgress(30);
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('community-media')
        .upload(uniqueFileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadErr) throw uploadErr;

      setUploadProgress(70);

      // 2. Fetch the Public URL of the uploaded asset
      const { data: publicUrlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(uniqueFileName);

      const mediaUrl = publicUrlData.publicUrl;
      const mediaType = selectedFile.type.startsWith('audio/') ? 'audio' : 'video';

      setUploadProgress(85);

      // 3. Write metadata to posts table
      // In posts table, we can save contentMedium as description tag or prefix it
      const descriptionWithTag = `[${contentMedium}] ${postDesc}`;

      const { data: postData, error: postErr } = await supabase
        .from('posts')
        .insert([{
          user_id: activeUser.id,
          title: postTitle.trim(),
          description: descriptionWithTag,
          media_url: mediaUrl,
          media_type: mediaType,
          likes_count: 0,
          dislikes_count: 0
        }])
        .select();

      if (postErr) throw postErr;

      setUploadProgress(100);

      // Close modal & reset fields
      setShowCreateModal(false);
      setPostTitle('');
      setPostDesc('');
      setSelectedFile(null);
      setContentMedium('Dancing');

      // Refresh post list
      fetchPosts();
    } catch (err) {
      console.error('Error during post creation:', err);
      alert(`Upload failed: ${err.message || 'Unknown error occurred.'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--aura-border-soft)' }}>
        <div>
          <p className="eyebrow-muted" style={{ marginBottom: '6px' }}>Community Sandbox</p>
          <h1 className="h-title" style={{ fontSize: '28px', margin: 0 }}>
            Community Feed
          </h1>
        </div>

        {isSupabaseConfigured && (
          <button className="btn-ghost" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--aura-gold)', borderColor: 'rgba(255,225,109,0.3)' }}
            onClick={() => { if (!activeUser) { onShowProfileModal(); } else { setShowCreateModal(true); } }}
          >
            <Plus size={14} />
            New Post
          </button>
        )}
      </div>

      {/* MISSING CONFIGURATION WARNING */}
      {!isSupabaseConfigured && (
        <div className="card" style={{ borderLeft: '3px solid var(--aura-amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ color: 'var(--aura-amber)' }} />
            <div className="label-syne" style={{ fontSize: 12, color: 'var(--aura-amber)' }}>Supabase Configuration Required</div>
          </div>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--aura-cream)', lineHeight: 1.6, marginBottom: 12 }}>
            Community Feed requires a Supabase database. Add your keys to the <code style={{ color: 'var(--aura-cyan)', fontSize: 11 }}>.env</code> file:
          </p>
          <div style={{ background: 'var(--aura-bg)', border: '1px solid var(--aura-border-soft)', borderRadius: 4, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--aura-muted)' }}>
            VITE_SUPABASE_URL=your_url<br />
            VITE_SUPABASE_ANON_KEY=your_key
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--aura-rose)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={14} style={{ color: 'var(--aura-rose)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="label-syne" style={{ fontSize: 11, color: 'var(--aura-rose)', marginBottom: 4 }}>Database Sync Failed</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', marginBottom: 10 }}>{error}</p>
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 10 }} onClick={fetchPosts}>Retry</button>
          </div>
        </div>
      )}

      {/* FEED LOADING */}
      {loading && isSupabaseConfigured && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <Loader size={24} style={{ color: 'var(--aura-cyan)', animation: 'auraSpin 1s linear infinite' }} />
          <span className="eyebrow-muted">Loading feed...</span>
        </div>
      )}

      {/* EMPTY FEED STATE */}
      {!loading && posts.length === 0 && isSupabaseConfigured && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <MessageCircle size={32} style={{ color: 'var(--aura-muted)', margin: '0 auto 16px' }} />
          <div className="h-title" style={{ fontSize: 18, marginBottom: 8 }}>Feed Is Silent</div>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--aura-muted)', marginBottom: 20 }}>
            Be the first to share a performance clip.
          </p>
          <button className="btn-gold" style={{ width: 'auto', padding: '10px 20px', margin: '0 auto' }}
            onClick={() => { if (!activeUser) { onShowProfileModal(); } else { setShowCreateModal(true); } }}
          >
            <Plus size={13} /> Publish First Post
          </button>
        </div>
      )}

      {/* FEED LIST */}
      {!loading && posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map((post) => {
            const isVocals = post.description?.startsWith('[Vocals]') || post.media_type === 'audio';
            const displayTag = isVocals ? 'Vocals' : 'Dancing';
            let cleanDesc = post.description || '';
            if (cleanDesc.startsWith('[Vocals]') || cleanDesc.startsWith('[Dancing]')) {
              cleanDesc = cleanDesc.replace(/^\[(Vocals|Dancing)\]\s*/, '');
            }
            const isExpanded = expandedDescriptions[post.id];
            const isCommentsOpen = expandedComments[post.id];
            const comments = commentsData[post.id] || [];
            const isCommentLoading = loadingComments[post.id];
            const tagClass = isVocals ? 'pill pill-cyan' : 'pill pill-emerald';

            return (
              <div key={post.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--aura-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(110,231,255,0.08)', border: '1px solid rgba(110,231,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: 'var(--aura-cyan)', flexShrink: 0 }}>
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: 'var(--aura-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {post.author_name}
                        {activeUser && post.user_id === activeUser.id && (
                          <span className="pill" style={{ fontSize: 8, padding: '2px 6px', color: 'var(--aura-cyan)', borderColor: 'rgba(110,231,255,0.3)' }}>you</span>
                        )}
                      </div>
                      <div className="eyebrow-muted" style={{ fontSize: 9 }}>{formatTime(post.created_at)}</div>
                    </div>
                  </div>
                  <span className={tagClass} style={{ fontSize: 9 }}><span className="dot" />{displayTag}</span>
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="label-syne" style={{ fontSize: 14, color: 'var(--aura-body)' }}>{post.title}</div>

                  {/* Media player */}
                  <div style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid var(--aura-border-soft)', background: 'var(--aura-bg)' }}>
                    {post.media_type === 'video' ? (
                      <video controls style={{ width: '100%', maxHeight: 380, background: 'var(--aura-bg)', display: 'block' }} src={post.media_url} />
                    ) : (
                      <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(110,231,255,0.06)', border: '1px solid rgba(110,231,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-cyan)' }}>
                          <Music size={20} />
                        </div>
                        <audio controls style={{ width: '100%' }} src={post.media_url} />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {cleanDesc && (
                    <div style={{ borderTop: '1px solid var(--aura-border-soft)', paddingTop: 12 }}>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--aura-cream)', lineHeight: 1.6, margin: 0, overflow: isExpanded ? 'visible' : 'hidden', display: '-webkit-box', WebkitLineClamp: isExpanded ? 'unset' : 2, WebkitBoxOrient: 'vertical' }}>{cleanDesc}</p>
                      {cleanDesc.length > 120 && (
                        <button onClick={() => toggleDescription(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: 'var(--aura-cyan)', padding: 0 }}>
                          {isExpanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> More</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--aura-border-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', background: 'var(--aura-bg)', border: '1px solid var(--aura-border-soft)', borderRadius: 999, overflow: 'hidden' }}>
                    <button onClick={() => handleVote(post.id, 'like')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: 'var(--aura-muted)' }}>
                      <ThumbsUp size={11} /> {post.likes_count}
                    </button>
                    <div style={{ width: 1, background: 'var(--aura-border-soft)' }} />
                    <button onClick={() => handleVote(post.id, 'dislike')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: 'var(--aura-muted)' }}>
                      <ThumbsDown size={11} /> {post.dislikes_count}
                    </button>
                  </div>
                  <button onClick={() => toggleComments(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: isCommentsOpen ? 'rgba(110,231,255,0.08)' : 'var(--aura-bg)', border: `1px solid ${isCommentsOpen ? 'rgba(110,231,255,0.25)' : 'var(--aura-border-soft)'}`, borderRadius: 999, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: isCommentsOpen ? 'var(--aura-cyan)' : 'var(--aura-muted)' }}>
                    <MessageSquare size={11} /> {post.comments_count} {isCommentsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                </div>

                {/* Comments drawer */}
                {isCommentsOpen && (
                  <div style={{ background: 'var(--aura-bg)', borderTop: '1px solid var(--aura-border-soft)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="eyebrow-muted" style={{ fontSize: 9 }}>Discussion</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {isCommentLoading && comments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 16 }}>
                          <Loader size={16} style={{ color: 'var(--aura-cyan)', animation: 'auraSpin 1s linear infinite' }} />
                        </div>
                      ) : comments.length === 0 ? (
                        <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', textAlign: 'center', padding: '12px 0' }}>No comments yet.</p>
                      ) : comments.map((comment) => (
                        <div key={comment.id} style={{ background: 'var(--aura-card)', border: '1px solid var(--aura-border-soft)', borderRadius: 4, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="label-syne" style={{ fontSize: 10, color: 'var(--aura-body)' }}>{comment.profiles?.username || 'Anonymous'}</span>
                            <span className="eyebrow-muted" style={{ fontSize: 9 }}>{formatTime(comment.created_at)}</span>
                          </div>
                          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-cream)', margin: 0, lineHeight: 1.5 }}>{comment.text}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={newCommentTexts[post.id] || ''} onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }} placeholder="Add a comment..." className="aura-input" style={{ flex: 1, padding: '10px 12px', fontSize: 12 }} disabled={submittingComment[post.id]} />
                      <button onClick={() => handleAddComment(post.id)} disabled={!newCommentTexts[post.id]?.trim() || submittingComment[post.id]} className="icon-btn" style={{ flexShrink: 0, color: newCommentTexts[post.id]?.trim() ? 'var(--aura-cyan)' : 'var(--aura-muted)' }}>
                        {submittingComment[post.id] ? <Loader size={14} style={{ animation: 'auraSpin 1s linear infinite' }} /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE POST MODAL DIALOG */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div className="eyebrow-muted" style={{ marginBottom: 4 }}>Community Sandbox</div>
                <div className="h-title" style={{ fontSize: 20 }}>Share Performance</div>
              </div>
              <button className="icon-btn" onClick={() => { if (!uploading) { setShowCreateModal(false); setSelectedFile(null); } }} disabled={uploading}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="eyebrow-muted">Title</label>
                <input type="text" required placeholder="My performance clip..." value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="aura-input" disabled={uploading} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="eyebrow-muted">Description</label>
                <textarea placeholder="What should the community look for?" rows="3" value={postDesc} onChange={(e) => setPostDesc(e.target.value)} className="aura-input" style={{ resize: 'none' }} disabled={uploading} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="eyebrow-muted">Medium</label>
                  <div className="seg">
                    <button type="button" className={contentMedium === 'Dancing' ? 'active' : ''} onClick={() => setContentMedium('Dancing')} disabled={uploading}>Dancing</button>
                    <button type="button" className={contentMedium === 'Vocals' ? 'active' : ''} onClick={() => setContentMedium('Vocals')} disabled={uploading}>Vocals</button>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="eyebrow-muted">Media File *</label>
                  <label className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', fontSize: 10 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                      {selectedFile ? selectedFile.name : 'Choose File'}
                    </span>
                    <input type="file" required accept="video/*,audio/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                </div>
              </div>

              {uploading && (
                <div style={{ background: 'var(--aura-bg)', border: '1px solid var(--aura-border-soft)', borderRadius: 4, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="eyebrow-muted" style={{ fontSize: 9 }}>Uploading...</span>
                    <span className="eyebrow" style={{ fontSize: 9 }}>{uploadProgress}%</span>
                  </div>
                  <div className="bar"><span style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => { setShowCreateModal(false); setSelectedFile(null); }} disabled={uploading}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ flex: 2 }} disabled={uploading}>
                  {uploading ? <><Loader size={13} style={{ animation: 'auraSpin 1s linear infinite' }} /> Uploading...</> : 'Upload & Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
