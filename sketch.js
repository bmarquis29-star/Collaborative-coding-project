let faceMesh;
let video;
let faces = [];

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: true, flipHorizontal: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  image(video, 0, 0, width, height);

  if (faces.length > 0) {
    let face = faces[0];
    
    // 1. SENSE & INTERPRET
    let activeState = updateState(face);
    
    // 2. RESPOND
    executeResponse(activeState);

    // 3. DEBUG (Draw landmarks)
    if (CONFIG.debugMode) {
      drawDebug(face);
    }
  }
}

function gotFaces(results) {
  faces = results;
}

function drawDebug(face) {
  fill(0, 255, 0);
  noStroke();
  for (let i = 0; i < face.keypoints.length; i++) {
    let pt = face.keypoints[i];
    circle(pt.x, pt.y, 2);
  }
}
