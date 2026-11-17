// ---------- car damage: smoke, fire, cracked/shattered glass, explosion, wreck ----------
const smokes = [], SMK_GEO = new THREE.BoxGeometry(0.35, 0.35, 0.35), SMK_MAX = isTouch ? 40 : 90;
function puff(pos, col, up, life, size, op = 0.6) {
  if (smokes.length >= SMK_MAX) return;
  const m = new THREE.Mesh(SMK_GEO, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }));
  m.position.copy(pos); m.scale.setScalar(size); scene.add(m);
  smokes.push({ m, v: new V3((Math.random() - 0.5) * 0.9, up, (Math.random() - 0.5) * 0.9), t: life, l: life, s: size, op });
}
function initCarDamage(c) {
  c.hp = 100; c.dead = false; c.fxT = 0; c.wreckT = 0; c.glass = []; c.paint = []; c.body.userData.car = c;
  c.body.traverse(m => {
    if (!m.isMesh || !m.material || Array.isArray(m.material)) return; const mt = m.material, role = m.userData.role;
    if (role === 'glass' || mt === CARGLASS) { if (!role) m.material = mt.clone(); c.glass.push(m); }
    else if (role === 'paint' || mt === CARBODY) { if (!role) m.material = mt.clone(); c.paint.push(m); }
  });
}
function popTire(c, w, byPlayer) {
  if (!c || c.dead || c.bike || w.flat) return; w.flat = true; c.flats++; c.pull += (w.front ? 1 : 0.5) * (Math.random() < 0.5 ? -1 : 1);
  w.pivot.scale.set(1, 0.72, 0.72); w.pivot.position.y *= 0.72; const p = new V3(); w.pivot.getWorldPosition(p); spark(p, 0xbbbbbb); spark(p, 0x222222); sfxAt(c.pos, 'hit');
  if (c.ai) c.ai.panic = 5; if (c === inCar) msg('Tire shot out!', 1200);
}
const debris = [];
function throwPart(p, v) {
  if (!p) return; const wp = new V3(), q = new THREE.Quaternion(); p.getWorldPosition(wp); p.getWorldQuaternion(q); p.removeFromParent(); p.position.copy(wp); p.quaternion.copy(q); scene.add(p);
  debris.push({ p, v: v || new V3((Math.random() - 0.5) * 9, 6 + Math.random() * 6, (Math.random() - 0.5) * 9), w: new V3(Math.random() * 9, Math.random() * 9, Math.random() * 9), t: 14 });
}
function updateCarParts(c, dt) {
  const k = Math.min(1, dt * 7); c.doorT = Math.max(0, c.doorT - dt);
  if (c.hood) { const t = c.dead ? 0 : c.hp < 45 ? -0.95 : 0; c.hoodA += (t - c.hoodA) * k; c.hood.rotation.x = c.hoodA; }
  if (c.trunk) { c.trunkA += ((!c.dead && c.hp < 25 ? 0.8 : 0) - c.trunkA) * k; c.trunk.rotation.x = c.trunkA; }
  c.doorA += ((c.doorT > 0 ? 1 : 0) - c.doorA) * k;
  for (const d of c.doors) if (d.pivot.parent) d.pivot.rotation.y = d.sx > 0 ? -1.05 * c.doorA : 0;
}
function carGlassState(c) {
  const g = c.hp < 35 ? 2 : c.hp < 65 ? 1 : 0;
  if (g === c.gs) return; c.gs = g;
  for (const m of c.glass) { m.visible = g < 2; if (g === 1) { m.material.color.set(0xc9d6de); m.material.opacity = 0.5; m.material.transparent = true; } }
  if (g === 2) for (let i = 0; i < 3; i++) spark(new V3(c.pos.x, 1.2, c.pos.z), 0xbfe6ff);
}
function damageCar(c, n, byPlayer) {
  if (!c || c.dead || c.bike || n <= 0) return;
  c.hp -= n; sfxAt(c.pos, 'hit'); carGlassState(c);
  if (c.ai) { c.ai.panic = 4; }
  if (c === inCar && c.hp < 40 && !c.warned) { c.warned = true; msg('Car is on fire! Get out (E)!', 2500); }
  if (c.hp <= 0) explodeCar(c, byPlayer);
}
function explodeCar(c, byPlayer) {
  if (c.dead) return; c.dead = true; c.ai = null; c.speed = 0; c.hp = 0; carGlassState(c);
  const p = new V3(c.pos.x, 1, c.pos.z);
  for (const col of [0xff7a1a, 0xffd23a, 0xff4d00, 0x555555, 0xffe9a0, 0x333333, 0xff7a1a, 0xffd23a]) spark(p, col);
  for (let i = 0; i < 12; i++) puff(p, i % 3 ? 0xff8a1f : 0x222222, 2 + Math.random() * 3, 0.9 + Math.random() * 0.6, 1.2 + Math.random() * 1.2, 0.85);
  boom(p, 1);   sfx('crash'); sfxAt(c.pos, 'edie'); scare(c.pos, 45);
  for (const e of [...enemies, ...cops]) if (!e.dead && dist2(e.pos, c.pos) < 8) damageEnemy(e, 90);
  for (const q of citizens) if (!q.hidden && !q.dead && dist2(q.pos, c.pos) < 6) { q.downT = 2; q.kv = new V3(q.pos.x - c.pos.x, 0, q.pos.z - c.pos.z).setLength(7); }
  for (const o of cars) if (o !== c && !o.dead && dist2(o.pos, c.pos) < 7) damageCar(o, 40, byPlayer);
  if (inCar === c) { inCar = null; stopEngine(); P.pos.set(c.pos.x + Math.cos(c.h) * 3, 0, c.pos.z - Math.sin(c.h) * 3); P.vel.set(0, 0, 0); hurt(45, true); }
  else if (dist2(P.pos, c.pos) < 7) hurt(30, true);
  if (byPlayer) crime(1, 'blew up a car', 'boom', 2);
  for (const m of c.paint) m.material.color.set(0x1b1b1b);
  throwPart(c.hood, new V3(0, 9, 0).add(new V3(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(5))); c.hood = null; if (c.doors.length) { throwPart(c.doors[0].pivot); throwPart(c.doors[1].pivot); } c.doors = [];
  c.body.rotation.z = (Math.random() < 0.5 ? -1 : 1) * 0.1; c.body.rotation.x = -0.06; c.body.position.y = -0.05;
}
function updateCarFx(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i]; d.t -= dt; d.v.y -= 22 * dt; d.p.position.addScaledVector(d.v, dt); d.p.rotation.x += d.w.x * dt; d.p.rotation.y += d.w.y * dt;
    if (d.p.position.y < 0.15) { d.p.position.y = 0.15; d.v.set(d.v.x * 0.4, Math.abs(d.v.y) > 3 ? -d.v.y * 0.3 : 0, d.v.z * 0.4); d.w.multiplyScalar(0.6); }
    if (d.t <= 0) { scene.remove(d.p); d.p.traverse(o => { if (o.isMesh) { o.geometry.dispose(); } }); debris.splice(i, 1); }
  }
  for (const c of cars) if (!c.bike) updateCarParts(c, dt);
  for (let i = smokes.length - 1; i >= 0; i--) {
    const s = smokes[i]; s.t -= dt; s.m.position.addScaledVector(s.v, dt); s.m.scale.setScalar(s.s * (1 + (1 - s.t / s.l) * 1.6)); s.m.material.opacity = Math.max(0, s.op * s.t / s.l);
    if (s.t <= 0) { scene.remove(s.m); s.m.material.dispose(); smokes.splice(i, 1); }
  }
  for (const c of cars.slice()) {
    if (c.bike) continue;
    if (c.dead) { c.wreckT += dt; if (c.wreckT > 60 && c !== inCar && dist2(c.pos, P.pos) > 30) { removeCar(c); continue; } }
    else if (c.hp < 20) { c.hp -= 3 * dt; if (c.hp <= 0) { explodeCar(c, false); continue; } }
    const lim = c.dead ? (c.wreckT < 25 ? 1 : 0) : c.hp < 55 ? 1 : 0; if (!lim || dist2(c.pos, P.pos) > 70) continue;
    c.fxT -= dt; if (c.fxT > 0) continue; c.fxT = c.dead ? 0.22 : c.hp < 28 ? 0.09 : 0.16;
    const p = new V3(c.pos.x + Math.sin(c.h) * 1.5, 1.0, c.pos.z + Math.cos(c.h) * 1.5);
    puff(p, c.dead ? 0x161616 : c.hp < 28 ? 0x2a2a2a : 0x9a9a9a, 1.6 + Math.random(), 1.0 + Math.random() * 0.5, 0.5);
    if (c.dead ? c.wreckT < 12 : c.hp < 28) puff(p, Math.random() < 0.5 ? 0xff7a1a : 0xffc23a, 1.8, 0.4, 0.45, 0.9);
  }
}
