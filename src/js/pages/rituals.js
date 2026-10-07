import '../main.js';
import { ScrollTrigger, $, $$ } from '../core.js';
import { canRender3D, whenNear } from '../three/gate.js';

/* ----- scroll-driven pour-over ------------------------------------------ */
const pour = $('[data-pour]');
const stage = $('[data-pour-stage]');
const steps = $$('.pour-step');
const dots = $$('.pour__dots li');
const poster = $('[data-pour-poster]');
let scene = null;
let progress = 0;
let active = -1;

function setActive(i) {
  if (i === active) return;
  active = i;
  steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
  dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
  if (!scene && poster) {
    const name = steps[i].dataset.poster;
    poster.src = `/img/${name}-sm.webp`;
    poster.srcset = `/img/${name}-sm.webp 640w, /img/${name}-md.webp 960w, /img/${name}-lg.webp 1400w`;
  }
}

ScrollTrigger.create({
  trigger: pour,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (st) => {
    progress = st.progress;
    scene?.setProgress(progress);
  },
});
// the step whose block crosses the middle of the screen is "active"
steps.forEach((step, i) =>
  ScrollTrigger.create({
    trigger: step,
    start: 'top 60%',
    end: 'bottom 60%',
    onToggle: (st) => st.isActive && setActive(i),
  })
);
setActive(0);

if (canRender3D()) {
  whenNear(stage, () =>
    import('../three/pourOver.js').then(async ({ mountPourOver }) => {
      scene = await mountPourOver(stage);
      scene.setProgress(progress);
    }),
    // mount once the section reaches the upper part of the screen
    '0px 0px -35% 0px'
  );
}

/* ----- brew timer -------------------------------------------------------- */
const METHODS = {
  pourover: {
    total: 210,
    recipe: { Coffee: '22 g', Water: '350 g', Temp: '94°C' },
    steps: [
      [0, 'Bloom: pour 50 g and let it breathe'],
      [30, 'First pour: slow spirals to 150 g'],
      [75, 'Second pour: gently up to 250 g'],
      [120, 'Final pour: to 350 g, center to edge'],
      [165, 'Let it draw down. Nearly there'],
    ],
    done: 'Ready. Pour, sip, slow down.',
  },
  press: {
    total: 240,
    recipe: { Coffee: '30 g', Water: '500 g', Temp: '96°C' },
    steps: [
      [0, 'Pour all the water, stir once'],
      [60, 'Lid on. Let it steep quietly'],
      [180, 'Break the crust, skim the foam'],
      [225, 'Press slowly, all the way down'],
    ],
    done: 'Ready. Serve right away.',
  },
  matcha: {
    total: 60,
    recipe: { Matcha: '2 g', Water: '70 ml', Temp: '75°C' },
    steps: [
      [0, 'Sift the matcha into your bowl'],
      [10, 'Add the water at 75°C'],
      [20, 'Whisk briskly in an “M” motion'],
      [45, 'Lift the whisk slowly from the center'],
    ],
    done: 'Ready. Enjoy it mindfully.',
  },
};

const timerEl = $('.timer');
const ring = $('[data-timer-ring]');
const timeEl = $('[data-timer-time]');
const stepEl = $('[data-timer-step]');
const toggle = $('[data-timer-toggle]');
const recipeEl = $('[data-timer-recipe]');
const CIRC = 2 * Math.PI * 96;
let method = 'pourover';
let elapsed = 0;
let running = false;
let tick = 0;
let lastStep = -1;
let audio = null;

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function chime(freq = 880) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.4);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 1.5);
  } catch {}
  navigator.vibrate?.(40);
}

function render() {
  const m = METHODS[method];
  const left = Math.max(0, m.total - elapsed);
  timeEl.textContent = fmt(Math.ceil(left));
  ring.style.strokeDashoffset = String(CIRC * (1 - elapsed / m.total));
  const done = elapsed >= m.total;
  timerEl.classList.toggle('is-done', done);
  let idx = -1;
  m.steps.forEach(([at], i) => elapsed >= at && (idx = i));
  if (done) stepEl.textContent = m.done;
  else if (!running && elapsed === 0) stepEl.textContent = 'Ready when you are';
  else if (idx >= 0) stepEl.textContent = m.steps[idx][1];
  if (running && idx !== lastStep) {
    if (lastStep !== -1) chime(idx % 2 ? 660 : 880);
    lastStep = idx;
  }
}

function setRunning(on) {
  running = on;
  toggle.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${on ? 'pause' : 'play'}" /></svg>`;
  toggle.setAttribute('aria-label', on ? 'Pause timer' : 'Start timer');
  clearInterval(tick);
  if (on) {
    tick = setInterval(() => {
      elapsed += 1;
      if (elapsed >= METHODS[method].total) {
        elapsed = METHODS[method].total;
        setRunning(false);
        chime(1046);
        setTimeout(() => chime(1318), 220);
      }
      render();
    }, 1000);
  }
  render();
}

function reset() {
  setRunning(false);
  elapsed = 0;
  lastStep = -1;
  ring.style.transition = 'none';
  render();
  requestAnimationFrame(() => (ring.style.transition = ''));
}

function selectMethod(id) {
  method = id;
  $$('[data-method]').forEach((b) => {
    const on = b.dataset.method === id;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-checked', String(on));
  });
  recipeEl.innerHTML = Object.entries(METHODS[id].recipe)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('');
  reset();
}

$$('[data-method]').forEach((b) => b.addEventListener('click', () => selectMethod(b.dataset.method)));
toggle.addEventListener('click', () => {
  if (elapsed >= METHODS[method].total) reset();
  setRunning(!running);
});
$('[data-timer-reset]').addEventListener('click', reset);
selectMethod('pourover');
