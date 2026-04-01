const STATES = {
  NEUTRAL:      'neutral',
  EMOTIONLESS:  'emotionless',
  JOY:          'joy',
  DISENGAGED:   'disengaged',
};

let _joyHold        = 0;
let _joyRelease     = 0;
let _disengHold     = 0;
let _disengRelease  = 0;
let _emotionlessHold    = 0;
let _emotionlessRelease = 0;
let _currentState   = STATES.NEUTRAL;
let _disengDuration = 0;

// how long a blank stare must hold before becoming EMOTIONLESS
const EMOTIONLESS_HOLD    = 40;  // ~1.3 seconds at 30fps
const EMOTIONLESS_RELEASE = 20;

function updateState(signals) {
  const prev = _currentState;

  // ── Joy signal ─────────────────────────────────────────
  // requires mouth clearly open — real smile or open mouth
  if (signals.mouthOpenness > CONFIG.joy.mouthOpenThreshold) {
    _joyHold++; _joyRelease = 0;
  } else if (signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis) {
    _joyRelease++; _joyHold = Math.max(0, _joyHold - 1);
  }

  // ── Disengaged signal ──────────────────────────────────
  const gazeAverted = signals.gazeXOffset  > CONFIG.disengaged.gazeOffsetThreshold;
  const fidgeting   = signals.headMovement > CONFIG.disengaged.movementThreshold;
  const disengOn    = gazeAverted || fidgeting;
  const disengOff   = signals.gazeXOffset  < CONFIG.disengaged.gazeHysteresis
                   && signals.headMovement < CONFIG.disengaged.movementThreshold * 0.5;

  if (disengOn)  { _disengHold++; _disengRelease = 0; }
  if (disengOff) { _disengRelease++; _disengHold = Math.max(0, _disengHold - 1); }

  // ── Emotionless signal ─────────────────────────────────
  // blank stare = mouth closed + not disengaged + not joyful
  const isBlank = signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis
               && !gazeAverted
               && !fidgeting;

  if (isBlank) {
    _emotionlessHold++; _emotionlessRelease = 0;
  } else {
    _emotionlessRelease++; _emotionlessHold = Math.max(0, _emotionlessHold - 1);
  }

  // ── Resolve state ──────────────────────────────────────
  // priority: disengaged > joy > emotionless > neutral
  const joyReady         = _joyHold         >= CONFIG.joy.holdFrames;
  const disengReady      = _disengHold       >= CONFIG.disengaged.holdFrames;
  const emotionlessReady = _emotionlessHold  >= EMOTIONLESS_HOLD;

  if (disengReady) {
    _currentState = STATES.DISENGAGED;
    _disengDuration++;
    _joyHold = 0;
    _emotionlessHold = 0;
  } else if (_disengRelease >= CONFIG.disengaged.releaseFrames) {
    _disengDuration = 0;
    if (joyReady) {
      _currentState = STATES.JOY;
    } else if (emotionlessReady) {
      _currentState = STATES.EMOTIONLESS;
    } else {
      _currentState = STATES.NEUTRAL;
    }
  } else if (_currentState !== STATES.DISENGAGED) {
    if (joyReady) {
      _currentState = STATES.JOY;
    } else if (_joyRelease >= CONFIG.joy.releaseFrames && _currentState === STATES.JOY) {
      _currentState = emotionlessReady ? STATES.EMOTIONLESS : STATES.NEUTRAL;
    } else if (emotionlessReady && _currentState !== STATES.JOY) {
      _currentState = STATES.EMOTIONLESS;
    } else if (_emotionlessRelease >= EMOTIONLESS_RELEASE && _currentState === STATES.EMOTIONLESS) {
      _currentState = STATES.NEUTRAL;
    }
  }

  return {
    state:          _currentState,
    changed:        _currentState !== prev,
    disengDuration: _disengDuration,
    debugHold:      disengReady ? _disengHold : _joyHold,
  };
}

function forceNeutral() {
  _currentState        = STATES.NEUTRAL;
  _joyHold             = 0; _joyRelease        = 0;
  _disengHold          = 0; _disengRelease     = 0;
  _emotionlessHold     = 0; _emotionlessRelease = 0;
  _disengDuration      = 0;
}
