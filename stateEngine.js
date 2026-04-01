// ─── stateEngine.js ──────────────────────────────────────
// Converts raw signals → named states from your Control Language Map.
// Uses hold/release frame counters + hysteresis to prevent flickering.

const STATES = {
  NEUTRAL:       'neutral',
  JOY:           'joy',
  UNCOMFORTABLE: 'uncomfortable',
};

// Internal counters — not exported, managed only inside this file
let _joyHoldCount      = 0;
let _joyReleaseCount   = 0;
let _uncomfHoldCount   = 0;
let _uncomfReleaseCount = 0;
let _currentState      = STATES.NEUTRAL;
let _uncomfFrameCount  = 0; // how long we've been in uncomfortable

function updateState(signals) {
  const prev = _currentState;

  // ── Joy logic ──────────────────────────────────────────
  const joySignalOn = signals.mouthOpenness > CONFIG.joy.mouthOpenThreshold;
  const joySignalOff = signals.mouthOpenness < CONFIG.joy.mouthCloseHysteresis;

  if (joySignalOn) {
    _joyHoldCount++;
    _joyReleaseCount = 0;
  } else if (joySignalOff) {
    _joyReleaseCount++;
    _joyHoldCount = Math.max(0, _joyHoldCount - 1);
  }

  // ── Uncomfortable logic ────────────────────────────────
  // Signal fires when EITHER gaze is averted OR head is moving significantly
  const gazeAverted = signals.gazeXOffset > CONFIG.uncomfortable.gazeOffsetThreshold;
  const headFidgeting = signals.headMovement > CONFIG.uncomfortable.movementThreshold;
  const uncomfSignalOn  = gazeAverted || headFidgeting;
  const uncomfSignalOff = signals.gazeXOffset < CONFIG.uncomfortable.gazeHysteresis
                       && signals.headMovement < CONFIG.uncomfortable.movementThreshold * 0.5;

  if (uncomfSignalOn) {
    _uncomfHoldCount++;
    _uncomfReleaseCount = 0;
  } else if (uncomfSignalOff) {
    _uncomfReleaseCount++;
    _uncomfHoldCount = Math.max(0, _uncomfHoldCount - 1);
  }

  // ── State resolution (priority: uncomfortable > joy > neutral) ──
  // Joy can only fire when NOT uncomfortable
  const joyActive   = _joyHoldCount   >= CONFIG.joy.holdFrames;
  const uncomfActive = _uncomfHoldCount >= CONFIG.uncomfortable.holdFrames;

  if (uncomfActive) {
    _currentState = STATES.UNCOMFORTABLE;
    _uncomfFrameCount++;
    _joyHoldCount = 0; // suppress joy while uncomfortable
  } else if (_uncomfReleaseCount >= CONFIG.uncomfortable.releaseFrames) {
    _uncomfFrameCount = 0;
    if (joyActive) {
      _currentState = STATES.JOY;
    } else if (_joyReleaseCount >= CONFIG.joy.releaseFrames) {
      _currentState = STATES.NEUTRAL;
    }
  } else if (joyActive && _currentState !== STATES.UNCOMFORTABLE) {
    _currentState = STATES.JOY;
  } else if (_joyReleaseCount >= CONFIG.joy.releaseFrames && _currentState === STATES.JOY) {
    _currentState = STATES.NEUTRAL;
  }

  return {
    state: _currentState,
    changed: _currentState !== prev,
    uncomfDuration: _uncomfFrameCount,       // used by response.js for prompt timing
    joyHold: _joyHoldCount,
    debugHold: uncomfActive ? _uncomfHoldCount : _joyHoldCount,
  };
}

function getCurrentState() { return _currentState; }
function resetMovementMemory() { _prevNoseX = null; _prevNoseY = null; }
