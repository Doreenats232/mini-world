import * as THREE from 'three';
import Peer from 'peerjs';

const VER = __V__;
const REPO = 'Doreenats232/mini-world';
const isTouch = matchMedia('(pointer:coarse)').matches;
const native = navigator.userAgent.includes('Electron');
if (isTouch) document.body.classList.add('touch');
const $ = id => document.getElementById(id);
$('ver').textContent = 'v' + VER;
if (isTouch) $('help').style.display = 'none';
const V3 = THREE.Vector3;
const net = { on: false, host: false, client: false, peer: null, conns: [], hostConn: null, myId: null, code: '', remotes: new Map(), applying: false, noSave: false, names: [], name: 'Player' + Math.floor(Math.random() * 900 + 100) };
try { const n = localStorage.getItem('mw_name'); if (n) net.name = n; } catch (e) {}

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
const furn = new Map(), doors = [];
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
    case 'siren': tone(600, 900, 0.35, 'sine', 0.2 * v); setTimeout(() => tone(900, 600, 0.35, 'sine', 0.2 * v), 350); break;
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
  if (blockMeshes.has(k) || furn.has(k)) return false;
  const m = new THREE.Mesh(boxGeo, bmats[t]);
  m.position.set(cx * 2 + 1, cy * 2 + 1, cz * 2 + 1); m.userData = { k, cx, cy, cz, c: t }; m.updateMatrixWorld();
  solids.set(k, new THREE.Box3().setFromObject(m));
  scene.add(m); targets.push(m); blockMeshes.set(k, m);
  if (anim) { m.scale.setScalar(0.2); grow.push({ m, t: 0 }); }
  if (net.on && !net.applying) netSend({ t: 'b+', a: [cx, cy, cz, t] });
  if (doSave) queueSave();
  return true;
}
function delBlock(k) { const m = blockMeshes.get(k); if (!m) return; scene.remove(m); targets.splice(targets.indexOf(m), 1); blockMeshes.delete(k); solids.delete(k); if (net.on && !net.applying) netSend({ t: 'b-', k }); queueSave(); }
function queueSave() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
function save() { if (net.noSave) return; try { localStorage.setItem('mw_save', JSON.stringify({ b: [...blockMeshes.values()].map(m => [m.userData.cx, m.userData.cy, m.userData.cz, m.userData.c]), p: [P.pos.x, P.pos.y, P.pos.z, P.yaw], k: kills, m: money, u: up, sg: hasShotgun, f: [...furn.values()].map(o => [o.cx, o.cy, o.cz, o.f, o.rot]) })); } catch (e) {} }
setInterval(() => save(), 10000); addEventListener('beforeunload', save);

// ---------- player ----------
const P = mkEnt(25, 1, 25, 0.35, 1.7); P.yaw = 0; P.pitch = 0; P.hp = 100;
let kills = 0, mode = 'build', inCar = null, lastHurt = -99, flashV = 0, clock = 0;
let wanted = 0, lastCrime = -99, calmT = 0, copT = 0, copLeaveT = 5; const crimeCD = {};
let money = 0, up = { dmg: 0, hp: 0, spd: 0 }, hasShotgun = false, weapon = 'pistol', shopOpen = false;
const maxHp = () => 100 + 25 * up.hp;
let pendingFurn = null;
try {
  const s = JSON.parse(localStorage.getItem('mw_save') || 'null');
  if (s) { s.b.forEach(b => addBlock(b[0], b[1], b[2], b[3], false)); P.pos.set(s.p[0], s.p[1], s.p[2]); P.yaw = s.p[3]; kills = s.k || 0; money = s.m || 0; if (s.u) up = { dmg: s.u.dmg || 0, hp: s.u.hp || 0, spd: s.u.spd || 0 }; hasShotgun = !!s.sg; pendingFurn = s.f || []; }
} catch (e) {}
const keys = {}; const joy = { x: 0, y: 0 };
function hud() {
  $('hp').firstElementChild.style.width = Math.max(0, P.hp / maxHp() * 100) + '%';
  $('info').textContent = '$' + money + '  ·  Kills ' + kills + '  ·  ' + (mode === 'fight' ? 'FIGHT: ' + weapon : 'BUILD: ' + BLOCKS[sel][0]) + ' (Q)';
  $('col').textContent = mode === 'fight' ? 'GUN' : 'BLOCK';
  $('place').textContent = mode === 'fight' ? 'SHOOT' : 'PLACE';
  $('brk').textContent = mode === 'fight' ? 'PUNCH' : 'BREAK';
}
selBlock(0);
let msgT = 0;
function msg(t, ms = 1800) { const m = $('msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(msgT); msgT = setTimeout(() => m.style.display = 'none', ms); }
function hurt(n, force) {
  if ((inCar && !force) || shopOpen) return;
  P.hp -= n; lastHurt = clock; flashV = 0.45; sfx('hurt');
  if (P.hp <= 0) { wanted = 0; clearCops(); hudStars(); P.hp = maxHp(); P.pos.set(25, 1, 25); P.vel.set(0, 0, 0); msg('YOU DIED'); sfx('die'); flashV = 0.8; }
  hud();
}
function jump() { if (P.ground) { P.vel.y = 11; P.ground = false; } }
function playerStep(dt) {
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
  const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
  let mx = -sin * f + cos * s, mz = -cos * f - sin * s;
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  const sp = (keys.ShiftLeft ? 12 : 7) * (1 + 0.15 * up.spd);
  phys(P, mx * sp, mz * sp, dt);
  if (P.ground && (mx || mz)) { stepT -= dt; if (stepT <= 0) { sfx('step'); stepT = keys.ShiftLeft ? 0.28 : 0.42; } }
  if (P.pos.y < -50) P.pos.set(25, 3, 25);
  cam.position.set(P.pos.x, P.pos.y + 1.55, P.pos.z); cam.rotation.set(P.pitch, P.yaw, 0);
  if (P.hp < maxHp() && clock - lastHurt > 5) { P.hp = Math.min(maxHp(), P.hp + 3 * dt); hud(); }
}

// ---------- cars ----------
const cars = [];
function mkCar(x, z, h, col, owned = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 4.2), new THREE.MeshLambertMaterial({ color: col })); body.position.y = 0.7; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2), new THREE.MeshLambertMaterial({ color: 0x223344 })); cab.position.set(0, 1.4, -0.2); g.add(cab);
  const wm = new THREE.MeshLambertMaterial({ color: 0x111111 }), wg = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
  for (const [wx, wz] of [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]]) { const w = new THREE.Mesh(wg, wm); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.4, wz); g.add(w); }
  g.position.set(x, 0, z); g.rotation.y = h; scene.add(g);
  const car = { mesh: g, pos: new V3(x, 0, z), h, speed: 0, owned }; cars.push(car); return car;
}
mkCar(25, 45, 0, 0xd62828); mkCar(45, 25, Math.PI / 2, 0x2a9d8f); mkCar(-25, -5, 0, 0xf4a261); mkCar(75, -25, Math.PI / 2, 0x6a4c93);
function toggleCar() {
  if (!inCar && shopNear()) { openShop(); return; }
  if (inCar) { const c = inCar; inCar = null; c.speed = 0; stopEngine(); P.pos.set(c.pos.x + Math.cos(c.h) * 3, 0, c.pos.z - Math.sin(c.h) * 3); P.vel.set(0, 0, 0); P.yaw = c.h + Math.PI; P.pitch = 0; return; }
  let best = null, bd = 5;
  for (const c of cars) { const d = dist2(c.pos, P.pos); if (d < bd) { bd = d; best = c; } }
  if (best) { inCar = best; startEngine(); if (!best.owned && !best.stolen) { best.stolen = true; crime(1, 'car theft'); } msg('W/S drive, A/D steer, Space brake, E exit', 2500); } else msg('No car nearby', 900);
}
function driveCar(dt) {
  const c = inCar, thr = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0) - joy.x;
  if (Math.abs(thr) > 0.1) c.speed += thr * 18 * dt; else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 8 * dt);
  if (keys.Space) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 25 * dt);
  c.speed = Math.max(-8, Math.min(26, c.speed)); engine(Math.abs(c.speed));
  c.h += steer * 1.8 * dt * Math.max(-1, Math.min(1, c.speed / 5));
  const t = { pos: new V3(c.pos.x + Math.sin(c.h) * c.speed * dt, 0, c.pos.z + Math.cos(c.h) * c.speed * dt), R: 1.3, H: 1.2 };
  let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
  if (bad) { if (Math.abs(c.speed) > 12) crime(1, 'reckless driving', 'crash', 1); if (Math.abs(c.speed) > 4) sfx('crash'); c.speed *= -0.3; } else c.pos.copy(t.pos);
  c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h;
  if (Math.abs(c.speed) > 6) for (const e of [...enemies, ...cops]) if (!e.dead && dist2(e.pos, c.pos) < 2.3) damageEnemy(e, 100);
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
  e.hp -= n; e.hurt = 0.12; if (e.cop && !quiet) crime(1, 'attacked a cop', 'copHit'); sfxAt(e.pos, 'hit');
  if (e.hp <= 0) { sfxAt(e.pos, 'edie'); e.dead = true; scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); if (e.cop) { if (!quiet) crime(1, 'killed a cop', 'copKill'); } else if (!quiet) { kills++; money += 25; hud(); } }
}
function enemyStep(e, dt) {
  let T = inCar ? inCar.pos : P.pos, npc = null;
  const dp = dist2(T, e.pos);
  if (dp > 14 && !net.client) { let bd = 10; for (const n of npcs) { const d = dist2(n.pos, e.pos); if (d < bd) { bd = d; npc = n; } } if (npc) T = npc.pos; }
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
  npcs.push({ ...mkEnt(d.x, 0, d.z, 0.4, 1.9), ...d, mesh: g, aL, aR, el, bub, st, hp: 80, inv: { wood: 0, stone: 0, sand: 0 }, task: null, sub: null, queue: [], status: 'standing by', last: 'just arrived', stuck: 0, work: 0, cd: 0, bubT: 0, idleT: 0, swing: 0, face: 0, home: { x: d.x, z: d.z }, walking: false, working: false });
}
NPCDEF.forEach(mkNpc);
const nearestNpc = pos => { let b = null, bd = 1e9; for (const n of npcs) { const d = dist2(n.pos, pos); if (d < bd) { bd = d; b = n; } } return b; };
const COSTRES = i => BLOCKS[i][1];
function logLine(txt, cls) { if (net.on && net.host && cls !== 'me') nsend({ t: 'log', txt, cls }); const d = document.createElement('div'); d.textContent = txt; if (cls) d.className = cls; const L = $('log'); L.appendChild(d); while (L.children.length > 8) L.firstChild.remove(); setTimeout(() => d.remove(), 40000); }
let events = [];
const ev = t => { events.push(t); logLine('· ' + t, 'ev'); };
function say(n, t) { t = String(t || '').slice(0, 220); if (!t) return; if (net.on && net.host) nsend({ t: 'say', id: n.id, text: t }); n.bub.textContent = t; n.bubT = 6 + t.length / 18; logLine(n.name + ': ' + t); }
function npcHurt(n, d) { n.hp -= d; if (n.hp <= 0) { dropTask(n); n.hp = 80; n.pos.set(n.home.x, 0, n.home.z); n.task = null; n.sub = null; n.last = 'was knocked out and woke up at home'; ev(n.name + ' was knocked out by thugs and woke up at home'); } }

