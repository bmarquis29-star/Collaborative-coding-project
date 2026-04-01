// ─── config.js ───────────────────────────────────────────
// Single source of truth for all thresholds and timing.
// Change numbers HERE only — never bury magic numbers in other files.

const CONFIG = {

  // ── Joy detection ──────────────────────────────────────
  // Mouth openness: distance between landmarks 13 (upper lip) and 14 (lower lip),
  // normalized by face height. A smile often has slight opening + raised cheeks.
  joy: {
    mouthOpenThreshold: 0.04,      // normalized ratio — above this = open/smiling
    mouthCloseHysteresis: 0.025,   // must drop BELOW this to exit joy (prevents flicker)
    holdFrames: 10,                // must detect for N frames before state triggers
    releaseFrames: 20,             // must be absent for N frames before state releases
  },

  // ── Uncomfortable detection ────────────────────────────
  // Detects gaze aversion (iris drifts to corners) + head movement (restlessness).
  uncomfortable: {
    gazeOffsetThreshold: 0.08,     // normalized iris-to-eye-center X offset — above = averted
    gazeHysteresis: 0.05,          // must drop below this to stop detecting gaze aversion
    movementThreshold: 4.0,        // frame-to-frame nose landmark pixel delta — above = fidgeting
    movementDecay: 0.85,           // smoothing factor for movement signal (0–1, lower = more smoothing)
    holdFrames: 18,                // frames of signal needed to trigger
    releaseFrames: 30,             // frames of absence needed to release
    promptDelayFrames: 90,         // frames in uncomfortable state before showing the prompt
  },

  // ── General ────────────────────────────────────────────
  showDebug: true,                 // toggle debug panel visibility
  landmarkDotSize: 2,              // size of raw landmark dots drawn in Stage 1
  drawLandmarks: false,            // set true to see raw points (Stage 1 mode)
};
