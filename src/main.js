import * as THREE from 'three';

const VER = __V__;
const REPO = 'Doreenats232/mini-world';
const isTouch = matchMedia('(pointer:coarse)').matches;
const native = navigator.userAgent.includes('Electron');
if (isTouch) document.body.classList.add('touch');
const $ = id => document.getElementById(id);
$('ver').textContent = 'v' + VER;
if (isTouch) $('help').style.display = 'none';

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
    m.position.set(x, h / 2, z); scene.add(m); targets.push(m); m.updateMatrixWorld();
    solids.set('b' + i + ',' + j + ',' + q, new THREE.Box3().setFromObject(m));
  }
}

// ---------- entities / physics ----------
const mkEnt = (x, y, z, R, H) => ({ pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(), R, H, ground: false });
function hit(e, b) {
  return e.pos.x + e.R > b.min.x && e.pos.x - e.R < b.max.x && e.pos.z + e.R > b.min.z && e.pos.z - e.R < b.max.z && e.pos.y + e.H > b.min.y && e.pos.y < b.max.y;
}
function move(e, axis, d) {
  e.pos[axis] += d;
  for (const b of solids.values()) {
    if (!hit(e, b)) continue;
    if (axis === 'y') {
      if (d <= 0) { e.pos.y = b.max.y; e.vel.y = 0; e.ground = true; } else { e.pos.y = b.min.y - e.H; e.vel.y = 0; }
    } else e.pos[axis] = d > 0 ? b.min[axis] - e.R : b.max[axis] + e.R;
  }
}
function phys(e, mx, mz, dt) {
  e.vel.y -= 28 * dt;
  move(e, 'x', mx * dt); move(e, 'z', mz * dt);
  e.ground = false; move(e, 'y', e.vel.y * dt);
  if (e.pos.y <= 0) { e.pos.y = 0; e.vel.y = 0; e.ground = true; }
}

// ---------- blocks ----------
const COLORS = [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xecf0f1];
let sel = 0;
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const mats = COLORS.map(c => new THREE.MeshLambertMaterial({ color: c }));
const hot = $('hot');
COLORS.forEach(c => { const d = document.createElement('div'); d.style.background = '#' + c.toString(16).padStart(6, '0'); hot.appendChild(d); });
function selBlock(i) { sel = (i + COLORS.length) % COLORS.length; [...hot.children].forEach((d, k) => d.classList.toggle('on', k === sel)); }
selBlock(0);
let saveT = 0;
function addBlock(cx, cy, cz, c, doSave = true) {
  const k = cx + ',' + cy + ',' + cz;
  if (blockMeshes.has(k)) return;
  const m = new THREE.Mesh(boxGeo, mats[c]);
  m.position.set(cx * 2 + 1, cy * 2 + 1, cz * 2 + 1); m.userData = { k, cx, cy, cz, c }; m.updateMatrixWorld();
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
  try { localStorage.setItem('mw_save', JSON.stringify({ b: [...blockMeshes.values()].map(m => [m.userData.cx, m.userData.cy, m.userData.cz, m.userData.c]), p: [P.pos.x, P.pos.y, P.pos.z, P.yaw], k: kills })); } catch (e) {}
}
setInterval(() => save(), 10000); addEventListener('beforeunload', save);

