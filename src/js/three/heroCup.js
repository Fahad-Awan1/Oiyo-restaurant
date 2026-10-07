// The Oiyo cup: a procedural stoneware cup on a saucer, with latte art,
// steam, orbiting coffee beans and an amber glass ribbon.
//
// The canvas is fixed to the viewport and the cup *follows DOM anchors*: it
// sits in the hero stage, then travels (spinning) into the Ritual Builder
// stage as you scroll, like a product that walks you through the page.
import { THREE, makeRenderer, addStudio, stonewareMaterial, beanGeometry, beanMaterial, ribbonGeometry, amberGlassMaterial, contactShadow, steamMaterial, isSmall, warmUp, nextFrame } from './shared.js';
import { gsap, ScrollTrigger, finePointer } from '../core.js';

export const DRINKS = {
  cappuccino: { liquid: '#a8703f', crema: '#cf9a69', milk: '#f6ebda', art: 'rosetta' },
  matcha: { liquid: '#7c9a45', crema: '#a2bb68', milk: '#f3f2df', art: 'heart' },
  chai: { liquid: '#b5875a', crema: '#d6ab7d', milk: '#f6eadb', art: 'tulip', dust: true },
  cocoa: { liquid: '#5b3423', crema: '#7d4b33', milk: '#f3e3cf', art: 'heart' },
};

