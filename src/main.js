import * as THREE from 'three';

const VER = __V__;
const REPO = 'Doreenats232/mini-world';
const isTouch = matchMedia('(pointer:coarse)').matches;
const native = navigator.userAgent.includes('Electron');
if (isTouch) document.body.classList.add('touch');
const $ = id => document.getElementById(id);
$('ver').textContent = 'v' + VER;
if (isTouch) $('help').style.display = 'none';
const V3 = THREE.Vector3;

// ---------- procedural textures ----------
function mkTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t._c = c; return t;
}
const rr = (a, b) => a + Math.random() * (b - a);
function speck(g, w, h, n, l, d) { for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? l : d; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }
function facade(base, frame) {
  const lits = [];
  const T = mkTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); speck(g, w, h, 1800, 'rgba(255,255,255,.07)', 'rgba(0,0,0,.08)');
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, w, 4); g.fillRect(0, 128, w, 4);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const x = c * 64 + 12, y = r * 128 + 30, ww = 40, hh = 70;
      g.fillStyle = frame; g.fillRect(x - 3, y - 3, ww + 6, hh + 6);
      const lit = Math.random() < 0.28; if (lit) lits.push([x, y, ww, hh]); const gr = g.createLinearGradient(0, y, 0, y + hh);
      if (lit) { gr.addColorStop(0, '#ffe9a8'); gr.addColorStop(1, '#f5c15b'); } else { gr.addColorStop(0, '#6f97b8'); gr.addColorStop(1, '#1d3347'); }
      g.fillStyle = gr; g.fillRect(x, y, ww, hh);
      g.fillStyle = frame; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh * 0.45, ww, 2);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 2, y + 2, ww / 2 - 4, 8);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 4, y + hh + 3, ww + 8, 3);
    }
  });
  T._em = mkTex(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd27a'; for (const [x, y, ww, hh] of lits) g.fillRect(x, y, ww, hh); });
  return T;
}
const FACADES = [['#b7aea0', '#3a3a3a'], ['#a86656', '#2a2a2a'], ['#8f9aa8', '#20252b'], ['#d0c3a4', '#4a4036']].map(([b, f]) => facade(b, f));
const matCache = {};
function sideMat(v, wm, hm) {
  const rx = Math.max(1, Math.round(wm / 8)), ry = Math.max(1, Math.round(hm / 8)), k = v + '|' + rx + '|' + ry;
  if (!matCache[k]) { const t = FACADES[v].clone(); t.needsUpdate = true; t.repeat.set(rx, ry); const e = FACADES[v]._em.clone(); e.needsUpdate = true; e.repeat.set(rx, ry); matCache[k] = new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: e, emissiveIntensity: 0 }); }
  return matCache[k];
}
const roofTop = new THREE.MeshLambertMaterial({ map: mkTex(64, 64, (g, w, h) => { g.fillStyle = '#6a6c70'; g.fillRect(0, 0, w, h); speck(g, w, h, 500, 'rgba(255,255,255,.1)', 'rgba(0,0,0,.15)'); }) });
const grassTex = mkTex(256, 256, (g, w, h) => { g.fillStyle = '#4b7d3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `hsl(${rr(88, 108)},${rr(35, 50)}%,${rr(26, 40)}%)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); } });
grassTex.repeat.set(175, 175);
const roadTex = mkTex(128, 256, (g, w, h) => {
  g.fillStyle = '#2e2e31'; g.fillRect(0, 0, w, h); speck(g, w, h, 1500, 'rgba(255,255,255,.07)', 'rgba(0,0,0,.2)');
  g.fillStyle = '#dcdcdc'; g.fillRect(6, 0, 3, h); g.fillRect(w - 9, 0, 3, h);
  g.fillStyle = '#e8c41c'; for (let y = 0; y < h; y += 80) g.fillRect(w / 2 - 2, y, 4, 40);
  g.fillStyle = '#555'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
});
roadTex.repeat.set(1, 800 / 28);
const BLOCKS = [['planks', 'wood'], ['stone', 'stone'], ['brick', 'stone'], ['glass', 'sand'], ['concrete', 'stone'], ['roof', 'wood']];
const BIDX = Object.fromEntries(BLOCKS.map((b, i) => [b[0], i]));
const BTEX = [
  mkTex(64, 64, (g, w, h) => { for (let r = 0; r < 4; r++) { g.fillStyle = `hsl(32,${rr(38, 50)}%,${rr(42, 54)}%)`; g.fillRect(0, r * 16, w, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, r * 16, w, 1.5); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(80,45,15,.25)'; g.fillRect(rr(0, w), r * 16 + rr(2, 14), rr(8, 26), 1); } g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect((r % 2) * 32 + 14, r * 16 + 7, 2, 2); } }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#8c9094'; g.fillRect(0, 0, w, h); speck(g, w, h, 700, 'rgba(255,255,255,.18)', 'rgba(0,0,0,.25)'); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); let x = rr(0, w), y = rr(0, h); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rr(-9, 9); y += rr(-9, 9); g.lineTo(x, y); } g.stroke(); } }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#d2cbbf'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const x = c * 32 + (r % 2) * 16; g.fillStyle = `hsl(${rr(8, 14)},${rr(45, 55)}%,${rr(32, 42)}%)`; g.fillRect(x + 1, r * 16 + 1, 30, 14); } speck(g, w, h, 300, 'rgba(255,255,255,.1)', 'rgba(0,0,0,.15)'); }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = 'rgba(170,220,235,.45)'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(8, 6); g.lineTo(26, 6); g.lineTo(6, 28); g.lineTo(6, 14); g.fill(); g.strokeStyle = '#d6f2f8'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#d6f2f8'; g.fillRect(w / 2 - 1, 0, 2, h); g.fillRect(0, h / 2 - 1, w, 2); }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#b9bbbd'; g.fillRect(0, 0, w, h); speck(g, w, h, 900, 'rgba(255,255,255,.2)', 'rgba(0,0,0,.12)'); g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0.5, 0.5, w - 1, h - 1); g.fillStyle = 'rgba(0,0,0,.25)'; for (const [x, y] of [[6, 6], [56, 6], [6, 56], [56, 56]]) g.fillRect(x, y, 2, 2); }),
  mkTex(64, 64, (g, w, h) => { for (let r = 0; r < 4; r++) { for (let c = -1; c < 4; c++) { const x = c * 20 + (r % 2) * 10; g.fillStyle = `hsl(${rr(10, 16)},${rr(50, 60)}%,${rr(34, 44)}%)`; g.fillRect(x, r * 16, 19, 15); } g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, r * 16 + 15, w, 1.5); } }),
];
BTEX.forEach(t => { t.magFilter = THREE.NearestFilter; });
const bmats = BTEX.map((t, i) => new THREE.MeshLambertMaterial(i === 3 ? { map: t, transparent: true, opacity: 0.7, depthWrite: false } : { map: t }));

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
const hemi = new THREE.HemisphereLight(0xffffff, 0x556655, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(60, 100, 30);
scene.add(sun);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); ren.setSize(innerWidth, innerHeight); });

// ---------- world ----------
const solids = new Map();
const targets = [];
const blockMeshes = new Map();
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshLambertMaterial({ map: grassTex }));
ground.rotation.x = -Math.PI / 2; scene.add(ground); targets.push(ground);
const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
for (let k = -8; k <= 7; k++) {
  const a = new THREE.Mesh(new THREE.PlaneGeometry(14, 800), roadMat); a.rotation.x = -Math.PI / 2; a.position.set(k * 50 + 25, 0.03, 0); scene.add(a);
  const gr = new THREE.Group(), b = new THREE.Mesh(new THREE.PlaneGeometry(14, 800), roadMat); b.rotation.x = -Math.PI / 2; gr.add(b); gr.rotation.y = Math.PI / 2; gr.position.set(0, 0.035, k * 50 + 25); scene.add(gr);
}
for (let i = -7; i <= 6; i++) for (let j = -7; j <= 6; j++) {
  const n = 1 + Math.floor(rnd() * 3);
  for (let q = 0; q < n; q++) {
    const w = 8 + rnd() * 10, d = 8 + rnd() * 10, h = 6 + rnd() * rnd() * 46, v = Math.floor(rnd() * 4);
    const x = i * 50 + (rnd() - 0.5) * 18, z = j * 50 + (rnd() - 0.5) * 18;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideMat(v, d, h), sideMat(v, d, h), roofTop, roofTop, sideMat(v, w, h), sideMat(v, w, h)]);
    m.position.set(x, h / 2, z); scene.add(m); targets.push(m); m.updateMatrixWorld();
    solids.set('b' + i + ',' + j + ',' + q, new THREE.Box3().setFromObject(m));
  }
}
const onRoad = (x, z, m = 8.5) => { const a = ((x - 25) % 50 + 50) % 50, b = ((z - 25) % 50 + 50) % 50; return a < m || a > 50 - m || b < m || b > 50 - m; };

