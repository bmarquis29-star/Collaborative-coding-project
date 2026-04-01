// ─── stateEngine.js ──────────────────────────────────────
// Signals → named states. Hold/release counters prevent flickering.

const STATES = {
  NEUTRAL:    'neutral',
  JOY:        'joy',
  DISENGAGED: 'disengaged',
};

let _joyHold        = 0;
let _joyRelease     = 0;
let _disengHold     = 0;
let _disengRelease  = 0;
let _currentState   = STATES.NEUTRAL;
let _disengDuration = 0; // frames spent in disengaged (for prompt timing)

function updateState(signals) {
  const prev = _currentState;

  // ── Joy signal ─────────────────────────────────────────
  if (signals.mouthOpenness > CONFIG.joy.mouthOpenThreshold) {
    _joyHold++; _joyRelease = 0;
  } else if (signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis) {
    _joyRelease++; _joyHold = Math.max(0, _joyHold - 1);
  }

  // ── Disengaged signal ──────────────────────────────────
  // Fires on gaze aversion OR head fidgeting
  const gazeAverted  = signals.gazeXOffset  > CONFIG.disengaged.gazeOffsetThreshold;
  const fidgeting    = signals.headMovement > CONFIG.disengaged.movementThreshold;
  const disengOn     = gazeAverted || fidgeting;
  const disengOff    = signals.gazeXOffset  < CONFIG.disengaged.gazeHysteresis
                    && signals.headMovement < CONFIG.disengaged.movementThreshold * 0.5;

  if (disengOn)  { _disengHold++; _disengRelease = 0; }
  if (disengOff) { _disengRelease++; _disengHold = Math.max(0, _disengHold - 1); }

  // ── Resolve state (disengaged beats joy) ──────────────
  const joyReady    = _joyHold    >= CONFIG.joy.holdFrames;
  const disengReady = _disengHold >= CONFIG.disengaged.holdFrames;

  if (disengReady) {
    _currentState = STATES.DISENGAGED;
    _disengDuration++;
    _joyHold = 0; // suppress joy while disengaged
  } else if (_disengRelease >= CONFIG.disengaged.releaseFrames) {
    _disengDuration = 0;
    _currentState = joyReady ? STATES.JOY : STATES.NEUTRAL;
  } else if (joyReady && _currentState !== STATES.DISENGAGED) {
    _currentState = STATES.JOY;
  } else if (_joyRelease >= CONFIG.joy.releaseFrames && _currentState === STATES.JOY) {
    _currentState = STATES.NEUTRAL;
  }

  return {
    state:          _currentState,
    changed:        _currentState !== prev,
    disengDuration: _disengDuration,
    debugHold:      disengReady ? _disengHold : _joyHold,
  };
}

function forceNeutral() {
  _currentState   = STATES.NEUTRAL;
  _joyHold        = 0; _joyRelease     = 0;
  _disengHold     = 0; _disengRelease  = 0;
  _disengDuration = 0;
}