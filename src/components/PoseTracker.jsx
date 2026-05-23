import React, { useState, useEffect, useRef } from 'react';
import { Camera as CameraIcon, Video, VideoOff, Activity, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { extractMetrics } from '../utils/biomechanics';

const CONNECTIONS = [
  [11, 12], // Shoulder to shoulder
  [11, 13], [13, 15], // Left arm (Shoulder -> Elbow -> Wrist)
  [12, 14], [14, 16], // Right arm (Shoulder -> Elbow -> Wrist)
  [11, 23], [12, 24], // Shoulders to hips
  [23, 24], // Hip to hip
  [23, 25], [25, 27], // Left leg (Hip -> Knee -> Ankle)
  [24, 26], [26, 28]  // Right leg (Hip -> Knee -> Ankle)
];

export default function PoseTracker({ onAnalysisComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  // For live stats rendering
  const [liveMetrics, setLiveMetrics] = useState({
    leftKnee: 0,
    rightKnee: 0,
    leftElbow: 0,
    rightElbow: 0,
    kneeAsymmetry: 0
  });

  const recordingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Drawing helper
  const drawSkeleton = (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks) return;

    // Draw connection lines (bones)
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    CONNECTIONS.forEach(([iA, iB]) => {
      const ptA = landmarks[iA];
      const ptB = landmarks[iB];

      if (ptA && ptB && (ptA.visibility || 0) > 0.5 && (ptB.visibility || 0) > 0.5) {
        const xA = ptA.x * width;
        const yA = ptA.y * height;
        const xB = ptB.x * width;
        const yB = ptB.y * height;

        // Key joints being analyzed in this app:
        const isKeySegment = 
          (iA === 23 && iB === 25) || (iA === 25 && iB === 27) || // left leg
          (iA === 24 && iB === 26) || (iA === 26 && iB === 28) || // right leg
          (iA === 11 && iB === 13) || (iA === 13 && iB === 15) || // left arm
          (iA === 12 && iB === 14) || (iA === 14 && iB === 16);  // right arm

        ctx.beginPath();
        ctx.moveTo(xA, yA);
        ctx.lineTo(xB, yB);

        if (isKeySegment) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)'; // Neon cyan
          ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'; // Slate gray for torso/shoulders
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0; // Reset shadow blur for points

    // Draw joints
    landmarks.forEach((landmark, index) => {
      if ((landmark.visibility || 0) > 0.5) {
        const x = landmark.x * width;
        const y = landmark.y * height;

        const isPrimaryTracked = [13, 14, 25, 26].includes(index); // Elbows and Knees
        const isSecondaryTracked = [11, 12, 15, 16, 23, 24, 27, 28].includes(index); // Hips, shoulders, wrists, ankles

        ctx.beginPath();
        ctx.arc(x, y, isPrimaryTracked ? 7 : (isSecondaryTracked ? 5 : 3), 0, 2 * Math.PI);

        if (isPrimaryTracked) {
          ctx.fillStyle = '#10b981'; // Neon Emerald
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Draw pulsating ring
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (isSecondaryTracked) {
          ctx.fillStyle = '#06b6d4'; // Cyan
        } else {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
        }
        ctx.fill();
      }
    });
  };

  // Initialize MediaPipe Pose CNN
  useEffect(() => {
    let active = true;
    let cameraInstance = null;
    let poseInstance = null;

    const checkAndInitPose = () => {
      if (!window.Pose || !window.Camera) {
        // Scripts might still be loading, retry shortly
        setTimeout(checkAndInitPose, 150);
        return;
      }

      try {
        const pose = new window.Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          if (!active) return;
          latestLandmarksRef.current = results.poseLandmarks;
          
          // Update live metrics on the screen in real-time (at 30fps)
          if (results.poseLandmarks) {
            const metrics = extractMetrics(results.poseLandmarks, 0);
            if (metrics) {
              setLiveMetrics({
                leftKnee: metrics.left_knee_angle,
                rightKnee: metrics.right_knee_angle,
                leftElbow: metrics.left_elbow_angle,
                rightElbow: metrics.right_elbow_angle,
                kneeAsymmetry: metrics.knee_asymmetry_delta
              });
            }
            drawSkeleton(results.poseLandmarks);
          }
        });

        poseInstanceRef.current = pose;
        poseInstance = pose;
        setModelLoading(false);

        // Start camera feed
        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && active) {
                await pose.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start()
            .then(() => {
              if (active) setCameraActive(true);
            })
            .catch((err) => {
              console.error("Camera start failed", err);
              if (active) {
                setError("Camera permission denied or camera is in use. Please enable access in browser settings.");
              }
            });
          cameraInstanceRef.current = camera;
          cameraInstance = camera;
        }
      } catch (err) {
        console.error("Error creating MediaPipe Pose instance:", err);
        if (active) {
          setError("Failed to initialize MediaPipe Pose tracking. Please reload page.");
        }
      }
    };

    checkAndInitPose();

    // Clean up
    return () => {
      active = false;
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cameraInstance) {
        try {
          cameraInstance.stop();
        } catch (e) {
          console.error(e);
        }
      }
      if (poseInstance) {
        try {
          poseInstance.close();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Make canvas responsive to video size
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && canvasRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        canvasRef.current.width = videoRef.current.videoWidth || 640;
        canvasRef.current.height = videoRef.current.videoHeight || 480;
      }
    };

    // Attach load listener to video
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', handleResize);
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const startRecording = () => {
    if (isRecording) return;
    
    setIsRecording(true);
    setHistory([]);
    setRecordingSeconds(0);
    
    const startTime = Date.now();
    const tempHistory = [];

    // Slice frames every 200 milliseconds (5 fps)
    recordingIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const landmarks = latestLandmarksRef.current;
      
      if (landmarks) {
        const frameMetrics = extractMetrics(landmarks, elapsedMs);
        if (frameMetrics) {
          tempHistory.push(frameMetrics);
          setHistory([...tempHistory]);
        }
      }
    }, 200);

    // Recording duration stopwatch
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;
        // Limit recording to 15 seconds to prevent oversized payloads
        if (next >= 15) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setIsRecording(false);
    
    // Switch view only if we actually captured tracking frames
    if (history.length > 0) {
      onAnalysisComplete(history);
    } else {
      alert("No movement data was captured. Ensure your body is fully visible in the camera frame and try again.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto w-full px-4 py-8">
      {/* LEFT: Video & Canvas Capture Area */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative w-full aspect-[4/3] max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover pointer-events-none scale-x-[-1]"
            playsInline
            muted
          />

          {/* Precise Drawing Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]"
          />

          {/* Initial Loading Overlay */}
          {modelLoading && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6 z-10">
              <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
              <h3 className="font-semibold text-lg text-slate-100 font-orbitron tracking-wider">INITIALIZING SYSTEM</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Downloading and configuring client-side BlazePose CNN model via WebGL...
              </p>
            </div>
          )}

          {/* Camera Access Error Overlay */}
          {error && !modelLoading && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-6 z-10">
              <AlertCircle className="h-12 w-12 text-rose-500" />
              <h3 className="font-semibold text-lg text-rose-500 font-orbitron tracking-wider">HARDWARE ERROR</h3>
              <p className="text-slate-300 text-sm max-w-md">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700 text-sm"
              >
                Reload Application
              </button>
            </div>
          )}

          {/* Live Recording Pulse */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full z-10">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-orbitron font-semibold text-red-400 tracking-wider">
                RECORDING {recordingSeconds}s / 15s
              </span>
            </div>
          )}
          
          {/* Skeleton Tracking Status */}
          {!modelLoading && !error && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full z-10">
              <span className={`w-2.5 h-2.5 rounded-full ${latestLandmarksRef.current ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-orbitron font-semibold text-slate-300 tracking-wider">
                {latestLandmarksRef.current ? 'BODY DETECTED' : 'POSITION BODY'}
              </span>
            </div>
          )}
        </div>

        {/* Buttons / Controls */}
        <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-2xl">
          <div className="flex gap-4 w-full justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={modelLoading || error || !latestLandmarksRef.current}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-orbitron font-bold tracking-wider text-base transition-all duration-300 shadow-lg border w-full sm:w-auto ${
                  (modelLoading || error || !latestLandmarksRef.current)
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 active:scale-95 hover:shadow-cyan-500/20'
                }`}
              >
                <Video className="h-5 w-5" />
                START ANALYSIS RECORDING
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-red-500 hover:bg-red-400 border border-red-400 text-white font-orbitron font-bold tracking-wider text-base transition-all duration-300 active:scale-95 shadow-lg shadow-red-500/20 w-full sm:w-auto"
              >
                <VideoOff className="h-5 w-5" />
                STOP & ANALYZE NOW ({history.length} frames)
              </button>
            )}
          </div>
          
          <div className="flex items-start gap-2 bg-slate-900/60 border border-slate-800 p-4 rounded-xl max-w-2xl w-full text-slate-400 text-xs leading-relaxed">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200 mb-1">How it works:</p>
              <p>
                Step back so your full body (head to toe) is visible. Press start, execute a joint movement (e.g. Squat, Lunge, or Bicep Curl) for 5-15 seconds, then stop. The system slices your movement into discrete frame snapshots, extracting real-time angles using localized AI, which are formatted into a compressed time-series JSON array for advanced biomechanical LLM auditing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Data & Visual Biomechanics Analytics */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {/* Real-time Angles Board */}
        <div className="glassmorphism rounded-2xl p-6 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <h3 className="font-orbitron font-bold text-slate-100 tracking-wider">LIVE TELEMETRY</h3>
          </div>

          <div className="flex flex-col gap-4">
            {/* Knees */}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Knee Flexion (Hip-Knee-Ankle)</span>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-xs text-slate-500 font-medium">LEFT</div>
                  <div className="text-xl font-orbitron font-bold text-cyan-400">{liveMetrics.leftKnee}°</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-xs text-slate-500 font-medium">RIGHT</div>
                  <div className="text-xl font-orbitron font-bold text-cyan-400">{liveMetrics.rightKnee}°</div>
                </div>
              </div>
            </div>

            {/* Elbows */}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Elbow Flexion (Shoulder-Elbow-Wrist)</span>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-xs text-slate-500 font-medium">LEFT</div>
                  <div className="text-xl font-orbitron font-bold text-emerald-400">{liveMetrics.leftElbow}°</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-xs text-slate-500 font-medium">RIGHT</div>
                  <div className="text-xl font-orbitron font-bold text-emerald-400">{liveMetrics.rightElbow}°</div>
                </div>
              </div>
            </div>

            {/* Knee Asymmetry */}
            <div className="border-t border-slate-800/60 pt-3">
              <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Knee Asymmetry Delta</span>
              <div className={`bg-slate-950/60 border rounded-lg p-3 flex justify-between items-center ${
                liveMetrics.kneeAsymmetry > 10 ? 'border-amber-500/40 text-amber-400' : 'border-slate-800 text-slate-300'
              }`}>
                <span className="text-xs font-semibold">Absolute Difference:</span>
                <span className="text-lg font-orbitron font-bold">
                  {liveMetrics.kneeAsymmetry}°
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Details Card */}
        <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
          <div className="font-semibold text-slate-300 mb-2 font-orbitron uppercase tracking-wider">PIPELINE METRIC SPEC</div>
          <ul className="space-y-1.5 list-disc pl-4">
            <li>Model: BlazePose (Single-Person Topology)</li>
            <li>Sampling Rate: Exactly 5Hz (200ms)</li>
            <li>Angles processed: Cosine rule vector dot product</li>
            <li>Output structure: Dynamic biomechanical array JSON</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
