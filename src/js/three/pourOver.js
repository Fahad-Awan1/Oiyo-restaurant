// Rituals page: a scroll-driven pour-over in four acts.
//   1 Source – green coffee beans drift in from everywhere and gather
//   2 Roast  – the ring spins, warms and the beans turn brown
//   3 Pour   – beans fall into the dripper, the kettle pours, the carafe fills
//   4 Share  – the dripper lifts away and two cups arrive, steaming
import { THREE, makeRenderer, addStudio, stonewareMaterial, beanGeometry, beanMaterial, contactShadow, steamMaterial, renderLoop, isSmall, warmUp, nextFrame } from './shared.js';
import { gsap, finePointer } from '../core.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const seg = (s, a, b) => clamp01((s - a) / (b - a));
const ease = gsap.parseEase('power2.inOut');
const easeOut = gsap.parseEase('expo.out');

function glass() {
  return new THREE.MeshPhysicalMaterial({ color: '#eef2ea', roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
}
const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

function buildKettle() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#c99a5e', metalness: 0.55, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.6 });
  const body = new THREE.Mesh(lathe([[0, 0], [0.62, 0], [0.7, 0.08], [0.72, 0.5], [0.66, 0.78], [0.42, 0.95], [0.18, 1.0], [0, 1.0]], 48), metal);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), dark);
  knob.position.y = 1.05;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, 0.18, 0),
    new THREE.Vector3(-0.95, 0.3, 0),
    new THREE.Vector3(-1.15, 0.85, 0),
    new THREE.Vector3(-1.3, 1.15, 0),
    new THREE.Vector3(-1.62, 1.12, 0),
  ]);
  const spout = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.045, 10), metal);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 10, 32, Math.PI * 1.1), dark);
  handle.position.set(0.72, 0.52, 0);
  handle.rotation.z = -Math.PI * 0.55;
  g.add(body, knob, spout, handle);
  g.userData.tip = new THREE.Vector3(-1.62, 1.12, 0);
  return g;
}

function buildCupSmall(ceramic, coffeeMat) {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(lathe([[0, 0.08], [0.32, 0.09], [0.42, 0.3], [0.45, 0.62], [0.48, 0.64], [0.49, 0.6], [0.46, 0.3], [0.36, 0.04], [0, 0]], 48), ceramic);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 10, 24, Math.PI * 1.3), ceramic);
  handle.position.set(0.47, 0.36, 0);
  handle.rotation.z = -Math.PI * 0.65;
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.44, 40), coffeeMat);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.55;
  g.add(cup, handle, top);
  return g;
}

