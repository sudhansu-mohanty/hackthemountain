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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div className="eyebrow-muted" style={{ marginBottom: 4 }}>Performance Capture</div>
          <div className="h-title" style={{ fontSize: 22, letterSpacing: '0.04em' }}>Pose Tracker</div>
        </div>
      </div>

      {/* Source switcher */}
      <div className="seg" style={{ opacity: isRecording ? 0.4 : 1, pointerEvents: isRecording ? 'none' : 'auto' }}>
        <button type="button" className={sourceMode === 'webcam' ? 'active' : ''} onClick={() => setSourceMode('webcam')}>
          Webcam
        </button>
        <button type="button" className={sourceMode === 'file' ? 'active' : ''} onClick={() => setSourceMode('file')}>
          Upload Video
        </button>
      </div>

      {/* Video & Canvas Capture Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', maxWidth: '100%', background: 'var(--aura-card)', borderRadius: 4, border: '1px solid var(--aura-border-soft)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', transform: sourceMode === 'webcam' ? 'scaleX(-1)' : 'none' }}
            playsInline
            muted
          />

          {/* Precise Drawing Overlay */}
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: sourceMode === 'webcam' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Drag & Drop File Upload Overlay */}
          {sourceMode === 'file' && !uploadedFileUrl && (
            <label style={{ position: 'absolute', inset: 0, background: 'rgba(12,15,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', padding: 32, textAlign: 'center', zIndex: 20 }}>
              <UploadCloud size={40} style={{ color: 'var(--aura-cyan)', animation: 'auraPulse 2s ease-in-out infinite' }} />
              <div>
                <div className="label-syne" style={{ fontSize: 13, color: 'var(--aura-body)', marginBottom: 4 }}>Upload Kinematic Video</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)' }}>MP4 / WebM — drag & drop or browse</div>
              </div>
              <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          )}

          {/* Initial Loading Overlay */}
          {modelLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,15,15,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 24, zIndex: 30 }}>
              <RefreshCw size={32} style={{ color: 'var(--aura-cyan)', animation: 'auraSpin 1s linear infinite' }} />
              <div className="label-syne" style={{ fontSize: 13, color: 'var(--aura-body)' }}>Initializing System</div>
              <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-muted)', maxWidth: 280 }}>Configuring BlazePose CNN model via WebGL...</p>
            </div>
          )}

          {/* Camera Access Error Overlay */}
          {error && !modelLoading && sourceMode === 'webcam' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,15,15,0.95)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 24, zIndex: 30 }}>
              <AlertCircle size={36} style={{ color: 'var(--aura-rose)' }} />
              <div className="label-syne" style={{ fontSize: 13, color: 'var(--aura-rose)' }}>Camera Error</div>
              <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--aura-cream)', maxWidth: 320 }}>{error}</p>
              <button className="btn-ghost" style={{ padding: '10px 20px', fontSize: 11 }} onClick={() => startWebcam()}>Retry Camera</button>
            </div>
          )}

          {/* Live Recording Pulse */}
          {isRecording && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(12,15,15,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(110,231,255,0.25)', borderRadius: 999, padding: '6px 12px', zIndex: 10 }}>
              <span style={{ width: 8, height: 8, background: 'var(--aura-cyan)', borderRadius: '50%', animation: 'auraPulse 1s ease-in-out infinite' }} />
              <span className="eyebrow" style={{ fontSize: 9, color: 'var(--aura-cyan)' }}>
                {sourceMode === 'file' ? `Analyzing: ${analysisProgress}%` : `Recording ${recordingSeconds}s`}
              </span>
            </div>
          )}
          
          {/* High-speed analysis scanner overlay */}
          {sourceMode === 'file' && isRecording && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,15,15,0.35)', pointerEvents: 'none', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'var(--aura-cyan)', boxShadow: '0 0 12px rgba(110,231,255,0.8)', animation: 'auraScan 1.5s ease-in-out infinite' }} />
              <div style={{ background: 'rgba(12,15,15,0.92)', backdropFilter: 'blur(12px)', border: '1px solid var(--aura-border-soft)', borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="eyebrow-muted" style={{ fontSize: 9 }}>Scanning frames</span>
                  <span className="eyebrow" style={{ fontSize: 9 }}>{analysisProgress}%</span>
                </div>
                <div className="bar"><span style={{ width: `${analysisProgress}%` }} /></div>
              </div>
            </div>
          )}

          {/* Skeleton Scanning Keyframes */}
          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0.3; }
              50% { top: 100%; opacity: 1; }
              100% { top: 0%; opacity: 0.3; }
            }
          `}</style>
          
          {/* Skeleton Tracking Status */}
          {!modelLoading && !error && (sourceMode === 'webcam' || uploadedFileUrl) && (
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(12,15,15,0.88)', backdropFilter: 'blur(12px)', border: `1px solid ${latestLandmarksRef.current ? 'rgba(141,232,144,0.3)' : 'rgba(255,203,107,0.3)'}`, borderRadius: 999, padding: '6px 12px', zIndex: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: latestLandmarksRef.current ? 'var(--aura-emerald)' : 'var(--aura-amber)', animation: 'auraPulse 1.5s ease-in-out infinite' }} />
              <span className="eyebrow" style={{ fontSize: 9, color: latestLandmarksRef.current ? 'var(--aura-emerald)' : 'var(--aura-amber)' }}>
                {latestLandmarksRef.current ? 'Body Detected' : 'Position Body'}
              </span>
            </div>
          )}
        </div>

        {/* CONTROLS AREA */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
          {sourceMode === 'file' && uploadedFileUrl && (
            <div className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <FolderOpen size={14} style={{ color: 'var(--aura-cyan)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--aura-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFileName}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={togglePlayback}>
                  {isPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                </button>
                <label className="btn-ghost" style={{ padding: '6px 10px', fontSize: 10, cursor: 'pointer' }}>
                  Change
                  <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center' }}>
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={modelLoading || (sourceMode === 'webcam' && (error || !latestLandmarksRef.current)) || (sourceMode === 'file' && !uploadedFileUrl)}
                className="btn-gold"
                style={{ opacity: (modelLoading || (sourceMode === 'webcam' && (error || !latestLandmarksRef.current)) || (sourceMode === 'file' && !uploadedFileUrl)) ? 0.4 : 1, cursor: (modelLoading || (sourceMode === 'webcam' && (error || !latestLandmarksRef.current)) || (sourceMode === 'file' && !uploadedFileUrl)) ? 'not-allowed' : 'pointer' }}
              >
                <Video size={14} />
                {sourceMode === 'file' ? 'Analyze Video' : 'Start Recording'}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="btn-ghost"
                style={{ color: 'var(--aura-rose)', borderColor: 'rgba(255,143,163,0.4)', width: '100%' }}
              >
                <VideoOff size={14} style={{ color: 'var(--aura-rose)' }} />
                Stop & Analyze ({history.length} frames)
              </button>
            )}
          </div>
          
          <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '12px 14px' }}>
            <Info size={13} style={{ color: 'var(--aura-cyan)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="label-syne" style={{ fontSize: 11, color: 'var(--aura-body)', marginBottom: 4 }}>
                {sourceMode === 'file' ? 'Video Analysis' : 'Webcam Capture'}
              </div>
              <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-muted)', lineHeight: 1.5, margin: 0 }}>
                {sourceMode === 'file'
                  ? 'Upload a video, start analysis. BlazePose tracks skeleton in real-time and generates your biomechanical report.'
                  : 'Stand back so your full body is visible. Start, perform your routine, then stop to generate the report.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Real-time Angles Board */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--aura-border-soft)' }}>
            <Activity size={14} style={{ color: 'var(--aura-cyan)' }} />
            <div className="label-syne" style={{ fontSize: 12, color: 'var(--aura-body)' }}>Live Telemetry</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Knee Flexion', left: liveMetrics.leftKnee, right: liveMetrics.rightKnee, color: 'var(--aura-cyan)' },
              { label: 'Elbow Flexion', left: liveMetrics.leftElbow, right: liveMetrics.rightElbow, color: 'var(--aura-emerald)' },
              { label: 'Hip Flexion', left: liveMetrics.leftHip, right: liveMetrics.rightHip, color: 'var(--aura-amber)' },
            ].map((m) => (
              <div key={m.label}>
                <div className="eyebrow-muted" style={{ fontSize: 9, marginBottom: 6 }}>{m.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, textAlign: 'center' }}>
                  {[['L', m.left], ['R', m.right]].map(([side, val]) => (
                    <div key={side} style={{ background: 'var(--aura-bg)', border: '1px solid var(--aura-border-soft)', borderRadius: 4, padding: '8px 6px' }}>
                      <div className="eyebrow-muted" style={{ fontSize: 8 }}>{side}</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontSize: 22, color: m.color, lineHeight: 1.1 }}>{val !== null ? `${val}°` : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--aura-border-soft)', paddingTop: 12 }}>
              <div className="eyebrow-muted" style={{ fontSize: 9, marginBottom: 6 }}>Torso Tilt</div>
              <div style={{ background: 'var(--aura-bg)', border: '1px solid var(--aura-border-soft)', borderRadius: 4, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-muted)' }}>Lean Angle</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500, color: 'var(--aura-cyan)' }}>{liveMetrics.torsoTilt !== null ? `${liveMetrics.torsoTilt}°` : '—'}</span>
              </div>
            </div>

            <div>
              <div className="eyebrow-muted" style={{ fontSize: 9, marginBottom: 6 }}>Knee Asymmetry Delta</div>
              <div style={{ background: 'var(--aura-bg)', border: `1px solid ${liveMetrics.kneeAsymmetry > 10 ? 'rgba(255,203,107,0.4)' : 'var(--aura-border-soft)'}`, borderRadius: 4, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-muted)' }}>Δ difference</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500, color: liveMetrics.kneeAsymmetry > 10 ? 'var(--aura-amber)' : 'var(--aura-cream)' }}>{liveMetrics.kneeAsymmetry !== null ? `${liveMetrics.kneeAsymmetry}°` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline spec */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Pipeline Spec</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['BlazePose — single-person topology', 'Sampling: 5 Hz (200ms intervals)', 'Cosine rule vector dot product', 'Output: biomechanical array JSON'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--aura-gold)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--aura-muted)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
