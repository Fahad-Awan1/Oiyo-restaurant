// Ambient café soundscape, synthesised with WebAudio (zero downloads):
// a warm room-tone murmur, soft rain on the glass and the odd ceramic clink.
// Off by default; the preference is remembered for the session.
import { $$ } from './core.js';

let ctx = null;
let master = null;
let clinkTimer = null;

function noiseBuffer(ac, seconds = 4, brown = true) {
  const len = ac.sampleRate * seconds;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

function loop(ac, buffer, filterType, freq, gain, q = 0.7) {
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const f = ac.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start();
  return { src, f, g };
}

function clink() {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const base = 1800 + Math.random() * 1600;
  [1, 2.76, 5.4].forEach((m, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = base * m;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03 / (i + 1), t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6 + Math.random() * 0.5);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 1.2);
  });
  clinkTimer = setTimeout(clink, 4000 + Math.random() * 9000);
}

function start() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const brown = noiseBuffer(ctx, 5, true);
    const white = noiseBuffer(ctx, 3, false);
    loop(ctx, brown, 'lowpass', 420, 0.55); // room murmur
    const rain = loop(ctx, white, 'bandpass', 2600, 0.035, 0.4); // rain on glass
    // slow swell on the murmur so it breathes
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(rain.g.gain);
    lfo.start();
  }
  ctx.resume();
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
  clearTimeout(clinkTimer);
  clinkTimer = setTimeout(clink, 2500);
  return true;
}

function stop() {
  if (!ctx) return;
  clearTimeout(clinkTimer);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  setTimeout(() => ctx.state === 'running' && master.gain.value < 0.01 && ctx.suspend(), 1800);
}

export function initSound() {
  const btns = $$('[data-sound]');
  let on = false;
  const set = (v) => {
    on = v && start();
    if (!v) stop();
    btns.forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Mute ambient café sound' : 'Play ambient café sound');
    });
    try { sessionStorage.setItem('oiyo:sound', on ? '1' : '0'); } catch {}
  };
  btns.forEach((b) => b.addEventListener('click', () => set(!on)));
  // Browsers need a gesture to start audio, so resume on the first interaction.
  try {
    if (sessionStorage.getItem('oiyo:sound') === '1') addEventListener('pointerdown', () => set(true), { once: true });
  } catch {}
}