/* ----- latte art, painted to a canvas texture --------------------------- */
function paintArt(ctx, s, { drink = 'cappuccino', milk = 'whole', sweet = 'none' } = {}) {
  const d = DRINKS[drink];
  const c = s / 2;
  const milkCol = milk === 'oat' ? '#efdcc0' : d.milk;
  ctx.clearRect(0, 0, s, s);
  // crema body
  const g = ctx.createRadialGradient(c, c * 0.92, s * 0.05, c, c, c);
  g.addColorStop(0, milk === 'none' ? d.liquid : d.crema);
  g.addColorStop(0.75, d.liquid);
  g.addColorStop(1, shade(d.liquid, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // crema mottling
  for (let i = 0; i < 420; i++) {
    const r = Math.random() * c * 0.9;
    const a = Math.random() * Math.PI * 2;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,235,205' : '60,30,15'},${Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, Math.random() * s * 0.012 + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (milk !== 'none') {
    ctx.fillStyle = milkCol;
    ctx.strokeStyle = milkCol;
    ctx.shadowColor = 'rgba(255,240,220,0.5)';
    ctx.shadowBlur = s * 0.01;
    if (d.art === 'rosetta') {
      for (let i = 0; i < 7; i++) {
        const y = c + s * 0.2 - i * s * 0.062;
        const rx = s * (0.2 - i * 0.021);
        ctx.beginPath();
        ctx.moveTo(c - rx, y);
        ctx.quadraticCurveTo(c, y - s * 0.11, c + rx, y);
        ctx.quadraticCurveTo(c, y - s * 0.035, c - rx, y);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(c, c + s * 0.3);
      ctx.lineTo(c, c - s * 0.25);
      ctx.lineWidth = s * 0.012;
      ctx.lineCap = 'round';
      ctx.stroke();
      // small heart cap
      heart(ctx, c, c - s * 0.25, s * 0.07);
    } else if (d.art === 'heart') {
      heart(ctx, c, c + s * 0.03, s * 0.26);
      ctx.fillStyle = d.crema;
      heart(ctx, c, c + s * 0.0, s * 0.12);
      ctx.fillStyle = milkCol;
      heart(ctx, c, c - s * 0.02, s * 0.06);
    } else {
      // tulip: stacked blobs
      [0.19, 0.14, 0.1].forEach((r, i) => {
        ctx.beginPath();
        ctx.ellipse(c, c + s * 0.17 - i * s * 0.14, s * r, s * r * 0.62, 0, Math.PI, 0);
        ctx.ellipse(c, c + s * 0.17 - i * s * 0.14, s * r, s * r * 0.3, 0, 0, Math.PI);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(c, c + s * 0.28);
      ctx.lineTo(c, c - s * 0.12);
      ctx.lineWidth = s * 0.01;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
  if (d.dust) {
    for (let i = 0; i < 260; i++) {
      const r = Math.random() * c * 0.8;
      const a = Math.random() * Math.PI * 2;
      ctx.fillStyle = `rgba(120,62,28,${Math.random() * 0.6})`;
      ctx.fillRect(c + Math.cos(a) * r, c + Math.sin(a) * r, 2, 2);
    }
  }
  if (sweet !== 'none') {
    ctx.strokeStyle = sweet === 'honey' ? 'rgba(232,170,60,0.85)' : 'rgba(170,92,30,0.85)';
    ctx.lineWidth = s * 0.008;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (sweet === 'honey') {
      for (let i = 0; i <= 10; i++) ctx.lineTo(c - s * 0.3 + i * s * 0.06, c - s * 0.32 + (i % 2) * s * 0.07);
    } else {
      for (let a = 0; a < Math.PI * 5; a += 0.08) {
        const r = s * 0.02 + a * s * 0.022;
        ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      }
    }
    ctx.stroke();
  }
  // soft vignette where liquid meets the cup wall
  const v = ctx.createRadialGradient(c, c, c * 0.8, c, c, c);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(30,15,5,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, s, s);
}
function heart(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y + r * 0.1, x - r * 0.9, y - r * 1.05, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.9, y - r * 1.05, x + r * 1.4, y + r * 0.1, x, y + r * 0.9);
  ctx.fill();
}
function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt * 0.5);
  return `#${c.getHexString()}`;
}

/* ----- geometry ---------------------------------------------------------- */
function buildCup() {
  const group = new THREE.Group();
  const ceramic = stonewareMaterial();
  // cup wall profile (radius, height): inner bottom → inner wall → rim → outer wall → foot
  const prof = [
    [0, 0.14], [0.5, 0.15], [0.7, 0.32], [0.8, 0.62], [0.845, 0.98], [0.87, 1.04], [0.905, 1.03], [0.92, 0.98],
    [0.88, 0.62], [0.78, 0.3], [0.62, 0.1], [0.5, 0.02], [0.46, 0], [0, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), ceramic);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.058, 14, 40, Math.PI * 1.3), ceramic);
  handle.position.set(0.9, 0.58, 0);
  handle.rotation.z = -Math.PI * 0.65;
  const saucerProf = [
    [0, 0.0], [0.55, 0.0], [0.6, 0.035], [1.15, 0.1], [1.32, 0.17], [1.36, 0.16], [1.3, 0.1], [1.12, 0.045], [0.58, -0.02], [0.5, -0.06], [0, -0.06],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerProf, 80), ceramic);
  saucer.position.y = -0.06;
  cup.position.y = 0.01;

  const tex = new THREE.CanvasTexture(document.createElement('canvas'));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const liquid = new THREE.Mesh(
    new THREE.CircleGeometry(0.83, 64),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 })
  );
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.9;

  const shadow = contactShadow(1.7, 0.42);
  shadow.position.y = -0.08;
  group.add(shadow, saucer, cup, handle, liquid);
  return { group, liquid, tex };
}

function buildBeans(count) {
  const mesh = new THREE.InstancedMesh(beanGeometry(0.15), beanMaterial(), count);
  const data = Array.from({ length: count }, (_, i) => ({
    a: (i / count) * Math.PI * 2 + Math.random() * 0.4,
    r: 1.55 + Math.random() * 0.75,
    h: -0.4 + Math.random() * 2.0,
    sp: 0.12 + Math.random() * 0.12,
    rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    rs: 0.4 + Math.random() * 0.8,
    ph: Math.random() * 6,
  }));
  return { mesh, data };
}

