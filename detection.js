let _previousNoseTip = null;
let _smoothedHeadMovement = 0;

function dist2D(a, b) {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function safePoint(landmarks, index) {
  return Array.isArray(landmarks) && landmarks[index] ? landmarks[index] : null;
}

function extractSignals(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 68) {
    return {
      noFace: true,
      mouthOpenness: 0,
      gazeXOffset: 0,
      headMovement: 0,
      faceScale: 0,
    };
  }

  const leftMouthCorner = safePoint(landmarks, 48);
  const rightMouthCorner = safePoint(landmarks, 54);
  const innerTopLip = safePoint(landmarks, 62);
  const innerBottomLip = safePoint(landmarks, 66);
  const noseTip = safePoint(landmarks, 30);
  const leftEye = safePoint(landmarks, 36);
  const rightEye = safePoint(landmarks, 45);

  const faceScale = dist2D(leftEye, rightEye) || 1;

  const mouthWidth = dist2D(leftMouthCorner, rightMouthCorner) || 1;
  const mouthGap = dist2D(innerTopLip, innerBottomLip);
  const mouthOpenness = mouthGap / mouthWidth;

  const eyeCenterX = leftEye && rightEye ? (leftEye.x + rightEye.x) / 2 : 0;
  const gazeXOffset = noseTip ? Math.abs(noseTip.x - eyeCenterX) / faceScale : 0;

  let headMovement = 0;
  if (noseTip && _previousNoseTip) {
    const rawMovement = dist2D(noseTip, _previousNoseTip);
    _smoothedHeadMovement = (_smoothedHeadMovement * CONFIG.disengaged.movementDecay)
      + (rawMovement * (1 - CONFIG.disengaged.movementDecay));
    headMovement = _smoothedHeadMovement;
  }

  if (noseTip) {
    _previousNoseTip = { x: noseTip.x, y: noseTip.y };
  }

  return {
    noFace: false,
    mouthOpenness,
    gazeXOffset,
    headMovement,
    faceScale,
  };
}

function resetDetectionState() {
  _previousNoseTip = null;
  _smoothedHeadMovement = 0;
}

window.extractSignals = extractSignals;
window.resetDetectionState = resetDetectionState;
