// ─── SCENE SETUP ─────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('c'),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x060008, 1);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── LIGHTS ──────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const pinkLight = new THREE.PointLight(0xff69a0, 2, 20);
pinkLight.position.set(2, 2, 3);
scene.add(pinkLight);
const pinkLight2 = new THREE.PointLight(0xff1493, 1.5, 20);
pinkLight2.position.set(-2, -1, 2);
scene.add(pinkLight2);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const rnd  = (a, b) => a + Math.random() * (b - a);
const pick = arr   => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease  = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOut

const PINKS    = [0xff69a0, 0xff1493, 0xe0157a, 0xffb3cc, 0xff5ca8, 0xffc0cb, 0xff79b0, 0xffaad4];
const MAGENTAS = [0xff1493, 0xe0157a, 0xc01068, 0xff0066];
const GREENS   = [0x4aaa4a, 0x3a9a3a, 0x5acc5a, 0x2a7a2a];
const GOLD     = [0xffd700, 0xffec6e];

function mat(color, emissive, rough, metal) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive:          emissive ?? color,
    emissiveIntensity: 0.3,
    roughness:         rough  ?? 0.6,
    metalness:         metal  ?? 0.1,
    side: THREE.DoubleSide,
  });
}
function hexToRgb(hex) {
  return [(hex>>16&0xff)/255,(hex>>8&0xff)/255,(hex&0xff)/255];
}

// ─── FLOWER FACTORY ──────────────────────────────────────────────────────────
function makePetal(color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo( 0.4,  0.1,  0.5,  0.6,  0,   0.9);
  shape.bezierCurveTo(-0.5,  0.6, -0.4,  0.1,  0,   0);
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), mat(color));
}

function makeFlower(color, color2, size, petalCount) {
  const group = new THREE.Group();
  for (let i = 0; i < petalCount; i++) {
    const p = makePetal(color);
    p.scale.setScalar(size);
    p.rotation.z = (i / petalCount) * Math.PI * 2;
    p.position.z = rnd(-0.01, 0.01);
    group.add(p);
  }
  for (let i = 0; i < petalCount; i++) {
    const p = makePetal(color2);
    p.scale.setScalar(size * 0.55);
    p.rotation.z = (i / petalCount) * Math.PI * 2 + Math.PI / petalCount;
    p.position.z = 0.02;
    group.add(p);
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.28, 8, 8),
    mat(pick(GOLD), pick(GOLD), 0.3, 0.4)
  );
  center.position.z = 0.05;
  group.add(center);
  return group;
}

// ─── BOUQUET GROUP ───────────────────────────────────────────────────────────
const bouquet = new THREE.Group();
scene.add(bouquet);
bouquet.position.y = 0.3;

// flowers with animation metadata
const NUM_FLOWERS  = 55;
const flowerMeshes = [];

for (let i = 0; i < NUM_FLOWERS; i++) {
  const theta  = rnd(0, Math.PI * 2);
  const phi    = rnd(0, Math.PI * 0.72);
  const r      = rnd(0.3, 1.5);
  const tx     = r * Math.sin(phi) * Math.cos(theta);
  const ty     = r * Math.cos(phi) * 0.7 + 0.4;
  const tz     = r * Math.sin(phi) * Math.sin(theta) * 0.55;

  const color  = pick(PINKS);
  const color2 = pick(MAGENTAS);
  const size   = rnd(0.07, 0.19);
  const pc     = Math.random() < 0.4 ? 8 : (Math.random() < 0.5 ? 5 : 6);

  const flower = makeFlower(color, color2, size, pc);
  flower.position.set(tx, ty, tz);
  flower.rotation.z = rnd(0, Math.PI * 2);

  // start invisible + scaled to 0 for intro animation
  flower.scale.setScalar(0);
  flower.visible = false;

  bouquet.add(flower);
  flowerMeshes.push({
    mesh:    flower,
    rotSpd:  rnd(-0.01, 0.01),
    // staggered reveal delay 0.3s–2.4s
    delay:   0.3 + (i / NUM_FLOWERS) * 2.1,
    tx, ty, tz,
  });
}

// stems — store tube progress for grow animation
function makeStemGrowing(x, z) {
  // return control points; we rebuild geometry each frame during intro
  return {
    pts: [
      new THREE.Vector3(x,          -1.6, z),
      new THREE.Vector3(x * 0.8,   -1.0, z * 0.8),
      new THREE.Vector3(x * 0.5,   -0.4, z * 0.5),
      new THREE.Vector3(x * 0.2,    0.0, z * 0.2),
      new THREE.Vector3(x * 0.05,   0.3, z * 0.05),
    ],
    color: pick(GREENS),
    mesh:  null,
    progress: 0,
  };
}

