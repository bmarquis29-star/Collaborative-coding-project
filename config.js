const CONFIG = {

  // ── Joy detection ──────────────────────────────────────
  joy: {
    mouthOpenThreshold:   0.08,  // open mouth or smile triggers it
    mouthCloseHysteresis: 0.05,
    holdFrames:  8,
    releaseFrames: 20,
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