// ---------- entities / physics ----------
const mkEnt = (x, y, z, R, H) => ({ pos: new V3(x, y, z), vel: new V3(), R, H, ground: false });
function hit(e, b) { return e.pos.x + e.R > b.min.x && e.pos.x - e.R < b.max.x && e.pos.z + e.R > b.min.z && e.pos.z - e.R < b.max.z && e.pos.y + e.H > b.min.y && e.pos.y < b.max.y; }
function move(e, axis, d) {
  e.pos[axis] += d;
  for (const b of solids.values()) {
    if (!hit(e, b)) continue;
    if (axis === 'y') { if (d <= 0) { e.pos.y = b.max.y; e.vel.y = 0; e.ground = true; } else { e.pos.y = b.min.y - e.H; e.vel.y = 0; } }
    else e.pos[axis] = d > 0 ? b.min[axis] - e.R : b.max[axis] + e.R;
  }
}
function phys(e, mx, mz, dt) { e.vel.y -= 28 * dt; move(e, 'x', mx * dt); move(e, 'z', mz * dt); e.ground = false; move(e, 'y', e.vel.y * dt); if (e.pos.y <= 0) { e.pos.y = 0; e.vel.y = 0; e.ground = true; } }
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------- sound (synthesized, no files) ----------
let AC = null, master = null, nb = null, eng = null, stepT = 0, muted = false;
try { muted = localStorage.getItem('mw_mute') === '1'; } catch (e) {}
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
['keydown', 'mousedown', 'touchstart'].forEach(k => addEventListener(k, () => audio(), { passive: true }));
function tone(f1, f2, dur, type = 'square', vol = 0.3) {
  const a = AC; if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, type = 'lowpass') {
  const a = AC; if (!a || muted) return;
  if (!nb) { nb = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = a.createBufferSource(); s.buffer = nb;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(), t = a.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5, dur + 0.02);
}
function sfx(n, v = 1) {
  if (!audio() || muted) return;
  switch (n) {
    case 'shoot': noise(0.14, 0.5 * v, 900, 'highpass'); tone(500, 70, 0.14, 'sawtooth', 0.3 * v); break;
    case 'punch': noise(0.08, 0.5 * v, 500); tone(140, 60, 0.1, 'square', 0.25 * v); break;
    case 'hit': tone(900, 400, 0.05, 'square', 0.12 * v); break;
    case 'place': tone(330, 220, 0.07, 'square', 0.18 * v); break;
    case 'brk': noise(0.15, 0.4 * v, 1400); break;
    case 'hurt': tone(220, 80, 0.22, 'sawtooth', 0.35 * v); break;
    case 'die': tone(400, 60, 0.7, 'sawtooth', 0.35 * v); break;
    case 'edie': tone(260, 50, 0.3, 'sawtooth', 0.25 * v); break;
    case 'npcplace': tone(520, 380, 0.05, 'triangle', 0.18 * v); break;
    case 'chop': noise(0.07, 0.35 * v, 700); tone(180, 120, 0.05, 'square', 0.12 * v); break;
    case 'mine': tone(1200, 700, 0.04, 'square', 0.12 * v); noise(0.05, 0.3 * v, 2500, 'highpass'); break;
    case 'crash': noise(0.25, 0.6 * v, 600); tone(100, 40, 0.25, 'sawtooth', 0.3 * v); break;
    case 'step': noise(0.04, 0.1 * v, 450); break;
  }
}
function sfxAt(pos, n) { const v = 1 - dist2(pos, P.pos) / 45; if (v > 0.05) sfx(n, v); }
function startEngine() { const a = audio(); if (!a || eng) return; const o = a.createOscillator(), g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = 45; g.gain.value = 0.05; o.connect(g); g.connect(master); o.start(); eng = { o, g }; }
function engine(sp) { if (eng) { eng.o.frequency.value = 45 + sp * 5; eng.g.gain.value = muted ? 0 : 0.05 + Math.min(0.06, sp * 0.003); } }
function stopEngine() { if (eng) { try { eng.o.stop(); } catch (e) {} eng = null; } }
function toggleMute() { muted = !muted; try { localStorage.setItem('mw_mute', muted ? '1' : '0'); } catch (e) {} $('mute').textContent = muted ? '🔇' : '🔊'; if (muted && eng) eng.g.gain.value = 0; }
$('mute').textContent = muted ? '🔇' : '🔊';
$('mute').addEventListener('click', toggleMute);

