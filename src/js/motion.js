// Scroll + pointer motion layer. Everything here degrades to static content
// when reduced motion is requested.
import { gsap, ScrollTrigger, $$, reducedMotion, finePointer } from './core.js';

/** Fade/slide-in on enter. Siblings inside [data-stagger] get cascading delays. */
export function initReveals(root = document) {
  const els = $$('[data-reveal]:not(.is-in), [data-clip]:not(.is-in)', root);
  if (reducedMotion) return els.forEach((el) => el.classList.add('is-in'));
  $$('[data-stagger]', root).forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty('--d', `${Math.min(i, 8) * 0.08}s`));
  });
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  els.forEach((el) => io.observe(el));
}

/** Split a heading into masked lines (words kept intact, <em>/<svg> preserved). */
export function splitLines(el) {
  if (el.dataset.splitDone) return $$('.split-line > span', el);
  const nodes = [...el.childNodes];
  el.innerHTML = '';
  const words = [];
  nodes.forEach((n) => {
    if (n.nodeType === 3) {
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return el.append(document.createTextNode(' '));
        const w = document.createElement('span');
        w.textContent = part;
        w.style.display = 'inline-block';
        el.append(w);
        words.push(w);
      });
    } else if (n.nodeName === 'BR') {
      el.append(n);
    } else {
      n.style && (n.style.display = n.style.display || 'inline-block');
      el.append(n);
      words.push(n);
    }
  });
  // group by vertical position
  const lines = [];
  let top = null;
  words.forEach((w) => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) {
      lines.push([]);
      top = t;
    }
    lines[lines.length - 1].push(w);
  });
  el.innerHTML = '';
  const inners = lines.map((ws) => {
    const line = document.createElement('span');
    line.className = 'split-line';
    const inner = document.createElement('span');
    ws.forEach((w, i) => {
      inner.append(w);
      if (i < ws.length - 1) inner.append(' ');
    });
    line.append(inner);
    el.append(line);
    return inner;
  });
  el.dataset.splitDone = '1';
  return inners;
}

/** Headings marked [data-split] rise line-by-line. The hero heading splits
 *  immediately; the rest are split lazily as they approach the viewport,
 *  which spreads the layout work out instead of front-loading it. */
export function initSplits(root = document) {
  const els = $$('[data-split]', root);
  const reveal = (el) => {
    const lines = splitLines(el);
    gsap.set(lines, { yPercent: 115, rotate: 2 });
    el.classList.add('is-split');
    gsap.to(lines, { yPercent: 0, rotate: 0, duration: 1.25, ease: 'expo.out', stagger: 0.09, delay: Number(el.dataset.split) || 0 });
  };
  if (reducedMotion) return els.forEach((el) => el.classList.add('is-split'));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        reveal(e.target);
      }),
    { rootMargin: '0px 0px -10% 0px' }
  );
  els.forEach((el) => (el.hasAttribute('data-split-now') ? reveal(el) : io.observe(el)));
}

export function initParallax(root = document) {
  if (reducedMotion) return;
  $$('[data-parallax]', root).forEach((el) => {
    const amt = Number(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

export function initCounters(root = document) {
  $$('[data-count]', root).forEach((el) => {
    const end = Number(el.dataset.count);
    if (reducedMotion) return (el.textContent = end);
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(obj.v)) }),
    });
  });
}

/** Buttons that lean toward the pointer. */
export function initMagnetic(root = document) {
  if (!finePointer || reducedMotion) return;
  $$('[data-magnetic]', root).forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/** Subtle 3D tilt on card media (CSS perspective, GPU-only transforms). */
export function initTilt(root = document) {
  if (!finePointer || reducedMotion) return;
  $$('[data-tilt]', root).forEach((el) => {
    const card = el.closest('.p-card, .tilt-host') || el;
    card.style.perspective = '900px';
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 10);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

export function initMotion(root = document) {
  initReveals(root);
  initSplits(root);
  initParallax(root);
  initCounters(root);
  initMagnetic(root);
  initTilt(root);
}
