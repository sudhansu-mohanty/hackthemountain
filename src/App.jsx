import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, Play, RefreshCw, Cpu, Activity, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import PoseTracker from './components/PoseTracker';
import Dashboard from './components/Dashboard';
import { calculateSessionSummary } from './utils/biomechanics';
export default function App() {
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

  // Sync API Key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('bioform_gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('bioform_gemini_api_key');
    }
  }, [apiKey]);

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

  // Handler for analyzing tracking history
  const handleAnalysisComplete = async (trackingHistory, sourceMode) => {
    setIsUploadedVideo(sourceMode === 'file');
    setError(null);
    setView('processing');

    const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!keyToUse) {
      setError('A Gemini API Key is required to run biomechanical judging. Please configure it in the settings panel above.');
      setView('capture');
      setShowKeyModal(true);
      return;
    }

    try {
      // 1. Initialize the Google Gen AI SDK
      const ai = new GoogleGenAI({ apiKey: keyToUse });

      // 2. Formulate system instruction and user prompt
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

      // Calculate session kinematic summary metrics (hyperparameters)
      const sessionSummary = calculateSessionSummary(trackingHistory);

      const prompt = `Assess the kinematics of this joint movement session based on the summary metrics and detailed time-series telemetry dataset below. Analyze joint ranges of motion (ROM), symmetry root-mean-squares (RMS), joint angular velocities, postural lean (torso tilt), and symmetry balance. Note: You must not use any '**' markers in your response, and you must include the '=== CONDENSED ===' separator within each section to divide elaborated and condensed text:

Session Kinematic Summary (Calculated Hyperparameters):
${JSON.stringify(sessionSummary, null, 2)}

Detailed Time-Series Telemetry:
\`\`\`json
${JSON.stringify(trackingHistory, null, 2)}
\`\`\``;

      // 3. Asynchronously fetch the LLM critique
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
    setError(null);
    setView('capture');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/30">
              <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="font-orbitron font-extrabold text-xl tracking-wider text-slate-100">
                BIOFORM <span className="text-cyan-400 glow-cyan">AI</span>
              </span>
              <span className="text-[10px] block font-orbitron text-slate-500 tracking-widest uppercase">
                Biomechanical Judge
              </span>
            </div>
          </div>

          {/* Navigation / Configuration Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* View indicators */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 p-1 rounded-lg text-xs font-orbitron mr-2">
              <span className={`px-2.5 py-1 rounded-md transition-all ${view === 'capture' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 border border-transparent'}`}>CAPTURE</span>
              <span className="text-slate-700">➔</span>
              <span className={`px-2.5 py-1 rounded-md transition-all ${view === 'processing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 border border-transparent'}`}>PROCESSING</span>
              <span className="text-slate-700">➔</span>
              <span className={`px-2.5 py-1 rounded-md transition-all ${view === 'results' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 border border-transparent'}`}>RESULTS</span>
            </div>

            {/* API Key Configure Button */}
            <button
              onClick={() => setShowKeyModal(!showKeyModal)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-orbitron font-bold text-xs tracking-wider transition-all duration-300 ${
                apiKey 
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                  : 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 animate-pulse'
              }`}
            >
              <Key className="h-4 w-4 shrink-0" />
              {apiKey ? 'GEMINI API KEY ACTIVE' : 'SET GEMINI API KEY'}
            </button>
          </div>
        </div>
      </header>

      {/* API KEY DRAWER / CONFIG PANEL */}
      {showKeyModal && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-5 shadow-2xl transition-all duration-300">
          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-orbitron font-bold text-sm text-slate-200 uppercase tracking-wider">
                  Gemini API Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  BioForm AI uses the Google Gemini 2.5 Flash model to audit your athletic movement. Provide your personal API key (stored locally inside your browser cache).
                </p>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (AIzaSy...)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
              />
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold font-orbitron text-xs tracking-wider transition-colors"
              >
                SAVE KEY
              </button>
            </div>

            <div className="flex gap-2 items-start bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-normal">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                Don't have a key? You can generate a free-tier key in less than a minute at the{' '}
                <a 
                  href="https://aistudio.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Google AI Studio Developer Console
                </a>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-rose-400 font-orbitron uppercase tracking-wider">PIPELINE EXECUTION EXCEPTION</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-slate-500 hover:text-slate-300 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center">
        {view === 'capture' && (
          <PoseTracker onAnalysisComplete={handleAnalysisComplete} />
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto gap-6">
            {/* Spinning Neon Rings */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-emerald-500/20 border-b-emerald-400 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
              <Cpu className="h-8 w-8 text-cyan-400 animate-pulse" />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-orbitron font-extrabold text-lg text-slate-100 tracking-wider">
                JUDGING IN PROGRESS
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed h-12">
                {processingPhase}
              </p>
            </div>

            {/* Glowing progress line */}
            <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 w-1/3 rounded-full animate-[loading_2s_infinite_ease-in-out]" />
            </div>
            
            <p className="text-[10px] text-slate-500 font-orbitron tracking-widest uppercase">
              Average latency: ~3.5 seconds
            </p>
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
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500 font-orbitron tracking-wider">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>BIOFORM AI © 2026 // ALL SYSTEM CRITIQUES LOCALLY AUDITED</span>
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
            BLAZEPOSE CNN ENGINE ACTIVE (WEBGL ENGINE)
          </span>
        </div>
      </footer>

      {/* Inject custom loading keyframe animation */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-150%); width: 30%; }
          50% { width: 50%; }
          100% { transform: translateX(250%); width: 30%; }
        }
      `}</style>
    </div>
  );
}