const stemData = [];
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const r     = rnd(0.1, 0.5);
  stemData.push(makeStemGrowing(Math.cos(angle) * r, Math.sin(angle) * r));
}

function buildStemMesh(sd, progress) {
  if (sd.mesh) { bouquet.remove(sd.mesh); sd.mesh.geometry.dispose(); }
  const p    = clamp(progress, 0.001, 1);
  const idx  = Math.floor(p * (sd.pts.length - 1));
  const frac = (p * (sd.pts.length - 1)) - idx;
  const sub  = sd.pts.slice(0, idx + 1);
  if (idx < sd.pts.length - 1) {
    const interp = new THREE.Vector3().lerpVectors(sd.pts[idx], sd.pts[idx+1], frac);
    sub.push(interp);
  }
  if (sub.length < 2) return;
  const curve = new THREE.CatmullRomCurve3(sub);
  const geo   = new THREE.TubeGeometry(curve, 12, 0.012, 5, false);
  sd.mesh     = new THREE.Mesh(geo, mat(sd.color, sd.color, 0.8, 0));
  bouquet.add(sd.mesh);
}

// leaves
function makeLeaf(color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo( 0.3, 0.1,  0.4, 0.5,  0,   0.8);
  shape.bezierCurveTo(-0.4, 0.5, -0.3, 0.1,  0,   0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 6), mat(color, color, 0.9, 0));
  m.scale.setScalar(0);
  return m;
}

const leafMeshes = [];
for (let i = 0; i < 10; i++) {
  const leaf  = makeLeaf(pick(GREENS));
  const angle = rnd(0, Math.PI * 2);
  const h     = rnd(-1.2, -0.2);
  const r     = rnd(0.2, 0.6);
  const ls    = rnd(0.15, 0.3);
  leaf.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
  leaf.rotation.z = angle + rnd(-0.3, 0.3);
  leaf.rotation.x = rnd(-0.4, 0.4);
  bouquet.add(leaf);
  leafMeshes.push({ mesh: leaf, targetScale: ls, delay: 0.1 + i * 0.08 });
}

// ribbon + bow — start invisible
const ribbonGeo = new THREE.TorusGeometry(0.5, 0.045, 8, 48);
const ribbon    = new THREE.Mesh(ribbonGeo, mat(0xe0157a, 0xff1493, 0.5, 0.2));
ribbon.position.y = -1.4; ribbon.rotation.x = Math.PI / 2;
ribbon.scale.setScalar(0);
bouquet.add(ribbon);

const bowGeo = new THREE.TorusGeometry(0.14, 0.03, 6, 20);
const bow1   = new THREE.Mesh(bowGeo, mat(0xff69a0, 0xff1493, 0.5, 0.1));
const bow2   = bow1.clone();
bow1.position.set(-0.18, -1.35, 0); bow1.rotation.z =  0.6; bow1.scale.setScalar(0);
bow2.position.set( 0.18, -1.35, 0); bow2.rotation.z = -0.6; bow2.scale.setScalar(0);
bouquet.add(bow1); bouquet.add(bow2);

// ─── BUBU TEXTURE ────────────────────────────────────────────────────────────
function makeBubuTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c  = cv.getContext('2d');
  c.clearRect(0, 0, 256, 256);
  c.fillStyle = '#f5f0ff';
  c.beginPath(); c.ellipse(128, 160, 70, 60, 0, 0, Math.PI*2); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(128, 100, 62, 0, Math.PI*2); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(76,  48, 24, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(180, 48, 24, 0, Math.PI*2); c.fill();
  c.fillStyle = '#ffb3cc';
  c.beginPath(); c.arc(76,  48, 13, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(180, 48, 13, 0, Math.PI*2); c.fill();
  c.fillStyle = '#222';
  c.beginPath(); c.arc(107, 95, 9, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(149, 95, 9, 0, Math.PI*2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(111, 91, 3.5, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(153, 91, 3.5, 0, Math.PI*2); c.fill();
  c.fillStyle = '#ff9abc';
  c.beginPath(); c.ellipse(128, 112, 10, 7, 0, 0, Math.PI*2); c.fill();
  c.strokeStyle = '#cc6688'; c.lineWidth = 3;
  c.beginPath(); c.arc(128, 112, 14, 0.2, Math.PI-0.2); c.stroke();
  c.fillStyle = 'rgba(255,160,180,0.4)';
  c.beginPath(); c.ellipse(90,  118, 18, 11, -0.2, 0, Math.PI*2); c.fill();
  c.beginPath(); c.ellipse(166, 118, 18, 11,  0.2, 0, Math.PI*2); c.fill();
  return new THREE.CanvasTexture(cv);
}

const bubuMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(0.8, 0.8),
  new THREE.MeshBasicMaterial({ map: makeBubuTexture(), transparent: true, depthWrite: false })
);
bubuMesh.position.set(0, -1.95, 0.1);
bubuMesh.scale.setScalar(0);
scene.add(bubuMesh);

const heartCanvas = document.createElement('canvas');
heartCanvas.width = heartCanvas.height = 64;
const hc = heartCanvas.getContext('2d');
hc.fillStyle = '#ff69a0'; hc.font = '44px serif'; hc.textAlign = 'center';
hc.fillText('♡', 32, 48);
const heartMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(0.3, 0.3),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(heartCanvas), transparent: true, depthWrite: false })
);
heartMesh.position.set(0, -1.45, 0.1);
heartMesh.scale.setScalar(0);
scene.add(heartMesh);

