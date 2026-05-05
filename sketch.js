let capture;
let detections = [];
let modelLoaded = false;
let trackingActive = false;
let trackingPaused = false;
let detectionTimer = null;

let startOverlayEl;
let beginSessionBtn;
let startBtn;
let pauseBtn;
let stopBtn;

async function loadModels() {
  if (modelLoaded) return;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  console.log('models loaded');
  modelLoaded = true;
}

function setTrackingControls({ canStart, canPause, canStop, pauseText = 'Pause' }) {
  if (startBtn) startBtn.disabled = !canStart;
  if (pauseBtn) {
    pauseBtn.disabled = !canPause;
    pauseBtn.textContent = pauseText;
  }
  if (stopBtn) stopBtn.disabled = !canStop;
}

function showStartOverlay(show) {
  if (!startOverlayEl) return;
  startOverlayEl.classList.toggle('active', show);
}

function ensureDetectionLoop() {
  if (detectionTimer) return;
  detectionTimer = setInterval(async () => {
    if (!trackingActive || trackingPaused || !modelLoaded || !capture?.elt) return;
    const result = await faceapi
      .detectSingleFace(capture.elt, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    detections = result ? [result] : [];
  }, 100);
}

async function startTracking() {
  try {
    await loadModels();

    if (!capture) {
      capture = createCapture({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      capture.size(640, 480);
      capture.hide();
    }

    if (capture.elt) {
      await capture.elt.play().catch(() => {});
    }

    trackingActive = true;
    trackingPaused = false;
    showStartOverlay(false);
    setTrackingControls({ canStart: false, canPause: true, canStop: true, pauseText: 'Pause' });
    ensureDetectionLoop();
    loop();
  } catch (err) {
    console.warn('Unable to start tracking:', err);
    showStartOverlay(true);
  }
}

function togglePauseTracking() {
  if (!trackingActive || !capture?.elt) return;
  trackingPaused = !trackingPaused;

  if (trackingPaused) {
    capture.elt.pause();
    detections = [];
    setTrackingControls({ canStart: false, canPause: true, canStop: true, pauseText: 'Resume' });
  } else {
    capture.elt.play().catch(() => {});
    setTrackingControls({ canStart: false, canPause: true, canStop: true, pauseText: 'Pause' });
  }
}

function stopTracking() {
  trackingActive = false;
  trackingPaused = false;
  detections = [];

  if (detectionTimer) {
    clearInterval(detectionTimer);
    detectionTimer = null;
  }

  if (capture?.elt?.srcObject) {
    capture.elt.srcObject.getTracks().forEach(track => track.stop());
  }

  if (capture) {
    capture.remove();
    capture = null;
  }

  forceNeutral();
  document.body.classList.remove('state-joy', 'state-sadness', 'state-anxiety', 'state-disengaged', 'state-emotionless');
  document.body.classList.add('state-neutral');
  const stateLabelEl = document.getElementById('state-label');
  const stateDescEl = document.getElementById('state-description');
  if (stateLabelEl) stateLabelEl.textContent = 'NEUTRAL';
  if (stateDescEl) stateDescEl.textContent = '';
  showStartOverlay(true);
  setTrackingControls({ canStart: true, canPause: false, canStop: false });
}

function setup() {
  const cnv = createCanvas(640, 480);
  cnv.parent(document.getElementById('canvas-container'));

  startOverlayEl = document.getElementById('start-overlay');
  beginSessionBtn = document.getElementById('btn-begin-session');
  startBtn = document.getElementById('btn-start-tracking');
  pauseBtn = document.getElementById('btn-pause-tracking');
  stopBtn = document.getElementById('btn-stop-tracking');

  beginSessionBtn?.addEventListener('click', startTracking);
  startBtn?.addEventListener('click', startTracking);
  pauseBtn?.addEventListener('click', togglePauseTracking);
  stopBtn?.addEventListener('click', stopTracking);

  setTrackingControls({ canStart: true, canPause: false, canStop: false });
  showStartOverlay(true);
}

function draw() {
  if (!trackingActive || !capture) {
    background(6, 8, 12);
    fill(120);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text('click "Start Tracking" to begin', width / 2, height / 2);
    return;
  }

  // mirrored webcam
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  fill(0, 0, 0, 55);
  noStroke();
  rect(0, 0, width, height);

  if (trackingPaused) {
    fill(190);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(15);
    text('tracking paused', width / 2, height / 2);
    return;
  }

  if (!modelLoaded) {
    fill(80);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(13);
    text('loading model...', width / 2, height / 2);
    return;
  }

  if (detections.length === 0) {
    // still run state engine so disengaged can trigger
    const stateInfo = updateState({ noFace: true, mouthOpenness: 0, gazeXOffset: 0, headMovement: 0 });
    applyResponse(stateInfo, { width, height });

    fill(80);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(13);
    text('no face detected', width / 2, height / 2);
    return;
  }

  // landmarks come back as a positions array
  const landmarks = detections[0].landmarks.positions;
  // mirror the x positions to match flipped video
  const mirrored = landmarks.map(pt => ({ x: width - pt.x, y: pt.y }));

  if (CONFIG.drawLandmarks) {
    noStroke();
    fill(255, 80, 80, 200);
    for (const pt of mirrored) ellipse(pt.x, pt.y, 4);
    return;
  }

  try {
    const signals   = extractSignals(mirrored);
    const stateInfo = updateState(signals);
    applyResponse(stateInfo, { width, height });

    if (CONFIG.showDebug) {
      document.getElementById('dbg-mouth').textContent    = signals.mouthOpenness.toFixed(4);
      document.getElementById('dbg-gaze-x').textContent   = signals.gazeXOffset.toFixed(4);
      document.getElementById('dbg-movement').textContent = signals.headMovement.toFixed(3);
      document.getElementById('dbg-hold').textContent     = stateInfo.debugHold;
    }
  } catch (err) {
    console.warn('pipeline error:', err);
  }

}
// pause camera when tab is hidden, resume when visible
document.addEventListener('visibilitychange', () => {
  if (!capture?.elt || !trackingActive) return;
  if (document.hidden) {
    capture.elt.pause();
    noLoop();
  } else {
    if (!trackingPaused) capture.elt.play().catch(() => {});
    loop();
  }
});