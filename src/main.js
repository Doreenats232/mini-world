import * as THREE from 'three';

const VER = __V__;
const REPO = 'Doreenats232/mini-world';
const isTouch = matchMedia('(pointer:coarse)').matches;
if (isTouch) document.body.classList.add('touch');
document.getElementById('ver').textContent = 'v' + VER;
if (isTouch) document.getElementById('help').style.display = 'none';

// ---------- scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 260);
const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 600);
cam.rotation.order = 'YXZ';
const ren = new THREE.WebGLRenderer({ antialias: !isTouch });
ren.setSize(innerWidth, innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(ren.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x556655, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(60, 100, 30);
scene.add(sun);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); ren.setSize(innerWidth, innerHeight); });

// ---------- world ----------
const solids = new Map();
const targets = [];
const blockMeshes = new Map();
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshLambertMaterial({ color: 0x4a7c3a }));
ground.rotation.x = -Math.PI / 2; scene.add(ground); targets.push(ground);

const roadMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
for (let k = -8; k <= 7; k++) {
  const a = new THREE.Mesh(new THREE.PlaneGeometry(14, 800), roadMat); a.rotation.x = -Math.PI / 2; a.position.set(k * 50 + 25, 0.03, 0); scene.add(a);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(800, 14), roadMat); b.rotation.x = -Math.PI / 2; b.position.set(0, 0.03, k * 50 + 25); scene.add(b);
}
const bcols = [0x9aa5b1, 0xc9b79c, 0x8d99ae, 0xb08968, 0x7f8fa6, 0xd4c5a9];
for (let i = -7; i <= 6; i++) for (let j = -7; j <= 6; j++) {
  const n = 1 + Math.floor(rnd() * 3);
  for (let q = 0; q < n; q++) {
    const w = 8 + rnd() * 10, d = 8 + rnd() * 10, h = 6 + rnd() * rnd() * 46;
    const x = i * 50 + (rnd() - 0.5) * 18, z = j * 50 + (rnd() - 0.5) * 18;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: bcols[Math.floor(rnd() * bcols.length)] }));
    m.position.set(x, h / 2, z); scene.add(m); targets.push(m);
    m.updateMatrixWorld();
    solids.set('b' + i + ',' + j + ',' + q, new THREE.Box3().setFromObject(m));
  }
}

// ---------- building blocks ----------
const COLORS = [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xecf0f1];
let sel = 0;
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const mats = COLORS.map(c => new THREE.MeshLambertMaterial({ color: c }));
const hot = document.getElementById('hot');
COLORS.forEach(c => { const d = document.createElement('div'); d.style.background = '#' + c.toString(16).padStart(6, '0'); hot.appendChild(d); });
function selBlock(i) { sel = (i + COLORS.length) % COLORS.length; [...hot.children].forEach((d, k) => d.classList.toggle('on', k === sel)); }
selBlock(0);

let saveT = 0;
function addBlock(cx, cy, cz, c, doSave = true) {
  const k = cx + ',' + cy + ',' + cz;
  if (blockMeshes.has(k)) return;
  const m = new THREE.Mesh(boxGeo, mats[c]);
  m.position.set(cx * 2 + 1, cy * 2 + 1, cz * 2 + 1); m.userData = { k, cx, cy, cz, c };
  m.updateMatrixWorld();
  scene.add(m); targets.push(m); blockMeshes.set(k, m);
  solids.set(k, new THREE.Box3().setFromObject(m));
  if (doSave) queueSave();
}
function delBlock(k) {
  const m = blockMeshes.get(k); if (!m) return;
  scene.remove(m); targets.splice(targets.indexOf(m), 1); blockMeshes.delete(k); solids.delete(k); queueSave();
}
function queueSave() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
function save() {
  try {
    localStorage.setItem('mw_save', JSON.stringify({ b: [...blockMeshes.values()].map(m => [m.userData.cx, m.userData.cy, m.userData.cz, m.userData.c]), p: [P.pos.x, P.pos.y, P.pos.z, P.yaw] }));
  } catch (e) {}
}
setInterval(() => save(), 10000); addEventListener('beforeunload', save);