export async function mountPourOver(host) {
  const small = isSmall();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  addStudio(scene);
  await nextFrame();
  const ember = new THREE.PointLight(0xff8a3a, 0, 8, 1.6);
  ember.position.set(0, 1.8, 1);
  scene.add(ember);

  const world = new THREE.Group();
  scene.add(world);

  // carafe + dripper
  const brewer = new THREE.Group();
  const carafe = new THREE.Mesh(lathe([[0.0, 0.0], [0.62, 0.0], [0.82, 0.25], [0.86, 0.6], [0.55, 1.1], [0.3, 1.35], [0.34, 1.55], [0.58, 1.95]]), glass());
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.07, 10, 40), new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 0.8 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.4;
  const coffeeMat = new THREE.MeshStandardMaterial({ color: '#3b2114', roughness: 0.15, transparent: true, opacity: 0.92 });
  const brew = new THREE.Mesh(lathe([[0, 0.02], [0.6, 0.02], [0.79, 0.25], [0.83, 0.6], [0.55, 1.0], [0, 1.0]]), coffeeMat);
  brew.scale.y = 0.001;
  const ceramic = stonewareMaterial('#eee6d8');
  const dripper = new THREE.Group();
  const cone = new THREE.Mesh(lathe([[0.12, 0], [0.18, 0], [0.82, 0.72], [0.86, 0.76], [0.8, 0.78], [0.16, 0.06], [0.12, 0.06]]), ceramic);
  const bed = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshStandardMaterial({ color: '#4a2c1a', roughness: 0.9 }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = 0.42;
  bed.scale.setScalar(0.001);
  dripper.add(cone, bed);
  dripper.position.y = 1.95;
  const shadow = contactShadow(1.5, 0.35);
  shadow.position.y = 0.01;
  brewer.add(shadow, brew, carafe, collar, dripper);
  world.add(brewer);

  // beans
  const N = small ? 26 : 44;
  const beans = new THREE.InstancedMesh(beanGeometry(0.13), beanMaterial('#ffffff'), N);
  const green = new THREE.Color('#8a9a5b');
  const roasted = new THREE.Color('#4a2a18');
  const bc = new THREE.Color();
  const B = Array.from({ length: N }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 3;
    return {
      start: new THREE.Vector3(Math.cos(a) * r, 1.8 + (Math.random() - 0.5) * 5, Math.sin(a) * r * 0.6 - 1),
      theta: (i / N) * Math.PI * 2,
      ry: 1.3 + Math.random() * 0.5,
      h: (Math.random() - 0.5) * 0.6,
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0),
      spin: 0.5 + Math.random(),
      dx: (Math.random() - 0.5) * 0.5,
      dz: (Math.random() - 0.5) * 0.5,
    };
  });
  world.add(beans);

  // kettle + stream + drips
  const kettle = buildKettle();
  kettle.scale.setScalar(0.85);
  world.add(kettle);
  const streamMat = new THREE.MeshStandardMaterial({ color: '#e8eef0', emissive: '#6d5a44', emissiveIntensity: 0.25, roughness: 0.05, transparent: true, opacity: 0.85 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 1, 12, 1, true), streamMat);
  world.add(stream);
  const DR = 6;
  const drips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 8), coffeeMat, DR);
  world.add(drips);

  // share: two cups
  const cupA = buildCupSmall(ceramic, coffeeMat);
  const cupB = buildCupSmall(ceramic, coffeeMat);
  world.add(cupA, cupB);
  const steam = [cupA, cupB].map((c, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.1, 1, 12), steamMaterial());
    m.material.uniforms.uSeed.value = i * 5;
    scene.add(m);
    return m;
  });

  const state = { p: 0, target: 0, mx: 0, my: 0 };
  if (finePointer) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      state.mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      state.my = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
  }

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole scene in frame on narrow/tall stages
    camera.position.set(0, 2.2, camera.aspect < 0.9 ? 12.5 : 9.5);
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  const dummy = new THREE.Object3D();
  const v = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const dripTop = new THREE.Vector3(0, 1.95, 0);

  await warmUp(renderer, scene, camera);
  renderLoop(host, (dt, t) => {
    state.p += (state.target - state.p) * Math.min(1, dt * 6);
    const s = state.p * 4;

    // camera drift + pointer parallax; pull back for "share"
    const share = ease(seg(s, 3.4, 4));
    camera.position.x += (state.mx * 0.6 - camera.position.x) * 0.05;
    camera.lookAt(0, 1.55 - share * 0.2, 0);
    world.rotation.y = Math.sin(t * 0.2) * 0.12 + state.mx * 0.08 + share * 0.35;

    // brewer rises in as roasting finishes
    const brewIn = easeOut(seg(s, 1.4, 2.1));
    brewer.scale.setScalar(0.7 + 0.3 * brewIn);
    brewer.position.y = -2.5 * (1 - brewIn);
    brewer.visible = brewIn > 0.001;

    // beans
    const gather = ease(seg(s, 0, 0.95));
    const roast = seg(s, 1, 1.9);
    const drop = ease(seg(s, 2.0, 2.6));
    const omega = 0.25 + roast * 1.6;
    bc.copy(green).lerp(roasted, roast);
    ember.intensity = Math.sin(Math.PI * seg(s, 0.9, 2.2)) * 18;
    for (let i = 0; i < N; i++) {
      const b = B[i];
      b.theta += omega * dt;
      v.set(Math.cos(b.theta) * b.ry, 1.85 + b.h + Math.sin(t + i) * 0.06, Math.sin(b.theta) * b.ry);
      dummy.position.copy(b.start).lerp(v, gather);
      if (drop > 0) dummy.position.lerp(dripTop.set(b.dx, 2.4, b.dz), drop);
      dummy.rotation.set(b.rot.x + t * b.spin, b.rot.y + t * b.spin * 0.7, 0);
      dummy.scale.setScalar(Math.max(0.0001, (0.6 + 0.4 * gather) * (1 - drop)));
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
      beans.setColorAt(i, bc);
    }
    beans.instanceMatrix.needsUpdate = true;
    beans.instanceColor.needsUpdate = true;
    beans.visible = drop < 1;
    bed.scale.setScalar(Math.max(0.001, drop));

    // kettle: enter → tilt → pour → leave
    const enter = ease(seg(s, 1.9, 2.4));
    const leave = ease(seg(s, 3.3, 3.75));
    const tilt = ease(seg(s, 2.3, 2.6)) * (1 - ease(seg(s, 3.15, 3.35)));
    // grow in place rather than sliding in, so nothing is clipped by the stage edge
    kettle.scale.setScalar(0.85 * Math.max(0.0001, enter * (1 - leave)));
    kettle.position.set(1.7 + leave * 0.6, 3.2 + tilt * 0.2 + (1 - enter) * 0.8 + leave * 1.2, 0);
    kettle.rotation.z = tilt * 0.62 - leave * 0.4;
    kettle.visible = enter > 0.001 && leave < 0.999;

    // stream from spout tip down to the dripper
    tip.copy(kettle.userData.tip).multiplyScalar(kettle.scale.x);
    tip.applyEuler(kettle.rotation).add(kettle.position);
    const pouring = tilt > 0.85 ? 1 : 0;
    const streamTop = tip.y;
    const streamBottom = 2.45;
    stream.visible = pouring > 0;
    stream.scale.set(1, Math.max(0.01, streamTop - streamBottom), 1);
    stream.position.set(tip.x, (streamTop + streamBottom) / 2, 0);

    // drips into the carafe + fill level
    const fill = seg(s, 2.6, 3.5);
    brew.scale.y = Math.max(0.001, fill * 0.8);
    const dripping = s > 2.6 && s < 3.55;
    for (let i = 0; i < DR; i++) {
      const k = (t * 1.3 + i / DR) % 1;
      const top = 1.9 + brewer.position.y;
      const bottom = 0.05 + fill * 0.75;
      dummy.position.set(0, top - k * (top - bottom), 0);
      dummy.scale.setScalar(dripping ? 1 - k * 0.3 : 0.0001);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      drips.setMatrixAt(i, dummy.matrix);
    }
    drips.instanceMatrix.needsUpdate = true;

    // share: dripper lifts away, cups glide in
    dripper.position.y = 1.95 + share * 3;
    dripper.rotation.z = share * 0.4;
    const cupIn = easeOut(seg(s, 3.45, 4));
    cupA.position.set(-1.7, (1 - cupIn) * -0.8, 0.6);
    cupB.position.set(1.7, (1 - cupIn) * -0.8, 0.6);
    cupA.scale.setScalar(Math.max(0.0001, cupIn));
    cupB.scale.setScalar(Math.max(0.0001, cupIn));
    cupA.rotation.y = 0.5;
    cupB.rotation.y = Math.PI - 0.5;
    cupA.visible = cupB.visible = cupIn > 0.001;
    steam.forEach((m, i) => {
      const c = i ? cupB : cupA;
      c.getWorldPosition(v);
      m.position.set(v.x, v.y + 1.05, v.z + 0.1);
      m.quaternion.copy(camera.quaternion);
      m.material.uniforms.uTime.value = t + i * 2;
      m.material.uniforms.uOpacity.value = 0.55 * cupIn;
    });

    renderer.render(scene, camera);
  });

  host.classList.add('is-live');
  return {
    setProgress(p) {
      state.target = p;
    },
  };
}