// ---- plan expansion (architecture DSL) ----
function expandPlan(plan) {
  const m = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
  for (const o of (Array.isArray(plan) ? plan.slice(0, 20) : [])) {
    if (!o || typeof o !== 'object') continue;
    const C = (k, mx) => Math.max(0, Math.min(mx, Math.round(+o[k] || 0))), S = (k, mx) => Math.max(1, Math.min(mx, Math.round(+o[k] || 1)));
    const x0 = C('x', 24), y0 = C('y', 16), z0 = C('z', 24), w = S('w', 24), h = S('h', 16), d = S('d', 24), b = o.block in BIDX ? BIDX[o.block] : 0;
    switch (o.op) {
      case 'block': m.set(key(x0, y0, z0), b); break;
      case 'furniture': if (o.type in FURN) m.set(key(x0, y0, z0), { f: o.type, rot: C('rot', 3) }); break;
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
  const cells = [...m].map(([k, t]) => { const [x, y, z] = k.split(',').map(Number); return typeof t === 'object' ? { x, y, z, f: t.f, rot: t.rot } : { x, y, z, t }; }).slice(0, 700);
  return cells;
}
function rotCells(cells, r) {
  let W = 0, D = 0; for (const c of cells) { W = Math.max(W, c.x + 1); D = Math.max(D, c.z + 1); }
  const out = cells.map(c => {
    const q = { ...c };
    if (r === 1) { q.x = D - 1 - c.z; q.z = c.x; } else if (r === 2) { q.x = W - 1 - c.x; q.z = D - 1 - c.z; } else if (r === 3) { q.x = c.z; q.z = W - 1 - c.x; }
    if (q.f) q.rot = (c.rot + r) % 4; return q;
  });
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
const HUT = [{ op: 'box', x: 0, y: 0, z: 0, w: 5, h: 2, d: 5, block: 'planks', hollow: true }, { op: 'furniture', type: 'door', x: 2, y: 0, z: 0, rot: 0 }, { op: 'fill', x: 1, y: 1, z: 0, w: 1, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: 3, y: 1, z: 0, w: 1, h: 1, d: 1, block: 'glass' }, { op: 'roof', x: 0, y: 2, z: 0, w: 5, d: 5, block: 'roof', style: 'gable' }, { op: 'furniture', type: 'bed', x: 3, y: 0, z: 3, rot: 0 }, { op: 'furniture', type: 'lamp', x: 1, y: 0, z: 3, rot: 0 }, { op: 'furniture', type: 'table', x: 1, y: 0, z: 1, rot: 0 }];

function cellFree(cx, cy, cz) {
  const b = new THREE.Box3(new V3(cx * 2, cy * 2, cz * 2), new V3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2));
  if (hit(P, b)) return false;
  for (const n of npcs) if (hit(n, b)) return false;
  for (const e of enemies) if (!e.dead && hit(e, b)) return false;
  return true;
}
const has = c => { const k = c.cx + ',' + c.cy + ',' + c.cz; return blockMeshes.has(k) || furn.has(k); };
const costOf = c => c.f ? FURN[c.f] : { res: BLOCKS[c.t][1], n: 1 };
const isGuard = n => n.role === 'guard' || (n.task && (n.task.type === 'guard' || n.task.type === 'protect'));
function dropTask(n) { if (n.task && n.task.cur && n.task.st) { n.task.st.retry.push(n.task.cur); n.task.cur = null; } }
function remainingNeed(t) { const need = { wood: 0, stone: 0, sand: 0 }, st = t.st, add = c => { const k = costOf(c); need[k.res] += k.n; }; if (t.cur) add(t.cur); for (let i = st.next; i < st.cells.length; i++) add(st.cells[i]); st.retry.forEach(add); return need; }

function setTask(n, t) {
  if (!t || typeof t !== 'object') return;
  const type = String(t.type || '').toLowerCase();
  dropTask(n); n.sub = null; n.gnode = null; n.work = 0;
  if (type === 'idle' || type === 'stop') { n.task = null; n.status = 'standing by'; return; }
  if (type === 'wander') { n.task = { type: 'wander', wt: 0, tx: n.pos.x, tz: n.pos.z }; return; }
  if (type === 'follow' || type === 'guard') { n.task = { type }; return; }
  if (type === 'protect') { n.task = { type: 'protect', who: String(t.who || '').toLowerCase() }; return; }
  if (type === 'town') { startTown(String(t.name || 'Oakvale').slice(0, 24), Array.isArray(t.buildings) ? t.buildings.map(x => String(x).toLowerCase()) : null, String(t.size || 'small')); return; }
  if (type === 'assist') {
    const who = npcs.find(o => o !== n && o.id === String(t.with || '').toLowerCase() && o.task && o.task.st && o.task.st.status === 'building');
    const st = who ? who.task.st : structures.find(x => x.status === 'building');
    if (!st) { ev(n.name + ' has nothing to help with'); return; }
    n.task = { type: 'assist', st, cur: null, stuckSkip: 0 }; ev(`${n.name} joined the build of ${st.name}`); return;
  }
  if (type === 'gather') {
    const res = String(t.resource || t.res || 'wood').toLowerCase(); if (!(res in n.inv)) { ev(n.name + ': unknown resource ' + res); return; }
    n.task = { type: 'gather', res, amount: Math.max(1, Math.min(60, Math.round(+t.amount || 20))) }; return;
  }
  if (type === 'build') {
    const cells0 = expandPlan(t.plan);
    if (cells0.length < 4) { ev(n.name + "'s plan was empty or too small, ignoring"); n.task = null; return; }
    let mnx = 1e9, mny = 1e9, mnz = 1e9; for (const c of cells0) { mnx = Math.min(mnx, c.x); mny = Math.min(mny, c.y); mnz = Math.min(mnz, c.z); }
    const norm = cells0.map(c => ({ ...c, x: c.x - mnx, y: c.y - mny, z: c.z - mnz }));
    let W = 0, D = 0; for (const c of norm) { W = Math.max(W, c.x + 1); D = Math.max(D, c.z + 1); }
    const S = Math.max(W, D), toMe = String(t.where || '').includes('me'), abs = t.ax != null && t.az != null && Number.isFinite(+t.ax) && Number.isFinite(+t.az);
    const ref = abs ? { x: +t.ax, z: +t.az } : toMe ? n.pos : P.pos, rx = ref.x + (abs ? 0 : (+t.dx || 0)), rz = ref.z + (abs ? 0 : (+t.dz || 0));
    const ex = t.exact, site = ex && siteFree(ex.x0, ex.z0, S) ? ex : findSite(S, rx, rz);
    if (!site) { ev(n.name + ' could not find free space for ' + (t.name || 'the building')); n.task = null; if (towns.includes(t._town)) townDone(t._town); return; }
    const cxm = (site.x0 + S / 2) * 2, czm = (site.z0 + S / 2) * 2;
    let r = 0; if (t.face_player !== false) { const fp = t.fx != null && Number.isFinite(+t.fx) && Number.isFinite(+t.fz) ? { x: +t.fx, z: +t.fz } : P.pos, vx = fp.x - cxm, vz = fp.z - czm; let bd = -9; FACE.forEach((f, i) => { const dd = f[0] * vx + f[1] * vz; if (dd > bd) { bd = dd; r = i; } }); }
    const rot = rotCells(norm, r), ox = site.x0 + Math.floor((S - rot.W) / 2), oz = site.z0 + Math.floor((S - rot.D) / 2);
    const cells = rot.cells.map(c => ({ cx: ox + c.x, cy: c.y, cz: oz + c.z, t: c.t, f: c.f, rot: c.rot })).sort((a, b) => (a.f ? 1 : 0) - (b.f ? 1 : 0) || a.cy - b.cy || a.cz - b.cz || a.cx - b.cx);
    reserved.push(new THREE.Box3(new V3(site.x0 * 2 - 2, 0, site.z0 * 2 - 2), new V3((site.x0 + S) * 2 + 2, 60, (site.z0 + S) * 2 + 2)));
    const st = { name: String(t.name || 'Building').slice(0, 30), by: n.name, status: 'building', done: 0, total: cells.length, cells, next: 0, retry: [], town: towns.includes(t._town) ? t._town : null };
    structures.push(st);
    n.task = { type: 'build', st, cur: null, stuckSkip: 0 };
    const need = remainingNeed(n.task);
    ev(`${n.name} planned "${st.name}": ${cells.length} blocks (wood ${need.wood}, stone ${need.stone}, sand ${need.sand})`);
    return;
  }
  ev(n.name + ': unknown task type ' + type);
}

// ---- town founding ----
const towns = [], KINDS = ['house', 'cottage', 'shop', 'inn', 'tower'];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function townDone(tw) { tw.done++; ev(`${tw.name}: ${tw.done}/${tw.total} buildings finished`); if (tw.done >= tw.total) { msg('TOWN COMPLETE: ' + tw.name, 3500); ev(`The town of ${tw.name} is complete!`); } }
function genPlan(kind) {
  const wall = ['planks', 'brick', 'stone', 'concrete'][rint(0, 3)], roofB = Math.random() < 0.75 ? 'roof' : 'stone', ops = [];
  const F = (type, x, z, rot = 0) => ops.push({ op: 'furniture', type, x, y: 0, z, rot });
  const G = (x, y, z) => ops.push({ op: 'fill', x, y, z, w: 1, h: 1, d: 1, block: 'glass' });
  if (kind === 'plaza') {
    ops.push({ op: 'box', x: 1, y: 0, z: 1, w: 3, h: 1, d: 3, block: 'stone', hollow: true }, { op: 'fill', x: 2, y: 0, z: 2, w: 1, h: 1, d: 1, block: 'glass' });
    F('lamp', 0, 0); F('lamp', 4, 0); F('lamp', 0, 4); F('lamp', 4, 4); F('plant', 2, 0); F('plant', 2, 4); F('plant', 0, 2); F('plant', 4, 2); return ops;
  }
  if (kind === 'house' || kind === 'cottage') {
    const c = kind === 'cottage', w = c ? 5 : rint(5, 7), d = c ? 5 : rint(5, 7), h = c ? 2 : rint(2, 3), dx = Math.floor(w / 2);
    ops.push({ op: 'box', x: 0, y: 0, z: 0, w, h, d, block: wall, hollow: true }); G(1, 1, 0); G(w - 2, 1, 0); G(0, 1, Math.floor(d / 2)); G(w - 1, 1, Math.floor(d / 2));
    F('door', dx, 0); ops.push({ op: 'roof', x: 0, y: h, z: 0, w, d, block: roofB, style: 'gable' });
    F('bed', w - 2, d - 2); F('shelf', w - 2, d - 3); F('lamp', w - 2, 1); F('table', 1, d - 2); F('chair', 1, d - 3, 1); F('rug', dx, Math.floor(d / 2)); F('plant', 1, 1); return ops;
  }
  if (kind === 'shop') {
    const w = rint(7, 9), d = rint(5, 6), h = 3, dx = Math.floor(w / 2);
    ops.push({ op: 'box', x: 0, y: 0, z: 0, w, h, d, block: wall === 'planks' ? 'brick' : wall, hollow: true }, { op: 'fill', x: 1, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: w - 3, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' });
    F('door', dx, 0); ops.push({ op: 'roof', x: 0, y: h, z: 0, w, d, block: 'stone', style: 'flat' });
    F('table', dx, 2); for (let x = 1; x <= w - 2; x += 2) F('shelf', x, d - 2); F('lamp', 1, 1); F('lamp', w - 2, 1); F('plant', w - 2, 2); F('rug', dx, 1); return ops;
  }
  if (kind === 'inn') {
    const w = 9, d = 7, h = 3, dx = 4;
    ops.push({ op: 'box', x: 0, y: 0, z: 0, w, h, d, block: wall === 'stone' ? 'brick' : wall, hollow: true }, { op: 'fill', x: 1, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: w - 3, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' });
    F('door', dx, 0); ops.push({ op: 'roof', x: 0, y: h, z: 0, w, d, block: roofB, style: 'gable' });
    for (const x of [1, 3, 5, 7]) F('bed', x, d - 2); F('table', 2, 2); F('chair', 1, 2, 1); F('chair', 3, 2, 3); F('table', 6, 2); F('chair', 5, 2, 1); F('chair', 7, 2, 3); F('shelf', w - 2, 3); F('lamp', 4, 1); F('plant', 1, 1); return ops;
  }
  // tower
  ops.push({ op: 'box', x: 0, y: 0, z: 0, w: 4, h: 6, d: 4, block: 'stone', hollow: true }); G(2, 2, 0); G(2, 4, 0); G(0, 2, 2); G(0, 4, 2); G(3, 2, 1); G(3, 4, 1);
  F('door', 1, 0); ops.push({ op: 'roof', x: 0, y: 6, z: 0, w: 4, d: 4, block: 'stone', style: 'flat' });
  for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3], [0, 2], [3, 1]]) ops.push({ op: 'block', x, y: 7, z, block: 'stone' });
  F('bed', 2, 2); F('lamp', 1, 2); F('table', 1, 1); F('chair', 2, 1, 1); return ops;
}
function startTown(name, kinds, size) {
  const builders = npcs.filter(x => x.role !== 'guard');
  if (!builders.length) return;
  const DEF = { small: ['house', 'house', 'cottage', 'shop'], medium: ['house', 'house', 'house', 'cottage', 'shop', 'inn', 'tower'], large: ['house', 'house', 'house', 'house', 'house', 'cottage', 'cottage', 'shop', 'shop', 'inn', 'tower', 'tower'] };
  kinds = (kinds || []).filter(k => KINDS.includes(k)).slice(0, 14); if (kinds.length < 2) kinds = DEF[size] || DEF.small;
  const site = findSite(12, P.pos.x, P.pos.z);
  if (!site) { ev('No open land big enough for a town near you. Try moving to a clearer area.'); return; }
  const cx = (site.x0 + 6) * 2, cz = (site.z0 + 6) * 2, town = { name, cx, cz, total: kinds.length + 1, done: 0 }; towns.push(town);
  const jobs = [{ name: name + ' Plaza', kind: 'plaza', ax: cx, az: cz, exact: { x0: site.x0 + 4, z0: site.z0 + 4 } }];
  const cnt = {};
  kinds.forEach((k, i) => { const ang = i / kinds.length * 6.283 + 0.4, r = 26 + (i % 2) * 10; cnt[k] = (cnt[k] || 0) + 1; jobs.push({ name: `${name} ${k[0].toUpperCase() + k.slice(1)} ${cnt[k]}`, kind: k, ax: cx + Math.cos(ang) * r, az: cz + Math.sin(ang) * r }); });
  jobs.forEach((j, i) => builders[i % builders.length].queue.push({ type: 'build', name: j.name, ax: j.ax, az: j.az, exact: j.exact, fx: cx, fz: cz, plan: genPlan(j.kind), _town: town }));
  for (const w of builders) if (!w.task && w.queue.length) setTask(w, w.queue.shift());
  const rg = npcs.find(x => x.role === 'guard'); if (rg) setTask(rg, { type: 'protect', who: builders[0].id });
  ev(`Founding the town of ${name}: plaza + ${kinds.length} buildings`); msg('FOUNDING: ' + name, 2500); logLine('🏘 ' + name + ' is being planned around a plaza near ' + Math.round(cx) + ', ' + Math.round(cz), 'ev');
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
function finish(n, text) { n.last = text; ev(n.name + ' ' + text); n.task = null; n.sub = null; n.gnode = null; n.working = false; n.idleT = 0; n.status = 'standing by'; if (n.queue.length) setTask(n, n.queue.shift()); }
function npcStep(n, dt) {
  n.walking = false; n.working = false; n.cd -= dt;
  const foe = nearestEnemy(n.pos, isGuard(n) ? 16 : 3.2);
  if (foe) {
    const d = dist2(foe.pos, n.pos);
    if (d > 2.2) { if (isGuard(n)) { walkTo(n, foe.pos.x, foe.pos.z, dt, 1.8, 5.8); n.status = 'fighting thugs'; return; } }
    else { n.face = Math.atan2(foe.pos.x - n.pos.x, foe.pos.z - n.pos.z); if (n.cd <= 0) { n.cd = 0.6; n.swing = 0.25; sfxAt(n.pos, 'punch'); damageEnemy(foe, n.role === 'guard' ? 25 : 12, true); } n.status = 'fighting'; phys(n, 0, 0, dt); return; }
  }
  const t = n.task;
  if (!t) { if (n.queue.length) { setTask(n, n.queue.shift()); return; } phys(n, 0, 0, dt); n.idleT += dt; const dp = dist2(P.pos, n.pos); if (dp < 12) n.face = Math.atan2(P.pos.x - n.pos.x, P.pos.z - n.pos.z); return; }
  if (t.type === 'wander') { t.wt -= dt; if (t.wt <= 0) { const a = Math.random() * 6.28; t.tx = n.pos.x + Math.cos(a) * 14; t.tz = n.pos.z + Math.sin(a) * 14; t.wt = 5; } walkTo(n, t.tx, t.tz, dt, 1, 2.5); n.status = 'wandering'; return; }
  if (t.type === 'follow' || t.type === 'guard') { walkTo(n, P.pos.x, P.pos.z, dt, t.type === 'guard' ? 6 : 3.5, 6); n.status = t.type === 'guard' ? 'guarding you' : 'following you'; return; }
  if (t.type === 'protect') { const o = npcs.find(x => x.id === t.who && x !== n), tp = o ? o.pos : P.pos; walkTo(n, tp.x, tp.z, dt, 6, 6); n.status = 'protecting ' + (o ? o.name : 'you'); return; }
  if (t.type === 'gather') { const r = doGather(n, t.res, t.amount, dt); if (r === 'done') finish(n, `finished gathering ${t.amount} ${t.res}`); else if (r === 'none') finish(n, `found no ${t.res} left in the world`); return; }
  if (t.type === 'build' || t.type === 'assist') {
    const st = t.st;
    if (n.sub) {
      const r = doGather(n, n.sub.res, n.sub.amount, dt);
      if (r === 'done') n.sub = null; else if (r === 'none') { const rs = n.sub.res; dropTask(n); if (t.type === 'build') st.status = 'stalled'; finish(n, `ran out of ${rs} nodes while building ${st.name}`); }
      return;
    }
    if (!t.cur) {
      if (st.retry.length) t.cur = st.retry.shift();
      else { while (st.next < st.cells.length && has(st.cells[st.next])) { st.next++; st.done++; } if (st.next < st.cells.length) t.cur = st.cells[st.next++]; }
    }
    if (!t.cur) {
      if (st.status !== 'complete' && !npcs.some(o => o !== n && o.task && o.task.st === st && o.task.cur)) { st.status = 'complete'; if (st.town) townDone(st.town); }
      finish(n, (t.type === 'assist' ? 'helped finish ' : 'finished building ') + st.name); return;
    }
    const c = t.cur, kc = costOf(c), res = kc.res;
    if (n.inv[res] < kc.n) {
      const need = Math.ceil(remainingNeed(t)[res] / Math.max(1, npcs.filter(o => o.task && o.task.st === st).length)), amount = Math.min(60, n.inv[res] + Math.max(5, need));
      n.sub = { res, amount }; n.gnode = null; ev(`${n.name} needs ${need} more ${res} for ${st.name}, going to gather`); return;
    }
    const wx = c.cx * 2 + 1, wz = c.cz * 2 + 1;
    n.status = `${t.type === 'assist' ? 'helping build' : 'building'} ${st.name} ${st.done}/${st.total}`;
    if (dist2(n.pos, { x: wx, z: wz }) > (c.f ? 9 : 6.5) || Math.abs(n.pos.y - c.cy * 2) > 9) { walkTo(n, wx, wz, dt, c.f ? 7 : 5); return; }
    phys(n, 0, 0, dt); n.working = true; n.face = Math.atan2(wx - n.pos.x, wz - n.pos.z); n.work += dt;
    if (n.work >= 0.35) {
      if (!cellFree(c.cx, c.cy, c.cz)) { t.stuckSkip += 0.35; if (t.stuckSkip > 4) { t.stuckSkip = 0; st.done++; t.cur = null; } n.work = 0.3; return; }
      n.work = 0; t.stuckSkip = 0; if (c.f) addFurniture(c.cx, c.cy, c.cz, c.f, c.rot, true); else addBlock(c.cx, c.cy, c.cz, c.t, true, true); sfxAt(n.pos, 'npcplace'); n.inv[res] -= kc.n; st.done++; t.cur = null;
      beam(new V3(n.pos.x, n.pos.y + 1.4, n.pos.z), new V3(wx, c.cy * 2 + 1, wz), 0x66ddff, 120);
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
TASKS: {"type":"idle"} {"type":"wander"} {"type":"follow"} {"type":"guard"} {"type":"gather","resource":"wood|stone|sand","amount":20} {"type":"build","name":"Cottage","where":"near_player|near_me","dx":0,"dz":0,"plan":[ops]} (dx,dz optional offset in meters from the reference point). {"type":"assist","with":"archie"} joins another NPC's build and splits the blocks with them. {"type":"protect","who":"archie"} guards a teammate and fights thugs near them. Any NPC entry may include "then":[task,...] (max 4) to queue follow-up tasks. {"type":"town","name":"Oakvale","buildings":["house","house","cottage","shop","inn","tower"],"size":"small|medium|large"} founds a WHOLE TOWN: the game finds open land, builds a plaza with a well and lamps, designs each listed building (kinds: house, cottage, shop, inn, tower) in a ring facing the plaza, and shares them out among the builders automatically. Use it when the player asks for a town, village or settlement; afterwards do not change the builders' tasks, just comment on progress, keep the guard protecting, and react to the towns progress in the state.
TEAMWORK: act as a crew, not as individuals. The architect designs and starts a build; builders ASSIST (blocks and material gathering are shared, so it goes faster); the guard PROTECTS the builders. React to teammates' events. If the player asks for something big (a village, a base), split it into several buildings across NPCs and queue follow-ups.
PLAN OPS (integer cells; x,z horizontal; y up; y=0 is the ground layer; stay within 24x16x24): {"op":"box","x":0,"y":0,"z":0,"w":6,"h":3,"d":6,"block":"brick","hollow":true} (hollow = walls only); {"op":"fill","x","y","z","w","h","d","block"}; {"op":"roof","x","y","z","w","d","block","style":"gable|flat"} (gable ridge runs along x); {"op":"hole","x","y","z","w","h","d"} deletes cells (doors, windows); {"op":"block","x","y","z","block"}; {"op":"floor","x","y","z","w","d","block"}; {"op":"furniture","type":"bed|table|chair|lamp|shelf|rug|plant|door","x","y","z","rot":0} places ONE furniture piece in one cell (cost: bed 3 wood, table 2 wood, chair 1 wood, shelf 2 wood, rug 1 wood, plant 1 wood, lamp 1 sand, door 2 wood). A real door is {"op":"furniture","type":"door","x":2,"y":0,"z":0,"rot":0}: rot 0 for doors in walls running along x (front/back walls), rot 1 for side walls; it opens by itself when someone walks up. rot 0-3 turns other furniture. Later ops override earlier ones. The wall at z=0 is the FRONT; the game rotates the building so the front faces the player.
ARCHITECTURE RULES: design real buildings with walls, a door (a door furniture piece at ground level in the front wall), windows (glass fill at y=1), a roof covering all walls (roof y = wall height), and a furnished interior (bed, table with chairs, lamp, shelf, rug, plant) inside the walls, never on wall cells, keeping a clear path from the door. Sensible sizes (house about 6x3x6 cells). Nothing floating. Pick materials that match what you have and what resource nodes are near, and say why.
EXAMPLE house: [{"op":"box","x":0,"y":0,"z":0,"w":6,"h":3,"d":6,"block":"brick","hollow":true},{"op":"furniture","type":"door","x":2,"y":0,"z":0,"rot":0},{"op":"fill","x":1,"y":1,"z":0,"w":1,"h":1,"d":1,"block":"glass"},{"op":"fill","x":4,"y":1,"z":0,"w":1,"h":1,"d":1,"block":"glass"},{"op":"roof","x":0,"y":3,"z":0,"w":6,"d":6,"block":"roof","style":"gable"},{"op":"furniture","type":"bed","x":4,"y":0,"z":4,"rot":0},{"op":"furniture","type":"table","x":1,"y":0,"z":3,"rot":0},{"op":"furniture","type":"chair","x":1,"y":0,"z":2,"rot":1},{"op":"furniture","type":"lamp","x":1,"y":0,"z":4,"rot":0},{"op":"furniture","type":"shelf","x":3,"y":0,"z":4,"rot":0}]`;
let aiBusy = false, aiFail = 0, lastAI = performance.now() - 20000, pendingMsg = null;
const setStat = t => { $('aistat').textContent = t; };
setStat(REL.key ? 'AI: ready' : 'AI: no key (⚙) · scripted mode');
function stateJSON(m) {
  const nn = n => { const o = {}; for (const r of ['wood', 'stone', 'sand']) { const nd = nearestNode(n.pos, r); if (nd) o[r] = { m: Math.round(dist2(nd.pos, n.pos)), dir: dirName(n.pos, nd.pos), left: nd.left }; } return o; };
  return JSON.stringify({
    time: Math.round(clock), player: { at: [Math.round(P.pos.x), Math.round(P.pos.z)], hp: Math.round(P.hp), mode, inCar: !!inCar },
    npcs: npcs.map(n => ({ id: n.id, role: n.role, personality: n.pers, at: [Math.round(n.pos.x), Math.round(n.pos.z)], hp: Math.round(n.hp), inv: n.inv, doing: n.status, task: n.task ? n.task.type : 'idle', last: n.last, playerIs: { m: Math.round(dist2(n.pos, P.pos)), dir: dirName(n.pos, P.pos) }, nearestNodes: nn(n), thugsWithin25m: enemies.filter(e => !e.dead && dist2(e.pos, n.pos) < 25).length })),
    structures: structures.map(s => ({ name: s.name, by: s.by, status: s.status, progress: s.done + '/' + s.total, workers: npcs.filter(o => o.task && o.task.st === s).map(o => o.name) })),
    towns: towns.map(x => ({ name: x.name, built: x.done + '/' + x.total })), events: events.splice(0, 14), player_message: m || null,
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
    if (o.task) { n.queue = []; setTask(n, o.task); }
    if (Array.isArray(o.then)) n.queue = o.then.filter(x => x && x.type).slice(0, 4);
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
  if (!REL.key || aiBusy || net.client) return;
  const since = performance.now() - lastAI;
  if (pendingMsg && since > 2500) { const m = pendingMsg; pendingMsg = null; callAI(m); return; }
  if (aiFail >= 3 && since < 60000) return;
  if ((npcs.some(n => !n.task) && since > 25000) || since > 90000 || (events.length > 2 && since > 20000)) callAI(null);
}, 1000);
function autopilot() {
  if (net.client || (REL.key && aiFail < 3)) return;
  for (const n of npcs) {
    if (n.task || n.idleT < 5) continue;
    n.idleT = 0;
    if (n.queue.length) continue;
    const bs = structures.find(x => x.status === 'building');
    if (n.role === 'guard') { const w = bs && npcs.find(o => o.task && o.task.st === bs); setTask(n, w ? { type: 'protect', who: w.id } : { type: 'guard' }); continue; }
    if (bs && npcs.some(o => o !== n && o.task && o.task.st === bs)) { setTask(n, { type: 'assist' }); continue; }
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
  else if (/town|village/.test(t)) { startTown('Newtown', null, /large|big/.test(t) ? 'large' : /medium/.test(t) ? 'medium' : 'small'); reply = "Founding a town! We'll start with a plaza."; }
  else if (/build|house|hut/.test(t)) go({ type: 'build', name: 'Hut', where: 'near_player', plan: HUT }, "Building a hut. I'll gather the wood first.");
  else if (/wood|tree/.test(t)) go({ type: 'gather', resource: 'wood', amount: 20 }, 'Chopping wood.');
  else if (/stone|rock/.test(t)) go({ type: 'gather', resource: 'stone', amount: 20 }, 'Gathering stone.');
  else if (/sand|glass/.test(t)) go({ type: 'gather', resource: 'sand', amount: 20 }, 'Fetching sand.');
  else reply = REL.key ? 'My head is fuzzy, try again in a moment.' : 'Add your relay key in settings (⚙) so I can think properly. Until then I can follow, guard, gather or build a hut.';
  say(n, reply);
}
function playerSay(text, who = 'You') {
  text = text.trim(); if (!text) return;
  if (text[0] === '!') { const t = text.slice(1).trim(); if (!net.on) logLine('Host or join a room (🌐) to chat with players', 'ev'); else if (t) { logLine(net.name + ': ' + t, 'me'); netSend({ t: 'chat', name: net.name, text: t }); } return; }
  if (net.client) { logLine('You: ' + text, 'me'); netSend({ t: 'npcchat', text }); return; }
  const mt = text.match(/^@?(archie|mason|ranger)\b[\s,:]*/i), to = mt ? mt[1].toLowerCase() : 'everyone';
  logLine(who + ': ' + text, 'me');
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
function brk() { const h = aim(); if (!h) return; if (h.object.userData.k) { delBlock(h.object.userData.k); sfx('brk'); } else if (h.object.userData.fk) { delFurniture(h.object.userData.fk); sfx('brk'); } }
function tracer(to) {
  const g = new THREE.BufferGeometry().setFromPoints([cam.localToWorld(new V3(0.3, -0.25, -0.8)), to]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffee88 })); scene.add(l); setTimeout(() => { scene.remove(l); g.dispose(); }, 70);
}
function shoot() {
  if (cool > 0) return;
  cam.updateMatrixWorld(); const dm = 1 + 0.25 * up.dmg, sg = weapon === 'shotgun';
  cool = sg ? 0.7 : 0.25; sfx('shoot'); if (sg) sfx('punch');
  gun.far = sg ? 30 : 70;
  for (let i = 0; i < (sg ? 7 : 1); i++) {
    gun.setFromCamera({ x: sg ? (Math.random() - 0.5) * 0.14 : 0, y: sg ? (Math.random() - 0.5) * 0.14 : 0 }, cam);
    const h = gun.intersectObjects([...targets, ...enemyMeshes], false)[0];
    tracer(h ? h.point : gun.ray.at(gun.far, new V3()));
    if (h && h.object.userData.enemy) damageEnemy(h.object.userData.enemy, (h.object.userData.head ? (sg ? 28 : 60) : (sg ? 14 : 25)) * dm);
  }
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
  if (shopOpen) { if (e.code === 'Escape' || e.code === 'KeyE') closeShop(); return; }
  keys[e.code] = true;
  if (e.code === 'Space') { if (!inCar) jump(); e.preventDefault(); }
  if (e.code === 'KeyQ') toggleMode();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyR') swapWeapon();
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
btn('jump', () => { if (!inCar) jump(); }); btn('place', act1); btn('brk', act2); btn('col', colAct); btn('mode', toggleMode); btn('car', toggleCar); btn('chatbtn', openChat);
const uiTarget = t => t.closest && t.closest('#chatbar,#panel,#shop,#mp,#mpbtn,#gear,#mute,.b');
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
      if (j.version && j.version !== VER) { if (net.on) { const u2 = $('upd'); u2.style.display = 'block'; u2.textContent = 'New version available. Leave the room to update.'; return; } save(); const u = $('upd'); u.style.display = 'block'; u.textContent = 'New version v' + j.version + ', reloading...'; setTimeout(() => location.replace(location.pathname + '?v=' + j.version), 3000); }
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

// ---------- furniture + doors ----------
const FURN = { bed: { res: 'wood', n: 3 }, table: { res: 'wood', n: 2 }, chair: { res: 'wood', n: 1 }, lamp: { res: 'sand', n: 1 }, shelf: { res: 'wood', n: 2 }, rug: { res: 'wood', n: 1 }, plant: { res: 'wood', n: 1 }, door: { res: 'wood', n: 2 } };
const fmc = {}, FM = c => fmc[c] || (fmc[c] = new THREE.MeshLambertMaterial({ color: c }));
function bx(g, w, h, d, x, y, z, col) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), FM(col)); m.position.set(x, y, z); g.add(m); return m; }
function mkFurn(type, g) {
  const legs = (w, d, h, col, th) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, th, h, th, sx * w, h / 2, sz * d, col); };
  switch (type) {
    case 'bed': bx(g, 1.8, 0.45, 1.9, 0, 0.225, 0, 0x6b4423); bx(g, 1.7, 0.22, 1.3, 0, 0.56, 0.3, 0xf2f2f2); bx(g, 1.0, 0.14, 0.4, 0, 0.7, -0.65, 0x4dabf7); bx(g, 1.8, 0.9, 0.12, 0, 0.7, -0.95, 0x6b4423); break;
    case 'table': bx(g, 1.8, 0.12, 1.2, 0, 0.85, 0, 0x9c6b3a); legs(0.8, 0.5, 0.85, 0x7a5230, 0.12); break;
    case 'chair': bx(g, 0.7, 0.1, 0.7, 0, 0.45, 0, 0x9c6b3a); bx(g, 0.7, 0.6, 0.1, 0, 0.8, -0.3, 0x9c6b3a); legs(0.28, 0.28, 0.45, 0x7a5230, 0.08); break;
    case 'lamp': bx(g, 0.5, 0.08, 0.5, 0, 0.04, 0, 0x333333); bx(g, 0.06, 1.5, 0.06, 0, 0.8, 0, 0x555555); { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a0 })); sp.position.y = 1.7; g.add(sp); } break;
    case 'shelf': bx(g, 1.8, 1.8, 0.1, 0, 0.9, -0.85, 0x5a3b1f); bx(g, 0.1, 1.8, 0.4, -0.85, 0.9, -0.7, 0x5a3b1f); bx(g, 0.1, 1.8, 0.4, 0.85, 0.9, -0.7, 0x5a3b1f);
      for (const y of [0.05, 0.6, 1.15, 1.75]) bx(g, 1.8, 0.08, 0.4, 0, y, -0.7, 0x8b5a2b);
      for (const y of [0.1, 0.65, 1.2]) for (let i = 0; i < 5; i++) bx(g, 0.18, 0.35 + (i % 2) * 0.1, 0.25, -0.65 + i * 0.32, y + 0.22, -0.7, [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad][i]); break;
    case 'rug': bx(g, 1.7, 0.03, 1.7, 0, 0.02, 0, 0xb03a48); bx(g, 1.2, 0.035, 1.2, 0, 0.025, 0, 0xe8c07a); break;
    case 'plant': { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.4, 10), FM(0xb5651d)); pot.position.y = 0.2; g.add(pot); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), FM(0x2f8f3f)); lf.position.y = 0.85; g.add(lf); } break;
  }
}
function addFurniture(cx, cy, cz, type, rot = 0, anim = false, doSave = true) {
  const k = cx + ',' + cy + ',' + cz;
  if (!FURN[type] || furn.has(k) || blockMeshes.has(k)) return false;
  const g = new THREE.Group(), x = cx * 2 + 1, z = cz * 2 + 1, y = cy * 2; let pivot = null;
  if (type === 'door') { pivot = new THREE.Group(); pivot.position.set(-0.9, 0, 0); bx(pivot, 1.8, 1.95, 0.16, 0.9, 0.975, 0, 0x8b5a2b); bx(pivot, 0.1, 0.1, 0.22, 1.55, 0.95, 0, 0xd4af37); g.add(pivot); } else mkFurn(type, g);
  g.position.set(x, y, z); g.rotation.y = -rot * Math.PI / 2; scene.add(g); g.updateMatrixWorld(true);
  const o = { k, cx, cy, cz, f: type, rot, grp: g, pivot, meshes: [] };
  g.traverse(m => { if (m.isMesh) { m.userData.fk = k; targets.push(m); o.meshes.push(m); } });
  furn.set(k, o);
  if (type === 'door') { const al = rot % 2 === 0, hw = al ? 0.9 : 0.1, hd = al ? 0.1 : 0.9; o.box = new THREE.Box3(new V3(x - hw, y, z - hd), new V3(x + hw, y + 1.95, z + hd)); o.open = 0; o.solid = true; solids.set('d' + k, o.box); doors.push(o); }
  if (anim) { g.scale.setScalar(0.3); grow.push({ m: g, t: 0 }); }
  if (net.on && !net.applying) netSend({ t: 'f+', a: [cx, cy, cz, type, rot] });
  if (doSave) queueSave();
  return true;
}
function delFurniture(k) {
  const o = furn.get(k); if (!o) return;
  scene.remove(o.grp); o.meshes.forEach(m => { const i = targets.indexOf(m); if (i >= 0) targets.splice(i, 1); });
  furn.delete(k); if (o.f === 'door') { doors.splice(doors.indexOf(o), 1); solids.delete('d' + k); } if (net.on && !net.applying) netSend({ t: 'f-', k }); queueSave();
}
function updateDoors(dt) {
  for (const d of doors) {
    const cx = d.cx * 2 + 1, cz = d.cz * 2 + 1, cy = d.cy * 2; let near = false;
    const chk = p => { if (Math.abs(p.x - cx) < 3.2 && Math.abs(p.z - cz) < 3.2 && Math.abs(p.y - cy) < 3) near = true; };
    if (!inCar) chk(P.pos); for (const n of npcs) chk(n.pos); for (const e of enemies) if (!e.dead) chk(e.pos); for (const e of cops) if (!e.dead) chk(e.pos);
    d.open += ((near ? 1 : 0) - d.open) * Math.min(1, dt * 8); d.pivot.rotation.y = d.open * 1.55;
    if (d.open > 0.5 && d.solid) { solids.delete('d' + d.k); d.solid = false; } else if (d.open <= 0.5 && !d.solid) { solids.set('d' + d.k, d.box); d.solid = true; }
  }
}
if (pendingFurn) pendingFurn.forEach(a => addFurniture(a[0], a[1], a[2], a[3], a[4], false, false));

// ---------- police / wanted ----------
const cops = [], copRay = new THREE.Raycaster();
function hudStars() { const el = $('stars'); el.style.display = wanted ? 'block' : 'none'; el.textContent = '★'.repeat(wanted) + '☆'.repeat(3 - wanted); }
function crime(n, why, key, cap = 3) {
  if (key) { if (clock - (crimeCD[key] || -99) < 8) return; crimeCD[key] = clock; }
  const before = wanted; wanted = Math.max(wanted, Math.min(cap, wanted + n)); lastCrime = clock; calmT = 0;
  if (wanted > before) { hudStars(); msg('WANTED: ' + why, 1800); sfx('siren'); }
}
function beam(a, b, col, ms) { const g = new THREE.BufferGeometry().setFromPoints([a, b]), l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col })); scene.add(l); setTimeout(() => { scene.remove(l); g.dispose(); }, ms); }
function mkCop(x, z) {
  const g = new THREE.Group(), tm = new THREE.MeshLambertMaterial({ color: 0x1d3a8a });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x14213d })); legs.position.y = 0.35;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), tm); torso.position.y = 1.1;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshLambertMaterial({ color: 0xe0b48f })); head.position.y = 1.75;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), new THREE.MeshLambertMaterial({ color: 0x0b1d4a })); cap.position.y = 2.05;
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), new THREE.MeshLambertMaterial({ color: 0xffd400 })); badge.position.set(0.2, 1.3, 0.27);
  g.add(legs, torso, head, cap, badge); g.position.set(x, 0, z); scene.add(g);
  const e = { ...mkEnt(x, 0, z, 0.4, 1.95), mesh: g, hp: 80, mat: tm, col: 0x1d3a8a, hurt: 0, cd: 1, dead: false, cop: true };
  [legs, torso, head, cap].forEach(m => { m.userData.enemy = e; enemyMeshes.push(m); }); head.userData.head = true; cops.push(e);
}
function spawnCop() {
  for (let t = 0; t < 12; t++) {
    const v = Math.random() < 0.5, k = Math.floor(Math.random() * 16) - 8, a = (v ? P.pos.z : P.pos.x) + (Math.random() - 0.5) * 140;
    const x = v ? k * 50 + 25 : a, z = v ? a : k * 50 + 25, d = Math.hypot(x - P.pos.x, z - P.pos.z);
    if (d < 35 || d > 75) continue; mkCop(x, z); return;
  }
}
function clearCops() { for (const e of cops) { scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); } cops.length = 0; }
function copStep(e, dt) {
  const T = inCar ? inCar.pos : P.pos, dx = T.x - e.pos.x, dz = T.z - e.pos.z, d = Math.hypot(dx, dz);
  if (d > 160) { e.hp = 0; e.dead = true; scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); return; }
  const sp = 5.8 + wanted * 0.6, mx = d > 7 ? dx / d : 0, mz = d > 7 ? dz / d : 0, ox = e.pos.x, oz = e.pos.z;
  phys(e, mx * sp, mz * sp, dt);
  if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = 11;
  e.mesh.position.copy(e.pos); e.mesh.rotation.y = Math.atan2(dx, dz);
  e.hurt -= dt; e.mat.color.setHex(e.hurt > 0 ? 0xffffff : e.col); e.cd -= dt;
  if (e.cd > 0) return;
  if (d < 2 && !inCar) { hurt(10, true); e.cd = 0.8; return; }
  if (d < 26) {
    e.cd = 1.1 + Math.random() * 0.5;
    const o = new V3(e.pos.x, 1.6, e.pos.z), tg = new V3(T.x, inCar ? 1.2 : P.pos.y + 1.2, T.z), dir = tg.clone().sub(o), dl = dir.length(); dir.normalize();
    copRay.set(o, dir); copRay.far = dl; if (copRay.intersectObjects(targets, false)[0]) return;
    sfxAt(e.pos, 'shoot'); beam(o, tg, 0xff5555, 80); if (Math.random() < 0.35) hurt(8, true);
  }
}

// ---------- shop ----------
const SHOP = { x: 36, z: 22 };
let hintOn = false;
$('hint').textContent = isTouch ? 'Tap CAR button: open shop' : 'Press E: open shop';
(function () {
  const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: c });
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 5), M(0x555a60)); base.position.y = 0.15; g.add(base);
  for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), M(0xdddddd)); p.position.set(x, 1.8, z); g.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.4, 5.6), M(0xc0392b)); roof.position.y = 3.6; g.add(roof);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1), M(0x8b5a2b)); counter.position.set(0, 0.85, -1); g.add(counter);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128; const sg = sc.getContext('2d');
  sg.fillStyle = '#d4a017'; sg.fillRect(0, 0, 256, 128); sg.fillStyle = '#111'; sg.font = 'bold 60px sans-serif'; sg.textAlign = 'center'; sg.fillText('$ SHOP', 128, 84);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: st })); sp.scale.set(5, 2.5, 1); sp.position.y = 5.4; g.add(sp);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 40, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: 0.25, depthWrite: false })); beam.position.y = 20; g.add(beam);
  g.position.set(SHOP.x, 0, SHOP.z); scene.add(g);
})();
const shopNear = () => dist2(P.pos, SHOP) < 5;
function spawnCarNearby() {
  for (const a of [0, 1.57, -1.57, 3.14]) {
    const x = P.pos.x - Math.sin(P.yaw + a) * 8, z = P.pos.z - Math.cos(P.yaw + a) * 8, t = { pos: new V3(x, 0, z), R: 2, H: 1.2 };
    let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
    if (!bad) { mkCar(x, z, P.yaw + a + Math.PI, [0xff6b6b, 0x4dabf7, 0xffd43b, 0x69db7c, 0xda77f2][Math.floor(Math.random() * 5)], true); return true; }
  }
  return false;
}
function swapWeapon() { if (!hasShotgun) { msg('Buy the shotgun at the shop', 1500); return; } weapon = weapon === 'pistol' ? 'shotgun' : 'pistol'; hud(); }
function colAct() { if (mode === 'fight') swapWeapon(); else selBlock(sel + 1); }
const ITEMS = [
  { name: 'Health pack', desc: 'Restore full health', cost: () => 50, can: () => P.hp < maxHp(), buy: () => { P.hp = maxHp(); } },
  { name: 'Gun damage +25%', desc: () => 'Level ' + up.dmg + '/3', cost: () => 150 + 100 * up.dmg, can: () => up.dmg < 3, buy: () => { up.dmg++; } },
  { name: 'Max health +25', desc: () => 'Level ' + up.hp + '/3', cost: () => 200 + 150 * up.hp, can: () => up.hp < 3, buy: () => { up.hp++; P.hp = maxHp(); } },
  { name: 'Run speed +15%', desc: () => 'Level ' + up.spd + '/2', cost: () => 150 + 100 * up.spd, can: () => up.spd < 2, buy: () => { up.spd++; } },
  { name: 'Shotgun', desc: 'Press R (or GUN button) in fight mode', cost: () => 300, can: () => !hasShotgun, buy: () => { hasShotgun = true; weapon = 'shotgun'; } },
  { name: 'Supplies for NPCs', desc: '+40 wood, +30 stone, +15 sand each', cost: () => 120, can: () => true, buy: () => { for (const n of npcs) { n.inv.wood = Math.min(60, n.inv.wood + 40); n.inv.stone = Math.min(60, n.inv.stone + 30); n.inv.sand = Math.min(60, n.inv.sand + 15); } ev('You gave the crew supplies from the shop'); } },
  { name: 'New car', desc: 'Delivered next to you', cost: () => 200, can: () => true, buy: () => spawnCarNearby() },
];
function renderShop() {
  $('shopmoney').textContent = '$' + money;
  const box = $('shopitems'); box.innerHTML = '';
  for (const it of ITEMS) {
    const row = document.createElement('div'); row.className = 'srow';
    const cost = it.cost(), ok = it.can();
    const info = document.createElement('div'); info.innerHTML = '<b></b><br><small></small>';
    info.firstChild.textContent = it.name; info.lastChild.textContent = typeof it.desc === 'function' ? it.desc() : it.desc;
    const b = document.createElement('button'); b.textContent = ok ? '$' + cost : 'MAX'; b.disabled = !ok || money < cost;
    b.onclick = () => { if (money < cost || !it.can()) return; if (it.buy() === false) { msg('No room for that here', 1200); return; } money -= cost; sfx('place'); save(); hud(); renderShop(); };
    row.append(info, b); box.appendChild(row);
  }
}
function openShop() { shopOpen = true; for (const k in keys) keys[k] = false; document.exitPointerLock && document.exitPointerLock(); renderShop(); $('shop').style.display = 'block'; }
function closeShop() { shopOpen = false; $('shop').style.display = 'none'; }
$('shopclose').addEventListener('click', closeShop);

// ---------- online multiplayer (peer-to-peer, host-authoritative world) ----------
let netT = 0;
const nsend = (m, except) => { for (const c of net.conns) if (c.open && c !== except) c.send(m); };
const toHost = m => { if (net.hostConn && net.hostConn.open) net.hostConn.send(m); };
function netSend(m) { if (net.host) nsend(m); else toHost(m); }
const r2 = v => Math.round(v * 100) / 100;
function mpUpdate() {
  const st = $('mpstat');
  if (!net.on) { st.textContent = net.status || 'Not in a room'; return; }
  const names = net.host ? [net.name + ' (host)', ...net.conns.map(c => c.nm)] : net.names;
  st.innerHTML = '<div style="font-size:12px;opacity:.8">' + (net.host ? 'Hosting room code' : 'Connected to room') + '</div><div style="font-size:30px;font-weight:700;letter-spacing:4px;color:#ffd400"></div><div style="font-size:12px"></div>';
  st.children[1].textContent = net.code; st.children[2].textContent = 'Players: ' + names.join(', ');
}
function netApply(m) {
  net.applying = true;
  try {
    if (m.t === 'b+' && Array.isArray(m.a)) { const a = m.a; if (a.slice(0, 4).every(Number.isFinite) && a[3] >= 0 && a[3] < BLOCKS.length) addBlock(a[0], a[1], a[2], a[3], true, false); }
    else if (m.t === 'b-') delBlock(String(m.k));
    else if (m.t === 'f+' && Array.isArray(m.a)) { const a = m.a; if ([a[0], a[1], a[2]].every(Number.isFinite)) addFurniture(a[0], a[1], a[2], String(a[3]), (a[4] | 0) & 3, false, true); }
    else if (m.t === 'f-') delFurniture(String(m.k));
  } finally { net.applying = false; }
}
function hashColor(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360; return new THREE.Color().setHSL(h / 360, 0.65, 0.5); }
function mkAvatar(id, name) {
  const g = new THREE.Group(), cm = new THREE.MeshLambertMaterial({ color: hashColor(name) }), skin = new THREE.MeshLambertMaterial({ color: 0xe0b48f });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x333344 })); legs.position.y = 0.35;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), cm); torso.position.y = 1.1;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skin); head.position.y = 1.75;
  const mkArm = sx => { const p = new THREE.Group(); p.position.set(sx * 0.55, 1.45, 0); const a = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), cm); a.position.y = -0.3; p.add(a); return p; };
  const aL = mkArm(-1), aR = mkArm(1); g.add(legs, torso, head, aL, aR); scene.add(g);
  const el = document.createElement('div'); el.className = 'nl'; const bub = document.createElement('div'); bub.className = 'bub'; const nm = document.createElement('div'); nm.innerHTML = '<b style="color:#7fe7ff"></b>'; nm.firstChild.textContent = name; el.append(bub, nm); $('labels').appendChild(el);
  net.remotes.set(id, { id, name, g, aL, aR, el, bub, pos: new V3(0, -50, 0), tp: new V3(0, -50, 0), yaw: 0, first: true, bubT: 0 });
}
function removeAvatar(id) { const r = net.remotes.get(id); if (!r) return; scene.remove(r.g); r.el.remove(); net.remotes.delete(id); }
function updateRemotes(dt) {
  for (const r of net.remotes.values()) {
    const b = r.pos.clone(); r.pos.lerp(r.tp, Math.min(1, dt * 12)); const sp = r.pos.distanceTo(b) / Math.max(dt, 0.001);
    r.g.position.copy(r.pos); let dr = r.yaw + Math.PI - r.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); r.g.rotation.y += dr * Math.min(1, dt * 10);
    const w = sp > 0.6 ? Math.sin(clock * 9) * 0.8 : 0; r.aL.rotation.x = w; r.aR.rotation.x = -w;
    r.bubT -= dt; r.bub.style.display = r.bubT > 0 ? 'block' : 'none';
    const v = new V3(r.pos.x, r.pos.y + 2.5, r.pos.z).project(cam);
    if (v.z > 1 || v.z < -1 || dist2(r.pos, cam.position) > 120) r.el.style.display = 'none'; else { r.el.style.display = 'block'; r.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  }
}
function remoteChat(name, text) { text = String(text || '').slice(0, 200); logLine(name + ': ' + text, 'me'); for (const r of net.remotes.values()) if (r.name === name) { r.bub.textContent = text; r.bubT = 6; } }
function netTick() {
  const yaw = inCar ? inCar.h + Math.PI : P.yaw;
  if (net.host) {
    const pl = [{ id: 'host', name: net.name, x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), yaw: r2(yaw) }];
    for (const c of net.conns) if (c.st) pl.push({ id: c.peer, name: c.nm, ...c.st });
    net.names = pl.map(p => p.name);
    nsend({ t: 'ps', pl, day: dayT, npcs: npcs.map(n => ({ id: n.id, x: r2(n.pos.x), y: r2(n.pos.y), z: r2(n.pos.z), f: r2(n.face), w: n.walking ? 1 : 0, k: n.working ? 1 : 0, s: n.swing > 0 ? 1 : 0, st: n.status, hp: Math.round(n.hp) })) });
  } else toHost({ t: 'p', x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), yaw: r2(yaw) });
}
function hostData(c, m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hello') {
    c.nm = String(m.name || 'Player').slice(0, 16); if (!net.conns.includes(c)) net.conns.push(c);
    c.send({ t: 'welcome', code: net.code, host: net.name, ver: VER, snap: { b: [...blockMeshes.values()].map(b => [b.userData.cx, b.userData.cy, b.userData.cz, b.userData.c]), f: [...furn.values()].map(o => [o.cx, o.cy, o.cz, o.f, o.rot]), pos: [P.pos.x, P.pos.z], day: dayT } });
    logLine('🌐 ' + c.nm + ' joined the room', 'ev'); nsend({ t: 'chat', name: '🌐', text: c.nm + ' joined' }, c); mpUpdate();
    if (m.ver && m.ver !== VER) logLine('⚠ ' + c.nm + ' runs a different version (v' + m.ver + ')', 'ev');
  } else if (m.t === 'p') c.st = { x: +m.x || 0, y: +m.y || 0, z: +m.z || 0, yaw: +m.yaw || 0 };
  else if (m.t === 'b+' || m.t === 'b-' || m.t === 'f+' || m.t === 'f-') { netApply(m); nsend(m, c); }
  else if (m.t === 'chat') { remoteChat(c.nm, m.text); nsend({ t: 'chat', name: c.nm, text: String(m.text || '').slice(0, 200) }, c); }
  else if (m.t === 'npcchat') playerSay(String(m.text || '').slice(0, 300), c.nm);
}
function clientData(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'welcome') {
    net.noSave = true; net.applying = true;
    try { for (const k of [...blockMeshes.keys()]) delBlock(k); for (const k of [...furn.keys()]) delFurniture(k); m.snap.b.forEach(a => addBlock(a[0], a[1], a[2], a[3], false, false)); m.snap.f.forEach(a => addFurniture(a[0], a[1], a[2], a[3], a[4], false, false)); } finally { net.applying = false; }
    P.pos.set(m.snap.pos[0] + 2, 1, m.snap.pos[1] + 2); P.vel.set(0, 0, 0); dayT = m.snap.day;
    net.on = true; net.client = true; net.code = m.code; net.names = [m.host + ' (host)', net.name]; mpUpdate(); $('mp').style.display = 'none';
    msg('Joined ' + m.host + "'s room", 2500); logLine('🌐 Joined ' + m.host + "'s world. Type !text to chat with players, plain text talks to the NPCs.", 'ev');
    if (m.ver && m.ver !== VER) logLine('⚠ Host runs v' + m.ver + ', you run v' + VER + '. Reload to match.', 'ev');
  } else if (m.t === 'ps') {
    const seen = new Set();
    for (const p of m.pl) {
      if (p.id === net.myId) continue; seen.add(p.id);
      if (!net.remotes.has(p.id)) mkAvatar(p.id, String(p.name || 'Player'));
      const r = net.remotes.get(p.id); r.tp.set(p.x, p.y, p.z); r.yaw = p.yaw; if (r.first) { r.pos.copy(r.tp); r.first = false; }
    }
    for (const id of [...net.remotes.keys()]) if (!seen.has(id)) removeAvatar(id);
    net.names = m.pl.map(p => p.name); dayT = m.day;
    for (const d of m.npcs || []) { const n = npcs.find(x => x.id === d.id); if (!n) continue; if (!n.tp) { n.tp = new V3(); n.pos.set(d.x, d.y, d.z); } n.tp.set(d.x, d.y, d.z); n.face = d.f; n.walking = !!d.w; n.working = !!d.k; if (d.s) n.swing = 0.25; n.status = d.st; n.hp = d.hp; }
  } else if (m.t === 'b+' || m.t === 'b-' || m.t === 'f+' || m.t === 'f-') netApply(m);
  else if (m.t === 'chat') remoteChat(m.name, m.text);
  else if (m.t === 'log') logLine(String(m.txt), m.cls);
  else if (m.t === 'say') { const n = npcs.find(x => x.id === m.id); if (n) { n.bub.textContent = String(m.text); n.bubT = 7; } }
}
function mpErr(t) { net.status = t; mpUpdate(); }
function hostRoom(tries = 0) {
  if (net.on || net.peer) return;
  const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  mpErr('Creating room…');
  const peer = new Peer('mwld-' + code); net.peer = peer;
  peer.on('open', () => { net.on = true; net.host = true; net.code = code; mpUpdate(); logLine('🌐 Room open. Share the code ' + code, 'ev'); });
  peer.on('connection', c => { c.on('data', m => hostData(c, m)); c.on('close', () => { const i = net.conns.indexOf(c); if (i >= 0) net.conns.splice(i, 1); nsend({ t: 'chat', name: '🌐', text: (c.nm || 'A player') + ' left' }); logLine('🌐 ' + (c.nm || 'A player') + ' left', 'ev'); mpUpdate(); }); });
  peer.on('error', e => { if (e.type === 'unavailable-id' && tries < 4) { net.peer = null; peer.destroy(); hostRoom(tries + 1); } else mpErr('Could not create room (' + e.type + '). Check your connection.'); });
}
function joinRoom(code) {
  if (net.on || net.peer || !code) return;
  code = code.toUpperCase().replace(/[^A-Z0-9]/g, ''); mpErr('Connecting to ' + code + '…');
  const peer = new Peer(); net.peer = peer;
  peer.on('open', id => {
    net.myId = id; const c = peer.connect('mwld-' + code, { reliable: true }); net.hostConn = c;
    c.on('open', () => c.send({ t: 'hello', name: net.name, ver: VER })); c.on('data', clientData);
    c.on('close', () => { net.on = false; net.client = false; msg('Disconnected from room', 3000); logLine('🌐 Lost connection to the host. Tap Leave (🌐) to return to your own world.', 'ev'); mpErr('Disconnected'); });
  });
  peer.on('error', e => { net.peer = null; mpErr(e.type === 'peer-unavailable' ? 'Room not found. Check the code (the host must keep the game open).' : 'Connection problem (' + e.type + ')'); });
  setTimeout(() => { if (!net.on && net.peer === peer) { mpErr('Still connecting… the host may be offline or behind a strict network.'); } }, 15000);
}
const setName = () => { net.name = ($('mpname').value.trim() || net.name).slice(0, 16); try { localStorage.setItem('mw_name', net.name); } catch (e) {} };
$('mpbtn').addEventListener('click', () => { $('mpname').value = net.name; mpUpdate(); $('mp').style.display = 'block'; document.exitPointerLock && document.exitPointerLock(); });
$('mpclose').addEventListener('click', () => { $('mp').style.display = 'none'; });
$('mphost').addEventListener('click', () => { setName(); hostRoom(); });
$('mpjoin').addEventListener('click', () => { setName(); joinRoom($('mpcode').value); });
$('mpleave').addEventListener('click', () => location.reload());

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
  for (const e of cops) if (!e.dead) dot(e.pos.x, e.pos.z, '#3b82f6', 6, false);
  for (const r of net.remotes.values()) dot(r.pos.x, r.pos.z, '#00e5ff', 6, true);
  dot(SHOP.x, SHOP.z, '#ffd400', 7, true);
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
  { const nr = !inCar && !shopOpen && shopNear(); if (nr !== hintOn) { hintOn = nr; $('hint').style.display = nr ? 'block' : 'none'; } }
  miniT -= dt; if (miniT <= 0) { miniT = 0.066; drawMini(); }
  if (inCar) driveCar(dt); else playerStep(dt);
  if (held && mode === 'fight' && !inCar) shoot();
  for (let i = enemies.length - 1; i >= 0; i--) { if (enemies[i].dead) enemies.splice(i, 1); else enemyStep(enemies[i], dt); }
  spawnT -= dt; if (spawnT <= 0 && enemies.length < 10) { spawnEnemy(); spawnT = 3; }
  for (let i = cops.length - 1; i >= 0; i--) { if (cops[i].dead) cops.splice(i, 1); else copStep(cops[i], dt); }
  if (wanted > 0) {
    copLeaveT = 5; copT -= dt; if (copT <= 0 && cops.length < wanted * 2) { spawnCop(); copT = 1.5; }
    calmT = cops.some(c => dist2(c.pos, P.pos) < 60) ? 0 : calmT + dt;
    if (calmT > 10 || clock - lastCrime > 60) { wanted--; calmT = 0; lastCrime = clock; hudStars(); }
  } else if (cops.length) { copLeaveT -= dt; if (copLeaveT <= 0) clearCops(); }
  if (net.client) { for (const n of npcs) if (n.tp) n.pos.lerp(n.tp, Math.min(1, dt * 10)); } else for (const n of npcs) npcStep(n, dt);
  updateDoors(dt);
  cam.updateMatrixWorld();
  for (const n of npcs) npcVisuals(n, dt);
  updateRemotes(dt);
  netT -= dt; if (net.on && netT <= 0) { netT = 0.1; netTick(); }
  for (let i = grow.length - 1; i >= 0; i--) { const g = grow[i]; g.t += dt * 4; const s = Math.min(1, 0.2 + g.t); g.m.scale.setScalar(s); if (s >= 1) grow.splice(i, 1); }
  for (const nd of nodes) { if (nd.left < nd.max) { nd.regen += dt; if (nd.regen > 6) { nd.regen = 0; nd.left++; nd.mesh.visible = true; nd.mesh.scale.setScalar(0.45 + 0.55 * nd.left / nd.max); } } }
  flashV = Math.max(0, flashV - dt * 1.5); $('flash').style.opacity = flashV;
  ren.render(scene, cam);
});
