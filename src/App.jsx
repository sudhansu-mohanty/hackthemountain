import React, { useState, useEffect, useRef } from 'react';
import { Key, AlertTriangle, Play, RefreshCw, Cpu, Activity, Info, CheckCircle2, ShieldAlert, User, Users, Sparkles, X, Loader } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import PoseTracker from './components/PoseTracker';
import Dashboard from './components/Dashboard';
import { calculateSessionSummary } from './utils/biomechanics';

// Supabase backend client and views
import { supabase } from './utils/supabaseClient';
import CommunityFeed from './components/CommunityFeed';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/UserDashboard';
import AuthGate from './components/AuthGate';

const withTimeout = (promise, timeoutMs = 15000, errorMsg = 'Connection timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
};

const Metronome = React.lazy(() => import('./components/Metronome'));
export default function App() {
  const [activeMainTab, setActiveMainTab] = useState('coach'); // 'coach' | 'feed' | 'dashboard'
  const [currentTab, setCurrentTab] = useState('judge'); // 'judge' | 'metronome'
  const [view, setView] = useState('capture'); // 'capture' | 'processing' | 'results'
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('bioform_gemini_api_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [error, setError] = useState(null);
  const [processingPhase, setProcessingPhase] = useState('Initializing...');
  const [analysisResult, setAnalysisResult] = useState('');
  const [savedTrackingData, setSavedTrackingData] = useState([]);
  const [isUploadedVideo, setIsUploadedVideo] = useState(false);

  // Active User & Session State
  const [session, setSession] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Background prefetch refs and states
  const prefetchPromiseRef = useRef(null);
  const [prefetchedResult, setPrefetchedResult] = useState(null);
  const [prefetchedError, setPrefetchedError] = useState(null);

  // Sync API Key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('bioform_gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('bioform_gemini_api_key');
    }
  }, [apiKey]);

  // Helper to resolve user profile details from public.profiles
  const resolveActiveProfile = async (authUser) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single(),
        15000
      );

      if (error) {
        // Fallback: create profile if database sync missed it
        const usernameFallback = authUser.user_metadata?.username || authUser.email.split('@')[0];
        const newUser = { id: authUser.id, username: usernameFallback };

        const { error: insertErr } = await withTimeout(
          supabase
            .from('profiles')
            .insert([newUser]),
          15000
        );

        if (!insertErr) {
          setActiveUser(newUser);
        } else {
          console.error('Failed to auto-generate profile entry:', insertErr);
          setActiveUser(newUser); // Fallback to let UI run
        }
      } else {
        setActiveUser(data);
      }
    } catch (err) {
      console.error('Failed resolving athlete profile details:', err);
      // Fallback on timeout/error so app stays functional
      const usernameFallback = authUser.user_metadata?.username || authUser.email.split('@')[0];
      setActiveUser({ id: authUser.id, username: usernameFallback });
    }
  };

  // Sync Supabase Authentication State
  useEffect(() => {
    // Check if dev bypass is active
    if (localStorage.getItem('bioform_dev_bypass') === 'true') {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@bioform.ai',
        user_metadata: { username: 'AdminBypass' }
      };
      setSession({ user: mockUser });
      setActiveUser({ id: mockUser.id, username: 'AdminBypass' });
      setIsAuthLoading(false);
      return;
    }

    // Safety timeout to ensure we clear the loading screen even if Supabase connection hangs
    const safetyTimeout = setTimeout(() => {
      console.warn('[BioForm App] Session retrieval timed out. Clearing loading screen...');
      setIsAuthLoading(false);
    }, 4000);

    // 1. Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(safetyTimeout);
        setSession(session);
        if (session?.user) {
          resolveActiveProfile(session.user);
        }
        setIsAuthLoading(false);
      })
      .catch(err => {
        clearTimeout(safetyTimeout);
        console.error('[BioForm App] Failed to get initial session:', err);
        setIsAuthLoading(false);
      });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Ignore auth changes if bypass is active to prevent session conflict
      if (localStorage.getItem('bioform_dev_bypass') === 'true') return;

      setSession(session);
      if (session?.user) {
        await resolveActiveProfile(session.user);
      } else {
        setActiveUser(null);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      if (localStorage.getItem('bioform_dev_bypass') === 'true') {
        localStorage.removeItem('bioform_dev_bypass');
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      setActiveUser(null);
      setSession(null);
      setActiveMainTab('coach');
      setView('capture');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const saveAiReviewToSupabase = async (feedbackText, mediaUrl = null) => {
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!activeUser || !isSupabaseConfigured) return;

    const extractScoreFromText = (text) => {
      if (!text) return 70;
      const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
      return scoreMatch ? parseInt(scoreMatch[1], 10) : 70;
    };

    const score = isUploadedVideo
      ? Math.max(50, Math.min(95, Math.round(extractScoreFromText(feedbackText) * 1.2)))
      : extractScoreFromText(feedbackText);

    try {
      // First attempt: try to insert with media_url
      const { error: reviewErr } = await supabase
        .from('ai_reviews')
        .insert([{
          user_id: activeUser.id,
          exercise_type: 'Performance',
          score: score,
          feedback_markdown: feedbackText,
          media_url: mediaUrl
        }]);

      if (reviewErr) {
        console.error('[BioForm Supabase] Error saving AI review:', reviewErr);

        // Check if the error is due to missing media_url column in schema cache or table
        const isMediaUrlErr = reviewErr.message?.includes('media_url') ||
          reviewErr.code === 'PGRST204' ||
          reviewErr.details?.includes('media_url');

        if (isMediaUrlErr) {
          console.log('[BioForm Supabase] Retrying insertion without media_url column...');
          // Second attempt: retry inserting without media_url column
          const { error: retryErr } = await supabase
            .from('ai_reviews')
            .insert([{
              user_id: activeUser.id,
              exercise_type: 'Performance',
              score: score,
              feedback_markdown: feedbackText
            }]);

          if (retryErr) {
            console.error('[BioForm Supabase] Retry failed:', retryErr);
          } else {
            console.log('[BioForm Supabase] AI review saved successfully (without media_url fallback).');
          }
        }
      } else {
        console.log('[BioForm Supabase] AI review saved successfully.');
      }
    } catch (err) {
      console.error('[BioForm Supabase] Failed to write AI review:', err);
    }
  };

  // Phase text animation loop for the processing view
  useEffect(() => {
    if (view !== 'processing') return;

    const phases = [
      'Extracting physical coordinates from BlazePose CNN...',
      'Normalizing skeleton coordinate matrices...',
      'Calculating dynamic joint flexion vectors...',
      'Bundling time-series kinematics payload...',
      'Broadcasting JSON telemetry to Gemini-2.5-Flash...',
      'Auditing athletic benchmarks and symmetry angles...',
      'Generating sports science critique...'
    ];

    let currentPhaseIdx = 0;
    setProcessingPhase(phases[0]);

    const interval = setInterval(() => {
      currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
      setProcessingPhase(phases[currentPhaseIdx]);
    }, 2000);

    return () => clearInterval(interval);
  }, [view]);

  // System instruction and prompt helper to prevent discrepancy bugs
  const systemInstruction =
    "You are an AI Sports Scientist and Biomechanics Coach. Your purpose is to ingest time-series JSON descriptions of joint movements and output a highly client-friendly, motivating, and action-oriented athletic performance audit. " +
    "Your report must be structured, professional, and clear. You must avoid raw data dumps, computer-science terminology, and listing long lists of raw timestamps (like [9983, 10582...]). Write in a tone that is encouraging yet highly precise for an athlete. " +
    "You are strictly forbidden from using double asterisks '**' (bold markdown markers) anywhere in your response. Instead, write in clear plain text or standard bullet lists. " +
    "You must analyze these kinematic parameters from the JSON: 1. Joint angles and range of motion (knees, elbows, hips, shoulders, ankles), 2. Postural trunk alignment (torso tilt angle), and 3. Symmetry balance deltas across all joints. " +
    "CRITICAL ACCURACY REQUIREMENT: If a joint metric value is null in the JSON dataset (e.g. left_knee_angle is null, or knee_asymmetry_delta is null), this means that joint was NOT visible in the camera frame during those frames. You are strictly forbidden from guessing its state or declaring it had excellent symmetry or form. Instead, you MUST explicitly state in the audit report that the joint (e.g., knees, ankles, hips) was obstructed or out of the camera view, and instruct the client to adjust their camera angle to capture their full body. " +
    "Formatting Constraints: " +
    "- You MUST output 'SCORE: [number]/100' on the very first line of your response. " +
    "- Follow it immediately with two markdown sections using the exact headers '### ⚖️ Symmetry & Balance' and '### 📉 Form Corrections'. " +
    "- Within each of these sections, you MUST output two versions of the critique separated by a line containing '=== CONDENSED ==='. " +
    "  1. The first part (before '=== CONDENSED ===') is the ELABORATED version, containing detailed coaching feedback and analysis (around 3-4 descriptive sentences per bullet point). " +
    "  2. The second part (after '=== CONDENSED ===') is the CONDENSED version, containing very short and concise bullet points (strictly 1 short sentence maximum per bullet point, e.g. 'Knee alignment was stable but ankles showed slight asymmetry.') summarizing the findings. " +
    "- Within these sections, use standard bullet points. For emphasis, write the key take-away text in normal case or uppercase rather than using '**'. Summarize occurrences relative to the movement phase (e.g., 'primarily at deep flexion' or 'during initial extension'). " +
    "- You are forbidden from adding introductory or concluding conversational filler.";

  const getGeminiPrompt = (trackingHistory, sessionSummary) => {
    return `Assess the kinematics of this joint movement session based on the summary metrics and detailed time-series telemetry dataset below. Analyze joint ranges of motion (ROM), symmetry root-mean-squares (RMS), joint angular velocities, postural lean (torso tilt), and symmetry balance. Note: You must not use any '**' markers in your response, and you must include the '=== CONDENSED ===' separator within each section to divide elaborated and condensed text:

Session Kinematic Summary (Calculated Hyperparameters):
${JSON.stringify(sessionSummary, null, 2)}

Detailed Time-Series Telemetry:
\`\`\`json
${JSON.stringify(trackingHistory, null, 2)}
\`\`\``;
  };

  // Pre-fetch Gemini assessment in the background as soon as telemetry is compiled
  const handleBackgroundTelemetryReady = (trackingHistory) => {
    console.log(`[BioForm API] Background telemetry ready. Triggering prefetched Gemini request. Frames: ${trackingHistory.length}`);

    const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!keyToUse) return; // Will display warning on handleAnalysisComplete if missing

    setPrefetchedResult(null);
    setPrefetchedError(null);

    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const sessionSummary = calculateSessionSummary(trackingHistory);
    const prompt = getGeminiPrompt(trackingHistory, sessionSummary);

    prefetchPromiseRef.current = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.0
      }
    })
      .then(response => {
        if (!response || !response.text) {
          throw new Error('No assessment received from the Gemini AI service.');
        }
        setPrefetchedResult(response.text);
        return response.text;
      })
      .catch(err => {
        console.error("Background prefetch error:", err);
        const msg = err.message || 'An error occurred during background pre-fetching.';
        setPrefetchedError(msg);
        throw err;
      });
  };

  // Handler for analyzing tracking history
  const handleAnalysisComplete = async (trackingHistory, sourceMode, rawFile = null) => {
    console.log(`[BioForm API] Analysis complete. Source: ${sourceMode}, Frames captured: ${trackingHistory.length}`);
    setIsUploadedVideo(sourceMode === 'file');
    setError(null);
    setView('processing');

    // 1. Upload video file to community-media bucket if rawFile is present (either webcam or uploaded file)
    let uploadedMediaUrl = null;
    if (rawFile && activeUser) {
      try {
        setProcessingPhase('Uploading session video to vault...');
        const fileExt = rawFile.name.split('.').pop();
        const randomId = Math.random().toString(36).substring(2, 10);
        const uniqueFileName = `${activeUser.id}/vault-${Date.now()}-${randomId}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('community-media')
          .upload(uniqueFileName, rawFile);

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('community-media')
            .getPublicUrl(uniqueFileName);
          uploadedMediaUrl = urlData?.publicUrl;
        } else {
          console.error('[BioForm Supabase] Failed to upload vault video:', uploadErr);
        }
      } catch (err) {
        console.error('[BioForm Supabase] Vault upload error:', err);
      }
    }

    // If prefetch promise is running or completed for uploaded file
    if (sourceMode === 'file' && prefetchPromiseRef.current) {
      try {
        setProcessingPhase('Finalizing report...');
        const resultText = await prefetchPromiseRef.current;
        setAnalysisResult(resultText);
        setSavedTrackingData(trackingHistory);
        saveAiReviewToSupabase(resultText, uploadedMediaUrl);
        // Small delay for clean visual transition
        setTimeout(() => {
          setView('results');
        }, 800);
      } catch (err) {
        console.error("Prefetch resolution error:", err);
        let msg = err.message || 'An error occurred during analysis generation.';
        if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
          msg = 'Invalid Gemini API Key. Please click the settings icon in the top header to input a valid key.';
        } else if (msg.includes('quota') || msg.includes('429')) {
          msg = 'Gemini API free tier rate limit exceeded. Please wait a minute before starting another analysis.';
        }
        setError(msg);
        setView('capture');
      } finally {
        prefetchPromiseRef.current = null;
      }
      return;
    }

    const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!keyToUse) {
      setError('A Gemini API Key is required to run biomechanical judging. Please configure it in the settings panel above.');
      setView('capture');
      setShowKeyModal(true);
      return;
    }

    try {
      setProcessingPhase('Generating report...');
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const sessionSummary = calculateSessionSummary(trackingHistory);
      const prompt = getGeminiPrompt(trackingHistory, sessionSummary);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.0
        }
      });

      if (!response || !response.text) {
        throw new Error('No assessment received from the Gemini AI service. The response was empty.');
      }

      setAnalysisResult(response.text);
      setSavedTrackingData(trackingHistory);
      saveAiReviewToSupabase(response.text, uploadedMediaUrl);
      setView('results');
    } catch (err) {
      console.error('Gemini API Error:', err);
      // Give a detailed friendly error message
      let msg = err.message || 'An unexpected error occurred. Please verify your internet connection.';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        msg = 'Invalid Gemini API Key. Please click the settings icon in the top header to input a valid key.';
      } else if (msg.includes('quota') || msg.includes('429')) {
        msg = 'Gemini API free tier rate limit exceeded. Please wait a minute before starting another analysis.';
      }
      setError(msg);
      setView('capture');
    }
  };

  const handleReset = () => {
    setAnalysisResult('');
    setSavedTrackingData([]);
    setView('home');
    setError(null);
    setPrefetchedResult(null);
    setPrefetchedError(null);
    prefetchPromiseRef.current = null;
  };

  return (
    <>
      {isAuthLoading ? (
        <div style={{ minHeight: '100dvh', backgroundColor: '#111' }} />
      ) : !session ? (
        <LandingPage />
      ) : (
        <div style={{ backgroundColor: 'var(--aura-bg)', minHeight: '100dvh', color: 'var(--aura-body)' }} className="flex flex-col">

          {/* ── SCÉNIX HEADER ── */}
          <header style={{
            position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px 10px',
            background: 'linear-gradient(180deg, rgba(12,15,15,0.96), rgba(12,15,15,0.7))',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--aura-border-soft)',
          }}>
            <button className="icon-btn" onClick={() => setShowKeyModal(!showKeyModal)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu</span>
            </button>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 500,
              fontSize: '28px',
              letterSpacing: '0.04em',
              color: 'var(--aura-gold)',
              textShadow: '0 0 16px rgba(255,215,0,0.3)',
              margin: 0,
            }}>
              Scénix
            </h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="icon-btn" onClick={() => activeUser ? setActiveMainTab('dashboard') : setShowAuthModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{activeUser ? 'person_filled' : 'person'}</span>
              </button>
              {activeUser && (
                <button className="icon-btn" onClick={handleSignOut} title="Sign Out">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                </button>
              )}
            </div>
          </header>

          {/* ── API KEY DRAWER ── */}
          {showKeyModal && (
            <div style={{
              position: 'fixed', top: '57px', left: 0, width: '100%', zIndex: 40,
              background: 'var(--aura-card-2)',
              borderBottom: '1px solid var(--aura-border)',
              padding: '20px 18px',
              animation: 'auraFadeIn 0.2s ease',
            }}>
              <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p className="eyebrow" style={{ marginBottom: '4px' }}>Gemini API Key</p>
                    <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--aura-cream)', margin: 0 }}>
                      Stored locally. Required for AI analysis.
                    </p>
                  </div>
                  <button onClick={() => setShowKeyModal(false)} className="icon-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="aura-input"
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--aura-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--aura-border-soft)')}
                  />
                  <button onClick={() => setShowKeyModal(false)} className="btn-gold" style={{ width: 'auto', padding: '14px 20px', flexShrink: 0 }}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ERROR BANNER ── */}
          {error && (
            <div style={{
              position: 'fixed', top: '57px', left: 0, width: '100%', zIndex: 35,
              background: 'rgba(147,0,10,0.2)',
              borderBottom: '1px solid rgba(255,143,163,0.2)',
              padding: '10px 18px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--aura-rose)', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>error</span>
              <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#ffdad6', flex: 1, margin: 0, lineHeight: 1.5 }}>{error}</p>
              <button onClick={() => setError(null)} style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--aura-muted)', cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0 }}>
                Dismiss
              </button>
            </div>
          )}

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1" style={{ paddingTop: '57px', paddingBottom: '100px' }}>
            {activeMainTab === 'coach' && (
              <>
                {/* Evaluate / Metronome segmented toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 20px 0' }}>
                  <div className="seg" style={{ width: '100%', maxWidth: '300px' }}>
                    {[{ id: 'judge', label: 'Evaluate' }, { id: 'metronome', label: 'Metronome' }].map(({ id, label }) => (
                      <button key={id} onClick={() => setCurrentTab(id)} className={currentTab === id ? 'active' : ''}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {currentTab === 'judge' ? (
                  <>
                    {view === 'home' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
                        <div className="text-xl font-light text-white/50 tracking-widest uppercase">Studio Ready</div>
                        <button className="btn-gold px-8 py-4" onClick={() => setView('capture')}>
                          <Play size={16} className="inline mr-2" /> Start New Session
                        </button>
                      </div>
                    )}
                    {view === 'capture' && (
                      <PoseTracker
                        onAnalysisComplete={handleAnalysisComplete}
                        onBackgroundTelemetryReady={handleBackgroundTelemetryReady}
                      />
                    )}
                    {view === 'processing' && (
                      <div style={{
                        minHeight: 'calc(100dvh - 157px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '40px 24px', textAlign: 'center', position: 'relative',
                      }}>
                        {/* Minimalist sweeping loader arc */}
                        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 40, flexShrink: 0 }}>
                          <svg width="120" height="120" style={{ position: 'absolute', inset: 0, animation: 'auraSpin 1.5s linear infinite' }}>
                            <defs>
                              <linearGradient id="arcSweep" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="rgba(255,225,109,0)" />
                                <stop offset="100%" stopColor="#ffe16d" />
                              </linearGradient>
                            </defs>
                            <circle cx="60" cy="60" r="50" fill="none" stroke="url(#arcSweep)" strokeWidth="1.5"
                              strokeDasharray="150 314" strokeLinecap="round" />
                          </svg>
                          {/* Center analytics icon */}
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffe16d' }}>
                            <Activity size={24} strokeWidth={1.5} />
                          </div>
                        </div>

                        <div className="h-title" style={{ fontSize: 24, fontWeight: 300, marginBottom: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
                          Evaluation in Progress
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, height: 36, maxWidth: 290, marginBottom: 18, fontWeight: 500 }}>
                          <span className="shimmer-text">{processingPhase}</span>
                        </div>

                        {/* Scan line */}
                        <div style={{ width: 80, height: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', borderRadius: 2 }}>
                          <div style={{ position: 'absolute', inset: 0, width: '40%', background: '#ffe16d', animation: 'auraScan 1.4s linear infinite', borderRadius: 2 }} />
                        </div>

                        <div className="eyebrow-muted" style={{ marginTop: 24, fontSize: 9, opacity: 0.5 }}>Analyzing Biomechanics</div>
                      </div>
                    )}
                    {view === 'results' && (
                      <Dashboard
                        analysisText={analysisResult}
                        trackingData={savedTrackingData}
                        onReset={handleReset}
                        isUploadedVideo={isUploadedVideo}
                      />
                    )}
                  </>
                ) : (
                  <React.Suspense fallback={
                    <div style={{ minHeight: 'calc(100dvh - 157px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--aura-gold)', fontSize: '32px', animation: 'auraSpin 1s linear infinite' }}>sync</span>
                    </div>
                  }>
                    <Metronome />
                  </React.Suspense>
                )}
              </>
            )}
            {activeMainTab === 'feed' && (
              <CommunityFeed activeUser={activeUser} onShowProfileModal={() => setShowAuthModal(true)} />
            )}
            {activeMainTab === 'dashboard' && (
              <UserDashboard
                activeUser={activeUser}
                onShowProfileModal={() => setShowAuthModal(true)}
                onSwitchTab={(tab) => {
                  if (tab === 'coach') { setActiveMainTab('coach'); setCurrentTab('judge'); }
                  else setActiveMainTab(tab);
                }}
              />
            )}
          </main>

          {/* ── FLOATING PILL NAV ── */}
          <nav style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            display: 'flex',
            gap: '4px',
            padding: '6px',
            background: 'rgba(20, 20, 20, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '999px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8)',
          }}>
            {[
              { id: 'coach', icon: 'analytics', label: 'Evaluate' },
              { id: 'feed', icon: 'group', label: 'Community' },
              { id: 'dashboard', icon: 'person', label: 'Profile' },
            ].map(({ id, icon, label }) => {
              const active = activeMainTab === id;
              return (
                <button key={id}
                  onClick={() => {
                    if ((id === 'feed' || id === 'dashboard') && !activeUser) { setShowAuthModal(true); return; }
                    setActiveMainTab(id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '999px',
                    border: 0,
                    background: active ? '#2a2a2a' : 'transparent',
                    color: active ? '#ffe16d' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 500,
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                  <span style={{
                    maxWidth: active ? '100px' : 0,
                    opacity: active ? 1 : 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'max-width 0.3s ease, opacity 0.2s ease',
                    marginLeft: active ? '2px' : 0,
                  }}>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── AUTH MODAL ── */}
          {showAuthModal && (
            <AuthGate onClose={() => setShowAuthModal(false)} onAuthSuccess={(user) => setActiveUser(user)} />
          )}
        </div>
      )}
    </>
  );
}
