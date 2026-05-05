const STATES = {
  EMOTIONLESS: 'emotionless',
  JOY:         'joy',
  SADNESS:     'sadness',
  ANXIETY:     'anxiety',
  DISENGAGED:  'disengaged',
};

let _joyHold        = 0;
let _sadnessHold    = 0;
let _sadnessRelease = 0;
let _anxietyHold    = 0;
let _anxietyRelease = 0;
let _disengHold     = 0;
let _disengRelease  = 0;
let _disengDuration = 0;
let _noFaceCount    = 0;  // counts frames with no face detected
let _currentState   = STATES.EMOTIONLESS;

const NO_FACE_THRESHOLD = 15; // frames before no-face counts as disengaged

function updateState(signals) {
  const prev = _currentState;

  // ── No face in frame → disengaged immediately ─────────
  if (signals.noFace) {
    _noFaceCount++;
    if (_noFaceCount >= NO_FACE_THRESHOLD) {
      _currentState   = STATES.DISENGAGED;
      _disengDuration++;
      _joyHold        = 0;
    }
    return {
      state:          _currentState,
      changed:        _currentState !== prev,
      disengDuration: _disengDuration,
      debugHold:      _noFaceCount,
    };
  } else {
    _noFaceCount = 0; // face is back, reset counter
  }

  const neutralMouthBand = signals.mouthOpenness >= CONFIG.sadness.mouthCloseThreshold
                       && signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis;
  const calmFace = neutralMouthBand
                && signals.gazeXOffset < CONFIG.disengaged.gazeHysteresis
                && signals.headMovement < CONFIG.sadness.movementLimit;

  if (calmFace) {
    _joyHold = 0;
    _sadnessHold = 0;
    _sadnessRelease = 0;
    _anxietyHold = 0;
    _anxietyRelease = 0;
    _disengHold = 0;
    _disengRelease = 0;
    _currentState = STATES.EMOTIONLESS;
    return {
      state:          _currentState,
      changed:        _currentState !== prev,
      disengDuration: _disengDuration,
      debugHold:      0,
    };
  }

  // ── Joy ───────────────────────────────────────────────
  const mouthOpen   = signals.mouthOpenness > CONFIG.joy.mouthOpenThreshold;
  const mouthClosed = signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis;

  if (mouthOpen)   { _joyHold++; }
  if (mouthClosed) { _joyHold = 0; }

  // ── Sadness ───────────────────────────────────────────
  const sadnessLowMouth = signals.mouthOpenness < CONFIG.sadness.mouthCloseThreshold;
  const sadnessQuietFace = signals.gazeXOffset < CONFIG.sadness.gazeLimit
                       && signals.headMovement < CONFIG.sadness.movementLimit;

  if (sadnessLowMouth && sadnessQuietFace) {
    _sadnessHold++;
    _sadnessRelease = 0;
  } else {
    _sadnessRelease++;
    _sadnessHold = Math.max(0, _sadnessHold - 1);
  }

  // ── Anxiety ────────────────────────────────────────────
  const anxietyOn = signals.gazeXOffset > CONFIG.anxiety.gazeOffsetThreshold
                 || signals.headMovement > CONFIG.anxiety.movementThreshold;
  const anxietyOff = signals.gazeXOffset < CONFIG.disengaged.gazeHysteresis
                 && signals.headMovement < CONFIG.anxiety.movementThreshold * 0.5;

  if (anxietyOn) {
    _anxietyHold++;
    _anxietyRelease = 0;
  } else if (anxietyOff) {
    _anxietyRelease++;
    _anxietyHold = Math.max(0, _anxietyHold - 1);
  }

  // ── Disengaged — looking away ─────────────────────────
  const gazeAverted = signals.gazeXOffset  > CONFIG.disengaged.gazeOffsetThreshold;
  const fidgeting   = signals.headMovement > CONFIG.disengaged.movementThreshold;
  const disengOn    = gazeAverted || fidgeting;
  const disengOff   = signals.gazeXOffset  < CONFIG.disengaged.gazeHysteresis
                   && signals.headMovement < CONFIG.disengaged.movementThreshold * 0.5;

  if (disengOn)  { _disengHold++;    _disengRelease = 0; }
  if (disengOff) { _disengRelease++; _disengHold = Math.max(0, _disengHold - 1); }

  // ── Resolve state ─────────────────────────────────────
  const joyReady    = _joyHold    >= CONFIG.joy.holdFrames;
  const sadnessReady = _sadnessHold >= CONFIG.sadness.holdFrames;
  const sadnessGone  = _sadnessRelease >= CONFIG.sadness.releaseFrames;
  const anxietyReady = _anxietyHold >= CONFIG.anxiety.holdFrames;
  const anxietyGone  = _anxietyRelease >= CONFIG.anxiety.releaseFrames;
  const disengReady = _disengHold >= CONFIG.disengaged.holdFrames;
  const disengGone  = _disengRelease >= CONFIG.disengaged.releaseFrames;

  if (disengReady) {
    _currentState = STATES.DISENGAGED;
    _disengDuration++;
    _joyHold = 0;
  } else if (_currentState === STATES.DISENGAGED && disengGone) {
    _disengDuration = 0;
    _currentState   = STATES.EMOTIONLESS;
  } else if (joyReady) {
    _currentState = STATES.JOY;
  } else if (anxietyReady) {
    _currentState = STATES.ANXIETY;
  } else if (_currentState === STATES.ANXIETY && anxietyGone) {
    _currentState = STATES.EMOTIONLESS;
  } else if (sadnessReady) {
    _currentState = STATES.SADNESS;
  } else if (_currentState === STATES.SADNESS && sadnessGone) {
    _currentState = STATES.EMOTIONLESS;
  } else if (_currentState !== STATES.DISENGAGED) {
    _currentState = STATES.EMOTIONLESS;
  }

  return {
    state:          _currentState,
    changed:        _currentState !== prev,
    disengDuration: _disengDuration,
    debugHold:      disengReady ? _disengHold : (_currentState === STATES.ANXIETY ? _anxietyHold : (_currentState === STATES.SADNESS ? _sadnessHold : _joyHold)),
  };
}

function forceNeutral() {
  _currentState   = STATES.EMOTIONLESS;
  _joyHold        = 0;
  _sadnessHold    = 0;
  _sadnessRelease = 0;
  _anxietyHold    = 0;
  _anxietyRelease = 0;
  _disengHold     = 0;
  _disengRelease  = 0;
  _disengDuration = 0;
  _noFaceCount    = 0;
}