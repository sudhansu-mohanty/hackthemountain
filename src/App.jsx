import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import PoseTracker from './components/PoseTracker';
import Dashboard from './components/Dashboard';
import Community from './components/Community';
import Profile from './components/Profile';

export default function App() {
  const [tab, setTab] = useState('judge'); // 'judge' | 'community' | 'profile'
  const [view, setView] = useState('home'); // 'home' | 'capture' | 'processing' | 'results'
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aura_gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [error, setError] = useState(null);
  const [processingPhase, setProcessingPhase] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [savedTrackingData, setSavedTrackingData] = useState([]);

  useEffect(() => {
    if (apiKey) localStorage.setItem('aura_gemini_api_key', apiKey);
    else localStorage.removeItem('aura_gemini_api_key');
  }, [apiKey]);

  useEffect(() => {
    if (view !== 'processing') return;
    const phases = [
      'Extracting physical coordinates from BlazePose CNN...',
      'Normalizing skeleton coordinate matrices...',
      'Calculating dynamic joint flexion vectors...',
      'Bundling time-series kinematics payload...',
      'Broadcasting JSON telemetry to Gemini-2.5-Flash...',
      'Auditing athletic benchmarks and symmetry angles...',
      'Generating performance critique...',
    ];
    let idx = 0;
    setProcessingPhase(phases[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setProcessingPhase(phases[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [view]);

  const handleAnalysisComplete = async (trackingHistory) => {
    setError(null);
    setView('processing');
    const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!keyToUse) {
      setError('A Gemini API Key is required. Tap the menu icon to configure it.');
      setView('home');
      setShowKeyModal(true);
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const systemInstruction =
        "You are an AI Sports Scientist and Biomechanics Judge. Your sole purpose is to ingest time-series JSON descriptions of joint movements and output a strict performance audit. You must judge three pillars: 1. Accuracy (reaching athletic benchmarks), 2. Symmetry (flagging absolute deltas greater than 10 degrees), 3. Ratios and Timing. Your output formatting is strictly constrained: You must output 'SCORE: [number]/100' on the very first line of your response. Follow it immediately with two markdown sections using the exact headers '### ⚖️ Symmetry & Balance' and '### 📉 Form Corrections'. You are forbidden from adding introductory or concluding conversational filler.";
      const prompt = `Assess the kinematics of this joint movement session based on the telemetry dataset below. Flag any asymmetry over 10 degrees, compare joint angles with athletic benchmarks (knees and elbows), and rate timing ratios:\n\n\`\`\`json\n${JSON.stringify(trackingHistory, null, 2)}\n\`\`\``;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction, temperature: 0.1 },
      });
      if (!response || !response.text) throw new Error('No assessment received from Gemini.');
      setAnalysisResult(response.text);
      setSavedTrackingData(trackingHistory);
      setView('results');
    } catch (err) {
      let msg = err.message || 'An unexpected error occurred.';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid'))
        msg = 'Invalid Gemini API Key. Tap the menu icon to update it.';
      else if (msg.includes('quota') || msg.includes('429'))
        msg = 'Gemini API rate limit exceeded. Please wait a moment and try again.';
      setError(msg);
      setView('home');
    }
  };

  const handleReset = () => {
    setAnalysisResult('');
    setSavedTrackingData([]);
    setError(null);
    setView('home');
  };

  return (
    <div style={{ backgroundColor: '#121414', minHeight: '100dvh', color: '#e2e2e2' }} className="flex flex-col">

      {/* HEADER */}
      <header
        style={{ backgroundColor: 'rgba(18,20,20,0.9)', borderBottom: '1px solid #4d4732', zIndex: 50 }}
        className="fixed top-0 left-0 w-full backdrop-blur-md flex justify-between items-center px-5 py-4"
      >
        <button
          onClick={() => setShowKeyModal(!showKeyModal)}
          style={{ color: '#e2e2e2' }}
          className="hover:opacity-70 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="font-sora text-2xl tracking-[0.2em] font-bold" style={{ color: '#ffe16d' }}>
          AURA
        </h1>
        <button style={{ color: '#e2e2e2' }} className="hover:opacity-70 transition-opacity active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* API KEY DRAWER */}
      {showKeyModal && (
        <div
          style={{ backgroundColor: '#1a1c1c', borderBottom: '1px solid #4d4732', top: '64px', zIndex: 40 }}
          className="fixed left-0 w-full px-5 py-5"
        >
          <div className="max-w-md mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-sora font-bold text-sm tracking-widest uppercase" style={{ color: '#ffe16d' }}>
                  Gemini API Key
                </p>
                <p className="font-hanken text-xs mt-1" style={{ color: '#d0c6ab' }}>
                  Stored locally in your browser. Required for AI analysis.
                </p>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-xs font-semibold hover:opacity-70" style={{ color: '#c9c6c5' }}>
                Close
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (AIzaSy...)"
                className="flex-1 px-4 py-3 text-sm font-mono focus:outline-none"
                style={{ backgroundColor: '#0c0f0f', border: '1px solid #4d4732', color: '#e2e2e2', borderRadius: '2px' }}
                onFocus={(e) => (e.target.style.borderColor = '#ffe16d')}
                onBlur={(e) => (e.target.style.borderColor = '#4d4732')}
              />
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-5 py-3 text-xs font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#ffe16d', color: '#221b00', borderRadius: '2px' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div
          style={{ backgroundColor: 'rgba(147,0,10,0.2)', borderBottom: '1px solid rgba(255,180,171,0.2)', marginTop: '64px', zIndex: 30 }}
          className="relative px-5 py-3 flex items-start gap-3"
        >
          <span className="material-symbols-outlined text-sm" style={{ color: '#ffb4ab' }}>error</span>
          <p className="text-xs flex-1 font-hanken leading-relaxed" style={{ color: '#ffdad6' }}>{error}</p>
          <button onClick={() => setError(null)} className="text-xs hover:opacity-70 shrink-0" style={{ color: '#c9c6c5' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1" style={{ paddingTop: '64px', paddingBottom: '72px' }}>
        {tab === 'judge' && (
          <>
            {(view === 'home' || view === 'capture') && (
              <PoseTracker
                onAnalysisComplete={handleAnalysisComplete}
                showLanding={view === 'home'}
                onStartCapture={() => setView('capture')}
              />
            )}

            {view === 'processing' && (
              <div className="flex flex-col items-center justify-center text-center px-8" style={{ minHeight: 'calc(100dvh - 136px)' }}>
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'transparent', borderTopColor: '#ffe16d', animation: 'spin 1s linear infinite' }} />
                  <div className="absolute inset-2 rounded-full border-2" style={{ borderColor: 'transparent', borderBottomColor: '#e9c400', animation: 'spin 1.5s linear infinite reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ color: '#ffe16d', fontSize: '28px' }}>analytics</span>
                  </div>
                </div>
                <h2 className="font-sora font-bold text-xl tracking-widest uppercase mb-3" style={{ color: '#e2e2e2' }}>
                  Judging in Progress
                </h2>
                <p className="font-hanken text-sm h-10" style={{ color: '#d0c6ab' }}>{processingPhase}</p>
                <div className="mt-6 w-56 overflow-hidden" style={{ height: '1px', backgroundColor: '#1e2020' }}>
                  <div className="h-full shimmer" style={{ background: 'linear-gradient(90deg, transparent, #ffe16d, transparent)', width: '60%' }} />
                </div>
                <p className="mt-4 text-xs tracking-widest uppercase font-hanken" style={{ color: '#4d4732' }}>Avg. latency ~3.5s</p>
              </div>
            )}

            {view === 'results' && (
              <Dashboard analysisText={analysisResult} trackingData={savedTrackingData} onReset={handleReset} />
            )}
          </>
        )}
        {tab === 'community' && <Community />}
        {tab === 'profile' && <Profile />}
      </main>

      {/* BOTTOM NAV */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center"
        style={{
          backgroundColor: 'rgba(12,15,15,0.92)',
          borderTop: '1px solid #4d4732',
          backdropFilter: 'blur(12px)',
          paddingTop: '12px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={() => setTab('judge')}
          className="flex flex-col items-center gap-1 transition-all active:scale-110 px-6 py-1"
          style={{ color: tab === 'judge' ? '#ffe16d' : '#c9c6c5' }}
        >
          <span className="material-symbols-outlined" style={tab === 'judge' ? { fontVariationSettings: "'FILL' 1" } : {}}>analytics</span>
          {tab === 'judge' && <span className="font-hanken text-[10px] tracking-widest uppercase" style={{ color: '#ffe16d' }}>Judge</span>}
        </button>

        <button
          onClick={() => setTab('community')}
          className="flex flex-col items-center gap-1 transition-all active:scale-110 px-6 py-1"
          style={{
            color: tab === 'community' ? '#ffe16d' : '#c9c6c5',
            borderTop: tab === 'community' ? '2px solid #ffe16d' : '2px solid transparent',
            marginTop: '-2px',
            paddingTop: '10px',
          }}
        >
          <span className="material-symbols-outlined" style={tab === 'community' ? { fontVariationSettings: "'FILL' 1" } : {}}>group</span>
          {tab === 'community' && <span className="font-hanken text-[10px] tracking-widest uppercase" style={{ color: '#ffe16d' }}>Community</span>}
        </button>

        <button
          onClick={() => setTab('profile')}
          className="flex flex-col items-center gap-1 transition-all active:scale-110 px-6 py-1"
          style={{ color: tab === 'profile' ? '#ffe16d' : '#c9c6c5' }}
        >
          <span className="material-symbols-outlined" style={tab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          {tab === 'profile' && <span className="font-hanken text-[10px] tracking-widest uppercase" style={{ color: '#ffe16d' }}>Profile</span>}
        </button>
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .font-sora { font-family: 'Sora', sans-serif; }
        .font-hanken { font-family: 'Hanken Grotesk', sans-serif; }
      `}</style>
    </div>
  );
}
