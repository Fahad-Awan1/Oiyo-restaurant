// Tiny, dependency-free gate that decides whether 3D should run and lazily
// loads a scene module only when its host nears the viewport. Kept separate
// so pages never pull Three.js unless a scene actually mounts.
import { reducedMotion } from '../core.js';

let verdict = null;

export function canRender3D() {
  if (verdict !== null) return verdict;
  verdict = (() => {
    if (reducedMotion) return false;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
      // Software rasterisers (no GPU / blocklisted GPU) make WebGL janky:
      // those visitors get the static posters instead.
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
    } catch {
      return false;
    }
  })();
  return verdict;
}

/** Resolves after the page has loaded and the main thread is idle. */
const idle = new Promise((resolve) => {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 1500 }) : setTimeout(resolve, 300));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
});

/** Run `loader` once when `el` comes within `margin` of the viewport (after load + idle). */
export function whenNear(el, loader, margin = '300px') {
  if (!el) return;
  idle.then(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          loader();
        }
      },
      { rootMargin: margin }
    );
    io.observe(el);
  });
}

/** Floating beans & leaves behind a hero, lazily loaded. Purely decorative,
 *  so phones skip it and keep their bandwidth and battery for the content. */
export function heroParticles(host, opts) {
  if (!host || innerWidth < 768 || !canRender3D()) return;
  whenNear(host, () => import('./particles.js').then((m) => m.mountParticles(host, opts)), '100px');
}
