const CONFIG = {

  // ── Joy detection ──────────────────────────────────────
  joy: {
    mouthOpenThreshold:   0.08,  // open mouth or smile triggers it
    mouthCloseHysteresis: 0.05,
    holdFrames:  8,
    releaseFrames: 20,
  },

  // ── Sadness detection ─────────────────────────────────
  sadness: {
    mouthCloseThreshold:  0.032,
    gazeLimit:            0.03,
    movementLimit:        1.6,
    holdFrames:   10,
    releaseFrames: 16,
  },

  // ── Anxiety detection ──────────────────────────────────
  anxiety: {
    gazeOffsetThreshold:  0.06,
    movementThreshold:    2.2,
    holdFrames:   5,
    releaseFrames: 12,
  },

  // ── Disengaged detection ───────────────────────────────
  disengaged: {
    gazeOffsetThreshold:  0.04,
    gazeHysteresis:       0.02,
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