// ---------- player ----------
const P = mkEnt(25, 1, 25, 0.35, 1.7); P.yaw = 0; P.pitch = 0; P.hp = 100;
let kills = 0, mode = 'build', inCar = null, lastHurt = -99, flashV = 0, clock = 0;
try {
  const s = JSON.parse(localStorage.getItem('mw_save') || 'null');
  if (s) { s.b.forEach(b => addBlock(b[0], b[1], b[2], b[3], false)); P.pos.set(s.p[0], s.p[1], s.p[2]); P.yaw = s.p[3]; kills = s.k || 0; }
} catch (e) {}
const keys = {}; const joy = { x: 0, y: 0 };
function hud() {
  $('hp').firstElementChild.style.width = Math.max(0, P.hp) + '%';
  $('info').textContent = 'Kills ' + kills + '  ·  ' + (mode === 'fight' ? 'FIGHT' : 'BUILD') + ' (Q)';
  $('place').textContent = mode === 'fight' ? 'SHOOT' : 'PLACE';
  $('brk').textContent = mode === 'fight' ? 'PUNCH' : 'BREAK';
}
let msgT = 0;
function msg(t, ms = 1800) { const m = $('msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(msgT); msgT = setTimeout(() => m.style.display = 'none', ms); }
function hurt(n) {
  if (inCar) return;
  P.hp -= n; lastHurt = clock; flashV = 0.45;
  if (P.hp <= 0) {
    P.hp = 100; P.pos.set(25, 1, 25); P.vel.set(0, 0, 0); msg('YOU DIED'); flashV = 0.8;
  }
  hud();
}
function jump() { if (P.ground) { P.vel.y = 11; P.ground = false; } }
function playerStep(dt) {
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y;
  const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
  const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
  let mx = -sin * f + cos * s, mz = -cos * f - sin * s;
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  const sp = keys.ShiftLeft ? 12 : 7;
  phys(P, mx * sp, mz * sp, dt);
  if (P.pos.y < -50) P.pos.set(25, 3, 25);
  cam.position.set(P.pos.x, P.pos.y + 1.55, P.pos.z);
  cam.rotation.set(P.pitch, P.yaw, 0);
  if (P.hp < 100 && clock - lastHurt > 5) { P.hp = Math.min(100, P.hp + 3 * dt); hud(); }
}

// ---------- cars ----------
const cars = [];
function mkCar(x, z, h, col) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 4.2), new THREE.MeshLambertMaterial({ color: col })); body.position.y = 0.7; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2), new THREE.MeshLambertMaterial({ color: 0x223344 })); cab.position.set(0, 1.4, -0.2); g.add(cab);
  const wm = new THREE.MeshLambertMaterial({ color: 0x111111 }), wg = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
  for (const [wx, wz] of [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]]) { const w = new THREE.Mesh(wg, wm); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.4, wz); g.add(w); }
  g.position.set(x, 0, z); g.rotation.y = h; scene.add(g);
  cars.push({ mesh: g, pos: new THREE.Vector3(x, 0, z), h, speed: 0 });
}
mkCar(25, 45, 0, 0xd62828); mkCar(45, 25, Math.PI / 2, 0x2a9d8f); mkCar(-25, -5, 0, 0xf4a261); mkCar(75, -25, Math.PI / 2, 0x6a4c93);
function toggleCar() {
  if (inCar) {
    const c = inCar; inCar = null; c.speed = 0;
    P.pos.set(c.pos.x + Math.cos(c.h) * 3, 0, c.pos.z - Math.sin(c.h) * 3); P.vel.set(0, 0, 0); P.yaw = c.h + Math.PI; P.pitch = 0; return;
  }
  let best = null, bd = 5;
  for (const c of cars) { const d = Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z); if (d < bd) { bd = d; best = c; } }
  if (best) { inCar = best; msg('W/S drive, A/D steer, Space brake, E exit', 2500); } else msg('No car nearby', 900);
}
function driveCar(dt) {
  const c = inCar;
  const thr = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y;
  const steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0) - joy.x;
  if (Math.abs(thr) > 0.1) c.speed += thr * 18 * dt; else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 8 * dt);
  if (keys.Space) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 25 * dt);
  c.speed = Math.max(-8, Math.min(26, c.speed));
  c.h += steer * 1.8 * dt * Math.max(-1, Math.min(1, c.speed / 5));
  const t = { pos: new THREE.Vector3(c.pos.x + Math.sin(c.h) * c.speed * dt, 0, c.pos.z + Math.cos(c.h) * c.speed * dt), R: 1.3, H: 1.2 };
  let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
  if (bad) c.speed *= -0.3; else c.pos.copy(t.pos);
  c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h;
  if (Math.abs(c.speed) > 6) for (const e of enemies) if (!e.dead && Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z) < 2.3) damageEnemy(e, 100);
  P.pos.copy(c.pos);
  cam.position.set(c.pos.x - Math.sin(c.h) * 7.5, 3.8, c.pos.z - Math.cos(c.h) * 7.5);
  cam.lookAt(c.pos.x, 1.2, c.pos.z);
}

