// ─── response.js ─────────────────────────────────────────
// Receives the named state → changes the atmosphere.
// All DOM + canvas visual consequences live here.

const DESCRIPTIONS = {
  neutral:       '',
  joy:           'feeling seen.',
  uncomfortable: 'something feels off…',
};

const LABELS = {
  neutral:       'NEUTRAL',
  joy:           'JOY',
  uncomfortable: 'UNCOMFORTABLE',
};

// ── DOM refs ──────────────────────────────────────────────
const bodyEl          = document.body;
const stateLabelEl    = document.getElementById('state-label');
const stateDescEl     = document.getElementById('state-description');
const uncomfPromptEl  = document.getElementById('uncomfortable-prompt');

// ── Joy particle system ────────────────────────────────────
// Simple canvas-based floating particles drawn on top of the video
let _particles = [];

function spawnJoyParticle(canvasW, canvasH) {
  _particles.push({
    x: Math.random() * canvasW,
    y: canvasH + 10,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(Math.random() * 1.5 + 0.8),
    size: Math.random() * 5 + 2,
    alpha: 1,
    color: Math.random() > 0.5 ? '#f5c842' : '#a8e6a0',
  });
}

function updateAndDrawParticles(pg) {
  // pg = p5 graphics or the p5 sketch itself
  _particles = _particles.filter(p => p.alpha > 0.02);
  for (const p of _particles) {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy -= 0.015; // float upward, slight acceleration
    p.alpha -= 0.008;
    pg.noStroke();
    pg.fill(pg.color(p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0')));
    pg.ellipse(p.x, p.y, p.size);
  }
}

// ── Main response update — called every frame ──────────────
function applyResponse(stateInfo, p5sketch) {
  const { state, changed, uncomfDuration } = stateInfo;

  // Update body class (drives CSS atmosphere transitions)
  if (changed) {
    bodyEl.classList.remove('state-neutral', 'state-joy', 'state-uncomfortable');
    bodyEl.classList.add(`state-${state}`);
    stateLabelEl.textContent  = LABELS[state];
    stateDescEl.textContent   = DESCRIPTIONS[state];

    // Hide prompt when leaving uncomfortable
    if (state !== 'uncomfortable') {
      uncomfPromptEl.classList.add('hidden');
      _particles = []; // clear joy particles on state change
    }
  }

  // Joy: spawn particles while state is active
  if (state === 'joy') {
    if (Math.random() < 0.4) { // ~40% chance per frame = gentle stream
      spawnJoyParticle(p5sketch.width, p5sketch.height);
    }
  }

  // Uncomfortable: show "are you still there?" prompt after delay
  if (state === 'uncomfortable') {
    const showPrompt = uncomfDuration >= CONFIG.uncomfortable.promptDelayFrames;
    if (showPrompt) {
      uncomfPromptEl.classList.remove('hidden');
    }
  }

  // Draw particles on the p5 canvas
  updateAndDrawParticles(p5sketch);
}
