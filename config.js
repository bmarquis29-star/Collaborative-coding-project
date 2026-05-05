const CONFIG = {

  // ── Joy detection ──────────────────────────────────────
  joy: {
    mouthOpenThreshold:   0.06,  // open mouth or smile triggers it
    mouthCloseHysteresis: 0.05,
    holdFrames:  4,
    releaseFrames: 12,
  },

  // ── Sadness detection ─────────────────────────────────
  sadness: {
    mouthCloseThreshold:  0.036,
    gazeLimit:            0.03,
    movementLimit:        1.6,
    holdFrames:   8,
    releaseFrames: 14,
  },

  // ── Anxiety detection ──────────────────────────────────
  anxiety: {
    gazeOffsetThreshold:  0.05,
    movementThreshold:    1.9,
    holdFrames:   4,
    releaseFrames: 12,
  },

  // ── Disengaged detection ───────────────────────────────
  disengaged: {
    gazeOffsetThreshold:  0.085,
    gazeHysteresis:       0.05,
    movementThreshold:    4.0,
    movementDecay:        0.85,
    holdFrames:   6,
    releaseFrames: 30,
    promptDelayFrames: 90,
  },

  showDebug: true,
  drawLandmarks: false,
  landmarkDotSize: 2,
};