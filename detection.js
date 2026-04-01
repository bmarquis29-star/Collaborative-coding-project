// ─── detection.js ────────────────────────────────────────
// Receives raw FaceMesh landmarks → returns named signal values.
// NO state logic here. Only math.

// Euclidean distance between two landmark points
function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Returns normalized mouth openness (0 = closed, ~0.1 = wide open)
// Normalized by face height (nose tip to chin) so it's scale-independent.
function getMouthOpenness(landmarks) {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const noseTip  = landmarks[1];
  const chin     = landmarks[152];

  const mouthGap  = dist2D(upperLip, lowerLip);
  const faceHeight = dist2D(noseTip, chin);

  if (faceHeight === 0) return 0;
  return mouthGap / faceHeight;
}

// Returns normalized iris X offset from eye center (left eye).
// 0 = looking straight, positive = looking right, negative = looking left.
// Uses: iris center (468), inner corner (133), outer corner (33)
function getGazeXOffset(landmarks) {
  // ml5 v1 FaceMesh includes iris landmarks at indices 468–477
  const iris        = landmarks[468]; // left iris center
  const innerCorner = landmarks[133];
  const outerCorner = landmarks[33];

  if (!iris || !innerCorner || !outerCorner) return 0;

  const eyeWidth = dist2D(innerCorner, outerCorner);
  if (eyeWidth === 0) return 0;

  const eyeCenterX = (innerCorner.x + outerCorner.x) / 2;
  return (iris.x - eyeCenterX) / eyeWidth; // normalized, roughly –0.5 to +0.5
}

// Returns frame-to-frame movement of the nose tip (landmark 1).
// High values = head is moving around (restless/uncomfortable).
let _prevNoseX = null;
let _prevNoseY = null;
let _smoothedMovement = 0;

function getHeadMovement(landmarks) {
  const nose = landmarks[1];

  if (_prevNoseX === null) {
    _prevNoseX = nose.x;
    _prevNoseY = nose.y;
    return 0;
  }

  const dx = nose.x - _prevNoseX;
  const dy = nose.y - _prevNoseY;
  const raw = Math.sqrt(dx * dx + dy * dy);

  // Exponential smoothing to avoid single-frame spikes
  _smoothedMovement = _smoothedMovement * CONFIG.uncomfortable.movementDecay
                    + raw * (1 - CONFIG.uncomfortable.movementDecay);

  _prevNoseX = nose.x;
  _prevNoseY = nose.y;

  return _smoothedMovement;
}

// Master function — call this each frame with the landmark array.
// Returns a plain signals object consumed by stateEngine.js
function extractSignals(landmarks) {
  return {
    mouthOpenness: getMouthOpenness(landmarks),
    gazeXOffset:   Math.abs(getGazeXOffset(landmarks)), // absolute — either direction counts
    headMovement:  getHeadMovement(landmarks),
  };
}
