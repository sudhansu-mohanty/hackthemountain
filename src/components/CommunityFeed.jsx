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
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-orbitron font-semibold tracking-widest text-cyan-400 uppercase mb-1">
            Global Athletes Sandbox
          </div>
          <h1 className="text-3xl font-orbitron font-black text-slate-100 tracking-tight glow-cyan">
            COMMUNITY FEED
          </h1>
        </div>

        {isSupabaseConfigured && (
          <button
            onClick={() => {
              if (!activeUser) {
                onShowProfileModal();
              } else {
                setShowCreateModal(true);
              }
            }}
            className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 text-slate-950 font-orbitron font-bold tracking-wider rounded-xl transition-all duration-300 active:scale-95 hover:shadow-cyan-500/20 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            CREATE POST
          </button>
        )}
      </div>

      {/* MISSING CONFIGURATION WARNING */}
      {!isSupabaseConfigured && (
        <div className="glassmorphism-glow rounded-2xl border border-amber-500/20 p-6 flex flex-col gap-4 text-slate-300">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-orbitron font-bold text-lg text-slate-100 tracking-wide uppercase">
              Supabase Configuration Required
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            The Community Feed and User Dashboard require integration with a Supabase database. To start sharing posts and logging AI reviews:
          </p>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 flex flex-col gap-2">
            <div>1. Set up a free Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">supabase.com</a>.</div>
            <div>2. Execute the schema queries in <span className="text-emerald-400">supabase_schema.sql</span> via the SQL Editor.</div>
            <div>3. Add the following keys to your project's local <span className="text-cyan-400">.env</span> file:</div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 mt-1 select-all text-slate-400">
              VITE_SUPABASE_URL=your_supabase_project_url<br />
              VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
            </div>
          </div>
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
              Database Sync Failed
            </h3>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
            <button 
              onClick={fetchPosts}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-orbitron border border-slate-700 transition-colors"
            >
              RETRY CONNECTION
            </button>
          </div>
        </div>
      )}

      {/* FEED LOADING */}
      {loading && isSupabaseConfigured && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader className="h-10 w-10 text-cyan-400 animate-spin" />
          <span className="text-xs font-orbitron font-bold text-slate-500 tracking-widest uppercase">
            DOWNLOADING TIMELINE...
          </span>
        </div>
      )}

      {/* EMPTY FEED STATE */}
      {!loading && posts.length === 0 && isSupabaseConfigured && (
        <div className="glassmorphism rounded-2xl border border-slate-800 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
          <MessageCircle className="h-12 w-12 text-slate-600 animate-pulse" />
          <div className="flex flex-col gap-1">
            <h3 className="font-orbitron font-bold text-lg text-slate-200 uppercase tracking-wider">
              Feed Is Silent
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Be the first athlete to upload a biomechanical clip or vocal metric to the sandbox.
            </p>
          </div>
          <button
            onClick={() => {
              if (!activeUser) {
                onShowProfileModal();
              } else {
                setShowCreateModal(true);
              }
            }}
            className="mt-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-orbitron font-bold text-xs tracking-wider rounded-xl transition-all"
          >
            PUBLISH FIRST POST
          </button>
        </div>
      )}

      {/* FEED LIST */}
      {!loading && posts.length > 0 && (
        <div className="flex flex-col gap-6">
          {posts.map((post) => {
            // Check tag matching (Dancing or Vocals)
            const isVocals = post.description?.startsWith('[Vocals]') || post.media_type === 'audio';
            const displayTag = isVocals ? 'Vocals' : 'Dancing';
            
            // Clean description text (strip out [Tag])
            let cleanDesc = post.description || '';
            if (cleanDesc.startsWith('[Vocals]') || cleanDesc.startsWith('[Dancing]')) {
              cleanDesc = cleanDesc.replace(/^\[(Vocals|Dancing)\]\s*/, '');
            }

            const isExpanded = expandedDescriptions[post.id];
            const isCommentsOpen = expandedComments[post.id];
            const comments = commentsData[post.id] || [];
            const isCommentLoading = loadingComments[post.id];

            return (
              <div 
                key={post.id} 
                className="glassmorphism rounded-2xl border border-slate-800 shadow-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300"
              >
                {/* CARD HEADER */}
                <div className="px-6 py-4 border-b border-slate-900/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Glowing Avatar */}
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center font-orbitron font-bold text-sm text-cyan-300">
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {post.author_name}
                        {activeUser && post.user_id === activeUser.id && (
                          <span className="text-[9px] font-orbitron bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {formatTime(post.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* MEDIUM TAG */}
                  <span className={`text-[10px] font-orbitron font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    isVocals 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                  }`}>
                    {displayTag}
                  </span>
                </div>

                {/* CARD BODY */}
                <div className="p-6 flex flex-col gap-4">
                  <h3 className="text-lg font-orbitron font-bold text-slate-100 leading-tight">
                    {post.title}
                  </h3>

                  {/* MEDIA PLAYER */}
                  <div className="w-full relative rounded-xl overflow-hidden border border-slate-950 bg-slate-950 shadow-inner">
                    {post.media_type === 'video' ? (
                      <video 
                        controls 
                        className="w-full max-h-[420px] bg-slate-950 rounded-lg"
                        src={post.media_url}
                      />
                    ) : (
                      /* Enhanced Audio Player Container */
                      <div className="p-6 flex flex-col items-center justify-center gap-4 bg-slate-950/80">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-[spin_8s_linear_infinite]">
                          <Music className="h-6 w-6" />
                        </div>
                        <audio 
                          controls 
                          className="w-full focus:outline-none" 
                          src={post.media_url}
                        />
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION (Expandable) */}
                  {cleanDesc && (
                    <div className="border-t border-slate-900/60 pt-4 mt-2">
                      <p className={`text-slate-300 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {cleanDesc}
                      </p>
                      {cleanDesc.length > 150 && (
                        <button
                          onClick={() => toggleDescription(post.id)}
                          className="flex items-center gap-1 mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {isExpanded ? (
                            <>Show Less <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Read Full Description <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* CARD FOOTER */}
                <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-900/60 flex items-center justify-between gap-6">
                  
                  {/* Upvote / Downvote buttons */}
                  <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1 font-orbitron select-none shadow-sm">
                    <button
                      onClick={() => handleVote(post.id, 'like')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-all cursor-pointer"
                      title="Like Post"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{post.likes_count}</span>
                    </button>
                    <div className="w-[1px] bg-slate-800 my-1.5" />
                    <button
                      onClick={() => handleVote(post.id, 'dislike')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer"
                      title="Dislike Post"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>{post.dislikes_count}</span>
                    </button>
                  </div>

                  {/* Comment button */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-orbitron font-bold text-xs tracking-wider transition-all duration-300 ${
                      isCommentsOpen 
                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-md shadow-cyan-500/5'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>COMMENTS ({post.comments_count})</span>
                    {isCommentsOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </div>

                {/* COMMENTS PANEL DRAWER */}
                {isCommentsOpen && (
                  <div className="bg-slate-950/60 border-t border-slate-900/80 px-6 py-5 flex flex-col gap-4">
                    
                    <h4 className="font-orbitron font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">
                      Comments Section
                    </h4>

                    {/* Comments list */}
                    <div className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-3 font-sans">
                      {isCommentLoading && comments.length === 0 ? (
                        <div className="flex justify-center py-4">
                          <Loader className="h-5 w-5 text-cyan-400 animate-spin" />
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center text-xs text-slate-500 py-4 italic">
                          No comments posted yet. Start the conversation!
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-900/40 border border-slate-900 rounded-xl p-3 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-200 font-orbitron">{comment.profiles?.username || 'Anonymous'}</span>
                              <span className="text-slate-500 font-medium">{formatTime(comment.created_at)}</span>
                            </div>
                            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment Form input */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newCommentTexts[post.id] || ''}
                        onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        placeholder="Add a public comment..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        disabled={submittingComment[post.id]}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newCommentTexts[post.id]?.trim() || submittingComment[post.id]}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
                          !newCommentTexts[post.id]?.trim()
                            ? 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed'
                            : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                        }`}
                      >
                        {submittingComment[post.id] ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glassmorphism rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-orbitron font-extrabold text-slate-100 tracking-wider text-sm uppercase">
                Publish Community Post
              </h3>
              <button
                onClick={() => {
                  if (!uploading) {
                    setShowCreateModal(false);
                    setSelectedFile(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePost} className="p-6 flex flex-col gap-4 font-sans text-xs sm:text-sm">
              
              {/* Post Title */}
              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-[10px] text-slate-400 tracking-wider uppercase">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Analyze my symmetry deltas..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-[10px] text-slate-400 tracking-wider uppercase">
                  Description / Body Text
                </label>
                <textarea
                  placeholder="I felt my left elbow extension was slightly early during this transition. Let me know what you think!"
                  rows="3"
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium resize-none"
                  disabled={uploading}
                />
              </div>

              {/* Medium / Tag Selector & File Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Content Medium Tag */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-orbitron font-bold text-[10px] text-slate-400 tracking-wider uppercase">
                    Content Medium
                  </label>
                  <div className="grid grid-cols-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setContentMedium('Dancing')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-orbitron font-bold tracking-wider transition-all select-none ${
                        contentMedium === 'Dancing'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                      disabled={uploading}
                    >
                      DANCING
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMedium('Vocals')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-orbitron font-bold tracking-wider transition-all select-none ${
                        contentMedium === 'Vocals'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                      disabled={uploading}
                    >
                      VOCALS
                    </button>
                  </div>
                </div>

                {/* File picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-orbitron font-bold text-[10px] text-slate-400 tracking-wider uppercase">
                    Select Media File *
                  </label>
                  <label className="flex items-center justify-center bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 cursor-pointer transition-colors text-xs font-semibold text-slate-400 select-none text-center">
                    <span className="truncate">
                      {selectedFile ? selectedFile.name : 'Choose Video or Audio'}
                    </span>
                    <input
                      type="file"
                      required
                      accept="video/*,audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* PROGRESS BAR */}
              {uploading && (
                <div className="flex flex-col gap-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 mt-2">
                  <div className="flex justify-between items-center text-[10px] font-orbitron font-bold text-slate-400">
                    <span>UPLOADING TO SUPABASE BUCKET...</span>
                    <span className="text-cyan-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-4 border-t border-slate-900/80 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedFile(null);
                  }}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold font-orbitron text-xs tracking-wider rounded-xl transition-colors"
                  disabled={uploading}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-6 py-2.5 font-orbitron font-bold text-xs tracking-wider rounded-xl transition-all shadow-md ${
                    uploading
                      ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 text-slate-950 active:scale-95'
                  }`}
                >
                  {uploading ? 'PROCESSING...' : 'UPLOAD & SHARE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