// ---------- enemies ----------
const enemies = [], enemyMeshes = [];
function mkEnemy(x, z) {
  const col = [0xaa2222, 0x8a2be2, 0x225577, 0x886622][Math.floor(Math.random() * 4)];
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: col }), skin = new THREE.MeshLambertMaterial({ color: 0xe0b48f });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x222233 })); legs.position.y = 0.35;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), mat); torso.position.y = 1.1;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skin); head.position.y = 1.75;
  g.add(legs, torso, head); g.position.set(x, 0, z); scene.add(g);
  const e = { ...mkEnt(x, 0, z, 0.4, 1.95), mesh: g, hp: 60, mat, col, hurt: 0, cd: 0, wa: 0, wt: 0, dead: false };
  [legs, torso, head].forEach(m => { m.userData.enemy = e; enemyMeshes.push(m); });
  head.userData.head = true; enemies.push(e);
}
function spawnEnemy() {
  for (let t = 0; t < 10; t++) {
    const v = Math.random() < 0.5, k = Math.floor(Math.random() * 16) - 8, a = (Math.random() - 0.5) * 600;
    const x = v ? k * 50 + 25 : a, z = v ? a : k * 50 + 25;
    if (Math.hypot(x - P.pos.x, z - P.pos.z) < 40) continue;
    mkEnemy(x, z); return;
  }
}
function damageEnemy(e, n) {
  if (e.dead) return;
  e.hp -= n; e.hurt = 0.12;
  if (e.hp <= 0) {
    e.dead = true; scene.remove(e.mesh);
    e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); });
    kills++; hud();
  }
}
function enemyStep(e, dt) {
  const tx = P.pos.x - e.pos.x, tz = P.pos.z - e.pos.z, d = Math.hypot(tx, tz);
  if (d > 100) return;
  let mx = 0, mz = 0;
  if (d < 45 && d > 1.3) { mx = tx / d; mz = tz / d; }
  else if (d >= 45) { e.wt -= dt; if (e.wt <= 0) { e.wa = Math.random() * 6.28; e.wt = 2 + Math.random() * 3; } mx = Math.sin(e.wa) * 0.4; mz = Math.cos(e.wa) * 0.4; }
  const sp = 4.8, ox = e.pos.x, oz = e.pos.z;
  phys(e, mx * sp, mz * sp, dt);
  if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = 11;
  e.mesh.position.copy(e.pos); if (mx || mz) e.mesh.rotation.y = Math.atan2(mx, mz);
  e.hurt -= dt; e.mat.color.setHex(e.hurt > 0 ? 0xffffff : e.col);
  e.cd -= dt; if (d < 1.8 && e.cd <= 0 && !inCar) { hurt(8); e.cd = 0.7; }
}

// ---------- actions ----------
const ray = new THREE.Raycaster(); ray.far = 14;
const gun = new THREE.Raycaster(); gun.far = 70;
let cool = 0;
function aim() { cam.updateMatrixWorld(); ray.setFromCamera({ x: 0, y: 0 }, cam); return ray.intersectObjects(targets, false)[0]; }
function place() {
  const h = aim(); if (!h) return;
  const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
  const p = h.point.clone().addScaledVector(n, 0.01);
  const cx = Math.floor(p.x / 2), cy = Math.floor(p.y / 2), cz = Math.floor(p.z / 2);
  if (cy < 0) return;
  if (hit(P, new THREE.Box3(new THREE.Vector3(cx * 2, cy * 2, cz * 2), new THREE.Vector3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2)))) return;
  addBlock(cx, cy, cz, sel);
}
function brk() { const h = aim(); if (h && h.object.userData.k) delBlock(h.object.userData.k); }
function tracer(to) {
  const g = new THREE.BufferGeometry().setFromPoints([cam.localToWorld(new THREE.Vector3(0.3, -0.25, -0.8)), to]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffee88 })); scene.add(l);
  setTimeout(() => { scene.remove(l); g.dispose(); }, 70);
}
function shoot() {
  if (cool > 0) return; cool = 0.25;
  cam.updateMatrixWorld(); gun.setFromCamera({ x: 0, y: 0 }, cam);
  const h = gun.intersectObjects([...targets, ...enemyMeshes], false)[0];
  tracer(h ? h.point : gun.ray.at(70, new THREE.Vector3()));
  if (h && h.object.userData.enemy) damageEnemy(h.object.userData.enemy, h.object.userData.head ? 60 : 25);
}
function punch() {
  if (cool > 0) return; cool = 0.4;
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d < 2.8 && (dx * fx + dz * fz) / (d || 1) > 0.2) damageEnemy(e, 20);
  }
}
const act1 = () => { if (inCar) return; mode === 'fight' ? shoot() : place(); };
const act2 = () => { if (inCar) return; mode === 'fight' ? punch() : brk(); };
const toggleMode = () => { mode = mode === 'fight' ? 'build' : 'fight'; hud(); };

