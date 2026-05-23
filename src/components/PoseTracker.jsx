import React, { useState, useEffect, useRef } from 'react';
import { extractMetrics } from '../utils/biomechanics';

const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

const S = { fontFamily: 'Sora, sans-serif' };
const H = { fontFamily: 'Hanken Grotesk, sans-serif' };

export default function PoseTracker({ onAnalysisComplete, showLanding, onStartCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const requestRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const [modelLoading, setModelLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sourceMode, setSourceMode] = useState('webcam');
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({ leftKnee: 0, rightKnee: 0, leftElbow: 0, rightElbow: 0, kneeAsymmetry: 0 });
  const [captureStarted, setCaptureStarted] = useState(false);
  const [bodyDetected, setBodyDetected] = useState(false);

  const drawSkeleton = (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    CONNECTIONS.forEach(([iA, iB]) => {
      const ptA = landmarks[iA], ptB = landmarks[iB];
      if (ptA && ptB && (ptA.visibility || 0) > 0.5 && (ptB.visibility || 0) > 0.5) {
        const isKey = [11,12,13,14,15,16,23,24,25,26,27,28].includes(iA);
        ctx.beginPath();
        ctx.moveTo(ptA.x * canvas.width, ptA.y * canvas.height);
        ctx.lineTo(ptB.x * canvas.width, ptB.y * canvas.height);
        ctx.strokeStyle = isKey ? 'rgba(255,225,109,0.8)' : 'rgba(208,198,171,0.3)';
        ctx.shadowColor = isKey ? 'rgba(255,225,109,0.35)' : 'transparent';
        ctx.shadowBlur = isKey ? 4 : 0;
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;
    landmarks.forEach((lm, index) => {
      if ((lm.visibility || 0) > 0.5) {
        const x = lm.x * canvas.width, y = lm.y * canvas.height;
        const isPrimary = [13, 14, 25, 26].includes(index);
        const isSecondary = [11, 12, 15, 16, 23, 24, 27, 28].includes(index);
        ctx.beginPath();
        ctx.arc(x, y, isPrimary ? 6 : isSecondary ? 4 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = isPrimary ? '#ffe16d' : isSecondary ? '#e9c400' : 'rgba(226,226,226,0.4)';
        ctx.fill();
        if (isPrimary) {
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(255,225,109,0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
  };

  const stopWebcam = () => {
    if (cameraInstanceRef.current) {
      try { cameraInstanceRef.current.stop(); } catch (e) {}
      cameraInstanceRef.current = null;
    }
  };

  const startWebcam = () => {
    if (!poseInstanceRef.current || !videoRef.current) return;
    stopWebcam();
    setError(null);
    if (videoRef.current) { videoRef.current.src = ''; videoRef.current.srcObject = null; }
    try {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && cameraInstanceRef.current && sourceMode === 'webcam')
            await poseInstanceRef.current.send({ image: videoRef.current });
        },
        width: 640, height: 480,
      });
      camera.start().catch(() => setError('Camera permission denied. Please enable access in browser settings.'));
      cameraInstanceRef.current = camera;
    } catch {
      setError('Webcam hardware error. Check device permissions.');
    }
  };

  const processFileFrameLoop = async () => {
    const video = videoRef.current;
    if (video && !video.paused && !video.ended && sourceMode === 'file') {
      try { await poseInstanceRef.current.send({ image: video }); } catch {}
      requestRef.current = requestAnimationFrame(processFileFrameLoop);
    }
  };

  useEffect(() => {
    let active = true;
    const checkAndInit = () => {
      if (!window.Pose || !window.Camera) { setTimeout(checkAndInit, 150); return; }
      try {
        const pose = new window.Pose({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        pose.onResults((results) => {
          if (!active) return;
          latestLandmarksRef.current = results.poseLandmarks;
          setBodyDetected(!!results.poseLandmarks);
          if (results.poseLandmarks) {
            const metrics = extractMetrics(results.poseLandmarks, 0);
            if (metrics) setLiveMetrics({ leftKnee: metrics.left_knee_angle, rightKnee: metrics.right_knee_angle, leftElbow: metrics.left_elbow_angle, rightElbow: metrics.right_elbow_angle, kneeAsymmetry: metrics.knee_asymmetry_delta });
            drawSkeleton(results.poseLandmarks);
          } else {
            const canvas = canvasRef.current;
            if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          }
        });
        poseInstanceRef.current = pose;
        setModelLoading(false);
      } catch { setError('Failed to initialize BlazePose. Please reload.'); }
    };
    checkAndInit();
    return () => {
      active = false;
      stopWebcam();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (poseInstanceRef.current) try { poseInstanceRef.current.close(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (modelLoading || !captureStarted) return;
    if (sourceMode === 'webcam') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setIsPlaying(false);
      startWebcam();
    } else {
      stopWebcam();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = uploadedFileUrl || '';
        if (uploadedFileUrl) videoRef.current.load();
      }
    }
  }, [sourceMode, modelLoading, captureStarted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => { setIsPlaying(true); if (sourceMode === 'file') requestRef.current = requestAnimationFrame(processFileFrameLoop); };
    const handlePause = () => { setIsPlaying(false); if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    const handleEnded = () => { setIsPlaying(false); if (requestRef.current) cancelAnimationFrame(requestRef.current); if (isRecording && sourceMode === 'file') stopRecording(); };
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    return () => { video.removeEventListener('play', handlePlay); video.removeEventListener('pause', handlePause); video.removeEventListener('ended', handleEnded); };
  }, [sourceMode, isRecording, uploadedFileUrl]);

  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth || 640;
        canvasRef.current.height = videoRef.current.videoHeight || 480;
      }
    };
    const video = videoRef.current;
    if (video) video.addEventListener('loadedmetadata', handleResize);
    window.addEventListener('resize', handleResize);
    return () => { if (video) video.removeEventListener('loadedmetadata', handleResize); window.removeEventListener('resize', handleResize); };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (uploadedFileUrl) URL.revokeObjectURL(uploadedFileUrl);
    const url = URL.createObjectURL(file);
    setUploadedFileUrl(url);
    setUploadedFileName(file.name);
    setIsRecording(false);
    setHistory([]);
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = url; videoRef.current.load(); }
  };

  const startRecording = () => {
    if (isRecording) return;
    const tempHistory = [];
    setIsRecording(true);
    setHistory([]);
    setRecordingSeconds(0);
    let startTime = Date.now();
    if (sourceMode === 'file' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => { setIsPlaying(true); startTime = Date.now(); }).catch(() => setIsRecording(false));
    }
    recordingIntervalRef.current = setInterval(() => {
      const landmarks = latestLandmarksRef.current;
      if (landmarks) {
        const m = extractMetrics(landmarks, Date.now() - startTime);
        if (m) { tempHistory.push(m); setHistory([...tempHistory]); }
      }
    }, 200);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev + 1 >= 15) stopRecording();
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (sourceMode === 'file' && videoRef.current) { videoRef.current.pause(); setIsPlaying(false); }
    setIsRecording(false);
    setHistory((h) => {
      if (h.length > 0) onAnalysisComplete(h);
      else alert('No movement data captured. Ensure your full body is visible and try again.');
      return h;
    });
  };

  const handleLiveRecord = () => { setCaptureStarted(true); setSourceMode('webcam'); if (onStartCapture) onStartCapture(); };
  const handleUploadVideo = () => { setCaptureStarted(true); setSourceMode('file'); if (onStartCapture) onStartCapture(); };

  // ── LANDING ──────────────────────────────────────────────────────────────────
  if (showLanding) {
    return (
      <div style={{ backgroundColor: '#0c0f0f' }}>
        {/* Hero */}
        <section style={{ position: 'relative', minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.05) 0%, transparent 55%), #0c0f0f' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(12,15,15,0) 30%, rgba(12,15,15,0.9) 70%, #0c0f0f 100%)' }} />
          <div style={{ position: 'relative', zIndex: 10, marginBottom: '40px', maxWidth: '480px' }}>
            <h2 style={{ ...S, fontSize: '40px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#fff6df', marginBottom: '16px' }}>
              Your Stage, Your Director.
            </h2>
            <p style={{ ...H, fontSize: '16px', lineHeight: 1.6, color: '#d0c6ab', opacity: 0.8, marginBottom: '32px' }}>
              Precision analytics meets cinematic storytelling. Capture your mastery with the world's most advanced performance engine.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleLiveRecord}
                style={{ width: '100%', backgroundColor: '#ffd700', color: '#3a3000', padding: '16px', ...H, fontWeight: 600, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                Live Performance Record
              </button>
              <button onClick={handleUploadVideo}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#e2e2e2', padding: '16px', ...H, fontWeight: 600, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid rgba(226,226,226,0.2)', borderRadius: '2px', cursor: 'pointer' }}>
                Upload Existing Video
              </button>
            </div>
          </div>
        </section>

        {/* Studio Precision */}
        <section style={{ padding: '64px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4d4732' }} />
            <h3 style={{ ...S, fontSize: '13px', fontWeight: 600, color: '#ffe16d', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Studio Precision</h3>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4d4732' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: 'analytics', title: 'Biometric Analysis', desc: 'Real-time posture, velocity, and alignment tracking via neural mapping.', cta: 'View Engine' },
              { icon: 'movie', title: 'Cinematic Feedback', desc: 'Dynamic lighting overlays and frame-by-frame professional critiques.', cta: 'Explore Tools' },
            ].map(({ icon, title, desc, cta }) => (
              <div key={title}
                style={{ backgroundColor: '#1a1c1c', border: '1px solid #4d4732', padding: '32px', position: 'relative', overflow: 'hidden', borderRadius: '2px' }}>
                <div style={{ position: 'absolute', right: '-24px', bottom: '-24px', opacity: 0.05 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '120px', color: '#ffe16d' }}>{icon}</span>
                </div>
                <span className="material-symbols-outlined" style={{ color: '#ffe16d', marginBottom: '16px', display: 'block' }}>{icon}</span>
                <h4 style={{ ...S, fontWeight: 600, fontSize: '20px', color: '#e2e2e2', marginBottom: '8px' }}>{title}</h4>
                <p style={{ ...H, fontSize: '14px', lineHeight: 1.6, color: '#d0c6ab', marginBottom: '16px' }}>{desc}</p>
                <span style={{ ...H, fontSize: '12px', fontWeight: 600, color: '#ffe16d', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {cta} <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Momentum */}
        <section style={{ padding: '0 20px 128px' }}>
          <h3 style={{ ...S, fontWeight: 600, fontSize: '13px', color: '#ffe16d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Weekly Momentum</h3>
          <p style={{ ...H, fontSize: '12px', color: '#d0c6ab', marginBottom: '32px' }}>Current Path to Mastery</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[{ label: 'Biomechanics Form', pct: 88 }, { label: 'Symmetry Score', pct: 64 }, { label: 'Timing Ratio', pct: 42 }].map(({ label, pct }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ ...H, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e2e2e2' }}>{label}</span>
                  <span style={{ ...H, fontSize: '12px', color: '#ffe16d' }}>{pct}%</span>
                </div>
                <div style={{ height: '2px', backgroundColor: 'rgba(77,71,50,0.4)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#ffe16d', boxShadow: '0 0 8px rgba(233,196,0,0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── CAPTURE ───────────────────────────────────────────────────────────────────
  const canRecord = !modelLoading && (
    (sourceMode === 'webcam' && !error && bodyDetected) ||
    (sourceMode === 'file' && !!uploadedFileUrl)
  );

  return (
    <div style={{ backgroundColor: '#0c0f0f', minHeight: '100%', paddingBottom: '16px' }}>
      {/* Source tabs */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1a1c1c', border: '1px solid #4d4732', padding: '6px', borderRadius: '2px' }}>
          {[{ id: 'webcam', label: '📷  Webcam' }, { id: 'file', label: '📁  Upload Video' }].map(({ id, label }) => (
            <button key={id} disabled={isRecording} onClick={() => setSourceMode(id)}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '2px', border: 'none', cursor: isRecording ? 'not-allowed' : 'pointer', backgroundColor: sourceMode === id ? '#ffd700' : 'transparent', color: sourceMode === id ? '#3a3000' : '#c9c6c5', ...H, fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: isRecording ? 0.5 : 1 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Viewfinder */}
      <div style={{ position: 'relative', margin: '12px 20px 0', aspectRatio: '4/3', backgroundColor: '#0c0f0f', border: '1px solid #4d4732', overflow: 'hidden', borderRadius: '2px' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: sourceMode === 'webcam' ? 'scaleX(-1)' : 'none', display: 'block' }} playsInline muted />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: sourceMode === 'webcam' ? 'scaleX(-1)' : 'none' }} />

        {sourceMode === 'file' && !uploadedFileUrl && (
          <label style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(12,15,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', zIndex: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ffe16d' }}>upload</span>
            <span style={{ ...S, fontWeight: 600, fontSize: '14px', color: '#e2e2e2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upload Kinematic Video</span>
            <span style={{ ...H, fontSize: '12px', color: '#d0c6ab' }}>Tap to browse MP4 / WebM</span>
            <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        )}

        {modelLoading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(12,15,15,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 30 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#ffe16d', animation: 'aura-spin 1.2s linear infinite' }}>sync</span>
            <p style={{ ...S, fontWeight: 600, fontSize: '14px', color: '#e2e2e2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Initializing System</p>
            <p style={{ ...H, fontSize: '12px', color: '#d0c6ab', textAlign: 'center', maxWidth: '260px' }}>Downloading BlazePose CNN model via WebGL...</p>
          </div>
        )}

        {error && !modelLoading && sourceMode === 'webcam' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(12,15,15,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px', zIndex: 30 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#ffb4ab' }}>camera_off</span>
            <p style={{ ...H, fontSize: '13px', color: '#ffdad6', textAlign: 'center', lineHeight: 1.5 }}>{error}</p>
            <button onClick={startWebcam} style={{ ...H, fontWeight: 600, fontSize: '12px', color: '#ffe16d', border: '1px solid #ffe16d', padding: '10px 20px', borderRadius: '2px', backgroundColor: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Retry</button>
          </div>
        )}

        {isRecording && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(12,15,15,0.85)', border: '1px solid rgba(255,180,171,0.3)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(8px)', zIndex: 10 }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#f43f5e', borderRadius: '50%', animation: 'aura-pulse 1s infinite' }} />
            <span style={{ ...H, fontWeight: 600, fontSize: '11px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {sourceMode === 'file' ? 'Analyzing' : 'Recording'} {recordingSeconds}s / 15s
            </span>
          </div>
        )}

        {!modelLoading && (sourceMode === 'webcam' || uploadedFileUrl) && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(12,15,15,0.85)', border: `1px solid ${bodyDetected ? 'rgba(255,225,109,0.3)' : 'rgba(245,158,11,0.3)'}`, padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(8px)', zIndex: 10 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: bodyDetected ? '#ffe16d' : '#f59e0b' }} />
            <span style={{ ...H, fontWeight: 600, fontSize: '11px', color: '#e2e2e2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {bodyDetected ? 'Body Detected' : 'Position Body'}
            </span>
          </div>
        )}
      </div>

      {/* File controls */}
      {sourceMode === 'file' && uploadedFileUrl && (
        <div style={{ margin: '10px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1c1c', border: '1px solid #4d4732', padding: '12px 16px', borderRadius: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ffe16d', flexShrink: 0 }}>folder_open</span>
            <span style={{ ...H, fontSize: '12px', color: '#d0c6ab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFileName}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => { const v = videoRef.current; if (!v) return; isPlaying ? v.pause() : v.play().catch(() => {}); }}
              style={{ padding: '8px', backgroundColor: '#282a2b', border: '1px solid #4d4732', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#e2e2e2' }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <label style={{ padding: '8px 12px', backgroundColor: '#282a2b', border: '1px solid #4d4732', borderRadius: '2px', cursor: 'pointer', ...H, fontSize: '11px', color: '#c9c6c5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Change <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* Live metrics */}
      <div style={{ margin: '10px 20px 0', backgroundColor: '#1a1c1c', border: '1px solid #4d4732', padding: '16px', borderRadius: '2px' }}>
        <p style={{ ...H, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999077', marginBottom: '12px' }}>Live Telemetry</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[{ label: 'Left Knee', val: liveMetrics.leftKnee }, { label: 'Right Knee', val: liveMetrics.rightKnee }, { label: 'Left Elbow', val: liveMetrics.leftElbow }, { label: 'Right Elbow', val: liveMetrics.rightElbow }].map(({ label, val }) => (
            <div key={label} style={{ backgroundColor: '#0c0f0f', border: '1px solid #4d4732', padding: '10px', borderRadius: '2px', textAlign: 'center' }}>
              <p style={{ ...H, fontSize: '10px', color: '#999077', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ ...S, fontWeight: 700, fontSize: '20px', color: '#ffe16d', marginTop: '2px' }}>{val}°</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '8px', backgroundColor: '#0c0f0f', border: `1px solid ${liveMetrics.kneeAsymmetry > 10 ? 'rgba(245,158,11,0.4)' : '#4d4732'}`, padding: '10px', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...H, fontSize: '11px', color: '#d0c6ab', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Knee Asymmetry</span>
          <span style={{ ...S, fontWeight: 700, fontSize: '18px', color: liveMetrics.kneeAsymmetry > 10 ? '#f59e0b' : '#ffe16d' }}>{liveMetrics.kneeAsymmetry}°</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 20px 0' }}>
        {!isRecording ? (
          <button onClick={startRecording} disabled={!canRecord}
            style={{ width: '100%', padding: '18px', border: 'none', borderRadius: '2px', cursor: canRecord ? 'pointer' : 'not-allowed', backgroundColor: canRecord ? '#ffd700' : '#1e2020', color: canRecord ? '#3a3000' : '#4d4732', ...H, fontWeight: 600, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>videocam</span>
            {sourceMode === 'file' ? 'Start Video Analysis' : 'Start Analysis Recording'}
          </button>
        ) : (
          <button onClick={stopRecording}
            style={{ width: '100%', padding: '18px', border: 'none', borderRadius: '2px', cursor: 'pointer', backgroundColor: '#93000a', color: '#ffdad6', ...H, fontWeight: 600, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>stop_circle</span>
            Stop & Analyze ({history.length} frames)
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#1a1c1c', border: '1px solid #4d4732', padding: '14px', borderRadius: '2px', marginTop: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ffe16d', flexShrink: 0, marginTop: '1px' }}>info</span>
          <p style={{ ...H, fontSize: '12px', lineHeight: 1.6, color: '#d0c6ab' }}>
            {sourceMode === 'file'
              ? 'Upload an athletic video, then tap Start. The engine plays and tracks your skeleton at 5Hz, then generates an audit.'
              : 'Stand back so your full body is visible. Tap start, perform a movement for 5–15 seconds, then tap stop.'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes aura-spin { to { transform: rotate(360deg); } }
        @keyframes aura-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
