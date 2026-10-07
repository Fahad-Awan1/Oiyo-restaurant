// Ambient drift of coffee beans and tea leaves for page heroes. A small,
// cheap scene: two instanced meshes, pointer parallax, pauses off-screen.
import { THREE, makeRenderer, addStudio, beanGeometry, beanMaterial, leafGeometry, renderLoop, isSmall, warmUp } from './shared.js';
import { finePointer } from '../core.js';

export async function mountParticles(host, { beans = 14, leaves = 10, palette = ['#5f6b3d', '#a7b98d', '#7a8a4e'] } = {}) {
  const small = isSmall();
  const nb = small ? Math.ceil(beans * 0.55) : beans;
  const nl = small ? Math.ceil(leaves * 0.55) : leaves;

  const canvas = document.createElement('canvas');
  canvas.className = 'particles-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 12;
  addStudio(scene);

  const beanMesh = new THREE.InstancedMesh(beanGeometry(0.22), beanMaterial(), nb);
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide });
  const leafMesh = new THREE.InstancedMesh(leafGeometry(0.45), leafMat, nl);
  const color = new THREE.Color();
  for (let i = 0; i < nl; i++) leafMesh.setColorAt(i, color.set(palette[i % palette.length]));
  scene.add(beanMesh, leafMesh);

  const spread = () => ({ x: (camera.aspect || 1.6) * 4.6, y: 4.6 });
  const make = (n, depth) =>
    Array.from({ length: n }, () => ({
      x: (Math.random() * 2 - 1),
      y: (Math.random() * 2 - 1),
      z: -Math.random() * depth,
      vy: 0.05 + Math.random() * 0.12,
      rx: Math.random() * 6,
      ry: Math.random() * 6,
      rs: (Math.random() - 0.5) * 1.2,
      sway: Math.random() * 6,
      s: 0.7 + Math.random() * 0.7,
    }));
  const beanData = make(nb, 4);
  const leafData = make(nl, 3);
  const dummy = new THREE.Object3D();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  if (finePointer) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
  }

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  const place = (mesh, data, t, dt, leaf) => {
    const sp = spread();
    data.forEach((d, i) => {
      d.y += (d.vy * dt) / (leaf ? 3.2 : 4);
      if (d.y > 1.15) d.y = -1.15;
      const px = d.x * sp.x + Math.sin(t * 0.4 + d.sway) * (leaf ? 0.5 : 0.2) + pointer.x * (1 + d.z * -0.3) * 0.5;
      const py = d.y * sp.y - pointer.y * (1 + d.z * -0.3) * 0.35;
      dummy.position.set(px, py, d.z);
      dummy.rotation.set(d.rx + t * d.rs, d.ry + t * d.rs * 0.6, leaf ? Math.sin(t + d.sway) * 0.6 : 0);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  await warmUp(renderer, scene, camera);
  renderLoop(host, (dt, t) => {
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    place(beanMesh, beanData, t, dt, false);
    place(leafMesh, leafData, t, dt, true);
    renderer.render(scene, camera);
  });
  requestAnimationFrame(() => canvas.classList.add('is-in'));
}
