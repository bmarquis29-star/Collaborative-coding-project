// face-api 68-point landmark map:

// Mouth: 51 (top lip) 57 (bottom lip)

// Nose tip: 30, Chin: 8

// Left eye corners: 36 (outer) 39 (inner)

// Right eye corners: 42 (inner) 45 (outer)

// Left iris: no iris points in 68-model — use eye center instead



function dist2D(a, b) {

if (!a || !b) return 0;

return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

}



function getMouthOpenness(landmarks) {

const topLip = landmarks[51];

const bottomLip = landmarks[57];

const noseTip = landmarks[27];

const chin = landmarks[8];

if (!topLip || !bottomLip || !noseTip || !chin) return 0;

const faceHeight = dist2D(noseTip, chin);

if (faceHeight === 0) return 0;

return dist2D(topLip, bottomLip) / faceHeight;

}



// For gaze we use the center of each eye vs pupil approximation

// Left eye: landmarks 36–41, right eye: 42–47

// We compare left eye center x to right eye center x relative to face width

function getGazeXOffset(landmarks) {

const leftEyeOuter = landmarks[36];

const leftEyeInner = landmarks[39];

const rightEyeInner = landmarks[42];

const rightEyeOuter = landmarks[45];

if (!leftEyeOuter || !rightEyeOuter) return 0;



const faceWidth = dist2D(leftEyeOuter, rightEyeOuter);

if (faceWidth === 0) return 0;



// eye midpoint x vs face center x

const leftEyeCenterX = (leftEyeOuter.x + leftEyeInner.x) / 2;

const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;

const eyeMidX = (leftEyeCenterX + rightEyeCenterX) / 2;

const faceCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;



return Math.abs((eyeMidX - faceCenterX) / faceWidth);

}



let _prevNoseX = null;

let _prevNoseY = null;

let _smoothedMovement = 0;



function getHeadMovement(landmarks) {

const nose = landmarks[30];

if (!nose) return 0;

if (_prevNoseX === null) {

_prevNoseX = nose.x; _prevNoseY = nose.y; return 0;

}

const dx = nose.x - _prevNoseX;

const dy = nose.y - _prevNoseY;

const raw = Math.sqrt(dx * dx + dy * dy);

_smoothedMovement = _smoothedMovement * CONFIG.disengaged.movementDecay

+ raw * (1 - CONFIG.disengaged.movementDecay);

_prevNoseX = nose.x;

_prevNoseY = nose.y;

return _smoothedMovement;

}



function extractSignals(landmarks) {

const mouth = getMouthOpenness(landmarks);

const gaze = getGazeXOffset(landmarks);

const move = getHeadMovement(landmarks);



if (frameCount % 60 === 0) {

console.log(`mouth: ${mouth.toFixed(4)} | gaze: ${gaze.toFixed(4)} | move: ${move.toFixed(3)}`);

}



return { mouthOpenness: mouth, gazeXOffset: gaze, headMovement: move };

}
