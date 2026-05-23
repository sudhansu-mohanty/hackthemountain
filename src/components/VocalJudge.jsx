import React, { useState, useEffect, useRef } from 'react';
import { Mic, Activity, MicOff, Star, ShieldAlert } from 'lucide-react';

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.005) return { pitch: -1, clarity: 0 };

  let maxval = -1;
  let maxpos = -1;

  // Vocal bounds: 50Hz to 1000Hz
  const minLag = Math.floor(sampleRate / 1000);
  const maxLag = Math.floor(sampleRate / 50);

  for (let i = minLag; i < Math.min(SIZE, maxLag); i++) {
    let sum = 0;
    for (let j = 0; j < SIZE - i; j++) sum += buf[j] * buf[j + i];
    if (sum > maxval) {
      maxval = sum;
      maxpos = i;
    }
  }

  let c0 = 0;
  for (let j = 0; j < SIZE; j++) c0 += buf[j] * buf[j];

  const clarity = maxval / c0;
  const pitch = sampleRate / maxpos;

  return { pitch, clarity };
}

export default function VocalJudge({ bpm, isPlaying, onStartJudge, onStopJudge }) {
  const [isJudging, setIsJudging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);
  const [avgError, setAvgError] = useState(0);
  const [hits, setHits] = useState(0);
  const [visualOnset, setVisualOnset] = useState(false);

  // Audio state refs
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafIdRef = useRef(null);

  // Rhythm tracking refs
  const startTimeRef = useRef(0);
  const lastOnsetRef = useRef(0);
  const accumulatedErrorRef = useRef(0);
  const hitCountRef = useRef(0);
  const currentScoreRef = useRef(100);
  const previousPitchRef = useRef(-1);

  // Debounce visual pulse
  const visualTimeoutRef = useRef(null);

  const startJudging = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048; // Increased buffer size for accurate pitch correlation
      source.connect(analyser);
      analyserRef.current = analyser;

      // Reset stats
      setScore(100);
      setAvgError(0);
      setHits(0);
      accumulatedErrorRef.current = 0;
      hitCountRef.current = 0;
      currentScoreRef.current = 100;

      // Start time for the judge session
      startTimeRef.current = audioCtx.currentTime;
      lastOnsetRef.current = 0;

      setIsJudging(true);
      setErrorMsg('');

      // Notify parent to start metronome in haptic/visual mode
      if (onStartJudge) onStartJudge();

      processAudio();
    } catch (err) {
      console.error("Microphone access denied:", err);
      setErrorMsg('Microphone access required for Vocal Judge.');
    }
  };

  const stopJudging = () => {
    setIsJudging(false);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error);
      audioCtxRef.current = null;
    }
    if (onStopJudge) onStopJudge();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isJudging) stopJudging();
    };
  }, [isJudging]);

  // The main processing loop
  const processAudio = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    // Use raw waveform data for auto-correlation
    analyser.getFloatTimeDomainData(dataArray);

    const { pitch, clarity } = autoCorrelate(dataArray, audioCtxRef.current.sampleRate);
    const currentTime = audioCtxRef.current.currentTime;

    // --- PITCH-BASED ONSET DETECTION (Salamon & Gómez inspired) ---
    // 1. Validates signal is an actual voice (clarity > 0.85) -> Filters out random claps!
    // 2. Detects legato note changes by checking if pitch jumps > 1 semitone (~6%).
    const DEBOUNCE_TIME = 0.25;
    let onsetDetected = false;

    if (clarity > 0.70) {
      if (previousPitchRef.current === -1) {
        // First vocal note in a sequence
        onsetDetected = true;
      } else {
        // Check for legato note jump (Pitch jump > 1 semitone)
        const pitchRatio = Math.max(pitch, previousPitchRef.current) / Math.min(pitch, previousPitchRef.current);
        if (pitchRatio > 1.059) {
          onsetDetected = true;
        }
      }
      previousPitchRef.current = pitch;
    } else {
      // If signal loses pitch clarity (breathing, noise, or claps), reset the tracker
      previousPitchRef.current = -1;
    }

    if (onsetDetected && (currentTime - lastOnsetRef.current > DEBOUNCE_TIME)) {
      console.log(`[Vocal Judge] Vocal Onset! Pitch: ${pitch.toFixed(1)}Hz, Clarity: ${clarity.toFixed(2)}`);

      // Visual feedback pulse
      setVisualOnset(true);
      if (visualTimeoutRef.current) clearTimeout(visualTimeoutRef.current);
      visualTimeoutRef.current = setTimeout(() => setVisualOnset(false), 100);

      // --- INTERVAL-BASED SCORING LOGIC ---
      // Instead of an absolute grid (which breaks if a track starts off-phase),
      // we measure the actual time interval between your syllables!
      // If the interval between your notes matches the BPM's expected note lengths, you are perfectly on rhythm.
      let errorMs = 0;
      let intervalMs = 0;
      let targetIntervalMs = 0;

      if (lastOnsetRef.current > 0 && hitCountRef.current > 0) {
        const interval = currentTime - lastOnsetRef.current;
        intervalMs = interval * 1000;

        const quarterNoteInterval = 60.0 / bpm;
        const sixteenthInterval = quarterNoteInterval / 4.0;

        // Find what type of note length the user just sang (e.g. 8th note, quarter note)
        const expectedGridMultiplier = Math.round(interval / sixteenthInterval);
        const expectedInterval = Math.max(1, expectedGridMultiplier) * sixteenthInterval;
        targetIntervalMs = expectedInterval * 1000;

        errorMs = Math.abs(interval - expectedInterval) * 1000;
      }

      // Update lastOnsetRef ONLY AFTER using it to calculate the interval!
      lastOnsetRef.current = currentTime;

      // --- HIT-BASED SCORING CURVE ---
      // This correctly gives humans a 100 for natural rubato singing.
      let hitScore = 0;
      if (errorMs <= 35) hitScore = 100;        // Perfect timing (Natural human rubato)
      else if (errorMs <= 60) hitScore = 80;    // Great timing
      else if (errorMs <= 90) hitScore = 40;    // Okay timing
      else hitScore = 0;                        // Complete miss

      // Update statistics
      hitCountRef.current += 1;
      accumulatedErrorRef.current += errorMs;

      // Use Exponentially Weighted Moving Average (EWMA) for hyper-responsive scoring!
      // This prevents a long history of perfect singing from masking current mistakes.
      // 20% weight to new hits, 80% to past score. Acts like a rhythm game health bar.
      const smoothingFactor = 0.2;
      currentScoreRef.current = (currentScoreRef.current * (1 - smoothingFactor)) + (hitScore * smoothingFactor);

      // --- DEBUGGING LOG ---
      if (hitCountRef.current > 1) {
        console.log(`[Vocal Judge] Hit #${hitCountRef.current} | Interval: ${intervalMs.toFixed(0)}ms | Target: ${targetIntervalMs.toFixed(0)}ms | Error: ${errorMs.toFixed(0)}ms | Grade: ${hitScore} | Health: ${currentScoreRef.current.toFixed(1)}`);
      }

      const avgErr = accumulatedErrorRef.current / hitCountRef.current;
      setAvgError(Math.round(avgErr));
      setHits(hitCountRef.current);

      setScore(Math.round(currentScoreRef.current));
    }

    rafIdRef.current = requestAnimationFrame(processAudio);
  };

  return (
    <div className="glassmorphism rounded-2xl border border-rose-500/30 p-6 shadow-xl relative overflow-hidden group">
      {/* Background ambient glow based on state */}
      <div className={`absolute -inset-10 bg-gradient-to-r blur-3xl opacity-10 pointer-events-none transition-colors duration-500 ${isJudging ? 'from-rose-500 to-fuchsia-500' : 'from-slate-500 to-slate-800'
        }`} />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">

        {/* LEFT: Info & Controls */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-2">
            <Mic className={`h-5 w-5 ${isJudging ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <h2 className="text-xl font-orbitron font-bold text-slate-100 tracking-wider uppercase">
              Vocal Rhythm Judge
            </h2>
          </div>
          <p className="text-sm text-slate-400 font-sans leading-relaxed">
            Test your rhythm accuracy. Sing or clap perfectly on the beat.
            <span className="block mt-1 text-rose-300/80 text-xs flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Metronome clicks will be muted to prevent mic feedback. Use headphones or visual cues.
            </span>
          </p>

          <div className="mt-2">
            {!isJudging ? (
              <button
                onClick={startJudging}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/50 px-6 py-2.5 rounded-xl font-orbitron font-bold text-sm tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 w-max"
              >
                <Activity className="h-4 w-4" />
                START JUDGING
              </button>
            ) : (
              <button
                onClick={stopJudging}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-600 px-6 py-2.5 rounded-xl font-orbitron font-bold text-sm tracking-widest transition-all flex items-center gap-2 w-max"
              >
                <MicOff className="h-4 w-4" />
                STOP JUDGING
              </button>
            )}
            {errorMsg && <div className="text-red-400 text-xs mt-2 font-bold">{errorMsg}</div>}
          </div>
        </div>

        {/* RIGHT: Score Dashboard */}
        <div className={`w-full md:w-64 glassmorphism-glow rounded-xl border p-4 flex flex-col items-center justify-center transition-all duration-300 ${isJudging ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'border-slate-800'
          }`}>
          <div className="text-xs font-orbitron text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Star className="h-3 w-3" /> Rhythm Score
          </div>

          <div className="relative">
            <div className={`text-6xl font-black font-orbitron tracking-tighter ${score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400'
              }`}>
              {isJudging || hits > 0 ? score : '--'}
            </div>

            {/* Visual Pulse Ring on Onset */}
            {visualOnset && (
              <div className="absolute inset-0 border-2 border-rose-400 rounded-full animate-ping opacity-50" />
            )}
          </div>

          <div className="flex gap-4 mt-4 text-xs font-orbitron text-slate-400 border-t border-slate-800/80 pt-3 w-full justify-around">
            <div className="flex flex-col items-center">
              <span>AVG ERROR</span>
              <span className={`font-bold ${isJudging ? 'text-slate-200' : ''}`}>
                {isJudging || hits > 0 ? `${avgError}ms` : '--'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span>HITS</span>
              <span className={`font-bold ${isJudging ? 'text-slate-200' : ''}`}>
                {isJudging || hits > 0 ? hits : '--'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