// ─── PARTICLES ───────────────────────────────────────────────────────────────
const PART_COUNT   = 180;
const partPos      = new Float32Array(PART_COUNT * 3);
const partCol      = new Float32Array(PART_COUNT * 3);
const partVels     = [];

for (let i = 0; i < PART_COUNT; i++) {
  const angle = rnd(0, Math.PI * 2);
  const r     = rnd(0, 1.8);
  partPos[i*3]   = Math.cos(angle) * r;
  partPos[i*3+1] = rnd(-2, 2);
  partPos[i*3+2] = Math.sin(angle) * r;
  const c = hexToRgb(pick(PINKS));
  partCol[i*3] = c[0]; partCol[i*3+1] = c[1]; partCol[i*3+2] = c[2];
  partVels.push({ vx: rnd(-0.004, 0.004), vy: rnd(0.005, 0.018), vz: rnd(-0.004, 0.004) });
}

const partGeo = new THREE.BufferGeometry();
partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
partGeo.setAttribute('color',    new THREE.BufferAttribute(partCol, 3));
const partMat  = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0 });
const partPts  = new THREE.Points(partGeo, partMat);
scene.add(partPts);

// burst
const burstPool = [];
const burstPos2 = new Float32Array(200 * 3);
const burstCol2 = new Float32Array(200 * 3);
const burstGeo  = new THREE.BufferGeometry();
burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos2, 3));
burstGeo.setAttribute('color',    new THREE.BufferAttribute(burstCol2, 3));
const burstMat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0 });
scene.add(new THREE.Points(burstGeo, burstMat));

function triggerBurst() {
  for (let i = 0; i < 40; i++) {
    const angle = rnd(0, Math.PI * 2);
    const phi   = rnd(0, Math.PI);
    const spd   = rnd(0.03, 0.12);
    burstPool.push({
      x: 0, y: 0.3, z: 0,
      vx: Math.sin(phi) * Math.cos(angle) * spd,
      vy: Math.sin(phi) * Math.sin(angle) * spd,
      vz: Math.cos(phi) * spd,
      life: 1, decay: rnd(0.012, 0.028),
      color: hexToRgb(pick(PINKS)),
    });
  }
}

// ─── ANIMATION STATE ─────────────────────────────────────────────────────────
// phases:
// 0  = camera zoom in (0 → 0.6s)
// 1  = stems grow     (0.2s → 1.2s)
// 2  = leaves appear  (0.8s → 1.6s)
// 3  = flowers bloom  (0.3s → 2.5s, staggered)
// 4  = ribbon + bow   (2.0s → 2.6s)
// 5  = bubu pops in   (2.4s → 2.8s)
// 6  = idle           (2.8s+)

let startTime = null;
let t = 0;

function getPhaseT(elapsed, start, end) {
  return clamp((elapsed - start) / (end - start), 0, 1);
}

