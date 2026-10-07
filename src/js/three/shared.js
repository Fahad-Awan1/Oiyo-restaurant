// Shared Three.js building blocks: renderer, studio lighting, procedural
// stoneware, coffee beans and leaves. Everything is generated in code, so
// there are no model downloads.
import * as THREE from 'three';

export { THREE };

export const isSmall = () => innerWidth < 768;

export function makeRenderer(canvas, { alpha = true } = {}) {
  const small = isSmall();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias: !small || devicePixelRatio < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/** Soft warm studio built from lights only. (A PMREM environment map looks
 *  lovely but compiles blur shaders synchronously: seconds of freeze on
 *  integrated GPUs, so specular points stand in for reflections.) */
export function addStudio(scene) {
  const hemi = new THREE.HemisphereLight(0xfff4e2, 0x5f6b3d, 1.35);
  const key = new THREE.DirectionalLight(0xffe2bd, 2.6);
  key.position.set(3, 5, 4);
  const fill = new THREE.DirectionalLight(0xf3efe6, 0.9);
  fill.position.set(-4, 1.5, 5);
  const rim = new THREE.DirectionalLight(0xc6d6a8, 1.5);
  rim.position.set(-4, 3, -4);
  const glintWarm = new THREE.PointLight(0xffe7c4, 14, 14, 2);
  glintWarm.position.set(2.5, 3.5, 3.5);
  const glintCool = new THREE.PointLight(0xe3ecd2, 8, 14, 2);
  glintCool.position.set(-3, 2, 2.5);
  scene.add(hemi, key, fill, rim, glintWarm, glintCool);
  return { hemi, key, rim };
}

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Speckled stoneware glaze, the kind you find in a slow café. */
export function stonewareMaterial(base = '#efe8dc', speck = 'rgba(90,70,50,0.55)') {
  const map = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(120,100,80,0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = speck;
      const r = Math.random() * 1.6 + 0.3;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: 0.38, metalness: 0, side: THREE.DoubleSide });
}

/** Coffee bean: a squashed sphere with a carved center crease. */
export function beanGeometry(size = 0.16) {
  const g = new THREE.SphereGeometry(1, 22, 16);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.x *= 0.62;
    v.y *= 0.9;
    v.z *= 0.42;
    if (v.z > 0) {
      const crease = Math.exp(-(v.x * v.x) / 0.006) * 0.16;
      v.z -= crease * (1 - Math.abs(v.y) * 0.6);
      v.x += Math.sin(v.y * 3) * 0.02;
    }
    v.multiplyScalar(size);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function beanMaterial(color = '#5a3521') {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.05 });
}

/** Simple leaf: a curved shape with a gentle fold along its midrib. */
export function leafGeometry(size = 0.35) {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(0.55, -0.6, 0.6, 0.4, 0, 1);
  s.bezierCurveTo(-0.6, 0.4, -0.55, -0.6, 0, -1);
  const g = new THREE.ShapeGeometry(s, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setXYZ(i, x * size * 0.55, y * size, Math.abs(x) * size * 0.35 + Math.sin(y * 1.5) * size * 0.08);
  }
  g.computeVertexNormals();
  return g;
}

/** Thin twisted glass ribbon along a curve (index order follows the path, so drawRange can “grow” it). */
export function ribbonGeometry(curve, { segments = 220, width = 0.22, twist = 2.5 } = {}) {
  const pos = [];
  const nor = [];
  const idx = [];
  const frames = curve.computeFrenetFrames(segments, false);
  const p = new THREE.Vector3();
  const side = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, p);
    const a = t * Math.PI * twist;
    const w = width * (0.35 + 0.65 * Math.sin(Math.PI * t)); // taper ends
    side.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
    n.copy(frames.normals[i]).multiplyScalar(-Math.sin(a)).addScaledVector(frames.binormals[i], Math.cos(a));
    pos.push(p.x + side.x * w, p.y + side.y * w, p.z + side.z * w, p.x - side.x * w, p.y - side.y * w, p.z - side.z * w);
    nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
    if (i < segments) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** Amber glass. A clear-coated, semi-transparent surface. (True transmission
 *  costs a full extra scene render every frame; this reads the same at speed.) */
export function amberGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({ color: '#d08a3c', roughness: 0.12, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
}

/** Soft radial contact shadow. */
export function contactShadow(radius = 1.6, opacity = 0.35) {
  const tex = canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(40,30,20,0.9)');
    g.addColorStop(0.5, 'rgba(40,30,20,0.35)');
    g.addColorStop(1, 'rgba(40,30,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** Rising steam plume: a camera-facing plane with an fbm-noise shader. */
export function steamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uSeed: { value: Math.random() * 10 }, uOpacity: { value: 0.55 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.x += sin(uv.y * 4.0 + uTime * 1.2) * 0.12 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSeed;
      uniform float uOpacity;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
      void main() {
        vec2 uv = vUv;
        float n = fbm(vec2(uv.x * 3.0 + uSeed, uv.y * 2.2 - uTime * 0.45));
        float wisp = smoothstep(0.42, 0.9, n);
        float mask = smoothstep(0.5, 0.0, abs(uv.x - 0.5 + (n - 0.5) * 0.35)) * smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.45, uv.y);
        gl_FragColor = vec4(vec3(1.0, 0.98, 0.95), wisp * mask * uOpacity);
      }`,
  });
}

/** Let the browser breathe between heavy setup steps. */
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/** Compile every shader off the main thread (KHR_parallel_shader_compile) before the first frame. */
export async function warmUp(renderer, scene, camera) {
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    renderer.compile(scene, camera);
  }
}

/** Visibility-aware render loop: pauses when the host is off-screen or the tab is hidden. */
export function renderLoop(host, frame) {
  let visible = true;
  let raf = 0;
  let last = performance.now();
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
  });
  io.observe(host);
  const tick = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame(dt, now / 1000);
    raf = requestAnimationFrame(tick);
  };
  function start() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  document.addEventListener('visibilitychange', () => !document.hidden && start());
  start();
  return { start, setVisible: (v) => ((visible = v), v && start()) };
}
