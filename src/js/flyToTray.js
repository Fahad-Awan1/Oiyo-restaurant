// Add-to-tray flight: the product photo lifts off its card, rounds into a
// little "cup" disc and arcs (spinning) into the tray icon, trailed by
// tumbling coffee beans. The tray catches it with a squash, a ripple ring
// and a puff of steam.
import { gsap, $, $$, reducedMotion } from './core.js';

const BEANS = 5;
const beanSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="6.4" ry="9" transform="rotate(32 12 12)" fill="currentColor"/><path d="M9.2 6.2c3.6 2.6-.4 8.4 5.4 11.6" fill="none" stroke="#f3efe6" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>';

/** The visible tray button (header on every page). */
function trayTarget() {
  const header = $('#site-header');
  header?.classList.remove('is-hidden'); // bring the header back so the tray is in view
  return $$('[data-tray-open]').find((b) => b.offsetParent !== null) || null;
}

/** Point on a quadratic Bézier curve. */
const qb = (p0, p1, p2, t) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

export function flyToTray(fromEl, imgSrc) {
  const target = trayTarget();
  if (reducedMotion || !fromEl || !target) return Promise.resolve();

  const src = fromEl.getBoundingClientRect();
  // very large sources (e.g. the 3D stage) start from a centred square
  const startSize = Math.min(src.width, src.height, 260);
  const sx = src.left + src.width / 2;
  const sy = src.top + src.height / 2;

  const fly = document.createElement('div');
  fly.className = 'fly';
  fly.innerHTML = `<img src="${imgSrc}" alt="" />`;
  document.body.append(fly);
  const beans = Array.from({ length: BEANS }, () => {
    const b = document.createElement('span');
    b.className = 'fly-bean';
    b.innerHTML = beanSvg;
    document.body.append(b);
    gsap.set(b, { opacity: 0, x: sx, y: sy, xPercent: -50, yPercent: -50 });
    return b;
  });

  // size + position are animated directly on this one element (cheap)
  gsap.set(fly, { width: src.width, height: src.height, x: src.left, y: src.top, borderRadius: 22 });

  return new Promise((resolve) => {
    const finish = () => {
      fly.remove();
      beans.forEach((b) => b.remove());
    };
    const path = { t: 0 };
    const D = 46; // flying disc size
    const end = () => {
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const control = () => {
      const e = end();
      return { x: (sx + e.x) / 2 + (e.x < sx ? 80 : -80), y: Math.min(sy, e.y) - Math.max(140, Math.abs(sx - e.x) * 0.25) };
    };

    gsap
      .timeline({ onComplete: finish })
      // 1. lift: shrink to a disc and pop up slightly
      .to(fly, {
        width: D * 1.6,
        height: D * 1.6,
        x: sx - D * 0.8,
        y: sy - D * 0.8 - 18,
        borderRadius: '50%',
        rotation: -12,
        duration: 0.38,
        ease: 'back.out(1.8)',
      })
      // 2. flight along the arc, beans trailing behind
      .to(path, {
        t: 1,
        duration: 0.8,
        ease: 'power2.in',
        onUpdate() {
          const e = end();
          const c = control();
          const t = path.t;
          const size = gsap.utils.interpolate(D * 1.6, 18, t);
          const x = qb(sx, c.x, e.x, t);
          const y = qb(sy - 18, c.y, e.y, t);
          gsap.set(fly, { width: size, height: size, x: x - size / 2, y: y - size / 2, rotation: -12 + t * 380 });
          beans.forEach((b, i) => {
            const lag = Math.max(0, t - (i + 1) * 0.07);
            if (!lag) return;
            const fade = 1 - Math.max(0, (t - 0.85) / 0.15);
            gsap.set(b, {
              opacity: Math.min(1, lag * 6) * fade,
              x: qb(sx, c.x, e.x, lag) + Math.sin((lag + i) * 12) * 6,
              y: qb(sy - 18, c.y, e.y, lag),
              rotation: lag * 720 + i * 50,
              scale: 1 - i * 0.12,
            });
          });
        },
      })
      .add(() => {
        resolve();
        catchAnimation(target);
      })
      .to(fly, { scale: 0, opacity: 0, duration: 0.18, ease: 'power2.in' }, '<')
      .to(beans, { opacity: 0, duration: 0.2 }, '<');
  });
}

/** The tray "catches" the drop: squash and wobble, a ripple ring, a puff of steam. */
function catchAnimation(target) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  gsap.fromTo(target, { scaleX: 1.25, scaleY: 0.78 }, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.35)' });
  gsap.fromTo(target, { rotation: -10 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });

  const ring = document.createElement('span');
  ring.className = 'tray-burst';
  document.body.append(ring);
  gsap.set(ring, { left: cx, top: cy });
  gsap.fromTo(ring, { scale: 0.4, opacity: 0.9 }, { scale: 1.9, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ring.remove() });

  const steam = document.createElement('span');
  steam.className = 'tray-steam';
  steam.innerHTML = '<i></i><i></i><i></i>';
  document.body.append(steam);
  gsap.set(steam, { left: cx, top: r.top - 10 });
  gsap.fromTo(
    steam.children,
    { y: 6, opacity: 0, scaleY: 0.4, skewX: 0 },
    { y: -16, opacity: 1, scaleY: 1, skewX: -14, duration: 0.55, ease: 'power2.out', stagger: 0.08, yoyo: false, onComplete: () => gsap.to(steam, { opacity: 0, duration: 0.3, onComplete: () => steam.remove() }) }
  );
}