// ─── ANIMATE ─────────────────────────────────────────────────────────────────
function animate(now) {
  requestAnimationFrame(animate);
  if (!startTime) startTime = now;
  const elapsed = (now - startTime) / 1000; // seconds
  t += 0.016;

  // ── camera intro zoom ──────────────────────────────────────────────────
  const camT = ease(getPhaseT(elapsed, 0, 0.9));
  camera.position.z = 12 - 7 * camT; // 12 → 5

  // also tilt camera down slightly then settle
  camera.position.y = (1 - camT) * -1.5;
  camera.lookAt(0, 0, 0);

  // ── stems grow ────────────────────────────────────────────────────────
  stemData.forEach((sd, i) => {
    const t0 = 0.15 + i * 0.06;
    const t1 = t0 + 0.7;
    sd.progress = ease(getPhaseT(elapsed, t0, t1));
    if (sd.progress > 0) buildStemMesh(sd, sd.progress);
  });

  // ── leaves pop ────────────────────────────────────────────────────────
  leafMeshes.forEach(({ mesh, targetScale, delay }) => {
    const lp = ease(getPhaseT(elapsed, delay, delay + 0.3));
    const s  = lp * targetScale;
    // overshoot bounce
    const bounce = lp < 1 ? s * (1 + 0.3 * Math.sin(lp * Math.PI)) : s;
    mesh.scale.setScalar(bounce);
  });

  // ── flowers bloom ─────────────────────────────────────────────────────
  flowerMeshes.forEach(({ mesh, delay }) => {
    const fp = ease(getPhaseT(elapsed, delay, delay + 0.35));
    if (fp > 0) {
      mesh.visible = true;
      // overshoot pop
      const pop = fp < 1 ? fp * (1 + 0.4 * Math.sin(fp * Math.PI)) : 1;
      mesh.scale.setScalar(pop);
    }
  });

  // ── ribbon + bow ──────────────────────────────────────────────────────
  const rbT = ease(getPhaseT(elapsed, 2.0, 2.5));
  const rbBounce = rbT < 1 ? rbT * (1 + 0.25 * Math.sin(rbT * Math.PI)) : 1;
  ribbon.scale.setScalar(rbBounce);
  bow1.scale.setScalar(rbBounce);
  bow2.scale.setScalar(rbBounce);

  // ── bubu pops in ──────────────────────────────────────────────────────
  const bubuP = ease(getPhaseT(elapsed, 2.4, 2.75));
  const bubuBounce = bubuP < 1 ? bubuP * (1 + 0.5 * Math.sin(bubuP * Math.PI)) : 1;
  bubuMesh.scale.setScalar(bubuBounce);
  heartMesh.scale.setScalar(bubuBounce * 0.9);

  // ── particles fade in after bouquet done ──────────────────────────────
  partMat.opacity = ease(getPhaseT(elapsed, 2.5, 3.5)) * 0.85;

  // ── idle rotation (ramps up after stems done) ─────────────────────────
  const spinRamp = ease(getPhaseT(elapsed, 1.0, 2.0));
  bouquet.rotation.y += 0.007 * spinRamp;

  // ── individual flower spin ─────────────────────────────────────────────
  flowerMeshes.forEach(({ mesh, rotSpd }) => { mesh.rotation.z += rotSpd; });

  // ── bubu bob + heart pulse ─────────────────────────────────────────────
  if (bubuP > 0) {
    bubuMesh.position.y  = -1.95 + Math.sin(t * 1.8) * 0.06;
    heartMesh.position.y = -1.45 + Math.sin(t * 2.2 + 1) * 0.08;
    heartMesh.material.opacity = 0.6 + 0.4 * Math.sin(t * 2.5);
  }

  // ── lights pulse ──────────────────────────────────────────────────────
  pinkLight.intensity  = 1.8 + Math.sin(t * 2)       * 0.6;
  pinkLight2.intensity = 1.2 + Math.sin(t * 1.5 + 1) * 0.4;

  // ── ambient particles ─────────────────────────────────────────────────
  for (let i = 0; i < PART_COUNT; i++) {
    partPos[i*3]   += partVels[i].vx;
    partPos[i*3+1] += partVels[i].vy;
    partPos[i*3+2] += partVels[i].vz;
    if (partPos[i*3+1] > 2.5) {
      partPos[i*3+1] = -2.2;
      partPos[i*3]   = rnd(-1.8, 1.8);
      partPos[i*3+2] = rnd(-1.8, 1.8);
    }
  }
  partGeo.attributes.position.needsUpdate = true;

  // ── burst ─────────────────────────────────────────────────────────────
  let bi = 0;
  for (let i = burstPool.length - 1; i >= 0; i--) {
    const p = burstPool[i];
    p.x += p.vx; p.y += p.vy; p.z += p.vz;
    p.vy -= 0.003; p.life -= p.decay;
    if (p.life <= 0) { burstPool.splice(i, 1); continue; }
    if (bi < 200) {
      burstPos2[bi*3]   = p.x; burstPos2[bi*3+1] = p.y; burstPos2[bi*3+2] = p.z;
      burstCol2[bi*3]   = p.color[0]; burstCol2[bi*3+1] = p.color[1]; burstCol2[bi*3+2] = p.color[2];
      bi++;
    }
  }
  for (let i = bi; i < 200; i++) burstPos2[i*3] = burstPos2[i*3+1] = burstPos2[i*3+2] = 9999;
  burstGeo.attributes.position.needsUpdate = true;
  burstGeo.attributes.color.needsUpdate    = true;
  burstMat.opacity = burstPool.length > 0 ? 0.9 : 0;

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// ─── INPUT ───────────────────────────────────────────────────────────────────
document.getElementById('c').addEventListener('click', triggerBurst);
document.getElementById('c').addEventListener('touchstart', e => {
  e.preventDefault(); triggerBurst();
}, { passive: false });
