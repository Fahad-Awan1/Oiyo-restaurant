// Shared runtime: GSAP + ScrollTrigger + Lenis, wired once for every page.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isMobile = () => innerWidth < 768;

export let lenis = null;

export function initScroll() {
  if (reducedMotion) return null;
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: { offset: -90 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { offset: -90, duration: 1.4, ...opts });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Callbacks queued until the preloader has finished (or immediately if none). */
const readyQueue = [];
let isReady = false;
export function onReady(fn) {
  if (isReady) fn();
  else readyQueue.push(fn);
}
export function flushReady() {
  isReady = true;
  window.__oiyoReady = true;
  readyQueue.splice(0).forEach((fn) => fn());
}

/** Lightweight toast. */
export function toast(html, { timeout = 3200 } = {}) {
  const host = $('[data-toasts]');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  host.append(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, timeout);
  return el;
}

export const money = (n) => `$${n.toFixed(2)}`;
