// ─── config.js ───────────────────────────────────────────
// All thresholds and timing in one place.
// Calibrate by changing numbers here only.

const CONFIG = {

  // ── Joy detection ──────────────────────────────────────
  joy: {
    mouthOpenThreshold:  0.04,   // normalized mouth gap — above = smiling/open
    mouthCloseHysteresis: 0.025, // must drop below this to exit joy
    holdFrames:  1,             // frames of signal before state triggers
    releaseFrames: 20,           // frames of absence before state releases
  },

  // ── Disengaged detection ───────────────────────────────
  disengaged: {
    gazeOffsetThreshold:  0.08,  // normalized iris X offset — above = gaze averted
    gazeHysteresis:       0.05,  // must drop below to stop counting gaze aversion
    movementThreshold:    4.0,   // nose landmark frame-delta — above = fidgeting
    movementDecay:        0.85,  // smoothing factor for movement (0–1)
    holdFrames:   1,            // frames of signal before state triggers
    releaseFrames: 30,           // frames of absence before state releases
    promptDelayFrames: 90,       // frames in disengaged before showing prompt (~3s at 30fps)
  },

  showDebug: true,
  drawLandmarks: false,          // set true for Stage 1 raw landmark view
  landmarkDotSize: 2,
};