// ---------- player ----------
const P = { pos: new THREE.Vector3(25, 1, 25), vel: new THREE.Vector3(), yaw: 0, pitch: 0, ground: false };
try {
  const s = JSON.parse(localStorage.getItem('mw_save') || 'null');
  if (s) { s.b.forEach(b => addBlock(b[0], b[1], b[2], b[3], false)); P.pos.set(s.p[0], s.p[1], s.p[2]); P.yaw = s.p[3]; }
} catch (e) {}
const H = 1.7, R = 0.35;
const keys = {}; const joy = { x: 0, y: 0 };
function hits(b) {
  return P.pos.x + R > b.min.x && P.pos.x - R < b.max.x && P.pos.z + R > b.min.z && P.pos.z - R < b.max.z && P.pos.y + H > b.min.y && P.pos.y < b.max.y;
}
function move(axis, d) {
  P.pos[axis] += d;
  for (const b of solids.values()) {
    if (!hits(b)) continue;
    if (axis === 'y') {
      if (d <= 0) { P.pos.y = b.max.y; P.vel.y = 0; P.ground = true; } else { P.pos.y = b.min.y - H; P.vel.y = 0; }
    } else P.pos[axis] = d > 0 ? b.min[axis] - R : b.max[axis] + R;
  }
}
function jump() { if (P.ground) { P.vel.y = 11; P.ground = false; } }
function step(dt) {
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y;
  const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
  const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
  let mx = -sin * f + cos * s, mz = -cos * f - sin * s;
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  const sp = keys.ShiftLeft ? 12 : 7;
  P.vel.y -= 28 * dt;
  move('x', mx * sp * dt); move('z', mz * sp * dt);
  P.ground = false; move('y', P.vel.y * dt);
  if (P.pos.y <= 0) { P.pos.y = 0; P.vel.y = 0; P.ground = true; }
  if (P.pos.y < -50) P.pos.set(25, 3, 25);
  cam.position.set(P.pos.x, P.pos.y + 1.55, P.pos.z);
  cam.rotation.set(P.pitch, P.yaw, 0);
}

// ---------- place / break ----------
const ray = new THREE.Raycaster(); ray.far = 14;
function aim() { cam.updateMatrixWorld(); ray.setFromCamera({ x: 0, y: 0 }, cam); return ray.intersectObjects(targets, false)[0]; }
function place() {
  const h = aim(); if (!h) return;
  const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
  const p = h.point.clone().addScaledVector(n, 0.01);
  const cx = Math.floor(p.x / 2), cy = Math.floor(p.y / 2), cz = Math.floor(p.z / 2);
  if (cy < 0) return;
  const bx = new THREE.Box3(new THREE.Vector3(cx * 2, cy * 2, cz * 2), new THREE.Vector3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2));
  if (hits(bx)) return;
  addBlock(cx, cy, cz, sel);
}
function brk() { const h = aim(); if (h && h.object.userData.k) delBlock(h.object.userData.k); }

// ---------- input: desktop ----------
const cv = ren.domElement;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') jump();
  if (e.code >= 'Digit1' && e.code <= 'Digit6') selBlock(+e.code.slice(5) - 1);
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('wheel', e => selBlock(sel + (e.deltaY > 0 ? 1 : -1)));
addEventListener('contextmenu', e => e.preventDefault());
if (!isTouch) {
  cv.addEventListener('click', () => { if (document.pointerLockElement !== cv) cv.requestPointerLock(); });
  addEventListener('mousedown', e => { if (document.pointerLockElement !== cv) return; if (e.button === 0) place(); else if (e.button === 2) brk(); });
  addEventListener('mousemove', e => {
    if (document.pointerLockElement !== cv) return;
    P.yaw -= e.movementX * 0.0025; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - e.movementY * 0.0025));
  });
}

// ---------- input: touch ----------
const tch = {};
function btn(id, fn) { document.getElementById(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false }); }
btn('jump', jump); btn('place', place); btn('brk', brk); btn('col', () => selBlock(sel + 1));
addEventListener('touchstart', e => {
  for (const t of e.changedTouches) {
    if (t.target.classList && t.target.classList.contains('b')) continue;
    tch[t.identifier] = { x: t.clientX, y: t.clientY, mode: t.clientX < innerWidth / 2 ? 'joy' : 'look' };
  }
}, { passive: false });
addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const s = tch[t.identifier]; if (!s) continue;
    if (s.mode === 'joy') { joy.x = Math.max(-1, Math.min(1, (t.clientX - s.x) / 50)); joy.y = Math.max(-1, Math.min(1, (t.clientY - s.y) / 50)); }
    else { P.yaw -= (t.clientX - s.x) * 0.006; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - (t.clientY - s.y) * 0.006)); s.x = t.clientX; s.y = t.clientY; }
  }
}, { passive: false });
const tend = e => { for (const t of e.changedTouches) { const s = tch[t.identifier]; if (s && s.mode === 'joy') { joy.x = joy.y = 0; } delete tch[t.identifier]; } };
addEventListener('touchend', tend); addEventListener('touchcancel', tend);

// ---------- update check ----------
function newer(a, b) { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
fetch('https://api.github.com/repos/' + REPO + '/releases/latest').then(r => r.json()).then(j => {
  const v = (j.tag_name || '').replace(/^v/, ''); if (!v || !newer(v, VER)) return;
  const u = document.getElementById('upd'); u.style.display = 'block';
  if (navigator.userAgent.includes('Electron')) { u.textContent = 'Update v' + v + ' downloading, restarts automatically'; return; }
  const apk = (j.assets || []).find(a => a.name.endsWith('.apk'));
  u.textContent = 'Update v' + v + ' available. Tap to download';
  u.onclick = async () => {
    const url = apk ? apk.browser_download_url : j.html_url;
    if (window.Capacitor) { const { Browser } = await import('@capacitor/browser'); Browser.open({ url }); } else window.open(url, '_blank');
  };
}).catch(() => {});

// ---------- loop ----------
let last = performance.now();
ren.setAnimationLoop(now => { const dt = Math.min((now - last) / 1000, 0.05); last = now; step(dt); ren.render(scene, cam); });
