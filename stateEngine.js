const STATES = {
  EMOTIONLESS: 'emotionless',
  JOY:         'joy',
  DISENGAGED:  'disengaged',
};

let _joyHold        = 0;
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

  // ── Joy ───────────────────────────────────────────────
  const mouthOpen   = signals.mouthOpenness > CONFIG.joy.mouthOpenThreshold;
  const mouthClosed = signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis;

  if (mouthOpen)   { _joyHold++; }
  if (mouthClosed) { _joyHold = 0; }

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
  const disengReady = _disengHold >= CONFIG.disengaged.holdFrames;
  const disengGone  = _disengRelease >= CONFIG.disengaged.releaseFrames;

  if (disengReady) {
    _currentState = STATES.DISENGAGED;
    _disengDuration++;
    _joyHold = 0;
  } else if (_currentState === STATES.DISENGAGED && disengGone) {
    _disengDuration = 0;
    _currentState   = STATES.EMOTIONLESS;
  } else if (_currentState !== STATES.DISENGAGED) {
    _currentState = joyReady ? STATES.JOY : STATES.EMOTIONLESS;
  }

  return {
    state:          _currentState,
    changed:        _currentState !== prev,
    disengDuration: _disengDuration,
    debugHold:      disengReady ? _disengHold : _joyHold,
  };
}

function forceNeutral() {
  _currentState   = STATES.EMOTIONLESS;
  _joyHold        = 0;
  _disengHold     = 0;
  _disengRelease  = 0;
  _disengDuration = 0;
  _noFaceCount    = 0;
}
