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
    <div className="relative w-full flex flex-col items-center gap-10 mt-8 transition-colors duration-500">
      
      {/* Background Glow */}
      {isJudging && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#8de890]/5 rounded-full blur-[100px] pointer-events-none" />
      )}
      {visualOnset && (
        <div className="absolute inset-0 bg-[#8de890]/10 transition-opacity duration-100 rounded-full blur-2xl" />
      )}

      {/* HEADER */}
      <div className="flex flex-col items-center text-center gap-2 relative z-10 w-full max-w-[280px]">
        <div className="text-[10px] font-medium tracking-[0.2em] text-[#ffe16d]/60 uppercase mb-2 flex items-center gap-2">
          <Mic size={12} className={isJudging ? 'text-[#8de890] animate-pulse' : ''} />
          Acoustic Analysis
        </div>
        <h3 className="text-2xl font-light text-white/90 tracking-wide mb-4">Vocal Rhythm Judge</h3>
        <p className="text-[10px] text-white/50 leading-relaxed text-center font-medium">
          Synchronize vocal pulses with the kinetic sweep. Audio feedback routes to haptics during analysis.
        </p>
      </div>

      {errorMsg && (
        <div className="text-[#ff6b6b] text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* TELEMETRY DATA */}
      <div className="flex flex-col items-center w-full max-w-[280px] relative z-10 gap-10">
        
        {/* Score Hub */}
        <div className="flex flex-col items-center justify-center relative w-full">
          <div className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-4">
            Phase Accuracy
          </div>
          <div className={`text-[100px] font-light leading-none tracking-tighter ${
            score >= 90 ? 'text-[#8de890]' : score >= 70 ? 'text-[#ffe16d]' : 'text-[#ff6b6b]'
          }`}>
            {isJudging || hits > 0 ? score : '—'}
          </div>
        </div>

        {/* Granular Metrics */}
        <div className="flex w-full justify-between items-center px-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase mb-2">Drift Error</span>
            <span className="text-2xl font-light text-white/90">
              {isJudging || hits > 0 ? `${avgError}ms` : '—'}
            </span>
          </div>
          <div className="h-8 w-px bg-[#333]" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase mb-2">Pulses</span>
            <span className="text-2xl font-light text-white/90">
              {isJudging || hits > 0 ? hits : '—'}
            </span>
          </div>
        </div>

      </div>

      {/* ACTION BUTTON */}
      <div className="w-full max-w-[280px] relative z-10 mt-4">
        {isJudging ? (
          <button 
            className="w-full py-5 rounded-full bg-[#111] text-[#ff6b6b] text-xs font-medium tracking-widest hover:bg-[#0a0a0a] transition-all flex items-center justify-center gap-3"
            onClick={stopJudging}
          >
            <MicOff size={14} /> HALT ANALYSIS
          </button>
        ) : (
          <button 
            className="w-full py-5 rounded-full bg-[#1a1a1a] text-[#8de890] text-xs font-medium tracking-widest hover:bg-[#222] transition-all flex items-center justify-center gap-3"
            onClick={startJudging}
          >
            <Activity size={14} /> INITIATE ANALYSIS
          </button>
        )}
      </div>

    </div>
  );
}
