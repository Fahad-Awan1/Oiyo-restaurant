// First-visit preloader: a real progress counter (fonts + window load), then
// the forest curtain lifts. Skipped on later page views in the same session.
import { gsap, reducedMotion } from './core.js';

export function runPreloader() {
  const root = document.documentElement;
  const el = document.getElementById('preloader');
  if (!el || root.classList.contains('no-preload')) {
    el?.remove();
    return Promise.resolve();
  }
  try { sessionStorage.setItem('oiyo:visited', '1'); } catch {}

  const countEl = el.querySelector('[data-preload-count]');
  const bar = el.querySelector('.preloader__bar span');
  const state = { p: 0 };
  let target = 30;

  const render = () => {
    countEl.textContent = Math.round(state.p);
    bar.style.transform = `scaleX(${state.p / 100})`;
  };

  document.fonts?.ready.then(() => (target = Math.max(target, 70)));
  // wait for the DOM + fonts (not every image), a short minimum, and a hard cap
  const loaded = new Promise((r) => (document.readyState !== 'loading' ? r() : addEventListener('DOMContentLoaded', r, { once: true }))).then(() => document.fonts?.ready);
  const minTime = new Promise((r) => setTimeout(r, reducedMotion ? 150 : 1000));
  const maxTime = new Promise((r) => setTimeout(r, 2800)); // never hold a visitor hostage

  const tick = gsap.ticker.add(() => {
    state.p += (target - state.p) * 0.08;
    render();
  });

  return Promise.race([Promise.all([loaded, minTime]), maxTime]).then(
    () =>
      new Promise((resolve) => {
        target = 100;
        gsap.to(state, {
          p: 100,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: render,
          onComplete: () => {
            gsap.ticker.remove(tick);
            gsap
              .timeline({ onComplete: () => el.remove() })
              .to(el.querySelector('.preloader__inner'), { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' })
              .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
              .add(resolve, '-=0.55');
          },
        });
      })
  );
}