// ---------- blocks ----------
let sel = 0;
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const hot = $('hot');
BTEX.forEach(t => { const d = document.createElement('div'); d.style.backgroundImage = 'url(' + t._c.toDataURL() + ')'; d.style.backgroundSize = 'cover'; hot.appendChild(d); });
function selBlock(i) { sel = (i + BLOCKS.length) % BLOCKS.length; [...hot.children].forEach((d, k) => d.classList.toggle('on', k === sel)); if (typeof hud === 'function') hud(); }
const grow = [];
let saveT = 0;
function addBlock(cx, cy, cz, t, doSave = true, anim = false) {
  const k = cx + ',' + cy + ',' + cz;
  if (blockMeshes.has(k)) return false;
  const m = new THREE.Mesh(boxGeo, bmats[t]);
  m.position.set(cx * 2 + 1, cy * 2 + 1, cz * 2 + 1); m.userData = { k, cx, cy, cz, c: t }; m.updateMatrixWorld();
  solids.set(k, new THREE.Box3().setFromObject(m));
  scene.add(m); targets.push(m); blockMeshes.set(k, m);
  if (anim) { m.scale.setScalar(0.2); grow.push({ m, t: 0 }); }
  if (doSave) queueSave();
  return true;
}
function delBlock(k) { const m = blockMeshes.get(k); if (!m) return; scene.remove(m); targets.splice(targets.indexOf(m), 1); blockMeshes.delete(k); solids.delete(k); queueSave(); }
function queueSave() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
function save() { try { localStorage.setItem('mw_save', JSON.stringify({ b: [...blockMeshes.values()].map(m => [m.userData.cx, m.userData.cy, m.userData.cz, m.userData.c]), p: [P.pos.x, P.pos.y, P.pos.z, P.yaw], k: kills })); } catch (e) {} }
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
  $('info').textContent = 'Kills ' + kills + '  ·  ' + (mode === 'fight' ? 'FIGHT' : 'BUILD: ' + BLOCKS[sel][0]) + ' (Q)';
  $('place').textContent = mode === 'fight' ? 'SHOOT' : 'PLACE';
  $('brk').textContent = mode === 'fight' ? 'PUNCH' : 'BREAK';
}
selBlock(0);
let msgT = 0;
function msg(t, ms = 1800) { const m = $('msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(msgT); msgT = setTimeout(() => m.style.display = 'none', ms); }
function hurt(n) {
  if (inCar) return;
  P.hp -= n; lastHurt = clock; flashV = 0.45; sfx('hurt');
  if (P.hp <= 0) { P.hp = 100; P.pos.set(25, 1, 25); P.vel.set(0, 0, 0); msg('YOU DIED'); sfx('die'); flashV = 0.8; }
  hud();
}
function jump() { if (P.ground) { P.vel.y = 11; P.ground = false; } }
function playerStep(dt) {
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
  const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
  let mx = -sin * f + cos * s, mz = -cos * f - sin * s;
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  const sp = keys.ShiftLeft ? 12 : 7;
  phys(P, mx * sp, mz * sp, dt);
  if (P.ground && (mx || mz)) { stepT -= dt; if (stepT <= 0) { sfx('step'); stepT = keys.ShiftLeft ? 0.28 : 0.42; } }
  if (P.pos.y < -50) P.pos.set(25, 3, 25);
  cam.position.set(P.pos.x, P.pos.y + 1.55, P.pos.z); cam.rotation.set(P.pitch, P.yaw, 0);
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
  cars.push({ mesh: g, pos: new V3(x, 0, z), h, speed: 0 });
}
mkCar(25, 45, 0, 0xd62828); mkCar(45, 25, Math.PI / 2, 0x2a9d8f); mkCar(-25, -5, 0, 0xf4a261); mkCar(75, -25, Math.PI / 2, 0x6a4c93);
function toggleCar() {
  if (inCar) { const c = inCar; inCar = null; c.speed = 0; stopEngine(); P.pos.set(c.pos.x + Math.cos(c.h) * 3, 0, c.pos.z - Math.sin(c.h) * 3); P.vel.set(0, 0, 0); P.yaw = c.h + Math.PI; P.pitch = 0; return; }
  let best = null, bd = 5;
  for (const c of cars) { const d = dist2(c.pos, P.pos); if (d < bd) { bd = d; best = c; } }
  if (best) { inCar = best; startEngine(); msg('W/S drive, A/D steer, Space brake, E exit', 2500); } else msg('No car nearby', 900);
}
function driveCar(dt) {
  const c = inCar, thr = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0) - joy.x;
  if (Math.abs(thr) > 0.1) c.speed += thr * 18 * dt; else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 8 * dt);
  if (keys.Space) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 25 * dt);
  c.speed = Math.max(-8, Math.min(26, c.speed)); engine(Math.abs(c.speed));
  c.h += steer * 1.8 * dt * Math.max(-1, Math.min(1, c.speed / 5));
  const t = { pos: new V3(c.pos.x + Math.sin(c.h) * c.speed * dt, 0, c.pos.z + Math.cos(c.h) * c.speed * dt), R: 1.3, H: 1.2 };
  let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
  if (bad) { if (Math.abs(c.speed) > 4) sfx('crash'); c.speed *= -0.3; } else c.pos.copy(t.pos);
  c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h;
  if (Math.abs(c.speed) > 6) for (const e of enemies) if (!e.dead && dist2(e.pos, c.pos) < 2.3) damageEnemy(e, 100);
  P.pos.copy(c.pos);
  cam.position.set(c.pos.x - Math.sin(c.h) * 7.5, 3.8, c.pos.z - Math.cos(c.h) * 7.5); cam.lookAt(c.pos.x, 1.2, c.pos.z);
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
function damageEnemy(e, n, quiet) {
  if (e.dead) return;
  e.hp -= n; e.hurt = 0.12; sfxAt(e.pos, 'hit');
  if (e.hp <= 0) { sfxAt(e.pos, 'edie'); e.dead = true; scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); if (!quiet) { kills++; hud(); } }
}
function enemyStep(e, dt) {
  let T = inCar ? inCar.pos : P.pos, npc = null;
  const dp = dist2(T, e.pos);
  if (dp > 14) { let bd = 10; for (const n of npcs) { const d = dist2(n.pos, e.pos); if (d < bd) { bd = d; npc = n; } } if (npc) T = npc.pos; }
  const tx = T.x - e.pos.x, tz = T.z - e.pos.z, d = Math.hypot(tx, tz);
  if (!npc && d > 100) return;
  let mx = 0, mz = 0;
  if ((npc || d < 45) && d > 1.3) { mx = tx / d; mz = tz / d; }
  else if (!npc && d >= 45) { e.wt -= dt; if (e.wt <= 0) { e.wa = Math.random() * 6.28; e.wt = 2 + Math.random() * 3; } mx = Math.sin(e.wa) * 0.4; mz = Math.cos(e.wa) * 0.4; }
  const sp = 4.8, ox = e.pos.x, oz = e.pos.z;
  phys(e, mx * sp, mz * sp, dt);
  if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = 11;
  e.mesh.position.copy(e.pos); if (mx || mz) e.mesh.rotation.y = Math.atan2(mx, mz);
  e.hurt -= dt; e.mat.color.setHex(e.hurt > 0 ? 0xffffff : e.col);
  e.cd -= dt;
  if (d < 1.8 && e.cd <= 0) { if (npc) npcHurt(npc, 6); else if (!inCar) hurt(8); e.cd = 0.7; }
}
const nearestEnemy = (pos, r) => { let b = null, bd = r; for (const e of enemies) { if (e.dead) continue; const d = dist2(e.pos, pos); if (d < bd) { bd = d; b = e; } } return b; };

// ---------- resources ----------
const nodes = [];
function mkNode(type, x, z) {
  const g = new THREE.Group();
  if (type === 'wood') {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 8), new THREE.MeshLambertMaterial({ color: 0x6b4423 })); tr.position.y = 1.5;
    const lv = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 8), new THREE.MeshLambertMaterial({ color: 0x2d7a33 })); lv.position.y = 5; g.add(tr, lv);
  } else if (type === 'stone') {
    const m = new THREE.MeshLambertMaterial({ color: 0x7d8185, flatShading: true });
    const a = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), m); a.position.y = 1.1; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1), m); b.position.set(1.6, 0.6, 0.6); g.add(a, b);
  } else {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.7, 10), new THREE.MeshLambertMaterial({ color: 0xe3cf96 })); m.position.y = 0.35;
    const b = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6, 0, 6.3, 0, 1.5), new THREE.MeshLambertMaterial({ color: 0xead8a2 })); b.position.y = 0.6; g.add(m, b);
  }
  g.position.set(x, 0, z); scene.add(g);
  nodes.push({ type, pos: new V3(x, 0, z), left: 30, max: 30, mesh: g, regen: 0 });
}
function nodeSpotOk(x, z) {
  if (onRoad(x, z, 9)) return false;
  const e = { pos: new V3(x, 0, z), R: 3, H: 6 };
  for (const b of solids.values()) if (hit(e, b)) return false;
  for (const n of nodes) if (Math.hypot(n.pos.x - x, n.pos.z - z) < 7) return false;
  return true;
}
for (const [type, cnt] of [['wood', 16], ['stone', 12], ['sand', 10]]) {
  let placed = 0;
  for (let t = 0; t < 1500 && placed < cnt; t++) { const a = Math.random() * 6.283, r = 18 + Math.random() * 170, x = 25 + Math.cos(a) * r, z = 25 + Math.sin(a) * r; if (nodeSpotOk(x, z)) { mkNode(type, x, z); placed++; } }
}
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const dirName = (from, to) => DIRS[((Math.round(Math.atan2(to.x - from.x, -(to.z - from.z)) / (Math.PI / 4)) % 8) + 8) % 8];
function nearestNode(pos, type) { let b = null, bd = 1e9; for (const n of nodes) { if (n.type !== type || n.left <= 0) continue; const d = dist2(n.pos, pos); if (d < bd) { bd = d; b = n; } } return b; }

