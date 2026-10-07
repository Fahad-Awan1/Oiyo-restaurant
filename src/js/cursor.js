// Custom cursor for fine pointers: dot + trailing ring that grows over
// interactive elements and shows a label for [data-cursor="Label"].
import { gsap, finePointer, reducedMotion, $ } from './core.js';

export function initCursor() {
  if (!finePointer || reducedMotion) return;
  const root = $('.cursor');
  if (!root) return;
  document.documentElement.classList.add('has-cursor');
  const dot = $('.cursor__dot', root);
  const ring = $('.cursor__ring', root);
  const label = $('[data-cursor-label]', root);
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

  root.classList.add('is-hidden'); // until the mouse actually moves
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    root.classList.remove('is-hidden');
    dx(e.clientX);
    dy(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button, [role="button"], input, select, label, summary, [data-drag]');
    root.classList.toggle('has-label', !!lab);
    label.textContent = lab ? lab.dataset.cursor : '';
    root.classList.toggle('is-hover', !!hov && !lab);
  });
  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => root.classList.remove('is-hidden'));
}
