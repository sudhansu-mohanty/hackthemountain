/**
 * Calculate the absolute angle in degrees (0 to 180) formed at joint B
 * using the dot product and cosine rule over points A, B, and C.
 * 
 * @param {Object} A - Point A {x, y}
 * @param {Object} B - Point B {x, y} - The vertex
 * @param {Object} C - Point C {x, y}
 * @returns {number} Angle in degrees
 */
export function calculateAngle(A, B, C) {
  if (!A || !B || !C) return 0;

  // Vector BA
  const ba = {
    x: A.x - B.x,
    y: A.y - B.y
  };

  // Vector BC
  const bc = {
    x: C.x - B.x,
    y: C.y - B.y
  };

  // Dot product
  const dotProduct = ba.x * bc.x + ba.y * bc.y;

  // Magnitudes
  const magnitudeBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }

  // Cosine of the angle
  let cosTheta = dotProduct / (magnitudeBA * magnitudeBC);

  // Clamp cosTheta to the range [-1.0, 1.0] to handle floating-point inaccuracies
  cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));

  // Angle in radians
  const angleRad = Math.acos(cosTheta);

  // Convert to degrees
  const angleDeg = (angleRad * 180.0) / Math.PI;

  // Return formatted to 1 decimal place as a number
  return parseFloat(angleDeg.toFixed(1));
}

/**
 * Extracts and calculates biomechanical metrics from a set of MediaPipe pose landmarks.
 * 
 * @param {Array} landmarks - MediaPipe pose landmarks (length 33)
 * @param {number} timestampMs - Timestamp of the frame in milliseconds
 * @returns {Object|null} Formatted metrics or null if landmarks are insufficient
 */
export function extractMetrics(landmarks, timestampMs) {
  if (!landmarks || landmarks.length < 33) {
    return null;
  }

  // MediaPipe Pose Landmark Indices:
  // Left Shoulder: 11, Right Shoulder: 12
  // Left Elbow: 13, Right Elbow: 14
  // Left Wrist: 15, Right Wrist: 16
  // Left Hip: 23, Right Hip: 24
  // Left Knee: 25, Right Knee: 26
  // Left Ankle: 27, Right Ankle: 28
  // Left Foot Index: 31, Right Foot Index: 32

  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lElbow = landmarks[13];
  const rElbow = landmarks[14];
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lKnee = landmarks[25];
  const rKnee = landmarks[26];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];
  const lFootIndex = landmarks[31];
  const rFootIndex = landmarks[32];

  // Calculate joint angles
  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
  const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);

  // New Joint Parameters:
  // Hip Flexion (Shoulder-Hip-Knee)
  const leftHipAngle = calculateAngle(lShoulder, lHip, lKnee);
  const rightHipAngle = calculateAngle(rShoulder, rHip, rKnee);

  // Shoulder Abduction (Hip-Shoulder-Elbow)
  const leftShoulderAngle = calculateAngle(lHip, lShoulder, lElbow);
  const rightShoulderAngle = calculateAngle(rHip, rShoulder, rElbow);

  // Ankle Dorsiflexion (Knee-Ankle-FootIndex)
  const leftAnkleAngle = calculateAngle(lKnee, lAnkle, lFootIndex);
  const rightAnkleAngle = calculateAngle(rKnee, rAnkle, rFootIndex);

  // Torso Lean/Tilt (Torso midline compared to a vertical axis)
  const midShoulder = {
    x: (lShoulder.x + rShoulder.x) / 2,
    y: (lShoulder.y + rShoulder.y) / 2
  };
  const midHip = {
    x: (lHip.x + rHip.x) / 2,
    y: (lHip.y + rHip.y) / 2
  };
  // Vertical axis vector going straight up from the midHip vertex
  const verticalTop = {
    x: midHip.x,
    y: midHip.y - 1
  };
  const torsoTilt = calculateAngle(midShoulder, midHip, verticalTop);

  // Calculate symmetry deltas (absolute difference)
  const kneeAsymmetryDelta = parseFloat(Math.abs(leftKneeAngle - rightKneeAngle).toFixed(1));
  const elbowAsymmetryDelta = parseFloat(Math.abs(leftElbowAngle - rightElbowAngle).toFixed(1));
  const hipAsymmetryDelta = parseFloat(Math.abs(leftHipAngle - rightHipAngle).toFixed(1));
  const shoulderAsymmetryDelta = parseFloat(Math.abs(leftShoulderAngle - rightShoulderAngle).toFixed(1));
  const ankleAsymmetryDelta = parseFloat(Math.abs(leftAnkleAngle - rightAnkleAngle).toFixed(1));

  return {
    timestamp_ms: Math.round(timestampMs),
    left_knee_angle: leftKneeAngle,
    right_knee_angle: rightKneeAngle,
    knee_asymmetry_delta: kneeAsymmetryDelta,
    left_elbow_angle: leftElbowAngle,
    right_elbow_angle: rightElbowAngle,
    elbow_asymmetry_delta: elbowAsymmetryDelta,
    left_hip_angle: leftHipAngle,
    right_hip_angle: rightHipAngle,
    hip_asymmetry_delta: hipAsymmetryDelta,
    left_shoulder_angle: leftShoulderAngle,
    right_shoulder_angle: rightShoulderAngle,
    shoulder_asymmetry_delta: shoulderAsymmetryDelta,
    left_ankle_angle: leftAnkleAngle,
    right_ankle_angle: rightAnkleAngle,
    ankle_asymmetry_delta: ankleAsymmetryDelta,
    torso_tilt_angle: torsoTilt
  };
}