// ---------- NPCs ----------
const npcs = [], structures = [], reserved = [];
const NPCDEF = [
  { id: 'archie', name: 'Archie', role: 'architect', pers: 'thoughtful, loves clean elegant design, a little pedantic, polite', col: 0x2e86de, x: 31, z: 25 },
  { id: 'mason', name: 'Mason', role: 'builder', pers: 'blunt hard worker, hates wasting materials, dry humor', col: 0xe67e22, x: 19, z: 27 },
  { id: 'ranger', name: 'Ranger', role: 'guard', pers: 'brave and protective, jokes when in danger, suspicious of strangers', col: 0x27ae60, x: 25, z: 17 },
];
function mkNpc(d) {
  const g = new THREE.Group(), cm = new THREE.MeshLambertMaterial({ color: d.col }), skin = new THREE.MeshLambertMaterial({ color: 0xe0b48f });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x2c3e50 })); legs.position.y = 0.35;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), cm); torso.position.y = 1.1;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skin); head.position.y = 1.75;
  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), new THREE.MeshLambertMaterial({ color: d.role === 'guard' ? 0x1e5631 : d.role === 'architect' ? 0x1b4f8a : 0xb35a14 })); hat.position.y = 2.05;
  const mkArm = sx => { const p = new THREE.Group(); p.position.set(sx * 0.55, 1.45, 0); const a = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), cm); a.position.y = -0.3; p.add(a); return p; };
  const aL = mkArm(-1), aR = mkArm(1);
  g.add(legs, torso, head, hat, aL, aR); g.position.set(d.x, 0, d.z); scene.add(g);
  const el = document.createElement('div'); el.className = 'nl';
  const bub = document.createElement('div'); bub.className = 'bub'; const nm = document.createElement('div'); const st = document.createElement('div'); st.className = 'st';
  nm.innerHTML = '<b></b> <small></small>'; nm.firstChild.textContent = d.name; nm.lastChild.textContent = '(' + d.role + ')';
  el.append(bub, nm, st); $('labels').appendChild(el);
  npcs.push({ ...mkEnt(d.x, 0, d.z, 0.4, 1.9), ...d, mesh: g, aL, aR, el, bub, st, hp: 80, inv: { wood: 0, stone: 0, sand: 0 }, task: null, sub: null, status: 'standing by', last: 'just arrived', stuck: 0, work: 0, cd: 0, bubT: 0, idleT: 0, swing: 0, face: 0, home: { x: d.x, z: d.z }, walking: false, working: false });
}
NPCDEF.forEach(mkNpc);
const nearestNpc = pos => { let b = null, bd = 1e9; for (const n of npcs) { const d = dist2(n.pos, pos); if (d < bd) { bd = d; b = n; } } return b; };
const COSTRES = i => BLOCKS[i][1];
function logLine(txt, cls) { const d = document.createElement('div'); d.textContent = txt; if (cls) d.className = cls; const L = $('log'); L.appendChild(d); while (L.children.length > 8) L.firstChild.remove(); setTimeout(() => d.remove(), 40000); }
let events = [];
const ev = t => { events.push(t); logLine('· ' + t, 'ev'); };
function say(n, t) { t = String(t || '').slice(0, 220); if (!t) return; n.bub.textContent = t; n.bubT = 6 + t.length / 18; logLine(n.name + ': ' + t); }
function npcHurt(n, d) { n.hp -= d; if (n.hp <= 0) { n.hp = 80; n.pos.set(n.home.x, 0, n.home.z); n.task = null; n.sub = null; n.last = 'was knocked out and woke up at home'; ev(n.name + ' was knocked out by thugs and woke up at home'); } }

// ---- plan expansion (architecture DSL) ----
function expandPlan(plan) {
  const m = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
  for (const o of (Array.isArray(plan) ? plan.slice(0, 20) : [])) {
    if (!o || typeof o !== 'object') continue;
    const C = (k, mx) => Math.max(0, Math.min(mx, Math.round(+o[k] || 0))), S = (k, mx) => Math.max(1, Math.min(mx, Math.round(+o[k] || 1)));
    const x0 = C('x', 24), y0 = C('y', 16), z0 = C('z', 24), w = S('w', 24), h = S('h', 16), d = S('d', 24), b = o.block in BIDX ? BIDX[o.block] : 0;
    switch (o.op) {
      case 'block': m.set(key(x0, y0, z0), b); break;
      case 'fill': case 'box':
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) { if (o.op === 'box' && o.hollow && !(x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1)) continue; m.set(key(x, y, z), b); }
        break;
      case 'floor': for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) m.set(key(x, y0, z), b); break;
      case 'roof':
        if (o.style === 'flat') { for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) m.set(key(x, y0, z), b); break; }
        for (let i = 0; z0 + i <= z0 + d - 1 - i; i++) for (let x = x0; x < x0 + w; x++) { m.set(key(x, y0 + i, z0 + i), b); m.set(key(x, y0 + i, z0 + d - 1 - i), b); if (x === x0 || x === x0 + w - 1) for (let z = z0 + i; z <= z0 + d - 1 - i; z++) m.set(key(x, y0 + i, z), b); }
        break;
      case 'hole': for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) m.delete(key(x, y, z)); break;
    }
    if (m.size > 900) break;
  }
  const cells = [...m].map(([k, t]) => { const [x, y, z] = k.split(',').map(Number); return { x, y, z, t }; }).slice(0, 700);
  return cells;
}
function rotCells(cells, r) {
  let W = 0, D = 0; for (const c of cells) { W = Math.max(W, c.x + 1); D = Math.max(D, c.z + 1); }
  const out = cells.map(c => r === 0 ? { x: c.x, y: c.y, z: c.z, t: c.t } : r === 1 ? { x: D - 1 - c.z, y: c.y, z: c.x, t: c.t } : r === 2 ? { x: W - 1 - c.x, y: c.y, z: D - 1 - c.z, t: c.t } : { x: c.z, y: c.y, z: W - 1 - c.x, t: c.t });
  return { cells: out, W: r % 2 ? D : W, D: r % 2 ? W : D };
}
const FACE = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function siteFree(x0, z0, S) {
  const box = new THREE.Box3(new V3(x0 * 2 - 2, 0.1, z0 * 2 - 2), new V3((x0 + S) * 2 + 2, 60, (z0 + S) * 2 + 2));
  for (const b of solids.values()) if (box.intersectsBox(b)) return false;
  for (const r of reserved) if (box.intersectsBox(r)) return false;
  for (let x = box.min.x; x <= box.max.x; x += 4) for (let z = box.min.z; z <= box.max.z; z += 4) if (onRoad(x, z, 8)) return false;
  for (const n of nodes) if (n.pos.x > box.min.x - 2 && n.pos.x < box.max.x + 2 && n.pos.z > box.min.z - 2 && n.pos.z < box.max.z + 2) return false;
  if (P.pos.x > box.min.x && P.pos.x < box.max.x && P.pos.z > box.min.z && P.pos.z < box.max.z) return false;
  return true;
}
function findSite(S, rx, rz) {
  for (let r = 6; r < 260; r += 4) {
    const steps = Math.max(8, Math.floor(r * 0.8)), off = Math.random() * 6.28;
    for (let a = 0; a < steps; a++) { const ang = off + a / steps * 6.283, x = rx + Math.cos(ang) * r, z = rz + Math.sin(ang) * r, x0 = Math.floor(x / 2 - S / 2), z0 = Math.floor(z / 2 - S / 2); if (siteFree(x0, z0, S)) return { x0, z0 }; }
  }
  return null;
}
const HUT = [{ op: 'box', x: 0, y: 0, z: 0, w: 5, h: 2, d: 5, block: 'planks', hollow: true }, { op: 'hole', x: 2, y: 0, z: 0, w: 1, h: 1, d: 1 }, { op: 'fill', x: 1, y: 1, z: 0, w: 1, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: 3, y: 1, z: 0, w: 1, h: 1, d: 1, block: 'glass' }, { op: 'roof', x: 0, y: 2, z: 0, w: 5, d: 5, block: 'roof', style: 'gable' }];

function cellFree(cx, cy, cz) {
  const b = new THREE.Box3(new V3(cx * 2, cy * 2, cz * 2), new V3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2));
  if (hit(P, b)) return false;
  for (const n of npcs) if (hit(n, b)) return false;
  for (const e of enemies) if (!e.dead && hit(e, b)) return false;
  return true;
}
function remainingNeed(t) { const need = { wood: 0, stone: 0, sand: 0 }; for (let i = t.i; i < t.cells.length; i++) need[COSTRES(t.cells[i].t)]++; return need; }

