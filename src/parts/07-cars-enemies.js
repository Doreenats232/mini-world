// ---------- cars ----------
const cars = [];
function mkCar(x, z, h, col, owned = false, type, ai = false) {
  const t = type || ['sedan', 'hatch', 'suv', 'sport', 'taxi'][Math.floor(Math.random() * 5)], M = mkCarModel(t, t === 'taxi' ? 0xf5c518 : col, ai), g = M.g;
  g.position.set(x, 0, z); g.rotation.y = h; scene.add(g);
  const car = { mesh: g, body: M.body, wheels: M.wheels, wr: M.wr, pos: new V3(x, 0, z), h, speed: 0, owned, type: t, spin: 0, steerV: 0, ai: ai ? {} : null }; cars.push(car); return car;
}
mkCar(25, 45, 0, 0xd62828); mkCar(45, 25, Math.PI / 2, 0x2a9d8f); mkCar(-25, -5, 0, 0xf4a261); mkCar(75, -25, Math.PI / 2, 0x6a4c93);
function toggleCar() {
  if (!inCar && shopNear()) { openShop(); return; }
  if (!inCar && tryUse()) return;
  if (!inCar && tryTalk()) return;
  if (inCar) { const c = inCar; inCar = null; c.speed = 0; stopEngine(); P.pos.set(c.pos.x + Math.cos(c.h) * 3, 0, c.pos.z - Math.sin(c.h) * 3); P.vel.set(0, 0, 0); P.yaw = c.h + Math.PI; P.pitch = 0; return; }
  let best = null, bd = 5;
  for (const c of cars) { const d = dist2(c.pos, P.pos); if (d < bd) { bd = d; best = c; } }
  if (best) { inCar = best; startEngine(); if (best.ai) { best.ai = null; msg('Carjacked!', 1500); } if (!best.owned && !best.stolen) { best.stolen = true; crime(1, 'car theft'); } msg('W/S drive, A/D steer, Space brake, E exit', 2500); } else msg('No car nearby', 900);
}
function driveCar(dt) {
  const c = inCar, thr = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0) - joy.x;
  if (Math.abs(thr) > 0.1) c.speed += thr * 18 * dt; else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 8 * dt);
  if (keys.Space) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 25 * dt);
  c.speed = Math.max(-8, Math.min(26, c.speed)); engine(Math.abs(c.speed));
  c.h += steer * 1.8 * dt * Math.max(-1, Math.min(1, c.speed / 5));
  const t = { pos: new V3(c.pos.x + Math.sin(c.h) * c.speed * dt, 0, c.pos.z + Math.cos(c.h) * c.speed * dt), R: 1.3, H: 1.2 };
  let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
  for (const o of cars) if (o !== c && dist2(o.pos, t.pos) < 2.8) bad = true;
  if (bad) { if (Math.abs(c.speed) > 12) crime(1, 'reckless driving', 'crash', 1); if (Math.abs(c.speed) > 4) sfx('crash'); c.speed *= -0.3; } else c.pos.copy(t.pos);
  c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; animCar(c, dt, steer, thr);
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
  e.hp -= n; e.hurt = 0.12; if (!quiet && e.hp > 0) knock(e, P.pos, n >= 20 ? 4.5 : 1.6, n >= 20 ? 0.7 : 0.2); if (e.cop && !quiet) crime(1, 'attacked a cop', 'copHit'); sfxAt(e.pos, 'hit');
  if (e.hp <= 0) { sfxAt(e.pos, 'edie'); e.dead = true; e.mesh.rotation.order = 'YXZ'; corpses.push({ m: e.mesh, t: 0 }); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); if (e.cop) { if (!quiet) crime(1, 'killed a cop', 'copKill'); } else if (!quiet) { kills++; money += 25; hud(); } }
}
function enemyStep(e, dt) {
  if (stunned(e, dt)) return;
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

