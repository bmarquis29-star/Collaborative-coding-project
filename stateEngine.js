let currentState = "IDLE";

function updateState(face) {
  let mouthGap = getMouthGap(face.keypoints);
  let faceSize = getFaceScale(face.keypoints);

  // Logic for state transitions
  if (mouthGap > CONFIG.mouthThreshold) {
    currentState = "GAPE"; // Rename to your lexicon state
  } 
  else if (faceSize > CONFIG.proximityThreshold) {
    currentState = "FOCUS"; // Rename to your lexicon state
  } 
  else {
    currentState = "IDLE";
  }
  
  return currentState;
}