function setTask(n, t) {
  if (!t || typeof t !== 'object') return;
  const type = String(t.type || '').toLowerCase();
  n.sub = null; n.gnode = null; n.work = 0;
  if (type === 'idle' || type === 'stop') { n.task = null; n.status = 'standing by'; return; }
  if (type === 'wander') { n.task = { type: 'wander', wt: 0, tx: n.pos.x, tz: n.pos.z }; return; }
  if (type === 'follow' || type === 'guard') { n.task = { type }; return; }
  if (type === 'gather') {
    const res = String(t.resource || t.res || 'wood').toLowerCase(); if (!(res in n.inv)) { ev(n.name + ': unknown resource ' + res); return; }
    n.task = { type: 'gather', res, amount: Math.max(1, Math.min(60, Math.round(+t.amount || 20))) }; return;
  }
  if (type === 'build') {
    const cells0 = expandPlan(t.plan);
    if (cells0.length < 4) { ev(n.name + "'s plan was empty or too small, ignoring"); n.task = null; return; }
    let mnx = 1e9, mny = 1e9, mnz = 1e9; for (const c of cells0) { mnx = Math.min(mnx, c.x); mny = Math.min(mny, c.y); mnz = Math.min(mnz, c.z); }
    const norm = cells0.map(c => ({ x: c.x - mnx, y: c.y - mny, z: c.z - mnz, t: c.t }));
    let W = 0, D = 0; for (const c of norm) { W = Math.max(W, c.x + 1); D = Math.max(D, c.z + 1); }
    const S = Math.max(W, D), toMe = String(t.where || '').includes('me');
    const ref = toMe ? n.pos : P.pos, rx = ref.x + (+t.dx || 0), rz = ref.z + (+t.dz || 0);
    const site = findSite(S, rx, rz);
    if (!site) { ev(n.name + ' could not find free space for ' + (t.name || 'the building')); n.task = null; return; }
    const cxm = (site.x0 + S / 2) * 2, czm = (site.z0 + S / 2) * 2;
    let r = 0; if (t.face_player !== false) { const vx = P.pos.x - cxm, vz = P.pos.z - czm; let bd = -9; FACE.forEach((f, i) => { const dd = f[0] * vx + f[1] * vz; if (dd > bd) { bd = dd; r = i; } }); }
    const rot = rotCells(norm, r), ox = site.x0 + Math.floor((S - rot.W) / 2), oz = site.z0 + Math.floor((S - rot.D) / 2);
    const cells = rot.cells.map(c => ({ cx: ox + c.x, cy: c.y, cz: oz + c.z, t: c.t })).sort((a, b) => a.cy - b.cy || a.cz - b.cz || a.cx - b.cx);
    reserved.push(new THREE.Box3(new V3(site.x0 * 2 - 2, 0, site.z0 * 2 - 2), new V3((site.x0 + S) * 2 + 2, 60, (site.z0 + S) * 2 + 2)));
    const st = { name: String(t.name || 'Building').slice(0, 30), by: n.name, status: 'building', done: 0, total: cells.length };
    structures.push(st);
    n.task = { type: 'build', st, cells, i: 0, cx: cxm, cz: czm, stuckSkip: 0 };
    const need = remainingNeed(n.task);
    ev(`${n.name} planned "${st.name}": ${cells.length} blocks (wood ${need.wood}, stone ${need.stone}, sand ${need.sand})`);
    return;
  }
  ev(n.name + ': unknown task type ' + type);
}

// ---- NPC movement / behaviour ----
function walkTo(n, tx, tz, dt, stop = 1.5, sp = 5.2) {
  const dx = tx - n.pos.x, dz = tz - n.pos.z, d = Math.hypot(dx, dz);
  if (d <= stop) { phys(n, 0, 0, dt); n.walking = false; return true; }
  const ox = n.pos.x, oz = n.pos.z; phys(n, dx / d * sp, dz / d * sp, dt); n.walking = true; n.face = Math.atan2(dx, dz);
  if (Math.hypot(n.pos.x - ox, n.pos.z - oz) < sp * dt * 0.3) {
    n.stuck += dt; if (n.ground && n.stuck > 0.2) n.vel.y = 11;
    if (n.stuck > 4) { n.stuck = 0; n.pos.set(tx - dx / d * (stop + 2), 0.3, tz - dz / d * (stop + 2)); }
  } else n.stuck = Math.max(0, n.stuck - dt);
  return false;
}
function doGather(n, res, amount, dt) {
  n.status = `gathering ${res} (${n.inv[res]}/${amount})`;
  if (n.inv[res] >= amount) return 'done';
  let nd = n.gnode && n.gnode.left > 0 ? n.gnode : nearestNode(n.pos, res);
  if (!nd) return 'none';
  n.gnode = nd;
  if (!walkTo(n, nd.pos.x, nd.pos.z, dt, 2.2)) { n.working = false; return 'busy'; }
  n.working = true; n.face = Math.atan2(nd.pos.x - n.pos.x, nd.pos.z - n.pos.z); n.work += dt;
  nd.mesh.rotation.z = Math.sin(clock * 20) * 0.04;
  if (n.work >= 0.5) { n.work = 0; sfxAt(nd.pos, res === 'wood' ? 'chop' : 'mine'); nd.left--; n.inv[res]++; nd.mesh.scale.setScalar(0.45 + 0.55 * nd.left / nd.max); if (nd.left <= 0) nd.mesh.visible = false; }
  return 'busy';
}
function finish(n, text) { n.last = text; ev(n.name + ' ' + text); n.task = null; n.sub = null; n.gnode = null; n.working = false; n.idleT = 0; n.status = 'standing by'; }
function npcStep(n, dt) {
  n.walking = false; n.working = false; n.cd -= dt;
  const foe = nearestEnemy(n.pos, n.role === 'guard' || (n.task && n.task.type === 'guard') ? 16 : 3.2);
  if (foe) {
    const d = dist2(foe.pos, n.pos);
    if (d > 2.2) { if (n.role === 'guard' || (n.task && n.task.type === 'guard')) { walkTo(n, foe.pos.x, foe.pos.z, dt, 1.8, 5.8); n.status = 'fighting thugs'; return; } }
    else { n.face = Math.atan2(foe.pos.x - n.pos.x, foe.pos.z - n.pos.z); if (n.cd <= 0) { n.cd = 0.6; n.swing = 0.25; sfxAt(n.pos, 'punch'); damageEnemy(foe, n.role === 'guard' ? 25 : 12, true); } n.status = 'fighting'; phys(n, 0, 0, dt); return; }
  }
  const t = n.task;
  if (!t) { phys(n, 0, 0, dt); n.idleT += dt; const dp = dist2(P.pos, n.pos); if (dp < 12) n.face = Math.atan2(P.pos.x - n.pos.x, P.pos.z - n.pos.z); return; }
  if (t.type === 'wander') { t.wt -= dt; if (t.wt <= 0) { const a = Math.random() * 6.28; t.tx = n.pos.x + Math.cos(a) * 14; t.tz = n.pos.z + Math.sin(a) * 14; t.wt = 5; } walkTo(n, t.tx, t.tz, dt, 1, 2.5); n.status = 'wandering'; return; }
  if (t.type === 'follow' || t.type === 'guard') { walkTo(n, P.pos.x, P.pos.z, dt, t.type === 'guard' ? 6 : 3.5, 6); n.status = t.type === 'guard' ? 'guarding you' : 'following you'; return; }
  if (t.type === 'gather') { const r = doGather(n, t.res, t.amount, dt); if (r === 'done') finish(n, `finished gathering ${t.amount} ${t.res}`); else if (r === 'none') finish(n, `found no ${t.res} left in the world`); return; }
  if (t.type === 'build') {
    if (n.sub) { // fetching material
      const r = doGather(n, n.sub.res, n.sub.amount, dt);
      if (r === 'done') { n.sub = null; } else if (r === 'none') { finish(n, `ran out of ${n.sub.res} nodes while building ${t.st.name}`); t.st.status = 'stalled'; };
      return;
    }
    while (t.i < t.cells.length && blockMeshes.has(t.cells[t.i].cx + ',' + t.cells[t.i].cy + ',' + t.cells[t.i].cz)) t.i++;
    t.st.done = t.i;
    if (t.i >= t.cells.length) { t.st.status = 'complete'; finish(n, `finished building ${t.st.name}`); return; }
    const c = t.cells[t.i], res = COSTRES(c.t);
    if (n.inv[res] < 1) {
      const need = remainingNeed(t)[res], amount = Math.min(60, n.inv[res] + Math.max(5, need));
      n.sub = { res, amount }; n.gnode = null; ev(`${n.name} needs ${need} more ${res} for ${t.st.name}, going to gather`); return;
    }
    const wx = c.cx * 2 + 1, wz = c.cz * 2 + 1;
    n.status = `building ${t.st.name} ${t.i}/${t.cells.length}`;
    if (dist2(n.pos, { x: wx, z: wz }) > 6.5 || Math.abs(n.pos.y - c.cy * 2) > 9) { walkTo(n, wx, wz, dt, 5); return; }
    phys(n, 0, 0, dt); n.working = true; n.face = Math.atan2(wx - n.pos.x, wz - n.pos.z); n.work += dt;
    if (n.work >= 0.35) {
      if (!cellFree(c.cx, c.cy, c.cz)) { t.stuckSkip += 0.35; if (t.stuckSkip > 4) { t.stuckSkip = 0; t.i++; } n.work = 0.3; return; }
      n.work = 0; t.stuckSkip = 0; addBlock(c.cx, c.cy, c.cz, c.t, true, true); sfxAt(n.pos, 'npcplace'); n.inv[res]--; t.i++;
      const g = new THREE.BufferGeometry().setFromPoints([new V3(n.pos.x, n.pos.y + 1.4, n.pos.z), new V3(wx, c.cy * 2 + 1, wz)]);
      const ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x66ddff })); scene.add(ln); setTimeout(() => { scene.remove(ln); g.dispose(); }, 120);
    }
  }
}
function npcVisuals(n, dt) {
  n.mesh.position.copy(n.pos);
  let dr = n.face - n.mesh.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); n.mesh.rotation.y += dr * Math.min(1, dt * 10);
  n.swing = Math.max(0, n.swing - dt);
  const w = n.walking ? Math.sin(clock * 9) * 0.8 : 0;
  n.aL.rotation.x = w; n.aR.rotation.x = n.swing > 0 ? -1.6 + Math.sin(clock * 40) * 0.5 : n.working ? -1.1 + Math.sin(clock * 14) * 0.6 : -w;
  n.bubT -= dt; n.bub.style.display = n.bubT > 0 ? 'block' : 'none';
  if (n._st !== n.status) { n._st = n.status; n.st.textContent = n.status; }
  const v = new V3(n.pos.x, n.pos.y + 2.5, n.pos.z).project(cam);
  if (v.z > 1 || v.z < -1 || dist2(n.pos, cam.position) > 70) n.el.style.display = 'none';
  else { n.el.style.display = 'block'; n.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
}

