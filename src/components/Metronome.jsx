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
    { name: 'Adagio', bpm: 60, desc: 'Slow, expressive performance tempo' },
    { name: 'Andante', bpm: 76, desc: 'Walking pace, moderate flow' },
    { name: 'Moderato', bpm: 108, desc: 'Balanced mid-tempo cadence' },
    { name: 'Allegro', bpm: 140, desc: 'Lively, energetic performance' },
    { name: 'Presto', bpm: 180, desc: 'Rapid, high-intensity execution' },
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
    <div style={{ padding: '18px 18px 24px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow-muted" style={{ marginBottom: 4 }}>Rhythm Companion</div>
          <div className="h-title" style={{ fontSize: 20, letterSpacing: '0.04em' }}>Metronome</div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* BPM display */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '20px' }}>

          {/* Mode toggle */}
          <div className="seg" style={{ width: '100%', maxWidth: '280px' }}>
            <button type="button" className={mode === 'bpm' ? 'active' : ''} onClick={() => setMode('bpm')}>Tempo</button>
            <button type="button" className={mode === 'timeSig' ? 'active' : ''} onClick={() => setMode('timeSig')}>Meter</button>
          </div>

          {/* BPM / Meter display */}
          {mode === 'bpm' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontSize: 96, lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(180deg, #fff5b8, #ffd23a)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                  textShadow: 'none',
                }}>{bpm}</div>
                <div className="eyebrow-muted" style={{ marginTop: -4 }}>Beats per minute</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '320px' }}>
                <button className="icon-btn" onClick={() => adjustBpm(-5)} style={{ flexShrink: 0 }}>
                  <Minus size={16} />
                </button>
                <input type="range" min="30" max="300" value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--aura-gold)', height: '4px' }}
                />
                <button className="icon-btn" onClick={() => adjustBpm(5)} style={{ flexShrink: 0 }}>
                  <Plus size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '320px' }}>
                <button className="btn-ghost" style={{ padding: '8px', fontSize: '11px' }} onClick={() => adjustBpm(-1)}>−1</button>
                <button className="btn-gold" style={{ padding: '8px', fontSize: '11px' }} onClick={handleTapTempo}>Tap</button>
                <button className="btn-ghost" style={{ padding: '8px', fontSize: '11px' }} onClick={() => adjustBpm(1)}>+1</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <p className="eyebrow-muted" style={{ textAlign: 'center' }}>Subdivision Meter</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[{ beats: 4, label: '4/4' }, { beats: 3, label: '3/4' }, { beats: 6, label: '6/8' }, { beats: 5, label: '5/4' }].map((sig) => (
                  <button key={sig.beats}
                    onClick={() => { setBeatsPerMeasure(sig.beats); setActiveBeat(-1); }}
                    style={{
                      padding: '10px 4px',
                      background: beatsPerMeasure === sig.beats ? 'linear-gradient(180deg,#ffe87a,#ffd23a)' : 'var(--aura-card-2)',
                      border: `1px solid ${beatsPerMeasure === sig.beats ? 'rgba(255,215,0,0.4)' : 'var(--aura-border-soft)'}`,
                      borderRadius: '4px',
                      color: beatsPerMeasure === sig.beats ? '#2b2200' : 'var(--aura-cream)',
                      fontFamily: 'DM Sans', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    {sig.label}
                  </button>
                ))}
              </div>

              {/* Beat grid */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', padding: '16px', background: 'var(--aura-bg)', borderRadius: '4px', border: '1px solid var(--aura-border-soft)' }}>
                {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
                  const isFirst = idx === 0;
                  const isActive = activeBeat === idx;
                  return (
                    <div key={idx} style={{
                      width: '36px', height: '36px', borderRadius: '4px',
                      border: `1px solid ${isActive ? (isFirst ? 'var(--aura-emerald)' : 'var(--aura-gold)') : 'var(--aura-border-soft)'}`,
                      background: isActive ? (isFirst ? 'rgba(141,232,144,0.15)' : 'rgba(255,225,109,0.12)') : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'DM Sans', fontWeight: 700, fontSize: '12px',
                      color: isActive ? (isFirst ? 'var(--aura-emerald)' : 'var(--aura-gold)') : 'var(--aura-muted)',
                      transition: 'all 0.1s',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Play / Stop */}
          <button className="btn-gold" style={{ width: '100%', maxWidth: '280px' }} onClick={handleTogglePlay}>
            {isPlaying ? <><Square size={14} /> Pause Metronome</> : <><Play size={14} /> Start Metronome</>}
          </button>
        </div>

        {/* Pendulum card */}
        <div className="card" style={{ padding: '14px 8px' }}>
          <div className="eyebrow-muted" style={{ marginBottom: 4, textAlign: 'center' }}>Visual Pulse</div>
          {/* Pendulum SVG */}
          <div style={{ position: 'relative', width: '100%', height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
            <svg width="240" height="130" style={{ position: 'absolute', bottom: 0 }}>
              <defs>
                <linearGradient id="pendGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="var(--aura-gold)" />
                  <stop offset="100%" stopColor="#fff5b8" />
                </linearGradient>
              </defs>
              {/* Arc guide */}
              <path d="M 50 120 A 70 70 0 0 1 190 120" fill="none" stroke="var(--aura-border-soft)" strokeWidth="1" strokeDasharray="4 3" />
              {/* Degree labels */}
              <text x="46" y="116" style={{ fontSize: 8, fill: 'var(--aura-muted)', fontFamily: 'DM Sans', fontWeight: 700 }}>-35°</text>
              <text x="110" y="108" style={{ fontSize: 8, fill: 'var(--aura-muted)', fontFamily: 'DM Sans', fontWeight: 700, textAnchor: 'middle' }}>0°</text>
              <text x="174" y="116" style={{ fontSize: 8, fill: 'var(--aura-muted)', fontFamily: 'DM Sans', fontWeight: 700 }}>+35°</text>
              {/* Pendulum rod */}
              <g transform="translate(120,120)" style={{ transformOrigin: '120px 120px', ...getPendulumStyle() }}>
                <line x1="0" y1="0" x2="0" y2="-90" stroke="url(#pendGrad)" strokeWidth="2" strokeLinecap="round" />
                {/* Bob */}
                <circle cx="0" cy="-90" r="7" fill="var(--aura-card-2)" stroke="var(--aura-emerald)" strokeWidth="1.5" />
                <circle cx="0" cy="-90" r="3" fill="var(--aura-emerald)" />
              </g>
              {/* Pivot */}
              <circle cx="120" cy="120" r="4" fill="var(--aura-card-2)" stroke="var(--aura-gold)" strokeWidth="1.5" />
              {isPlaying && (
                <circle key={activeBeat} cx="120" cy="120" r="8" fill="none" stroke="var(--aura-gold)" strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" from="5" to="18" dur="0.4s" fill="freeze" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="0.4s" fill="freeze" />
                </circle>
              )}
            </svg>
          </div>
        </div>

        {/* Feedback System */}
        <div>
          <div className="eyebrow-muted" style={{ marginBottom: 8 }}>Feedback System</div>
          <div className="seg" style={{ marginBottom: 14 }}>
            <button type="button" className={feedbackMode === 'audio' ? 'active' : ''} onClick={() => setFeedbackMode('audio')}>
              <Volume2 size={11} /> Click
            </button>
            <button type="button" className={feedbackMode === 'haptic' ? 'active' : ''} onClick={() => setFeedbackMode('haptic')}>
              Vibrate
            </button>
            <button type="button" className={feedbackMode === 'both' ? 'active' : ''} onClick={() => setFeedbackMode('both')}>
              Both
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, opacity: feedbackMode === 'haptic' ? 0.3 : 1, pointerEvents: feedbackMode === 'haptic' ? 'none' : 'auto' }}>
            <button style={{ background: 'none', border: 'none', color: isMuted ? 'var(--aura-rose)' : 'var(--aura-muted)', cursor: 'pointer', padding: 0 }} onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) setIsMuted(false); }}
              style={{ flex: 1, accentColor: '#ffe16d', height: 3 }}
              disabled={feedbackMode === 'haptic'}
            />
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: 'var(--aura-gold)', minWidth: 30, textAlign: 'right' }}>
              {feedbackMode === 'haptic' ? '—' : isMuted ? '0' : `${Math.round(volume * 100)}`}
            </span>
          </div>
        </div>

        {/* Performing Arts Cadence presets */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Performing Arts Cadence</div>
          <div className="card" style={{ padding: 0 }}>
            {presets.map((preset, i) => (
              <button
                key={preset.name}
                onClick={() => { setBpm(preset.bpm); if (audioContextRef.current && isPlaying) bpmRef.current = preset.bpm; }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '12px 16px', background: 'transparent', border: 0,
                  borderTop: i > 0 ? '1px solid var(--aura-border-soft)' : 'none',
                  cursor: 'pointer', textAlign: 'left', color: 'inherit',
                }}
              >
                <div>
                  <div className="label-syne" style={{ fontSize: 12, color: bpm === preset.bpm ? 'var(--aura-gold)' : 'var(--aura-body)' }}>{preset.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--aura-muted)', marginTop: 2, fontFamily: 'DM Sans' }}>{preset.desc}</div>
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontSize: 24, color: bpm === preset.bpm ? 'var(--aura-gold)' : 'var(--aura-cream)', letterSpacing: '-0.01em' }}>
                  {preset.bpm}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Vocal Rhythm Judge */}
        <VocalJudge bpm={bpm} isPlaying={isPlaying} onStartJudge={handleStartJudge} onStopJudge={handleStopJudge} />

      </div>

      <style>{`
        @keyframes shake-short {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 1px); }
          60% { transform: translate(-2px, -2px); }
        }
        @keyframes shake-long {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-4px, 2px); }
          60% { transform: translate(-3px, -3px); }
        }
        .animate-shake-short { animation: shake-short 0.08s ease-in-out; }
        .animate-shake-long { animation: shake-long 0.18s ease-in-out; }
      `}</style>
    </div>
  );
}
