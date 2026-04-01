// ─── sketch.js ───────────────────────────────────────────
// p5.js setup/draw loop. Handles webcam, ml5 FaceMesh init,
// and orchestrates detection → state → response each frame.

let capture;       // p5 video capture
let faceMesh;      // ml5 FaceMesh model
let faces = [];    // latest detected faces array

// Debug panel refs
const dbgMouth    = document.getElementById('dbg-mouth');
const dbgGazeX    = document.getElementById('dbg-gaze-x');
const dbgMovement = document.getElementById('dbg-movement');
const dbgHold     = document.getElementById('dbg-hold');
const debugPanel  = document.getElementById('debug-panel');

function preload() {
  // Load FaceMesh before sketch starts.
  // flipped: true mirrors the webcam so it feels natural.
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: true, flipped: true });
}

function setup() {
  // Attach canvas to our container div
  const container = document.getElementById('canvas-container');
  const cnv = createCanvas(640, 480);
  cnv.parent(container);

  // Start webcam (mirrored to match faceMesh flip)
  capture = createCapture({ video: { facingMode: 'user' }, audio: false });
  capture.size(640, 480);
  capture.hide(); // we draw it manually so we can layer on top

  // Begin detection — updates faces[] whenever new results arrive
  faceMesh.detectStart(capture, (results) => { faces = results; });

  // Debug panel visibility
  if (!CONFIG.showDebug) debugPanel.style.display = 'none';
}

function draw() {
  // Draw mirrored webcam feed
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  // Darken overlay so UI is legible
  fill(0, 0, 0, 60);
  noStroke();
  rect(0, 0, width, height);

  if (faces.length === 0) {
    // No face detected — show hint
    fill(80);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(13);
    text('position your face in frame', width / 2, height / 2);
    return;
  }

  const landmarks = faces[0].keypoints; // array of {x, y, z, name}

  // ── Stage 1 mode: draw raw landmarks ──────────────────
  if (CONFIG.drawLandmarks) {
    noStroke();
    fill(255, 100, 100, 180);
    for (const pt of landmarks) {
      ellipse(pt.x, pt.y, CONFIG.landmarkDotSize);
    }
    return; // skip state logic in raw landmark mode
  }

  // ── Stage 2+: full pipeline ────────────────────────────
  const signals   = extractSignals(landmarks);
  const stateInfo = updateState(signals);
  applyResponse(stateInfo, window._p5instance || this);

  // Update debug panel
  if (CONFIG.showDebug) {
    dbgMouth.textContent    = signals.mouthOpenness.toFixed(4);
    dbgGazeX.textContent    = signals.gazeXOffset.toFixed(4);
    dbgMovement.textContent = signals.headMovement.toFixed(3);
    dbgHold.textContent     = stateInfo.debugHold;
  }

  // Highlight key landmarks for visual legibility
  _drawKeyLandmarks(landmarks);
}

// Draw a subtle indicator on the landmarks we're actually using
function _drawKeyLandmarks(landmarks) {
  const keyIndices = [13, 14, 1, 152, 33, 133, 468]; // mouth, nose, eye corners, iris
  noStroke();
  for (const idx of keyIndices) {
    const pt = landmarks[idx];
    if (!pt) continue;
    fill(255, 255, 255, 60);
    ellipse(pt.x, pt.y, 4);
  }
}

// p5 needs this in global mode
window._p5instance = this;