// ---------- AI director (RelayAPI) ----------
let REL = { url: 'https://relayapi-c5ah.onrender.com', key: '' };
try { const s = JSON.parse(localStorage.getItem('mw_relay') || 'null'); if (s) REL = { ...REL, ...s }; } catch (e) {}
const SYS = `You control 3 NPC characters (archie=architect, mason=builder, ranger=guard) in a 3D voxel sandbox city game. Reply with ONE JSON object only. No markdown, no text outside the JSON.
WORLD: 1 block = 2m. N=-z, S=+z, E=+x, W=-x. Resources: wood (trees), stone (rocks), sand (sand piles). Blocks and cost (1 material per block): planks=wood, roof=wood, stone=stone, brick=stone, concrete=stone, glass=sand. NPCs must gather materials before building; the game automatically walks them to resource nodes, gathers, and goes back to building. Hostile thugs roam the roads; guards fight them. A human PLAYER chats with you. Listen to player_message, act on reasonable requests, and REFUSE (explain briefly, give no task) if it is unsafe, impossible, pointless, or against your personality. You may ask questions, negotiate, joke, report what you see. Keep "say" under 140 characters, in character. "thought" = your short reasoning (1-2 sentences): what you see, what materials you need vs have, why this design.
REPLY FORMAT: {"npcs":[{"id":"archie","thought":"...","say":"...","task":{...}}]}  Include only NPCs that speak or change task. Omit task to keep the current one.
TASKS: {"type":"idle"} {"type":"wander"} {"type":"follow"} {"type":"guard"} {"type":"gather","resource":"wood|stone|sand","amount":20} {"type":"build","name":"Cottage","where":"near_player|near_me","dx":0,"dz":0,"plan":[ops]} (dx,dz optional offset in meters from the reference point).
PLAN OPS (integer cells; x,z horizontal; y up; y=0 is the ground layer; stay within 24x16x24): {"op":"box","x":0,"y":0,"z":0,"w":6,"h":3,"d":6,"block":"brick","hollow":true} (hollow = walls only); {"op":"fill","x","y","z","w","h","d","block"}; {"op":"roof","x","y","z","w","d","block","style":"gable|flat"} (gable ridge runs along x); {"op":"hole","x","y","z","w","h","d"} deletes cells (doors, windows); {"op":"block","x","y","z","block"}; {"op":"floor","x","y","z","w","d","block"}. Later ops override earlier ones. The wall at z=0 is the FRONT; the game rotates the building so the front faces the player.
ARCHITECTURE RULES: design real buildings with walls, a door (hole 1 wide 1 high at ground level in the front wall), windows (glass fill at y=1), and a roof covering all walls (roof y = wall height). Sensible sizes (house about 6x3x6 cells). Nothing floating. Pick materials that match what you have and what resource nodes are near, and say why.
EXAMPLE house: [{"op":"box","x":0,"y":0,"z":0,"w":6,"h":3,"d":6,"block":"brick","hollow":true},{"op":"hole","x":2,"y":0,"z":0,"w":1,"h":1,"d":1},{"op":"fill","x":1,"y":1,"z":0,"w":1,"h":1,"d":1,"block":"glass"},{"op":"fill","x":4,"y":1,"z":0,"w":1,"h":1,"d":1,"block":"glass"},{"op":"roof","x":0,"y":3,"z":0,"w":6,"d":6,"block":"roof","style":"gable"}]`;
let aiBusy = false, aiFail = 0, lastAI = performance.now() - 20000, pendingMsg = null;
const setStat = t => { $('aistat').textContent = t; };
setStat(REL.key ? 'AI: ready' : 'AI: no key (⚙) · scripted mode');
function stateJSON(m) {
  const nn = n => { const o = {}; for (const r of ['wood', 'stone', 'sand']) { const nd = nearestNode(n.pos, r); if (nd) o[r] = { m: Math.round(dist2(nd.pos, n.pos)), dir: dirName(n.pos, nd.pos), left: nd.left }; } return o; };
  return JSON.stringify({
    time: Math.round(clock), player: { at: [Math.round(P.pos.x), Math.round(P.pos.z)], hp: Math.round(P.hp), mode, inCar: !!inCar },
    npcs: npcs.map(n => ({ id: n.id, role: n.role, personality: n.pers, at: [Math.round(n.pos.x), Math.round(n.pos.z)], hp: Math.round(n.hp), inv: n.inv, doing: n.status, task: n.task ? n.task.type : 'idle', last: n.last, playerIs: { m: Math.round(dist2(n.pos, P.pos)), dir: dirName(n.pos, P.pos) }, nearestNodes: nn(n), thugsWithin25m: enemies.filter(e => !e.dead && dist2(e.pos, n.pos) < 25).length })),
    structures: structures.map(s => ({ name: s.name, by: s.by, status: s.status, progress: s.done + '/' + s.total })),
    events: events.splice(0, 14), player_message: m || null,
  });
}
async function relay(user) {
  const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 150000);
  try {
    const r = await fetch(REL.url.replace(/\/$/, '') + '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + REL.key }, body: JSON.stringify({ model: 'relay', messages: [{ role: 'system', content: SYS }, { role: 'user', content: 'STATE: ' + user + '\nReply with JSON only.' }] }), signal: ctrl.signal });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
    return j.choices[0].message.content || '';
  } finally { clearTimeout(to); }
}
function parseAI(t) { const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null; try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; } }
function applyAI(j) {
  const arr = Array.isArray(j.npcs) ? j.npcs : j.npc ? [j.npc] : [];
  for (const o of arr) {
    const n = npcs.find(x => x.id === String(o.id || o.name || '').toLowerCase());
    if (!n) continue;
    if (o.thought) logLine('💭 ' + n.name + ': ' + String(o.thought).slice(0, 260), 'th');
    if (o.say) say(n, o.say);
    if (o.task) setTask(n, o.task);
  }
}
async function callAI(m) {
  aiBusy = true; lastAI = performance.now(); setStat('AI: thinking…');
  try {
    const j = parseAI(await relay(stateJSON(m)));
    if (!j) throw new Error('reply was not valid JSON');
    aiFail = 0; applyAI(j); setStat('AI: online');
  } catch (e) { aiFail++; setStat('AI: error (' + (e.name === 'AbortError' ? 'timeout' : e.message) + ')'); if (m) fallbackChat(m); }
  aiBusy = false;
}
setInterval(() => {
  if (!REL.key || aiBusy) return;
  const since = performance.now() - lastAI;
  if (pendingMsg && since > 2500) { const m = pendingMsg; pendingMsg = null; callAI(m); return; }
  if (aiFail >= 3 && since < 60000) return;
  if ((npcs.some(n => !n.task) && since > 25000) || since > 90000 || (events.length > 2 && since > 20000)) callAI(null);
}, 1000);
function autopilot() {
  if (REL.key && aiFail < 3) return;
  for (const n of npcs) {
    if (n.task || n.idleT < 5) continue;
    n.idleT = 0;
    if (n.role === 'guard') { setTask(n, { type: 'guard' }); continue; }
    const mine = structures.filter(s => s.by === n.name).length;
    if (mine < 2 && Math.random() < 0.7) setTask(n, { type: 'build', name: n.name + "'s hut", where: 'near_player', plan: HUT }); else setTask(n, { type: 'gather', resource: ['wood', 'stone'][Math.floor(Math.random() * 2)], amount: 15 });
  }
}
setInterval(autopilot, 2000);
function fallbackChat(m) {
  const n = npcs.find(x => x.id === m.to) || nearestNpc(P.pos), t = m.text.toLowerCase();
  const targets = m.to === 'everyone' ? npcs : [n]; let reply = '';
  const go = (task, r) => { targets.forEach(x => setTask(x, task)); reply = r; };
  if (/follow|come/.test(t)) go({ type: 'follow' }, 'Right behind you.');
  else if (/stop|stay|wait|idle/.test(t)) go({ type: 'idle' }, 'Okay, standing by.');
  else if (/guard|protect|fight/.test(t)) go({ type: 'guard' }, 'On guard!');
  else if (/build|house|hut/.test(t)) go({ type: 'build', name: 'Hut', where: 'near_player', plan: HUT }, "Building a hut. I'll gather the wood first.");
  else if (/wood|tree/.test(t)) go({ type: 'gather', resource: 'wood', amount: 20 }, 'Chopping wood.');
  else if (/stone|rock/.test(t)) go({ type: 'gather', resource: 'stone', amount: 20 }, 'Gathering stone.');
  else if (/sand|glass/.test(t)) go({ type: 'gather', resource: 'sand', amount: 20 }, 'Fetching sand.');
  else reply = REL.key ? 'My head is fuzzy, try again in a moment.' : 'Add your relay key in settings (⚙) so I can think properly. Until then I can follow, guard, gather or build a hut.';
  say(n, reply);
}
function playerSay(text) {
  text = text.trim(); if (!text) return;
  const mt = text.match(/^@?(archie|mason|ranger)\b[\s,:]*/i), to = mt ? mt[1].toLowerCase() : 'everyone';
  logLine('You: ' + text, 'me');
  const m = { to, text: mt ? text.slice(mt[0].length) || text : text };
  if (!REL.key || aiFail >= 3) fallbackChat(m); else pendingMsg = m;
}