// ---------- input: desktop ----------
const cv = ren.domElement;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') { if (!inCar) jump(); e.preventDefault(); }
  if (e.code === 'KeyQ') toggleMode();
  if (e.code === 'KeyE') toggleCar();
  if (e.code === 'KeyF' && !inCar) punch();
  if (e.code >= 'Digit1' && e.code <= 'Digit6') selBlock(+e.code.slice(5) - 1);
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('wheel', e => selBlock(sel + (e.deltaY > 0 ? 1 : -1)));
addEventListener('contextmenu', e => e.preventDefault());
let held = false;
if (!isTouch) {
  cv.addEventListener('click', () => { if (document.pointerLockElement !== cv) cv.requestPointerLock(); });
  addEventListener('mousedown', e => { if (document.pointerLockElement !== cv) return; if (e.button === 0) { held = true; act1(); } else if (e.button === 2) act2(); });
  addEventListener('mouseup', e => { if (e.button === 0) held = false; });
  addEventListener('mousemove', e => {
    if (document.pointerLockElement !== cv || inCar) return;
    P.yaw -= e.movementX * 0.0025; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - e.movementY * 0.0025));
  });
}

// ---------- input: touch ----------
const tch = {};
function btn(id, fn) { $(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false }); }
btn('jump', () => { if (!inCar) jump(); }); btn('place', act1); btn('brk', act2); btn('col', () => selBlock(sel + 1)); btn('mode', toggleMode); btn('car', toggleCar);
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
    else if (!inCar) { P.yaw -= (t.clientX - s.x) * 0.006; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - (t.clientY - s.y) * 0.006)); s.x = t.clientX; s.y = t.clientY; }
  }
}, { passive: false });
const tend = e => { for (const t of e.changedTouches) { const s = tch[t.identifier]; if (s && s.mode === 'joy') { joy.x = joy.y = 0; } delete tch[t.identifier]; } };
addEventListener('touchend', tend); addEventListener('touchcancel', tend);

// ---------- update check (Electron only) + live web updates ----------
function newer(a, b) { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
if (native) {
  fetch('https://api.github.com/repos/' + REPO + '/releases/latest').then(r => r.json()).then(j => {
    const v = (j.tag_name || '').replace(/^v/, ''); if (!v || !newer(v, VER)) return;
    const u = $('upd'); u.style.display = 'block'; u.textContent = 'Update v' + v + ' downloading, restarts automatically';
  }).catch(() => {});
} else if (location.protocol.startsWith('http')) {
  setInterval(async () => {
    try {
      const j = await (await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' })).json();
      if (j.version && j.version !== VER) {
        save();
        const u = $('upd'); u.style.display = 'block'; u.textContent = 'New version v' + j.version + ', reloading...';
        setTimeout(() => location.replace(location.pathname + '?v=' + j.version), 3000);
      }
    } catch (e) {}
  }, 30000);
}

// ---------- loop ----------
hud();
for (let i = 0; i < 6; i++) spawnEnemy();
let last = performance.now(), spawnT = 0;
ren.setAnimationLoop(now => {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt;
  cool -= dt;
  if (inCar) driveCar(dt); else playerStep(dt);
  if (held && mode === 'fight' && !inCar) shoot();
  for (let i = enemies.length - 1; i >= 0; i--) { if (enemies[i].dead) enemies.splice(i, 1); else enemyStep(enemies[i], dt); }
  spawnT -= dt; if (spawnT <= 0 && enemies.length < 10) { spawnEnemy(); spawnT = 3; }
  flashV = Math.max(0, flashV - dt * 1.5); $('flash').style.opacity = flashV;
  ren.render(scene, cam);
});
