const CONFIG = {

  // ── Joy detection ──────────────────────────────────────
  joy: {
    mouthOpenThreshold:   0.18,  // raised significantly — requires a real smile/open mouth
    mouthCloseHysteresis: 0.12,  // must drop below this to exit joy
    holdFrames:  8,
    releaseFrames: 20,
  },

  // ── Disengaged detection ───────────────────────────────
  disengaged: {
    gazeOffsetThreshold:  0.08,
    gazeHysteresis:       0.05,
    movementThreshold:    4.0,
    movementDecay:        0.85,
    holdFrames:   18,
    releaseFrames: 30,
    promptDelayFrames: 90,
  },

  showDebug: true,
  drawLandmarks: false,
  landmarkDotSize: 2,
};
