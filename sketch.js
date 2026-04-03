let capture;
let detections = [];
let modelLoaded = false;

async function loadModels() {
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  console.log('models loaded');
  modelLoaded = true;
}

function setup() {
  const cnv = createCanvas(640, 480);
  cnv.parent(document.getElementById('canvas-container'));

  capture = createCapture({
    video: { width: 640, height: 480, facingMode: 'user' },
    audio: false
  });
  capture.size(640, 480);
  capture.hide();

  loadModels();

  // run detection loop separately from p5 draw
  setInterval(async () => {
    if (!modelLoaded || !capture.elt) return;
    const result = await faceapi
      .detectSingleFace(capture.elt, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    detections = result ? [result] : [];
  }, 100); // detect every 100ms
}

function draw() {
  // mirrored webcam
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  fill(0, 0, 0, 55);
  noStroke();
  rect(0, 0, width, height);

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

  // subtle dots on key landmarks
  noStroke();
  fill(255, 255, 255, 50);
  for (const idx of [51, 57, 27, 8, 36, 39, 42, 45]) {
    const pt = mirrored[idx];
    if (pt) ellipse(pt.x, pt.y, 4);
  }
}
// pause camera when tab is hidden, resume when visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    capture.elt.pause();
    noLoop();
  } else {
    capture.elt.play();
    loop();
  }
});
