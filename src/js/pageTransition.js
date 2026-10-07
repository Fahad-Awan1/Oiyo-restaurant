// "The pour": a café-themed page transition. On leaving, a coffee layer and a
// forest layer rise from the bottom with rolling liquid edges while the Oiyo
// mark draws itself above the destination's name. The next page starts fully
// covered (flagged in <head> before first paint) and the liquid drains upward
// as its hero animates in, so no frame of the swap is ever visible.
import { gsap, $, $$, lenis, reducedMotion } from './core.js';

const LABELS = {
  '': 'Welcome home',
  'index.html': 'Welcome home',
  'menu.html': 'The Menu',
  'story.html': 'Our Story',
  'rituals.html': 'The Rituals',
  'visit.html': 'Plan your visit',
  'journal.html': 'The Journal',
};
const KEY = 'oiyo:pt';
const root = document.documentElement;
let leaving = false;

const fileOf = (url) => url.pathname.split('/').pop();

function isTransitionLink(a, e) {
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download') || a.dataset.noTransition !== undefined) return false;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  // same page (maybe a different #hash): let the in-page scroll handle it
  if (url.pathname === location.pathname && url.search === location.search) return false;
  return url;
}

function leave(url) {
  if (leaving) return;
  leaving = true;
  const el = $('.pt');
  const label = LABELS[fileOf(url)] ?? 'One moment';
  $('[data-pt-label]').textContent = label;
  try { sessionStorage.setItem(KEY, JSON.stringify({ label, t: Date.now() })); } catch {}
  lenis?.stop();
  el.classList.add('is-active');
  const [coffee, forest] = $$('.pt__layer', el);
  const go = () => location.assign(url.href);
  const safety = setTimeout(go, 1600);
  gsap
    .timeline({ onComplete: () => (clearTimeout(safety), go()) })
    .fromTo(coffee, { yPercent: 0, y: '100vh' }, { y: 0, duration: 0.75, ease: 'power3.inOut' })
    .fromTo(forest, { y: '100vh' }, { y: 0, duration: 0.75, ease: 'power3.inOut' }, 0.12)
    .fromTo('.pt__center', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.5)
    .to({}, { duration: 0.12 }); // a breath before the swap
}

/** Reveal the page if we arrived through the pour. Resolves when the hero can start animating. */
export function arrive() {
  if (!root.classList.contains('pt-arriving')) return Promise.resolve();
  const el = $('.pt');
  const [coffee, forest] = $$('.pt__layer', el);
  if (reducedMotion) {
    root.classList.remove('pt-arriving');
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    gsap.set([coffee, forest], { y: 0 });
    gsap
      .timeline({
        onComplete: () => {
          root.classList.remove('pt-arriving');
          gsap.set([coffee, forest], { clearProps: 'transform' });
          gsap.set('.pt__center', { clearProps: 'all' });
        },
      })
      .to('.pt__center', { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in' })
      .to(forest, { y: '-100vh', yPercent: -12, duration: 0.95, ease: 'power3.inOut' }, 0.15)
      .to(coffee, { y: '-100vh', yPercent: -12, duration: 0.95, ease: 'power3.inOut' }, 0.27)
      .add(resolve, 0.55);
  });
}

export function initPageTransitions() {
  if (reducedMotion) return;
  document.addEventListener('click', (e) => {
    const url = isTransitionLink(e.target.closest('a[href]'), e);
    if (!url) return;
    e.preventDefault();
    leave(url);
  });
  // Back/forward cache restores the covered page: uncover it instantly.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    $('.pt')?.classList.remove('is-active');
    root.classList.remove('pt-arriving');
    gsap.set($$('.pt__layer'), { clearProps: 'transform' });
    gsap.set('.pt__center', { clearProps: 'all' });
    lenis?.start();
  });
}