// ---------- actions ----------
const ray = new THREE.Raycaster(); ray.far = 14;
const gun = new THREE.Raycaster(); gun.far = 70;
let cool = 0;
function aim() { cam.updateMatrixWorld(); ray.setFromCamera({ x: 0, y: 0 }, cam); return ray.intersectObjects(targets, false)[0]; }
function place() {
  const h = aim(); if (!h) return;
  const n = h.face.normal.clone().transformDirection(h.object.matrixWorld), p = h.point.clone().addScaledVector(n, 0.01);
  const cx = Math.floor(p.x / 2), cy = Math.floor(p.y / 2), cz = Math.floor(p.z / 2);
  if (cy < 0) return;
  if (hit(P, new THREE.Box3(new V3(cx * 2, cy * 2, cz * 2), new V3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2)))) return;
  addBlock(cx, cy, cz, sel); sfx('place');
}
function brk() { const h = aim(); if (h && h.object.userData.k) { delBlock(h.object.userData.k); sfx('brk'); } }
function tracer(to) {
  const g = new THREE.BufferGeometry().setFromPoints([cam.localToWorld(new V3(0.3, -0.25, -0.8)), to]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffee88 })); scene.add(l); setTimeout(() => { scene.remove(l); g.dispose(); }, 70);
}
function shoot() {
  if (cool > 0) return; cool = 0.25; sfx('shoot');
  cam.updateMatrixWorld(); gun.setFromCamera({ x: 0, y: 0 }, cam);
  const h = gun.intersectObjects([...targets, ...enemyMeshes], false)[0];
  tracer(h ? h.point : gun.ray.at(70, new V3()));
  if (h && h.object.userData.enemy) damageEnemy(h.object.userData.enemy, h.object.userData.head ? 60 : 25);
}
function punch() {
  if (cool > 0) return; cool = 0.4; sfx('punch');
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  for (const e of enemies) { if (e.dead) continue; const dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, d = Math.hypot(dx, dz); if (d < 2.8 && (dx * fx + dz * fz) / (d || 1) > 0.2) damageEnemy(e, 20); }
}
const act1 = () => { if (inCar) return; mode === 'fight' ? shoot() : place(); };
const act2 = () => { if (inCar) return; mode === 'fight' ? punch() : brk(); };
const toggleMode = () => { mode = mode === 'fight' ? 'build' : 'fight'; hud(); };

// ---------- chat / settings UI ----------
const typing = () => { const a = document.activeElement; return a && a.tagName === 'INPUT'; };
function openChat() { for (const k in keys) keys[k] = false; document.exitPointerLock && document.exitPointerLock(); $('chatbar').style.display = 'flex'; $('chatin').focus(); }
function closeChat() { $('chatbar').style.display = 'none'; $('chatin').blur(); }
function sendChat() { const v = $('chatin').value; $('chatin').value = ''; closeChat(); playerSay(v); }
$('chatin').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); else if (e.key === 'Escape') closeChat(); });
$('chatsend').addEventListener('click', sendChat);
$('gear').addEventListener('click', () => { $('relurl').value = REL.url; $('relkey').value = REL.key; $('panel').style.display = 'block'; document.exitPointerLock && document.exitPointerLock(); });
$('relclose').addEventListener('click', () => { $('panel').style.display = 'none'; });
$('relsave').addEventListener('click', () => {
  REL = { url: $('relurl').value.trim() || REL.url, key: $('relkey').value.trim() };
  try { localStorage.setItem('mw_relay', JSON.stringify(REL)); } catch (e) {}
  aiFail = 0; lastAI = performance.now() - 20000; $('panel').style.display = 'none'; setStat(REL.key ? 'AI: ready' : 'AI: no key (⚙) · scripted mode');
});

// ---------- input: desktop ----------
const cv = ren.domElement;
addEventListener('keydown', e => {
  if (typing()) return;
  keys[e.code] = true;
  if (e.code === 'Space') { if (!inCar) jump(); e.preventDefault(); }
  if (e.code === 'KeyQ') toggleMode();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyE') toggleCar();
  if (e.code === 'KeyT') { e.preventDefault(); openChat(); }
  if (e.code === 'KeyF' && !inCar) punch();
  if (e.code >= 'Digit1' && e.code <= 'Digit6') selBlock(+e.code.slice(5) - 1);
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('wheel', e => { if (!typing()) selBlock(sel + (e.deltaY > 0 ? 1 : -1)); });
addEventListener('contextmenu', e => e.preventDefault());
let held = false;
if (!isTouch) {
  cv.addEventListener('click', () => { if (document.pointerLockElement !== cv) cv.requestPointerLock(); });
  addEventListener('mousedown', e => { if (document.pointerLockElement !== cv) return; if (e.button === 0) { held = true; act1(); } else if (e.button === 2) act2(); });
  addEventListener('mouseup', e => { if (e.button === 0) held = false; });
  addEventListener('mousemove', e => { if (document.pointerLockElement !== cv || inCar) return; P.yaw -= e.movementX * 0.0025; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - e.movementY * 0.0025)); });
}

