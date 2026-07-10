// "Calio Constellation" — the C-with-tail brand mark as a living particle field (sprint §4).
// Lazy-loaded after window load; never on reduced motion, low-end devices, or missing WebGL.
import * as THREE from 'three';
import gsap from 'gsap';

const ARC_START = 0.6435; // 36.87deg
const ARC_END = 5.6397; // 323.13deg
const SVG_CENTER = 17;
const SCALE = 0.105; // mark ≈ 2.2 world units tall

function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function svgToWorld(sx, sy) {
  return [(sx - SVG_CENTER) * SCALE, -(sy - SVG_CENTER) * SCALE];
}

export function initThreeHero() {
  const container = document.querySelector('.hero-visual');
  const poster = document.getElementById('hero-poster');
  if (!container) return false;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return false;
  }

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const COUNT = isMobile ? 2000 : 4500;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.1,
    100
  );
  camera.position.z = 6;

  /* ---------- geometry: sample the C mark ---------- */
  const targets = new Float32Array(COUNT * 3);
  const scatters = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  const colors = new Float32Array(COUNT * 3);
  const positions = new Float32Array(COUNT * 3);
  const dispX = new Float32Array(COUNT);
  const dispY = new Float32Array(COUNT);
  const normX = new Float32Array(COUNT);
  const normY = new Float32Array(COUNT);

  const palette = [
    [new THREE.Color('#14B8A6'), 0.55],
    [new THREE.Color('#2DD4BF'), 0.25],
    [new THREE.Color('#5EEAD4'), 0.15],
    [new THREE.Color('#6366F1'), 0.05]
  ];

  const pickColor = () => {
    let r = Math.random();
    for (const [color, weight] of palette) {
      if (r < weight) return color;
      r -= weight;
    }
    return palette[0][0];
  };

  for (let i = 0; i < COUNT; i++) {
    let sx;
    let sy;
    if (i < COUNT * 0.85) {
      // Arc of the C.
      const theta = ARC_START + Math.random() * (ARC_END - ARC_START);
      sx = 16 + 10 * Math.cos(theta);
      sy = 17 + 10 * Math.sin(theta);
    } else {
      // Tail (24,23) -> (29,28).
      const t = Math.random();
      sx = 24 + 5 * t;
      sy = 23 + 5 * t;
    }
    // Simulate the 3-unit stroke width + z jitter.
    const offAngle = Math.random() * Math.PI * 2;
    const offLen = Math.random() * 1.5;
    sx += Math.cos(offAngle) * offLen;
    sy += Math.sin(offAngle) * offLen;
    const [wx, wy] = svgToWorld(sx, sy);
    const wz = (Math.random() * 2 - 1) * 1.5 * SCALE;

    targets[i * 3] = wx;
    targets[i * 3 + 1] = wy;
    targets[i * 3 + 2] = wz;

    // Scatter cloud: random point in a sphere of radius ~5.
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();
    const rad = 5 * Math.cbrt(Math.random());
    scatters[i * 3] = dir.x * rad;
    scatters[i * 3 + 1] = dir.y * rad;
    scatters[i * 3 + 2] = dir.z * rad * 0.6;

    phases[i] = Math.random();

    const mag = Math.hypot(wx, wy) || 1;
    normX[i] = wx / mag;
    normY[i] = wy / mag;

    const col = pickColor();
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    positions[i * 3] = scatters[i * 3];
    positions[i * 3 + 1] = scatters[i * 3 + 1];
    positions[i * 3 + 2] = scatters[i * 3 + 2];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.035,
    map: makeSprite(),
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ---------- state ---------- */
  const state = { assemble: 0 }; // 0 scattered -> 1 assembled
  let heroProgress = 0; // hero scroll progress (0 at top)
  let cursor = null; // world-space pointer on the mark plane, or null
  let visible = true;
  let pageVisible = !document.hidden;
  let disposed = false;

  gsap.to(state, { assemble: 1, duration: 2.5, ease: 'power3.inOut' });

  const onHeroProgress = (e) => {
    heroProgress = e.detail;
  };
  document.addEventListener('calio:heroprogress', onHeroProgress);

  /* ---------- cursor interaction (fine pointers only) ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ndc = new THREE.Vector2();
  const proj = new THREE.Vector3();
  const onPointerMove = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      cursor = null;
      return;
    }
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    proj.set(ndc.x, ndc.y, 0.5).unproject(camera);
    const dir = proj.sub(camera.position).normalize();
    if (Math.abs(dir.z) < 1e-5) {
      cursor = null;
      return;
    }
    const t0 = -camera.position.z / dir.z;
    cursor = {
      x: camera.position.x + dir.x * t0,
      y: camera.position.y + dir.y * t0
    };
  };
  if (finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true });

  /* ---------- render loop (shared GSAP ticker) ---------- */
  const posAttr = geo.getAttribute('position');
  let elapsed = 0;

  const render = (time, deltaMS) => {
    if (disposed || !visible || !pageVisible) return;
    elapsed += deltaMS / 1000;

    const p = state.assemble * (1 - heroProgress * 0.65);
    const t = elapsed;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const breathe = 0.03 * Math.sin(t * 0.8 + phases[i] * 6.283);
      let x = scatters[i3] + (targets[i3] - scatters[i3]) * p + normX[i] * breathe;
      let y = scatters[i3 + 1] + (targets[i3 + 1] - scatters[i3 + 1]) * p + normY[i] * breathe;
      const z = scatters[i3 + 2] + (targets[i3 + 2] - scatters[i3 + 2]) * p + breathe * 0.5;

      // Cursor repulsion with spring-back (damping 0.08).
      let px = 0;
      let py = 0;
      if (cursor) {
        const dx = x - cursor.x;
        const dy = y - cursor.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.8 && dist > 1e-4) {
          const force = (1 - dist / 0.8) * 0.35;
          px = (dx / dist) * force;
          py = (dy / dist) * force;
        }
      }
      dispX[i] += (px - dispX[i]) * 0.08;
      dispY[i] += (py - dispY[i]) * 0.08;

      positions[i3] = x + dispX[i];
      positions[i3 + 1] = y + dispY[i];
      positions[i3 + 2] = z;
    }
    posAttr.needsUpdate = true;

    // Whole system sways ±4° on Y over a 12s yoyo.
    points.rotation.y = Math.sin(t * (Math.PI / 12)) * 0.0698;

    renderer.render(scene, camera);
  };
  gsap.ticker.add(render);

  /* ---------- pause / resize / dispose hygiene ---------- */
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  });
  io.observe(container);

  const onVis = () => {
    pageVisible = !document.hidden;
  };
  document.addEventListener('visibilitychange', onVis);

  const onResize = () => {
    const w = container.clientWidth;
    const h = Math.max(1, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize, { passive: true });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gsap.ticker.remove(render);
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('calio:heroprogress', onHeroProgress);
    if (finePointer) window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    geo.dispose();
    mat.map?.dispose();
    mat.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
  window.addEventListener('pagehide', dispose, { once: true });

  // Scene is live: fade the poster out.
  if (poster) {
    gsap.to(poster, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete() {
        poster.style.display = 'none';
      }
    });
  }

  return true;
}
