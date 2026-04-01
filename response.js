// ─── response.js ─────────────────────────────────────────

const LABELS = {
  neutral:    'NEUTRAL',
  joy:        'JOY',
  disengaged: 'DISENGAGED',
};

const DESCRIPTIONS = {
  neutral:    '',
  joy:        'feeling seen.',
  disengaged: 'something feels off…',
};

const bodyEl        = document.body;
const stateLabelEl  = document.getElementById('state-label');
const stateDescEl   = document.getElementById('state-description');
const disengOverlay = document.getElementById('disengaged-overlay');

// ── Button handlers ────────────────────────────────────────
function handleYes() {
  forceNeutral();
  disengOverlay.classList.add('hidden');
  disengOverlay.classList.remove('active');
  bodyEl.classList.remove('state-neutral', 'state-joy', 'state-disengaged');
  bodyEl.classList.add('state-neutral');
  stateLabelEl.textContent = LABELS.neutral;
  stateDescEl.textContent  = DESCRIPTIONS.neutral;
}

function handleExit() {
  document.body.innerHTML = `
    <div style="
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; height:100vh;
      font-family:'Space Mono',monospace; color:#555;
      background:#0e0e0e; gap:1rem;
    ">
      <span style="font-size:0.75rem; letter-spacing:0.2em;">SESSION ENDED</span>
      <span style="font-size:0.7rem; color:#333;">refresh to restart</span>
    </div>`;
}

// ── Joy particles — drawn on a separate <canvas> overlay ──
// Using plain Canvas2D so we don't need the p5 instance
let _particleCanvas = null;
let _ctx = null;
let _particles = [];

function ensureParticleCanvas() {
  if (_particleCanvas) return;
  _particleCanvas = document.createElement('canvas');
  _particleCanvas.id = 'joy-particle-canvas';
  _particleCanvas.style.cssText = `
    position:fixed; inset:0; width:100%; height:100%;
    pointer-events:none; z-index:9; opacity:0;
    transition: opacity 0.8s;
  `;
  document.body.appendChild(_particleCanvas);
  _ctx = _particleCanvas.getContext('2d');
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);
}

function resizeParticleCanvas() {
  if (!_particleCanvas) return;
  _particleCanvas.width  = window.innerWidth;
  _particleCanvas.height = window.innerHeight;
}

function spawnJoyParticle() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  _particles.push({
    x:     Math.random() * w,
    y:     h + 10,
    vx:    (Math.random() - 0.5) * 1.8,
    vy:    -(Math.random() * 2 + 0.8),
    size:  Math.random() * 6 + 2,
    alpha: 1,
    color: Math.random() > 0.5 ? '245,200,66' : '255,232,138',
  });
}

function tickParticles() {
  if (!_ctx || !_particleCanvas) return;
  _ctx.clearRect(0, 0, _particleCanvas.width, _particleCanvas.height);
  _particles = _particles.filter(p => p.alpha > 0.02);
  for (const p of _particles) {
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   -= 0.02;
    p.alpha -= 0.007;
    _ctx.beginPath();
    _ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    _ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
    _ctx.fill();
  }
}

// ── Main response — called every frame ────────────────────
function applyResponse(stateInfo, dimensions) {
  const { state, changed, disengDuration } = stateInfo;

  ensureParticleCanvas();

  if (changed) {
    bodyEl.classList.remove('state-neutral', 'state-joy', 'state-disengaged');
    bodyEl.classList.add(`state-${state}`);
    stateLabelEl.textContent = LABELS[state];
    stateDescEl.textContent  = DESCRIPTIONS[state];

    if (state !== 'disengaged') {
      disengOverlay.classList.add('hidden');
      disengOverlay.classList.remove('active');
    }
    if (state !== 'joy') {
      _particles = [];
      if (_particleCanvas) _particleCanvas.style.opacity = '0';
    } else {
      if (_particleCanvas) _particleCanvas.style.opacity = '1';
    }
  }

  // Joy particles
  if (state === 'joy') {
    if (Math.random() < 0.45) spawnJoyParticle();
  }
  tickParticles();

  // Disengaged prompt after delay
  if (state === 'disengaged') {
    const showPrompt = disengDuration >= CONFIG.disengaged.promptDelayFrames;
    if (showPrompt && disengOverlay.classList.contains('hidden')) {
      disengOverlay.classList.remove('hidden');
      setTimeout(() => disengOverlay.classList.add('active'), 10);
    }
  }
}