// ---------- input: touch ----------
const tch = {};
function btn(id, fn) { $(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false }); }
btn('jump', () => { if (!inCar) jump(); }); btn('place', act1); btn('brk', act2); btn('col', () => selBlock(sel + 1)); btn('mode', toggleMode); btn('car', toggleCar); btn('chatbtn', openChat);
const uiTarget = t => t.closest && t.closest('#chatbar,#panel,#gear,#mute,.b');
addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (uiTarget(t.target)) continue; tch[t.identifier] = { x: t.clientX, y: t.clientY, mode: t.clientX < innerWidth / 2 ? 'joy' : 'look' }; } }, { passive: false });
addEventListener('touchmove', e => {
  if (!uiTarget(e.target)) e.preventDefault();
  for (const t of e.changedTouches) {
    const s = tch[t.identifier]; if (!s) continue;
    if (s.mode === 'joy') { joy.x = Math.max(-1, Math.min(1, (t.clientX - s.x) / 50)); joy.y = Math.max(-1, Math.min(1, (t.clientY - s.y) / 50)); }
    else if (!inCar) { P.yaw -= (t.clientX - s.x) * 0.006; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - (t.clientY - s.y) * 0.006)); s.x = t.clientX; s.y = t.clientY; }
  }
}, { passive: false });
const tend = e => { for (const t of e.changedTouches) { const s = tch[t.identifier]; if (s && s.mode === 'joy') { joy.x = joy.y = 0; } delete tch[t.identifier]; } };
addEventListener('touchend', tend); addEventListener('touchcancel', tend);

// ---------- updates ----------
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
      if (j.version && j.version !== VER) { save(); const u = $('upd'); u.style.display = 'block'; u.textContent = 'New version v' + j.version + ', reloading...'; setTimeout(() => location.replace(location.pathname + '?v=' + j.version), 3000); }
    } catch (e) {}
  }, 30000);
}

// ---------- day / night ----------
let dayT = 0.3;
const cNight = new THREE.Color(0x070b1f), cDay = new THREE.Color(0x87ceeb), cDusk = new THREE.Color(0xff8a50), cTmp = new THREE.Color();
function updateSky(dt) {
  dayT = (dayT + dt / 300) % 1;
  const a = dayT * Math.PI * 2, sy = -Math.cos(a);
  const day = Math.min(1, Math.max(0, (sy + 0.15) / 0.4)), dusk = Math.max(0, 1 - Math.abs(sy) / 0.3) * 0.6;
  cTmp.copy(cNight).lerp(cDay, day).lerp(cDusk, dusk);
  scene.background.copy(cTmp); scene.fog.color.copy(cTmp);
  sun.position.set(Math.sin(a) * 100, sy * 100 + 5, 30); sun.intensity = 0.05 + 1.15 * day;
  hemi.intensity = 0.28 + 0.82 * day;
  for (const k in matCache) matCache[k].emissiveIntensity = (1 - day) * 1.1;
}
setInterval(() => { const h = Math.floor(dayT * 24), m = Math.floor((dayT * 24 - h) * 60); $('ver').textContent = 'v' + VER + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }, 1000);
updateSky(0);

// ---------- minimap ----------
const mini = $('mini'), mg = mini.getContext('2d'), MS = isTouch ? 110 : 150, MR = 70;
mini.width = mini.height = MS * 2; mini.style.width = mini.style.height = MS + 'px';
let miniT = 0;
function drawMini() {
  const S = MS * 2, c = S / 2, sc = c / MR, yaw = inCar ? inCar.h + Math.PI : P.yaw, cs = Math.cos(yaw), sn = Math.sin(yaw), px = P.pos.x, pz = P.pos.z, lim = MR + 25;
  mg.clearRect(0, 0, S, S); mg.save(); mg.beginPath(); mg.arc(c, c, c - 2, 0, 6.2832); mg.clip();
  mg.fillStyle = '#35592b'; mg.fillRect(0, 0, S, S);
  mg.translate(c, c); mg.rotate(yaw); mg.scale(sc, sc); mg.translate(-px, -pz);
  mg.fillStyle = '#3a3a3d'; for (let k = -8; k <= 7; k++) { mg.fillRect(k * 50 + 18, -400, 14, 800); mg.fillRect(-400, k * 50 + 18, 800, 14); }
  mg.fillStyle = '#8a8f98';
  for (const [k, b] of solids) { if (k[0] !== 'b') continue; if (Math.abs((b.min.x + b.max.x) / 2 - px) > lim || Math.abs((b.min.z + b.max.z) / 2 - pz) > lim) continue; mg.fillRect(b.min.x, b.min.z, b.max.x - b.min.x, b.max.z - b.min.z); }
  mg.fillStyle = '#d4a85f';
  for (const m of blockMeshes.values()) { const x = m.position.x, z = m.position.z; if (Math.abs(x - px) > lim || Math.abs(z - pz) > lim) continue; mg.fillRect(x - 1, z - 1, 2, 2); }
  mg.setTransform(1, 0, 0, 1, 0, 0);
  const toS = (x, z, clamp) => { const dx = x - px, dz = z - pz; let sx = (dx * cs - dz * sn) * sc, sy = (dx * sn + dz * cs) * sc; const d = Math.hypot(sx, sy), mx = c - 10; if (clamp && d > mx) { sx *= mx / d; sy *= mx / d; } return [c + sx, c + sy, d <= c - 4]; };
  const dot = (x, z, col, r, clamp) => { const [sx, sy, inside] = toS(x, z, clamp); if (!inside && !clamp) return; mg.fillStyle = col; mg.beginPath(); mg.arc(sx, sy, r, 0, 6.2832); mg.fill(); };
  for (const nd of nodes) if (nd.left > 0) dot(nd.pos.x, nd.pos.z, nd.type === 'wood' ? '#2ecc40' : nd.type === 'stone' ? '#e0e0e0' : '#f1c40f', 4, false);
  for (const e of enemies) if (!e.dead) dot(e.pos.x, e.pos.z, '#ff3b30', 5, false);
  for (const cr of cars) { const [sx, sy, inside] = toS(cr.pos.x, cr.pos.z); if (inside) { mg.fillStyle = '#fff'; mg.fillRect(sx - 4, sy - 4, 8, 8); } }
  for (const n of npcs) { const [sx, sy] = toS(n.pos.x, n.pos.z, true); mg.fillStyle = '#' + n.col.toString(16).padStart(6, '0'); mg.beginPath(); mg.arc(sx, sy, 8, 0, 6.2832); mg.fill(); mg.strokeStyle = '#fff'; mg.lineWidth = 2; mg.stroke(); mg.fillStyle = '#fff'; mg.font = 'bold 12px sans-serif'; mg.textAlign = 'center'; mg.fillText(n.name[0], sx, sy + 4); }
  mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(c, c - 12); mg.lineTo(c - 8, c + 9); mg.lineTo(c + 8, c + 9); mg.closePath(); mg.fill();
  mg.restore();
  mg.strokeStyle = '#fff'; mg.lineWidth = 3; mg.beginPath(); mg.arc(c, c, c - 2, 0, 6.2832); mg.stroke();
  const [nx, ny] = toS(px, pz - MR * 0.82); mg.fillStyle = '#ffd400'; mg.font = 'bold 16px sans-serif'; mg.textAlign = 'center'; mg.fillText('N', nx, ny + 5);
}

// ---------- loop ----------
hud();
for (let i = 0; i < 6; i++) spawnEnemy();
logLine('Press T (or CHAT) to talk to Archie, Mason and Ranger. ⚙ = set your relay key.', 'ev');
let last = performance.now(), spawnT = 0;
ren.setAnimationLoop(now => {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt; cool -= dt;
  updateSky(dt);
  miniT -= dt; if (miniT <= 0) { miniT = 0.066; drawMini(); }
  if (inCar) driveCar(dt); else playerStep(dt);
  if (held && mode === 'fight' && !inCar) shoot();
  for (let i = enemies.length - 1; i >= 0; i--) { if (enemies[i].dead) enemies.splice(i, 1); else enemyStep(enemies[i], dt); }
  spawnT -= dt; if (spawnT <= 0 && enemies.length < 10) { spawnEnemy(); spawnT = 3; }
  for (const n of npcs) npcStep(n, dt);
  cam.updateMatrixWorld();
  for (const n of npcs) npcVisuals(n, dt);
  for (let i = grow.length - 1; i >= 0; i--) { const g = grow[i]; g.t += dt * 4; const s = Math.min(1, 0.2 + g.t); g.m.scale.setScalar(s); if (s >= 1) grow.splice(i, 1); }
  for (const nd of nodes) { if (nd.left < nd.max) { nd.regen += dt; if (nd.regen > 6) { nd.regen = 0; nd.left++; nd.mesh.visible = true; nd.mesh.scale.setScalar(0.45 + 0.55 * nd.left / nd.max); } } }
  flashV = Math.max(0, flashV - dt * 1.5); $('flash').style.opacity = flashV;
  ren.render(scene, cam);
});
