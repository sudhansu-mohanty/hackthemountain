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
    { name: '🏋️‍♂️ Squat Tempo', bpm: 60, desc: '1s concentric, 1s eccentric' },
    { name: '🚴‍♂️ Cycle Spin', bpm: 90, desc: 'Optimal RPM standard' },
    { name: '🚶‍♂️ Power Walk', bpm: 120, desc: 'Brisk cardio rhythm' },
    { name: '🏃‍♂️ Run Cadence', bpm: 180, desc: 'Elite biomechanical stride' },
    { name: '⚡ High Pacing', bpm: 200, desc: 'Explosive high-intensity intervals' },
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

  // Calculate pendulum angle: visual sweep
  // Sweeps between -35deg and 35deg based on selected BPM and current playback state
  const getPendulumStyle = () => {
    if (!isPlaying) return { transform: 'rotate(0deg)' };
    
    // Smooth back-and-forth oscillation using cosine matching the exact frequency of BPM
    const hz = bpm / 60;
    const timeInSeconds = audioContextRef.current ? audioContextRef.current.currentTime : 0;
    const angle = Math.cos(timeInSeconds * Math.PI * hz) * 35;
    
    return {
      transform: `rotate(${angle}deg)`,
      transition: 'transform 0.05s linear' // small buffer transition for liquid motion
    };
  };

  // Vocal Judge Handlers
  const handleStartJudge = () => {
    previousFeedbackModeRef.current = feedbackModeRef.current;
    previousIsMutedRef.current = isMutedRef.current;

    setIsMuted(true);
    setFeedbackMode('haptic'); // Switch to haptic to prevent microphone feedback
    
    // Force a complete restart of the metronome to perfectly align its phase 
    // (t=0) with the exact moment the Vocal Judge starts recording.
    if (isPlaying) {
      stopMetronomeEngine();
    }
    setTimeout(() => startMetronomeEngine(), 50);
  };

  const handleStopJudge = () => {
    setIsMuted(previousIsMutedRef.current);
    setFeedbackMode(previousFeedbackModeRef.current);
    if (isPlaying) {
      stopMetronomeEngine();
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-orbitron font-semibold tracking-widest text-cyan-400 uppercase mb-1">
            Athletic Rhythm Companion
          </div>
          <h1 className="text-3xl font-orbitron font-black text-slate-100 tracking-tight glow-cyan">
            BIOMECHANICAL METRONOME
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 p-1.5 rounded-xl text-xs font-orbitron">
          <Clock className="h-4 w-4 text-cyan-400 ml-1.5" />
          <span className="text-slate-400 mr-2 uppercase">Engine Precision:</span>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
            Web Audio (Sub-ms)
          </span>
        </div>
      </div>

      {/* CORE INTERFACE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT PANEL: The Metronome Visualization Deck (Columns 1-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glassmorphism-glow rounded-2xl border border-cyan-500/20 p-8 flex flex-col items-center relative overflow-hidden group shadow-2xl">
            {/* Visual gradient highlights */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />

            {/* PENDULUM VISUALIZER */}
            <div className="relative w-full h-48 flex items-end justify-center border-b border-slate-900/80 pb-6 mb-8 overflow-hidden">
              {/* Back Arc Range Grid */}
              <div className="absolute bottom-6 w-72 h-36 border-t-2 border-dashed border-slate-800/85 rounded-t-full flex justify-between px-3 text-[10px] font-orbitron text-slate-600">
                <span className="mt-2">-35°</span>
                <span className="absolute left-1/2 -translate-x-1/2 mt-1">0°</span>
                <span className="mt-2">+35°</span>
              </div>

              {/* Pendulum Anchor Center Dot */}
              <div className="absolute bottom-5 w-4 h-4 bg-slate-900 border-2 border-cyan-500 rounded-full z-20 shadow-[0_0_10px_rgba(6,182,212,0.4)]" />

              {/* Swinging Needle Rod */}
              <div 
                style={getPendulumStyle()} 
                className="absolute bottom-6 origin-bottom w-1 h-32 bg-gradient-to-t from-cyan-500 via-cyan-400 to-emerald-400 z-10 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]"
              >
                {/* Weight mass on the end of the needle */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-6 bg-slate-900 border border-cyan-400/80 rounded-md flex items-center justify-center shadow-lg">
                  <div className="w-1.5 h-3 bg-cyan-400/50 rounded-sm" />
                </div>
              </div>

              {/* Pulse Ambient Glow Ring */}
              {isPlaying && (
                <div 
                  key={activeBeat} 
                  className="absolute bottom-5 w-6 h-6 bg-cyan-400/10 border border-cyan-500/30 rounded-full animate-ping z-0" 
                />
              )}
            </div>

            {/* -------------------- TOGGLE SWITCH IN THE MIDDLE -------------------- */}
            <div className="mb-8 w-full max-w-sm flex justify-center">
              <div className="relative bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full flex items-center shadow-inner">
                {/* Background Slider Indicator */}
                <div 
                  className={`absolute top-1.5 bottom-1.5 rounded-xl bg-cyan-500 transition-all duration-300 shadow-lg shadow-cyan-500/20`}
                  style={{
                    width: 'calc(50% - 6px)',
                    left: mode === 'bpm' ? '6px' : 'calc(50% + 2px)'
                  }}
                />
                
                {/* BPM Option Button */}
                <button
                  type="button"
                  onClick={() => setMode('bpm')}
                  className={`relative z-10 w-1/2 py-2.5 rounded-xl text-xs font-orbitron font-bold tracking-widest uppercase text-center transition-colors duration-300 ${
                    mode === 'bpm' ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TEMPO (BPM)
                </button>
                
                {/* Time Signature Option Button */}
                <button
                  type="button"
                  onClick={() => setMode('timeSig')}
                  className={`relative z-10 w-1/2 py-2.5 rounded-xl text-xs font-orbitron font-bold tracking-widest uppercase text-center transition-colors duration-300 ${
                    mode === 'timeSig' ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  METER (TIME SIG)
                </button>
              </div>
            </div>

            {/* DYNAMIC MODE CONTROLS */}
            {mode === 'bpm' ? (
              /* ==================== BPM MODE CONTROLS ==================== */
              <div className="w-full flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
                {/* Large digital readout */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-7xl font-orbitron font-black tracking-tighter text-slate-50 glow-cyan leading-none">
                    {bpm}
                  </span>
                  <span className="text-xs font-orbitron text-slate-500 tracking-widest uppercase mt-1">
                    BEATS PER MINUTE
                  </span>
                </div>

                {/* Adjuster Slider and precision buttons */}
                <div className="w-full max-w-md flex items-center gap-4">
                  <button
                    onClick={() => adjustBpm(-5)}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all duration-200 active:scale-95 shadow-md"
                  >
                    <Minus className="h-5 w-5" />
                  </button>

                  <div className="flex-1 flex flex-col">
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={bpm}
                      onChange={(e) => setBpm(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-slate-850"
                    />
                    <div className="flex justify-between text-[10px] font-orbitron text-slate-500 mt-2">
                      <span>30 BPM</span>
                      <span>165 BPM</span>
                      <span>300 BPM</span>
                    </div>
                  </div>

                  <button
                    onClick={() => adjustBpm(5)}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all duration-200 active:scale-95 shadow-md"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {/* Tap Tempo & Precision Increment Grid */}
                <div className="w-full max-w-md grid grid-cols-3 gap-3">
                  <button
                    onClick={() => adjustBpm(-1)}
                    className="py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-orbitron text-slate-400 rounded-xl transition-colors active:scale-95"
                  >
                    -1 BPM
                  </button>
                  <button
                    onClick={handleTapTempo}
                    className="py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-orbitron text-cyan-400 font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-inner"
                  >
                    ⚡ TAP TEMPO
                  </button>
                  <button
                    onClick={() => adjustBpm(1)}
                    className="py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-orbitron text-slate-400 rounded-xl transition-colors active:scale-95"
                  >
                    +1 BPM
                  </button>
                </div>
              </div>
            ) : (
              /* ==================== TIME SIGNATURE MODE ==================== */
              <div className="w-full flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
                {/* Meter preset grids */}
                <div className="w-full max-w-md flex flex-col gap-2">
                  <span className="text-xs font-orbitron font-bold text-slate-400 tracking-wider uppercase mb-1 text-center">
                    Select Subdivision Meter
                  </span>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: '4/4 Meter', beats: 4 },
                      { label: '3/4 Meter', beats: 3 },
                      { label: '6/8 Meter', beats: 6 },
                      { label: '5/4 Meter', beats: 5 },
                    ].map((sig) => (
                      <button
                        key={sig.beats}
                        onClick={() => {
                          setBeatsPerMeasure(sig.beats);
                          setActiveBeat(-1);
                        }}
                        className={`py-3 rounded-xl border text-sm font-orbitron font-bold tracking-wider transition-all duration-300 ${
                          beatsPerMeasure === sig.beats
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sig.beats}/bar
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom bar subdivision adjuster */}
                <div className="w-full max-w-md flex flex-col gap-1 border-t border-slate-900 pt-4 mt-2">
                  <div className="flex justify-between items-center text-xs font-orbitron font-bold text-slate-400">
                    <span>CUSTOM BEATS PER MEASURE:</span>
                    <span className="text-cyan-400 font-extrabold">{beatsPerMeasure} beats</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => {
                        setBeatsPerMeasure((p) => Math.max(2, p - 1));
                        setActiveBeat(-1);
                      }}
                      disabled={beatsPerMeasure <= 2}
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-400 rounded-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={beatsPerMeasure}
                      onChange={(e) => {
                        setBeatsPerMeasure(parseInt(e.target.value));
                        setActiveBeat(-1);
                      }}
                      className="flex-1 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <button
                      onClick={() => {
                        setBeatsPerMeasure((p) => Math.min(12, p + 1));
                        setActiveBeat(-1);
                      }}
                      disabled={beatsPerMeasure >= 12}
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-400 rounded-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* VISUAL BEAT LED MATRIX */}
                <div className="w-full max-w-md flex flex-col gap-2 border-t border-slate-900 pt-4 mt-2">
                  <span className="text-xs font-orbitron font-bold text-slate-500 tracking-wider text-center uppercase">
                    Beat Grid visualizer
                  </span>
                  
                  <div className="flex justify-center items-center gap-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-900 min-h-[72px]">
                    {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
                      const isFirst = idx === 0;
                      const isActive = activeBeat === idx;

                      let ledClass = 'bg-slate-800 border-slate-700/50 scale-95';
                      if (isActive) {
                        ledClass = isFirst
                          ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.9)] text-slate-950 font-black'
                          : 'bg-cyan-400 border-cyan-400 scale-105 shadow-[0_0_12px_rgba(6,182,212,0.8)] text-slate-950 font-bold';
                      }

                      return (
                        <div
                          key={idx}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-orbitron transition-all duration-150 ${ledClass}`}
                        >
                          <span className={`${isActive ? 'text-slate-950' : 'text-slate-500 font-medium'}`}>
                            {idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between px-2 text-[10px] font-orbitron text-slate-500 uppercase">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                      Accented Downbeat
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                      Standard Beat
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MASTER TRIGGER START / STOP ACTION BUTTON */}
            <div className="mt-8 border-t border-slate-900 w-full pt-6 flex justify-center">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`flex items-center justify-center gap-2 px-10 py-4 font-orbitron font-black tracking-widest text-sm uppercase rounded-2xl transition-all duration-300 active:scale-95 select-none shadow-xl ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-400 border border-rose-400 text-slate-950 hover:shadow-rose-500/20'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 border border-cyan-400 text-slate-950 hover:shadow-cyan-500/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="h-4.5 w-4.5 fill-slate-950 shrink-0" />
                    STOP METRONOME
                  </>
                ) : (
                  <>
                    <Play className="h-4.5 w-4.5 fill-slate-950 shrink-0" />
                    START METRONOME
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Settings Deck, Presets, Volume (Columns 8-12) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full justify-start">
          
          {/* VOLUME DECK */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-3">
            <h3 className="text-xs font-orbitron font-bold text-slate-300 tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              ENGINE CONTROLS
            </h3>
            
            <div className="flex flex-col gap-5 mt-2">
              {/* Feedback Mode Segment Toggles */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-orbitron font-semibold text-slate-400 uppercase tracking-wider">
                  FEEDBACK SYSTEM TYPE:
                </span>
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 shadow-inner relative">
                  <button
                    type="button"
                    onClick={() => setFeedbackMode('audio')}
                    className={`flex-1 py-2 text-center rounded-lg text-[10px] sm:text-xs font-orbitron font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                      feedbackMode === 'audio'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                         : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔊 CLICK (AUDIO)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackMode('haptic')}
                    className={`flex-1 py-2 text-center rounded-lg text-[10px] sm:text-xs font-orbitron font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                      feedbackMode === 'haptic'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📳 VIBRATE (HAPTIC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackMode('both')}
                    className={`flex-1 py-2 text-center rounded-lg text-[10px] sm:text-xs font-orbitron font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                      feedbackMode === 'both'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚡ BOTH SYSTEMS
                  </button>
                </div>
                {!isVibrationSupported && (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-[9px] text-amber-400/90 leading-relaxed font-sans mt-0.5 animate-pulse">
                    ⚠️ Haptics are unavailable on standard desktop browsers. Use a mobile browser or touch device with a vibration motor to receive physical pulses.
                  </div>
                )}
              </div>

              {/* Volume Slider - Disabled when Haptic only is active */}
              <div className={`flex flex-col gap-2 transition-all duration-300 ${
                feedbackMode === 'haptic' ? 'opacity-30 pointer-events-none' : 'opacity-100'
              }`}>
                <div className="flex justify-between items-center text-xs font-orbitron font-semibold text-slate-400">
                  <span>CLICK MONITOR LEVEL:</span>
                  <span className="text-slate-200">
                    {feedbackMode === 'haptic' ? 'MUTED (HAPTIC ONLY)' : (isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    disabled={feedbackMode === 'haptic'}
                    className={`p-2 bg-slate-900 border border-slate-800 hover:text-slate-100 rounded-lg transition-colors ${
                      isMuted ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    disabled={feedbackMode === 'haptic'}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="flex-1 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

        {/* VIRTUAL HAPTIC SIMULATOR (Only rendered if physical vibration is NOT supported) */}
        {!isVibrationSupported && (
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-3">
            <h3 className="text-xs font-orbitron font-bold text-slate-300 tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-2 select-none">
              <Zap className="h-4 w-4 text-cyan-400" />
              VIRTUAL HAPTIC SIMULATOR
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4 bg-slate-950/60 rounded-xl border border-slate-900 overflow-hidden relative min-h-[160px]">
              {/* Expanding Shockwaves (Ripples) when vibrating */}
              {isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') && vibeCount > 0 && (
                <div 
                  key={`wave-${vibeCount}`} 
                  className={`absolute w-36 h-36 rounded-full border border-dashed pointer-events-none animate-[ripple_0.3s_ease-out_1] ${
                    isAccentVibe ? 'border-emerald-500/30' : 'border-cyan-500/30'
                  }`}
                />
              )}

              {/* Stylized glassmorphic smartphone mockup */}
              <div 
                key={`vibe-${vibeCount}`}
                className={`relative w-16 h-28 rounded-2xl border bg-slate-900/80 shadow-2xl flex flex-col items-center justify-between p-2.5 transition-all duration-75 select-none ${
                  isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') && vibeCount > 0
                    ? (isAccentVibe ? 'animate-shake-long border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-950/20' : 'animate-shake-short border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-cyan-950/20')
                    : 'border-slate-800'
                }`}
              >
                {/* Speaker Grill */}
                <div className="w-6 h-1 bg-slate-800 rounded-full" />

                {/* Zap / Phone State Icon */}
                <div className="flex flex-col items-center gap-1">
                  <Zap className={`h-6 w-6 transition-all ${
                    isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') && vibeCount > 0
                      ? (isAccentVibe ? 'text-emerald-400 scale-110 animate-pulse' : 'text-cyan-400')
                      : 'text-slate-700'
                  }`} />
                  <span className="text-[7px] font-orbitron font-extrabold text-slate-500 tracking-widest uppercase">HAPTIC</span>
                </div>

                {/* Home Indicator */}
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Status Text HUD */}
              <div className="text-[9px] font-orbitron text-center mt-3 tracking-wider select-none">
                {isPlaying && (feedbackMode === 'haptic' || feedbackMode === 'both') ? (
                  vibeCount > 0 ? (
                    isAccentVibe ? (
                      <span className="text-emerald-400 font-extrabold animate-pulse">⚡ DOWNBEAT VIBE (120ms)</span>
                    ) : (
                      <span className="text-cyan-400 font-bold">📳 STANDARD VIBE (40ms)</span>
                    )
                  ) : (
                    <span className="text-slate-400">WAITING FOR BEAT...</span>
                  )
                ) : (
                  <span className="text-slate-650">SIMULATOR STANDBY</span>
                )}
              </div>
            </div>
          </div>
        )}

          {/* SPORTS CADENCE PRESETS */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 shadow-lg flex-1 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-orbitron font-bold text-slate-300 tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
                BIOMECHANICAL CADENCE PRESETS
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-1.5 leading-normal">
                Optimize athletic biomechanics. Standardize form speeds or stride cadences to reach peak kinetic performance benchmarks.
              </p>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setBpm(preset.bpm);
                    // Provide micro audio response feedback when preset is updated
                    if (audioContextRef.current && isPlaying) {
                      // Adjust immediately
                      bpmRef.current = preset.bpm;
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl text-left transition-all duration-300 hover:-translate-y-0.5 select-none ${
                    bpm === preset.bpm ? 'border-cyan-500/30 bg-cyan-500/5 shadow-md shadow-cyan-500/5' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-xs font-orbitron font-bold transition-colors ${
                      bpm === preset.bpm ? 'text-cyan-400' : 'text-slate-200'
                    }`}>
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                      {preset.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-orbitron font-black ${
                      bpm === preset.bpm ? 'text-cyan-400' : 'text-slate-400'
                    }`}>
                      {preset.bpm}
                    </span>
                    <span className="text-[9px] font-orbitron text-slate-500">BPM</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 text-[10px] text-slate-400 leading-relaxed font-sans">
              <span className="font-bold text-cyan-400 font-orbitron block uppercase mb-1">💡 Coach Tip: Elite Cadence</span>
              Running stride cadence plays a crucial role in lower-extremity loading. Transitioning running cadence to <strong className="text-slate-200">180 BPM</strong> reduces joint loading by shortening stride length, directly reducing knee patellofemoral pressure and ankle impact! Use the metronome to train your stride speed.
            </div>
          </div>

        </div>

      </div>

      {/* VOCAL RHYTHM JUDGE COMPONENT */}
      <div className="mt-2">
        <VocalJudge 
          bpm={bpm} 
          isPlaying={isPlaying} 
          onStartJudge={handleStartJudge} 
          onStopJudge={handleStopJudge} 
        />
      </div>

      {/* Fade In Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake-short {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-3px, 1px) rotate(-1.5deg); }
          40% { transform: translate(3px, -1px) rotate(1.5deg); }
          60% { transform: translate(-2px, -2px) rotate(-0.5deg); }
          80% { transform: translate(2px, 2px) rotate(0.5deg); }
        }
        @keyframes shake-long {
          0%, 100% { transform: translate(0, 0) scale(1.03); }
          10% { transform: translate(-4px, 2px) rotate(-2.5deg); }
          30% { transform: translate(4px, -2px) rotate(2.5deg); }
          50% { transform: translate(-3px, -3px) rotate(-1.5deg); }
          70% { transform: translate(3px, 3px) rotate(1.5deg); }
          90% { transform: translate(-2px, 1px) rotate(-0.5deg); }
        }
        @keyframes ripple {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-shake-short {
          animation: shake-short 0.08s ease-in-out;
        }
        .animate-shake-long {
          animation: shake-long 0.18s ease-in-out;
        }
      `}</style>
    </div>
  );
}
