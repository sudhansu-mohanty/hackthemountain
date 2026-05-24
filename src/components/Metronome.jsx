import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, Plus, Minus, Zap, Activity, Clock, RefreshCw } from 'lucide-react';
import VocalJudge from './VocalJudge';

export default function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [mode, setMode] = useState('bpm'); // 'bpm' | 'timeSig'
  const [feedbackMode, setFeedbackMode] = useState('audio'); // 'audio' | 'haptic' | 'both'
  const [isVibrationSupported, setIsVibrationSupported] = useState(false);
  const [vibeCount, setVibeCount] = useState(0);
  const [isAccentVibe, setIsAccentVibe] = useState(false);
  
  // Time signature state
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Audio Context and Scheduling Refs
  const audioContextRef = useRef(null);
  const isPlayingRef = useRef(false);
  const bpmRef = useRef(120);
  const modeRef = useRef('bpm');
  const beatsPerMeasureRef = useRef(4);
  const volumeRef = useRef(0.8);
  const isMutedRef = useRef(false);
  const feedbackModeRef = useRef('audio');
  
  // Store previous states for Vocal Judge
  const previousFeedbackModeRef = useRef('audio');
  const previousIsMutedRef = useRef(false);

  const nextNoteTimeRef = useRef(0.0);
  const currentBeatInMeasureRef = useRef(0);
  const timerIdRef = useRef(null);
  const notesInQueueRef = useRef([]); // { note: number, time: number }
  const animationFrameIdRef = useRef(null);
  const pendulumRef = useRef(null);

  // Detect vibration API compatibility
  useEffect(() => {
    setIsVibrationSupported(!!navigator.vibrate);
  }, []);

  // Keep refs in sync with state for access in scheduler callback
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { feedbackModeRef.current = feedbackMode; }, [feedbackMode]);

  // Tap Tempo state
  const [tapTimes, setTapTimes] = useState([]);

  // Sports Cadence Presets
  const presets = [
    { name: 'Adagio', bpm: 60, desc: 'Slow, expressive cadence' },
    { name: 'Andante', bpm: 76, desc: 'Walking pace flow' },
    { name: 'Moderato', bpm: 108, desc: 'Balanced mid-tempo' },
    { name: 'Allegro', bpm: 140, desc: 'Lively execution' },
    { name: 'Presto', bpm: 180, desc: 'High-intensity' },
  ];

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stopMetronomeEngine();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const startMetronomeEngine = () => {
    initAudioContext();
    
    // Reset scheduling variables
    nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
    currentBeatInMeasureRef.current = 0;
    notesInQueueRef.current = [];
    
    setIsPlaying(true);

    const lookahead = 25.0; // How frequently to call scheduling function (in ms)
    const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in s)

    const nextNote = () => {
      // Seconds per beat
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      // Advance the beat count
      currentBeatInMeasureRef.current = (currentBeatInMeasureRef.current + 1) % beatsPerMeasureRef.current;
    };

    const scheduleNote = (beatNumber, time) => {
      // Skip audio click synthesis entirely if we are in haptic-only mode or muted
      if (feedbackModeRef.current === 'haptic' || isMutedRef.current) return;

      const osc = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Determine pitch accent: Downbeat (1st beat of measure) gets a distinct higher frequency click
      // In BPM mode we can keep all clicks standard, in Time Sig mode accent the 0th beat
      const isAccent = modeRef.current === 'timeSig' && beatNumber === 0;
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1000 : 500, time);

      // Smooth click envelope synthesis to avoid speaker popping
      gainNode.gain.setValueAtTime(volumeRef.current, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.start(time);
      osc.stop(time + 0.06);
    };

    const scheduler = () => {
      while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
        scheduleNote(currentBeatInMeasureRef.current, nextNoteTimeRef.current);
        notesInQueueRef.current.push({
          note: currentBeatInMeasureRef.current,
          time: nextNoteTimeRef.current
        });
        nextNote();
      }
    };

    // precise requestAnimationFrame sync loop for matching audio time to visuals and haptics
    const draw = () => {
      if (!isPlayingRef.current) return;

      const currentTime = audioContextRef.current.currentTime;
      let activeBeatVal = activeBeat;

      while (notesInQueueRef.current.length > 0 && notesInQueueRef.current[0].time < currentTime) {
        const playedNote = notesInQueueRef.current.shift();
        activeBeatVal = playedNote.note;

        const isAccent = modeRef.current === 'timeSig' && playedNote.note === 0;

        // Synchronously trigger physical haptics exactly when the beat triggers!
        if ((feedbackModeRef.current === 'haptic' || feedbackModeRef.current === 'both') && navigator.vibrate) {
          // Accent / downbeat (beat 0) vibrates longer (120ms vs 40ms)
          navigator.vibrate(isAccent ? 120 : 40);
        }

        // Trigger visual haptics simulation! (Only if feedbackMode is haptic or both)
        if (feedbackModeRef.current === 'haptic' || feedbackModeRef.current === 'both') {
          setVibeCount((prev) => prev + 1);
          setIsAccentVibe(isAccent);
        }
      }

      if (activeBeatVal !== activeBeat) {
        setActiveBeat(activeBeatVal);
      }

      // Smooth Kinetic Sweep Animation via direct SVG attribute mutation
      if (pendulumRef.current && audioContextRef.current) {
        if (feedbackModeRef.current === 'haptic') {
          // Freeze the pendulum in pure haptic mode
          pendulumRef.current.setAttribute('transform', `translate(100, 90) rotate(0)`);
        } else {
          const hz = bpmRef.current / 60;
          // Swing range of 60 degrees (-60 to +60)
          const angle = Math.cos(audioContextRef.current.currentTime * Math.PI * hz) * 60;
          pendulumRef.current.setAttribute('transform', `translate(100, 90) rotate(${angle})`);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    timerIdRef.current = setInterval(scheduler, lookahead);
    animationFrameIdRef.current = requestAnimationFrame(draw);
  };

  const stopMetronomeEngine = () => {
    setIsPlaying(false);
    setActiveBeat(-1);
    setVibeCount(0);
    setIsAccentVibe(false);
    
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  };

  const handleTogglePlay = () => {
    // PRIME THE HAPTIC ENGINE ON ANDROID:
    // Android Chrome will aggressively block vibrations that happen inside background loops (requestAnimationFrame)
    // unless the vibration was explicitly authorized by a direct user click event first!
    // Firing a tiny 1ms vibration here "primes" the browser's permission for the background scheduler!
    if (navigator.vibrate) {
      navigator.vibrate(1);
    }

    if (isPlaying) {
      stopMetronomeEngine();
    } else {
      startMetronomeEngine();
    }
  };

  // Adjust BPM limits safely
  const adjustBpm = (delta) => {
    setBpm((prev) => Math.max(30, Math.min(300, prev + delta)));
  };

  // Tap Tempo engine
  const handleTapTempo = () => {
    const now = performance.now();
    const newTapTimes = [...tapTimes, now].filter(t => now - t < 2500); // 2.5s expiry
    
    setTapTimes(newTapTimes);

    if (newTapTimes.length > 1) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      setBpm(Math.max(30, Math.min(300, calculatedBpm)));
    }
  };

  // Vocal Judge Handlers
  const handleStartJudge = () => {
    previousFeedbackModeRef.current = feedbackModeRef.current;
    previousIsMutedRef.current = isMutedRef.current;

    setIsMuted(true);
    setFeedbackMode('haptic'); // Switch to haptic to prevent microphone feedback
    
    // If it's not playing, start it. If it is playing, let it continue uninterrupted!
    if (!isPlaying) {
      startMetronomeEngine();
    }
  };

  const handleStopJudge = () => {
    setIsMuted(previousIsMutedRef.current);
    setFeedbackMode(previousFeedbackModeRef.current);
    // Don't auto-stop the metronome either, let the user decide when to stop the session
  };

  return (
    <div className="max-w-md mx-auto w-full px-6 py-4 flex flex-col gap-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-[10px] font-medium tracking-[0.2em] text-[#ffe16d] uppercase">
          Fluid Monitoring System
        </div>
        <h1 className="text-3xl font-light tracking-wide text-white/90">
          Rhythm Telemetry
        </h1>
      </div>

      {/* MODE TOGGLE (Floating Pills) */}
      <div className="flex bg-[#2a2a2a]/40 rounded-full p-1.5 w-full mx-auto max-w-[260px]">
        <button 
          className={`flex-1 py-3 rounded-full text-xs font-medium tracking-widest transition-all duration-300 ${mode === 'bpm' ? 'bg-[#111] text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
          onClick={() => setMode('bpm')}
        >
          TEMPO
        </button>
        <button 
          className={`flex-1 py-3 rounded-full text-xs font-medium tracking-widest transition-all duration-300 ${mode === 'timeSig' ? 'bg-[#111] text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
          onClick={() => setMode('timeSig')}
        >
          METER
        </button>
      </div>

      {/* CENTRAL TELEMETRY HUB */}
      {mode === 'bpm' ? (
        <div className="flex flex-col items-center w-full relative">
          
          <div className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-4">
            Total Cadence
          </div>
          
          <div className="relative w-full aspect-[2/1] flex justify-center overflow-visible mb-8 max-w-[280px]">
            {/* The Massive Minimalist Gauge */}
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="pendGrad" x1="0" y1="-80" x2="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffe16d" />
                  <stop offset="100%" stopColor="rgba(255,225,109,0.0)" />
                </linearGradient>
                <radialGradient id="centerAura">
                  <stop offset="0%" stopColor="rgba(255,225,109,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,225,109,0)" />
                </radialGradient>
              </defs>
              
              {/* Background Aura */}
              <circle cx="100" cy="90" r="50" fill="url(#centerAura)" />

              {/* Background Arc */}
              <path d="M 10 90 A 80 80 0 0 1 190 90" fill="none" stroke="#2a2a2a" strokeWidth="2" strokeDasharray="4 8" />
              
              <g ref={pendulumRef} transform="translate(100, 90) rotate(0)">
                <line x1="0" y1="0" x2="0" y2="-80" stroke="url(#pendGrad)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="0" cy="-80" r="4" fill="#ffe16d" />
              </g>

              {/* Pivot Base */}
              <circle cx="100" cy="90" r="5" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
            </svg>
            
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-2">
              <div className="text-[100px] font-light leading-none tracking-tighter text-white/90">
                {bpm}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 w-full max-w-[280px] mb-6">
            <button 
              onClick={() => adjustBpm(-5)} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white/90 transition-colors shrink-0"
            >
              <Minus size={20} strokeWidth={1.5} />
            </button>
            <input 
              type="range" 
              min="30" max="300" 
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-0.5 rounded-full appearance-none bg-[#444] outline-none"
              style={{ accentColor: '#ffe16d' }}
              disabled={isPlaying}
            />
            <button 
              onClick={() => adjustBpm(5)} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white/90 transition-colors shrink-0"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex gap-4 w-full justify-center mb-4">
            <button className="px-6 py-3 rounded-full bg-transparent text-[10px] font-medium tracking-widest text-white/50 hover:text-white/90 transition-colors" onClick={() => adjustBpm(-1)}>MINUS</button>
            <button className="px-8 py-3 rounded-full bg-[#111] border border-[#2a2a2a] text-[10px] font-medium tracking-widest text-white/90 hover:bg-[#1a1a1a] transition-all" onClick={handleTapTempo}>TAP</button>
            <button className="px-6 py-3 rounded-full bg-transparent text-[10px] font-medium tracking-widest text-white/50 hover:text-white/90 transition-colors" onClick={() => adjustBpm(1)}>PLUS</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-4">
            Subdivision Meter
          </div>
          <div className="grid grid-cols-4 gap-3 w-full max-w-[280px] mb-6">
            {[{ beats: 4, label: '4/4' }, { beats: 3, label: '3/4' }, { beats: 6, label: '6/8' }, { beats: 5, label: '5/4' }].map((sig) => (
              <button 
                key={sig.beats}
                onClick={() => { setBeatsPerMeasure(sig.beats); setActiveBeat(-1); }}
                className={`py-4 rounded-3xl font-light text-sm transition-all duration-300 ${
                  beatsPerMeasure === sig.beats 
                    ? 'bg-[#111] text-white border border-[#2a2a2a]' 
                    : 'bg-transparent text-white/50 hover:text-white/80'
                }`}
              >
                {sig.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 w-full max-w-[280px] mb-4">
            {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
              const isFirst = idx === 0;
              const isActive = activeBeat === idx;
              return (
                <div 
                  key={idx} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-light text-xs transition-all duration-300 ${
                    isActive 
                      ? (isFirst ? 'bg-[#8de890] text-black scale-110' : 'bg-[#ffe16d] text-black scale-110')
                      : 'bg-[#222] text-white/30'
                  }`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PLAYBACK CONTROL */}
      <button 
        onClick={handleTogglePlay}
        className={`w-full max-w-[280px] mx-auto py-4 rounded-full text-xs font-medium tracking-widest transition-all flex items-center justify-center gap-3 ${
          isPlaying ? 'bg-[#ff6b6b]/20 text-[#ff6b6b] hover:bg-[#ff6b6b]/30' : 'bg-[#333333] text-[#ffe16d] hover:bg-[#404040]'
        }`}
        style={{
          boxShadow: isPlaying ? '0 0 30px rgba(255,107,107,0.2)' : '0 0 30px rgba(255,225,109,0.2)',
          border: isPlaying ? '1px solid rgba(255,107,107,0.2)' : '1px solid rgba(255,225,109,0.15)'
        }}
      >
        {isPlaying ? (
          <><Square size={14} /> HALT CYCLE</>
        ) : (
          <><Play size={14} /> INITIATE PULSE</>
        )}
      </button>

      {/* FEEDBACK SYSTEM PANEL */}
      <div className="w-full flex flex-col items-center mt-4">
        <div className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-4">
          Output Routing
        </div>
        
        <div className="flex bg-[#2a2a2a]/40 rounded-full p-1 w-full max-w-[280px]">
          <button className={`flex-1 py-2.5 rounded-full text-[10px] font-medium tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${feedbackMode === 'audio' ? 'bg-[#111] text-white' : 'text-white/40 hover:text-white/60'}`} onClick={() => setFeedbackMode('audio')}>
            <Volume2 size={12} /> AUDIO
          </button>
          <button className={`flex-1 py-2.5 rounded-full text-[10px] font-medium tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${feedbackMode === 'haptic' ? 'bg-[#111] text-white' : 'text-white/40 hover:text-white/60'}`} onClick={() => setFeedbackMode('haptic')}>
            <Activity size={12} /> HAPTIC
          </button>
          <button className={`flex-1 py-2.5 rounded-full text-[10px] font-medium tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${feedbackMode === 'both' ? 'bg-[#111] text-white' : 'text-white/40 hover:text-white/60'}`} onClick={() => setFeedbackMode('both')}>
            <Zap size={12} /> DUAL
          </button>
        </div>
      </div>

      {/* VIRTUAL HAPTIC SIMULATOR (Fallback for Desktop) */}
      {!isVibrationSupported && (
        <div className="w-full flex flex-col items-center mt-2">
          <div className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-4">
            Virtual Haptics
          </div>
          
          <div className="flex flex-col items-center justify-center py-4 w-full max-w-[280px] relative">
            {/* Expanding Shockwaves */}
            {isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') && vibeCount > 0 && (
              <div 
                key={`wave-${vibeCount}`} 
                className={`absolute w-32 h-32 rounded-full border pointer-events-none ${
                  isAccentVibe ? 'border-[#8de890]/20 animate-ping' : 'border-[#ffe16d]/20 animate-ping'
                }`}
              />
            )}

            {/* Stylized Holographic Phone */}
            <div 
              key={`vibe-${vibeCount}`}
              className={`relative w-14 h-24 rounded-3xl flex flex-col items-center justify-between p-2.5 transition-all duration-75 select-none ${
                isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') && vibeCount > 0
                  ? (isAccentVibe ? 'bg-[#8de890]/10 border border-[#8de890]/20' : 'bg-[#ffe16d]/10 border border-[#ffe16d]/20')
                  : 'bg-[#1a1a1a] border border-[#2a2a2a]'
              }`}
            >
              <div className="w-4 h-0.5 bg-[#333] rounded-full mt-1" />
              <div className="flex flex-col items-center gap-1">
                <Zap className={`h-4 w-4 transition-all ${
                  isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') && vibeCount > 0
                    ? (isAccentVibe ? 'text-[#8de890] scale-110' : 'text-[#ffe16d]')
                    : 'text-[#444]'
                }`} strokeWidth={1.5} />
              </div>
              <div className="w-6 h-0.5 bg-[#333] rounded-full mb-1" />
            </div>

            {/* Status HUD */}
            <div className="text-[9px] font-medium tracking-widest text-center mt-4 uppercase">
              {isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') ? (
                vibeCount > 0 ? (
                  isAccentVibe ? (
                    <span className="text-[#8de890]">Downbeat (120ms)</span>
                  ) : (
                    <span className="text-[#ffe16d]">Standard (40ms)</span>
                  )
                ) : (
                  <span className="text-white/40">Awaiting...</span>
                )
              ) : (
                <span className="text-white/20">Motor Offline</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VOCAL RHYTHM JUDGE */}
      <div className="w-full mt-4">
        <VocalJudge bpm={bpm} isPlaying={isPlaying} onStartJudge={handleStartJudge} onStopJudge={handleStopJudge} />
      </div>

    </div>
  );
}
