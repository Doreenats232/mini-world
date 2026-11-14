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

