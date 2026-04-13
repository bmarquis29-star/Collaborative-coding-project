function executeResponse(state) {
  push();
  if (state === "GAPE") {
    background(255, 0, 0, 50); // Flash Red
    fill(255);
    textSize(32);
    text("STATE: EXTRACTION", 20, 50); // Example Diptych name
  } else if (state === "FOCUS") {
    filter(THRESHOLD); // High contrast visual
    fill(0, 255, 0);
    text("STATE: WITNESS", 20, 50);
  } else {
    // Default/Idle behavior
  }
  pop();
}
