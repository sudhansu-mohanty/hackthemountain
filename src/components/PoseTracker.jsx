import React, { useState, useEffect, useRef } from 'react';
import { Camera as CameraIcon, Video, VideoOff, Activity, AlertCircle, Info, RefreshCw, UploadCloud, FolderOpen, Play as PlayIcon, Pause as PauseIcon } from 'lucide-react';
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

export default function PoseTracker({ onAnalysisComplete, onBackgroundTelemetryReady }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const requestRef = useRef(null);
  const resolveFramePromiseRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Video source mode: 'webcam' | 'file'
  const [sourceMode, setSourceMode] = useState('webcam');
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [rawFile, setRawFile] = useState(null);
  
  // For live stats rendering
  const [liveMetrics, setLiveMetrics] = useState({
    leftKnee: 0,
    rightKnee: 0,
    leftElbow: 0,
    rightElbow: 0,
    kneeAsymmetry: 0,
    leftHip: 0,
    rightHip: 0,
    torsoTilt: 0
  });

  const recordingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const sourceModeRef = useRef(sourceMode);
  const isRecordingRef = useRef(isRecording);
  const historyRef = useRef([]);
  const lastProcessedTimeRef = useRef(-200);
  const activeAnalysisVideoRef = useRef(null);

  // Keep refs updated with current state values to avoid closure traps in loops
  useEffect(() => {
    sourceModeRef.current = sourceMode;
  }, [sourceMode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Drawing helper
  const drawSkeleton = (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (sourceMode === 'file' || sourceModeRef.current === 'file') {
      return;
    }

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

  // Webcam controls
  const stopWebcam = () => {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch (e) {
        console.error("Error stopping camera:", e);
      }
      cameraInstanceRef.current = null;
    }
    setCameraActive(false);
  };

  const startWebcam = () => {
    if (!poseInstanceRef.current || !videoRef.current) return;
    
    stopWebcam();
    setError(null);

    // Clear video src bindings
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }

    try {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && cameraInstanceRef.current && sourceModeRef.current === 'webcam') {
            await poseInstanceRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });
      
      camera.start()
        .then(() => {
          setCameraActive(true);
        })
        .catch((err) => {
          console.error("Camera start failed", err);
          setError("Camera permission denied or camera is in use. Please enable access in browser settings.");
        });
      cameraInstanceRef.current = camera;
    } catch (err) {
      console.error("Failed to initialize camera constructor", err);
      setError("Webcam hardware access error. Check device permissions.");
    }
  };

  // Animation frame loop for file video stream - optimized to skip intermediate frames
  const processFileFrameLoop = async () => {
    const video = videoRef.current;
    if (video && !video.paused && !video.ended && sourceModeRef.current === 'file' && !isRecordingRef.current) {
      const currentTimeMs = Math.round(video.currentTime * 1000);
      
      // Only invoke BlazePose CNN if video currentTime has advanced by at least 200ms
      if (currentTimeMs - lastProcessedTimeRef.current >= 200) {
        lastProcessedTimeRef.current = currentTimeMs;
        try {
          if (poseInstanceRef.current) {
            await poseInstanceRef.current.send({ image: video });
          }
        } catch (e) {
          console.error("Error processing video frame:", e);
        }
      }
      requestRef.current = requestAnimationFrame(processFileFrameLoop);
    }
  };

  // Initialize MediaPipe Pose CNN
  useEffect(() => {
    let active = true;

    const checkAndInitPose = () => {
      if (!window.Pose || !window.Camera) {
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
          
          if (results.poseLandmarks) {
            const metrics = extractMetrics(results.poseLandmarks, 0);
            if (metrics) {
              setLiveMetrics({
                leftKnee: metrics.left_knee_angle,
                rightKnee: metrics.right_knee_angle,
                leftElbow: metrics.left_elbow_angle,
                rightElbow: metrics.right_elbow_angle,
                kneeAsymmetry: metrics.knee_asymmetry_delta,
                leftHip: metrics.left_hip_angle,
                rightHip: metrics.right_hip_angle,
                torsoTilt: metrics.torso_tilt_angle
              });
            }
            drawSkeleton(results.poseLandmarks);

            // Deterministic sampling for video file uploads based on background seeking
            const analysisVideo = activeAnalysisVideoRef.current || videoRef.current;
            if (analysisVideo && sourceModeRef.current === 'file' && isRecordingRef.current) {
              const currentTimeMs = Math.round(analysisVideo.currentTime * 1000);
              const frameMetrics = extractMetrics(results.poseLandmarks, currentTimeMs);
              if (frameMetrics) {
                historyRef.current.push(frameMetrics);
                setHistory([...historyRef.current]);
              }
            }
          }

          // Always resolve the pending frame promise if one is active to prevent blocking the scan loop
          if (resolveFramePromiseRef.current) {
            const resolveFn = resolveFramePromiseRef.current;
            resolveFramePromiseRef.current = null;
            resolveFn();
          }
        });

        poseInstanceRef.current = pose;
        setModelLoading(false);
      } catch (err) {
        console.error("Error creating MediaPipe Pose instance:", err);
        setError("Failed to initialize MediaPipe Pose tracking. Please reload page.");
      }
    };

    checkAndInitPose();

    // Clean up
    return () => {
      active = false;
      stopWebcam();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      if (poseInstanceRef.current) {
        try {
          poseInstanceRef.current.close();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Manage source mode changes
  useEffect(() => {
    if (modelLoading) return;

    if (sourceMode === 'webcam') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setIsPlaying(false);
      startWebcam();
    } else {
      stopWebcam();
      // Revoke any camera feed links and load file URL if present
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        if (uploadedFileUrl) {
          videoRef.current.src = uploadedFileUrl;
          videoRef.current.load();
        } else {
          videoRef.current.src = '';
        }
      }
    }
  }, [sourceMode, modelLoading]);

  // Bind video events for uploaded files
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      if (sourceModeRef.current === 'file') {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(processFileFrameLoop);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      // Auto submit if recording file reaches the end
      if (isRecordingRef.current && sourceModeRef.current === 'file') {
        stopRecording();
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [uploadedFileUrl]);

  // Make canvas responsive
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth || 640;
        canvasRef.current.height = videoRef.current.videoHeight || 480;
      }
    };

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Revoke old object URL to prevent leaks
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
    }

    const fileUrl = URL.createObjectURL(file);
    setRawFile(file);
    setUploadedFileUrl(fileUrl);
    setUploadedFileName(file.name);
    setIsRecording(false);
    setHistory([]);
    historyRef.current = [];
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = fileUrl;
      videoRef.current.load();
    }
  };

  const analyzeVideoFile = async () => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Play the main visual video tag at normal pace (1.0x) so the user can watch it
    video.currentTime = 0;
    video.playbackRate = 1.0;
    video.play().catch(e => console.error("Visual video playback failed:", e));
    setIsPlaying(true);

    // 2. Configure recording states
    setIsRecording(true);
    isRecordingRef.current = true;
    setHistory([]);
    historyRef.current = [];
    setAnalysisProgress(0);
    setRecordingSeconds(0);

    // 3. Create a background video element to run the fast scan, appended to the DOM to prevent browser decoder throttling
    const bgVideo = document.createElement('video');
    bgVideo.src = uploadedFileUrl;
    bgVideo.muted = true;
    bgVideo.playsInline = true;
    bgVideo.preload = "auto";
    bgVideo.style.position = 'absolute';
    bgVideo.style.width = '1px';
    bgVideo.style.height = '1px';
    bgVideo.style.opacity = '0.01';
    bgVideo.style.pointerEvents = 'none';
    bgVideo.style.top = '0';
    bgVideo.style.left = '0';
    document.body.appendChild(bgVideo); // Attach to DOM to keep decoder active

    activeAnalysisVideoRef.current = bgVideo; // Set ref for timestamp matching in onResults

    await new Promise((resolve) => {
      if (bgVideo.duration) {
        resolve();
      } else {
        const checkMeta = () => {
          bgVideo.removeEventListener('loadedmetadata', checkMeta);
          bgVideo.removeEventListener('loadeddata', checkMeta);
          resolve();
        };
        bgVideo.addEventListener('loadedmetadata', checkMeta);
        bgVideo.addEventListener('loadeddata', checkMeta);
      }
      bgVideo.load();
    });

    const duration = bgVideo.duration || 10;
    let currentTime = 0;

    // Helper promise to seek and process each frame programmatically on the offscreen video
    const seekAndProcessFrame = (time) => {
      return new Promise((resolve) => {
        const onSeeked = async () => {
          bgVideo.removeEventListener('seeked', onSeeked);
          if (poseInstanceRef.current) {
            try {
              // Wait for the pose processing callback (onResults) to complete for this frame
              await new Promise((resolveFrame) => {
                resolveFramePromiseRef.current = resolveFrame;
                poseInstanceRef.current.send({ image: bgVideo }).catch(err => {
                  console.error("Pose send error:", err);
                  resolveFrame();
                });
              });
            } catch (err) {
              console.error("Frame processing error during seek:", err);
            }
          }
          resolve();
        };
        bgVideo.addEventListener('seeked', onSeeked);
        bgVideo.currentTime = time;
      });
    };

    try {
      while (currentTime <= duration && isRecordingRef.current) {
        await seekAndProcessFrame(currentTime);
        setAnalysisProgress(Math.round((currentTime / duration) * 100));
        currentTime += 0.2; // Seek at 200ms (5 FPS) intervals
      }
    } catch (err) {
      console.error("Analysis loop error:", err);
    }

    // Clean up background video reference and remove from DOM
    activeAnalysisVideoRef.current = null;
    if (bgVideo.parentNode) {
      bgVideo.parentNode.removeChild(bgVideo);
    }

    // Trigger callback to initiate Gemini analysis in the background
    if (isRecordingRef.current && onBackgroundTelemetryReady) {
      onBackgroundTelemetryReady(historyRef.current);
    }

    // Automatically stop recording and trigger UI processing view
    if (isRecordingRef.current) {
      stopRecording();
    }
  };

  const startRecording = () => {
    if (isRecording) return;
    
    if (sourceMode === 'file') {
      analyzeVideoFile();
      return;
    }

    setIsRecording(true);
    setHistory([]);
    historyRef.current = [];
    lastProcessedTimeRef.current = -200; // Reset last processed video frame timestamp
    setRecordingSeconds(0);
    
    let startTime = Date.now();
    const tempHistory = [];

    // Slice frames every 200ms (5 FPS) - Only run wall-clock interval for webcam
    if (sourceMode === 'webcam') {
      // Set up video feed recorder
      recordedChunksRef.current = [];
      let stream = null;
      if (videoRef.current && videoRef.current.srcObject) {
        stream = videoRef.current.srcObject;
      } else if (videoRef.current && videoRef.current.captureStream) {
        stream = videoRef.current.captureStream();
      }

      if (stream) {
        try {
          let options = {};
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            options = { mimeType: 'video/webm;codecs=vp9' };
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { mimeType: 'video/webm;codecs=vp8' };
          } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options = { mimeType: 'video/webm' };
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4' };
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };
          mediaRecorder.start(100); // chunk every 100ms
          console.log("[BioForm] MediaRecorder started successfully.", options);
        } catch (err) {
          console.error("[BioForm] Failed to start MediaRecorder:", err);
        }
      } else {
        console.warn("[BioForm] No webcam stream found to record.");
      }

      recordingIntervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        const landmarks = latestLandmarksRef.current;
        
        if (landmarks) {
          const frameMetrics = extractMetrics(landmarks, elapsedMs);
          if (frameMetrics) {
            tempHistory.push(frameMetrics);
            historyRef.current = [...tempHistory];
            setHistory([...tempHistory]);
          }
        }
      }, 200);
    }

    // Recording duration stopwatch
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    setIsRecording(false);
    isRecordingRef.current = false;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (sourceModeRef.current === 'file' && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.playbackRate = 1.0; // Reset playback rate to normal
      setIsPlaying(false);
    }
    
    const finalHistory = historyRef.current;
    
    // Stop MediaRecorder if running and wait for the file blob compilation
    if (sourceModeRef.current === 'webcam' && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType || 'video/webm' 
        });
        const fileExt = (mediaRecorderRef.current.mimeType || 'video/webm').includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `webcam_recording_${Date.now()}.${fileExt}`, { type: blob.type });
        
        if (finalHistory.length > 0) {
          onAnalysisComplete(finalHistory, sourceModeRef.current, file);
        } else {
          alert("No movement data was captured. Ensure your body is fully visible in the camera frame and try again.");
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      if (finalHistory.length > 0) {
        onAnalysisComplete(finalHistory, sourceModeRef.current, rawFile);
      } else {
        alert("No movement data was captured. Ensure your body is fully visible in the camera frame and try again.");
      }
    }
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(e => console.error(e));
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className="text-[10px] font-medium tracking-[0.2em] text-[#ffe16d]/60 uppercase">
          Performance Capture
        </div>
        <h1 className="text-3xl font-light tracking-wide text-white/90">
          Pose Tracker
        </h1>
      </div>

      {/* Source switcher */}
      <div className="flex bg-[#2a2a2a]/40 rounded-full p-1.5 w-full mx-auto max-w-[260px] mb-6" style={{ opacity: isRecording ? 0.4 : 1, pointerEvents: isRecording ? 'none' : 'auto' }}>
        <button type="button" className={`flex-1 py-3 rounded-full text-xs font-medium tracking-widest transition-all duration-300 ${sourceMode === 'webcam' ? 'bg-[#111] text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`} onClick={() => setSourceMode('webcam')}>
          WEBCAM
        </button>
        <button type="button" className={`flex-1 py-3 rounded-full text-xs font-medium tracking-widest transition-all duration-300 ${sourceMode === 'file' ? 'bg-[#111] text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`} onClick={() => setSourceMode('file')}>
          UPLOAD
        </button>
      </div>

      {/* Video & Canvas Capture Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', maxWidth: '100%', background: '#262626', borderRadius: 32, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: sourceMode === 'file' ? 'contain' : 'cover', pointerEvents: 'none', transform: sourceMode === 'webcam' ? 'scaleX(-1)' : 'none' }}
            playsInline
            muted
          />

          {/* Precise Drawing Overlay */}
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: sourceMode === 'file' ? 'contain' : 'cover', transform: sourceMode === 'webcam' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Drag & Drop File Upload Overlay */}
          {sourceMode === 'file' && !uploadedFileUrl && (
            <label style={{ position: 'absolute', inset: 0, background: 'rgba(38,38,38,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', padding: 32, textAlign: 'center', zIndex: 20 }}>
              <UploadCloud size={40} className="text-[#ffe16d] mb-4 drop-shadow-[0_0_15px_rgba(255,225,109,0.4)]" />
              <div>
                <div className="text-sm font-medium text-white/90 mb-2 drop-shadow-[0_0_10px_rgba(255,225,109,0.1)]">Upload Kinematic Video</div>
                <div className="text-xs text-white/40 font-light">MP4 / WebM — drag & drop or browse</div>
              </div>
              <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          )}

          {/* Initial Loading Overlay */}
          {modelLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(38,38,38,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 24, zIndex: 30 }}>
              <RefreshCw size={32} className="text-[#ffe16d] animate-spin mb-2 drop-shadow-[0_0_15px_rgba(255,225,109,0.4)]" />
              <div className="text-sm font-medium text-white/90 drop-shadow-[0_0_10px_rgba(255,225,109,0.1)]">Initializing System</div>
              <p className="text-xs text-white/40 font-light">Configuring BlazePose CNN model via WebGL...</p>
            </div>
          )}

          {/* Camera Access Error Overlay */}
          {error && !modelLoading && sourceMode === 'webcam' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(38,38,38,0.95)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 24, zIndex: 30 }}>
              <AlertCircle size={36} className="text-[#ff6b6b]" />
              <div className="text-sm font-medium text-[#ff6b6b]">Camera Error</div>
              <p className="text-xs text-white/60">{error}</p>
              <button className="px-6 py-2 mt-4 rounded-full bg-[#111] text-white/80 text-xs font-medium tracking-widest hover:bg-[#0a0a0a]" onClick={() => startWebcam()}>RETRY</button>
            </div>
          )}

          {/* Live Recording Pulse */}
          {isRecording && (
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,17,0.88)', backdropFilter: 'blur(12px)', borderRadius: 999, padding: '8px 16px', zIndex: 10 }}>
              <span className="w-2 h-2 rounded-full bg-[#ff6b6b] animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#ff6b6b] uppercase">
                {sourceMode === 'file' ? `Analyzing: ${analysisProgress}%` : `Recording ${recordingSeconds}s`}
              </span>
            </div>
          )}
          
          {/* Skeleton Tracking Status */}
          {!modelLoading && !error && (sourceMode === 'webcam' || uploadedFileUrl) && (
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,17,0.88)', backdropFilter: 'blur(12px)', borderRadius: 999, padding: '8px 16px', zIndex: 10, boxShadow: latestLandmarksRef.current ? '0 0 20px rgba(141,232,144,0.15)' : '0 0 20px rgba(255,225,109,0.15)' }}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${latestLandmarksRef.current ? 'bg-[#8de890] shadow-[0_0_10px_#8de890]' : 'bg-[#ffe16d] shadow-[0_0_10px_#ffe16d]'}`} />
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${latestLandmarksRef.current ? 'text-[#8de890]' : 'text-[#ffe16d]'}`}>
                {latestLandmarksRef.current ? 'Body Detected' : 'Position Body'}
              </span>
            </div>
          )}
        </div>

        {/* CONTROLS AREA */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
          {sourceMode === 'file' && uploadedFileUrl && (
            <div className="bg-[#333333] rounded-[20px] p-4 flex justify-between items-center w-full max-w-[400px]">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                <FolderOpen size={16} className="text-white/40 flex-shrink-0" />
                <span className="text-xs font-mono text-white/80 overflow-hidden whitespace-nowrap text-ellipsis">{uploadedFileName}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-white/60 hover:text-white" onClick={togglePlayback}>
                  {isPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                </button>
                <label className="px-4 py-2 rounded-full bg-[#111] text-[10px] font-medium tracking-widest text-white/60 hover:text-white cursor-pointer">
                  CHANGE
                  <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }}>
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={modelLoading || (sourceMode === 'webcam' && (error || !latestLandmarksRef.current)) || (sourceMode === 'file' && !uploadedFileUrl)}
                className="w-full max-w-[280px] py-4 rounded-full bg-[#333333] text-[#ffe16d] text-xs font-medium tracking-widest hover:bg-[#404040] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 0 30px rgba(255,225,109,0.2)', border: '1px solid rgba(255,225,109,0.15)' }}
              >
                <Video size={16} />
                {sourceMode === 'file' ? 'ANALYZE VIDEO' : 'START RECORDING'}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full max-w-[280px] py-4 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs font-medium tracking-widest hover:bg-[#ff6b6b]/30 transition-all flex items-center justify-center gap-3"
                style={{ boxShadow: '0 0 30px rgba(255,107,107,0.2)', border: '1px solid rgba(255,107,107,0.2)' }}
              >
                <VideoOff size={16} />
                STOP & ANALYZE ({history.length} FRAMES)
              </button>
            )}
          </div>
          
          <p className="text-[10px] text-white/40 leading-relaxed max-w-sm text-center font-medium mt-2">
            {sourceMode === 'file'
              ? 'Upload a video, start analysis. BlazePose tracks the skeleton and generates a report.'
              : 'Stand back so your full body is visible. Start, perform your routine, then stop to generate the report.'}
          </p>
        </div>
      </div>
    </div>
  );
}