function buildRibbon() {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const a = t * Math.PI * 2.4 + 0.6;
    const r = 1.55 + Math.sin(t * Math.PI * 3) * 0.25;
    pts.push(new THREE.Vector3(Math.cos(a) * r, -0.5 + t * 2.6 + Math.sin(t * 9) * 0.12, Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const geo = ribbonGeometry(curve, { segments: 260, width: 0.2, twist: 3 });
  const mesh = new THREE.Mesh(geo, amberGlassMaterial());
  mesh.userData.total = geo.index.count;
  return mesh;
}

/* ----- scene ------------------------------------------------------------- */
export async function mountCup({ anchors, transitTrigger }) {
  const small = isSmall();
  const canvas = document.createElement('canvas');
  canvas.className = 'cup-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 60);
  camera.position.set(0, 0, 10);
  addStudio(scene);
  await nextFrame();

  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  root.add(tilt);
  tilt.add(spin);
  scene.add(root);

  const cup = buildCup();
  spin.add(cup.group);
  cup.group.position.y = -0.45;

  const beans = buildBeans(small ? 12 : 22);
  tilt.add(beans.mesh);
  const ribbon = buildRibbon();
  tilt.add(ribbon);

  const steams = [0, 1].map((i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.5, 1, 16), steamMaterial());
    m.material.uniforms.uSeed.value = i * 4.3;
    scene.add(m);
    return m;
  });

  // art texture
  const artCanvas = document.createElement('canvas');
  artCanvas.width = artCanvas.height = small ? 512 : 1024;
  const actx = artCanvas.getContext('2d');
  cup.tex.image = artCanvas;
  let current = { drink: 'cappuccino', milk: 'whole', sweet: 'none' };
  paintArt(actx, artCanvas.width, current);
  cup.tex.needsUpdate = true;

  /* state */
  const state = { intro: 0, transit: 0, yaw: 0, yawTarget: 0, tiltX: 0, tiltY: 0, mx: 0, my: 0, ribbon: 0 };
  const tmp = new THREE.Vector3();
  const dummy = new THREE.Object3D();
  const UNIT = 3.6; // world size of the composition that maps onto an anchor
  const easeTransit = gsap.parseEase('power2.inOut');

  if (transitTrigger) {
    ScrollTrigger.create({
      trigger: transitTrigger,
      start: 'top 78%',
      end: 'top 12%',
      scrub: true,
      onUpdate: (st) => (state.transit = st.progress),
    });
  }

  if (finePointer) {
    addEventListener('pointermove', (e) => {
      state.mx = (e.clientX / innerWidth) * 2 - 1;
      state.my = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // drag-to-turn on any anchor flagged [data-drag]
  anchors.forEach((a) => {
    if (!a?.hasAttribute('data-drag')) return;
    let down = false;
    let lx = 0;
    a.addEventListener('pointerdown', (e) => {
      down = true;
      lx = e.clientX;
      a.setPointerCapture(e.pointerId);
    });
    a.addEventListener('pointermove', (e) => {
      if (!down) return;
      state.yawTarget += (e.clientX - lx) * 0.012;
      lx = e.clientX;
    });
    const up = () => (down = false);
    a.addEventListener('pointerup', up);
    a.addEventListener('pointercancel', up);
  });

  function anchorRect(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: Math.min(r.width, r.height * 1.05) };
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  let rz = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(resize);
  });

  const worldPerPx = () => (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / innerHeight;

  let running = false;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    // where should the cup be? lerp between live anchor rects
    const a = anchorRect(anchors[0]);
    const b = anchors[1] ? anchorRect(anchors[1]) : a;
    const p = easeTransit(state.transit);
    const cx = a.x + (b.x - a.x) * p;
    const cy = a.y + (b.y - a.y) * p;
    const size = a.s + (b.s - a.s) * p;

    // off-screen? stop rendering until it comes back
    const onScreen = cy + size > -50 && cy - size < innerHeight + 50;
    canvas.style.visibility = onScreen ? 'visible' : 'hidden';
    if (!onScreen || document.hidden) {
      running = false;
      return;
    }

    const wpp = worldPerPx();
    const arc = Math.sin(p * Math.PI) * (small ? 0.4 : 1.2);
    root.position.set((cx - innerWidth / 2) * wpp + arc, -(cy - innerHeight / 2) * wpp, 0);
    const scale = ((size * wpp) / UNIT) * (0.55 + 0.45 * state.intro);
    root.scale.setScalar(scale);

    // tilt toward the viewer + pointer lean
    state.tiltX += (0.56 + state.my * 0.1 - state.tiltX) * 0.06;
    state.tiltY += (state.mx * 0.25 - state.tiltY) * 0.06;
    tilt.rotation.set(state.tiltX, state.tiltY, Math.sin(p * Math.PI) * 0.25);
    state.yawTarget += dt * 0.12;
    state.yaw += (state.yawTarget - state.yaw) * 0.08;
    spin.rotation.y = state.yaw + p * Math.PI * 2 + (1 - state.intro) * -2.5;
    root.position.y += (1 - state.intro) * -1.2;

    // beans orbit; they flare out mid-transit
    const flare = 1 + Math.sin(p * Math.PI) * 0.45;
    beans.data.forEach((d, i) => {
      d.a += d.sp * dt;
      const r = d.r * flare * (0.4 + 0.6 * state.intro);
      dummy.position.set(Math.cos(d.a) * r, d.h + Math.sin(t * 0.9 + d.ph) * 0.12, Math.sin(d.a) * r);
      dummy.rotation.set(d.rot.x + t * d.rs, d.rot.y + t * d.rs * 0.7, d.rot.z);
      dummy.scale.setScalar(state.intro);
      dummy.updateMatrix();
      beans.mesh.setMatrixAt(i, dummy.matrix);
    });
    beans.mesh.instanceMatrix.needsUpdate = true;

    ribbon.rotation.y = -t * 0.18 + p * 1.5;
    ribbon.geometry.setDrawRange(0, Math.floor(ribbon.userData.total * state.ribbon / 6) * 6);

    // steam rises from the cup's world position, always facing the camera
    cup.liquid.getWorldPosition(tmp);
    steams.forEach((m, i) => {
      m.position.set(tmp.x + (i - 0.5) * 0.18 * scale, tmp.y + 0.85 * scale, tmp.z + 0.2);
      m.scale.setScalar(scale);
      m.material.uniforms.uTime.value = t + i * 3.1;
      m.material.uniforms.uOpacity.value = 0.5 * state.intro;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  addEventListener('scroll', wake, { passive: true });
  document.addEventListener('visibilitychange', wake);
  addEventListener('resize', wake);

  await warmUp(renderer, scene, camera);
  anchors.forEach((a) => a?.classList.add('is-live'));
  wake();

  return {
    intro() {
      gsap.to(state, { intro: 1, duration: 2.2, ease: 'expo.out' });
      gsap.to(state, { ribbon: 1, duration: 2.6, ease: 'power3.inOut', delay: 0.3 });
      gsap.fromTo(state, { yawTarget: state.yaw - 1.4 }, { yawTarget: state.yaw, duration: 2.2, ease: 'expo.out' });
    },
    setDrink(next) {
      const merged = { ...current, ...next };
      if (JSON.stringify(merged) === JSON.stringify(current)) return;
      current = merged;
      // swirl: spin the liquid and repaint at the midpoint
      gsap.timeline()
        .to(cup.liquid.rotation, { z: cup.liquid.rotation.z + Math.PI, duration: 0.45, ease: 'power2.in' })
        .add(() => {
          paintArt(actx, artCanvas.width, current);
          cup.tex.needsUpdate = true;
        })
        .to(cup.liquid.rotation, { z: cup.liquid.rotation.z + Math.PI * 2, duration: 0.9, ease: 'expo.out' });
      gsap.fromTo(cup.liquid.scale, { x: 0.94, y: 0.94 }, { x: 1, y: 1, duration: 1, ease: 'elastic.out(1, 0.5)' });
      state.yawTarget += 0.6;
      wake();
    },
    nudge(amount = 0.8) {
      state.yawTarget += amount;
      wake();
    },
  };
}
