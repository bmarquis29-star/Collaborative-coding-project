# Collaborative Coding Project: Copilot Instructions

## Project Overview
Real-time webcam-based emotional state detection system using ML5.js FaceMesh to detect three states: **Neutral**, **Joy**, and **Uncomfortable**. The system monitors facial signals (mouth openness, gaze aversion, head movement) to infer user engagement and comfort, with adaptive visual feedback including particle effects and CSS-driven atmosphere changes.

## Architecture: Signal → State → Response Pipeline

### 1. **Detection Layer** (`detection.js`)
- Consumes raw FaceMesh landmarks (468 points from ml5.js)
- Pure math functions returning normalized signal values (0–1 scale)
- Key functions:
  - `getMouthOpenness()` — mouth gap ÷ face height
  - `getGazeXOffset()` — iris X position relative to eye center (detects looking left/right)
  - `getHeadMovement()` — frame-to-frame nose tip delta with exponential smoothing
  - `extractSignals()` — master aggregator returning `{mouthOpenness, gazeXOffset, headMovement}`
- **Important:** All thresholds are normalized to handle varying face sizes/distances

### 2. **State Engine** (`stateEngine.js`)
- Applies hysteresis + hold/release frame counters to prevent signal flicker
- Three states: NEUTRAL → JOY (joy only when NOT uncomfortable) → UNCOMFORTABLE
- **Priority:** Uncomfortable overrides Joy (discomfort exits gracefully, requiring reset frames)
- Exports `updateState(signals)` returning `{state, changed, uncomfDuration, debugHold}`
- **Key design:** Internal counters (`_joyHoldCount`, `_uncomfHoldCount`) persist across frames—do not reset except via frame decay logic

### 3. **Response Layer** (`response.js`)
- Applies visual + DOM consequences when state changes
- CSS classes: `state-neutral`, `state-joy`, `state-uncomfortable` (drive color/animation via `style.css`)
- Joy spawns particles (`spawnJoyParticle()`) at ~40% per-frame rate
- Uncomfortable shows "Are you still there?" prompt after delay (`uncomfDuration >= promptDelayFrames`)
- **Key pattern:** All visual state lives in `applyResponse()`, called every frame by orchestrator

### 4. **Orchestrator** (`sketch.js`)
- p5.js setup/draw loop managing camera + ml5.js FaceMesh lifecycle
- Each frame: extract signals → update state → apply response → update debug panel
- Handles two modes:
  - **Stage 1 (debug):** `CONFIG.drawLandmarks = true` shows raw landmark dots, skips state logic
  - **Stage 2+ (production):** full pipeline with visual feedback

## Configuration & Tuning

**Source of truth:** `config.js` — all magic numbers centralized here.
- Never bury thresholds in other files
- All comments in `config.js` explain landmark indices + normalization strategy
- Key configs:
  - `joy.holdFrames: 10` — frames of continuous signal before joy triggers
  - `uncomfortable.gazeOffsetThreshold: 0.08` — iris offset > this = averted gaze
  - `uncomfortable.movementThreshold: 4.0` — pixel delta > this = fidgeting
  - `uncomfortable.promptDelayFrames: 90` — how long in uncomfortable state before prompt

## Data Flow Example: Smiling Detection
1. FaceMesh detects face, yields 468 landmarks
2. `getMouthOpenness()` computes lip gap / face height
3. Signal enters `updateState()`: if > threshold + held for 10 frames → Joy triggers
4. `applyResponse()` sets body class `state-joy`, starts spawning particles
5. CSS transitions background color, particles float upward

## Cross-Component Communication

| Component | Input | Output | Consumer |
|-----------|-------|--------|----------|
| `detection.js` | landmarks array | signals object | `stateEngine.js` |
| `stateEngine.js` | signals object | state info + timers | `response.js` |
| `response.js` | state info | DOM/canvas mutations | Browser/display |
| `sketch.js` | faceMesh results | calls all three above | Orchestrator |

## Common Development Tasks

### Tuning Detection Sensitivity
1. Open `config.js`
2. Adjust thresholds (e.g., `joy.mouthOpenThreshold`, `uncomfortable.gazeOffsetThreshold`)
3. Set `CONFIG.showDebug = true` to view live signal values in debug panel
4. Set `CONFIG.drawLandmarks = true` in Stage 1 to inspect raw landmark positions
5. Test thresholds against varied lighting/face angles

### Adding a New State (e.g., Surprised)
1. Add signal extractor in `detection.js` (e.g., `getEyeOpenness()`)
2. Add state to `STATES` object in `stateEngine.js`
3. Implement hold/release logic + priority in `updateState()`
4. Add visual response in `response.js` (CSS class, particles, description)
5. Extend `config.js` with thresholds for new state

### Debugging State Transitions
- Debug panel shows: mouth gap, gaze X offset, head movement, current hold frame count
- Enable `CONFIG.drawLandmarks` to see raw FaceMesh points (landmarks 13, 14, 1, 152, 33, 133, 468 are key)
- Check browser console for any ml5.js errors
- Verify webcam permissions granted

## Key Conventions & Patterns

- **Signals are normalized & direction-agnostic:** `gazeXOffset` is absolute value (left OR right counts equally)
- **Hold/release counters degrade symmetrically:** rise sharply when signal on, decay gradually when off
- **State changes trigger visual reset:** particles clear, prompt hides on state exit
- **Debug mode in production code:** never strip `CONFIG.showDebug` checks; allows live inspection
- **FaceMesh landmarks are indexed:** refer to ml5 FaceMesh docs; indices 1, 13, 14, 152, 33, 133, 468 are hardcoded critical points

## Team Ownership & Related Files

- **State Engine Lead** (Drew): `stateEngine.js` — hold/release logic, state priority
- **Response Lead** (Brennan): `response.js` — visual feedback, particles, DOM updates
- **Detection Lead** (Blake): `detection.js` — landmark math, signal extraction
- **Integration Lead** (Christian): `sketch.js` — p5.js orchestration, ml5.js lifecycle

## External Dependencies

- **ml5.js** — FaceMesh model (468 landmarks, flipped video)
- **p5.js** — Canvas rendering, video capture
- **CSS** — `style.css` drives state-dependent colors/animations via class selectors
