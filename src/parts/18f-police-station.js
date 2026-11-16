// ---- police stations: patrol cars roll out, officers arrest thugs and take them to the station ----
const PATROL_SP = 13;
function mkPatrolCar(b) {
  const half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, x = b.x + Math.sin(b.ry) * (half + 5.5), z = b.z + Math.cos(b.ry) * (half + 5.5), h = Math.atan2(Math.cos(b.ry), -Math.sin(b.ry));
  const c = mkCar(x, z, h, 0xf4f6fa, false, 'sedan', true); c.ai = null; c.police = b; b.park = { x, z, h };
  const rm = new THREE.MeshBasicMaterial({ color: 0x330000 }), bm = new THREE.MeshBasicMaterial({ color: 0x000033 });
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.3), rm), bl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.3), bm); r.position.set(-0.28, 1.55, 0); bl.position.set(0.28, 1.55, 0); c.mesh.add(r, bl); c.bar = [rm, bm]; return c;
}
function policeLights(b, on) {
  const f = on && Math.floor(clock * 5) % 2;
  if (b.pcar && b.pcar.bar) { b.pcar.bar[0].color.setHex(f ? 0xff2020 : 0x330000); b.pcar.bar[1].color.setHex(on && !f ? 0x2060ff : 0x000033); }
  if (b.beacon) { b.beacon[0].color.setHex(f ? 0xff2020 : 0x330000); b.beacon[1].color.setHex(on && !f ? 0x2060ff : 0x000033); }
}
function dropPrisoner(e) { e.dead = true; e.hp = 0; scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }
function stepToward(o, tx, tz, sp, dt) { const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz), s = Math.min(d, sp * dt); if (d > 0.001) { o.x += dx / d * s; o.z += dz / d * s; } return d - s; }
function placePatrol(b, rt, t, rev, dt) {
  const w = routeAt(rt, Math.max(0, Math.min(rt.T, t)), rev), c = b.pcar, dh = Math.atan2(Math.sin(w.h - c.h), Math.cos(w.h - c.h));
  c.pos.set(w.x, 0, w.z); c.h += dh * Math.min(1, dt * 5); c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; c.speed = PATROL_SP; animCar(c, dt, dh * 1.5, 0);
}
function endMission(b, rt, cool) { b.mis = null; b.cool = cool; if (b.pcar && b.park) { const c = b.pcar, p = b.park; c.pos.set(p.x, 0, p.z); c.h = p.h; c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; c.speed = 0; } }
function policeTick(dt) {
  for (const b of institutions) {
    if (b.purpose !== 'police') continue;
    if (Math.hypot(b.x - P.pos.x, b.z - P.pos.z) > 200) continue;
    if (!b.beacon) { const m = [new THREE.MeshBasicMaterial({ color: 0x330000 }), new THREE.MeshBasicMaterial({ color: 0x000033 })], g = new THREE.Group(); const r = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), m[0]), bl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), m[1]); r.position.set(-0.6, 0, 0); bl.position.set(0.6, 0, 0); g.add(r, bl); g.position.set(b.x, b.h + 0.4, b.z); scene.add(g); b.beacon = m; b.beaconG = g; }
    b.respawn = Math.max(0, (b.respawn || 0) - dt); b.cool = Math.max(0, (b.cool || 0) - dt);
    if (b.pcar && b.pcar === inCar) { if (!b.stolen) { b.stolen = true; crime(1, 'stole a police car', 'pcar'); } b.mis = b.mis && b.mis.e && (b.mis.e.arrested = false, null); }
    else if (b.pcar && (b.stolen || !cars.includes(b.pcar))) { b.pcar = null; b.stolen = false; b.mis = null; b.respawn = 90; }
    if (!b.pcar && !b.respawn) b.pcar = mkPatrolCar(b);
    const m = b.mis;
    policeLights(b, !!m || wanted > 0);
    if (!b.pcar) continue;
    if (!m) {
      if (b.cool > 0) continue; let best = null, bd = 1e9;
      for (const e of enemies) { if (e.dead || e.arrested || e.hp <= 0) continue; const d = Math.hypot(e.pos.x - b.x, e.pos.z - b.z); if (d < 90 && d < bd) { bd = d; best = e; } }
      if (best) { const dst = nearestBld(best.pos, b) || b; b.mis = { st: 'go', el: 0, t: 0, rt: buildRoute(b, dst), e: best, off: null, sirenT: 0 }; }
      continue;
    }
    const c = b.pcar, e = m.e;
    if (m.st === 'go') {
      m.el += dt; placePatrol(b, m.rt, m.el, false, dt); m.sirenT -= dt; if (m.sirenT <= 0) { m.sirenT = 3; sfxAt(c.pos, 'horn'); }
      if (m.el >= m.rt.T) { m.off = mkCitizen('officer', c.pos.x + 2, c.pos.z, 0, { role: 'officer', name: 'Officer ' + pick(NAMES), label: 'police officer', isStatic: true, home: new V3(c.pos.x + 2, 0, c.pos.z), tgt: new V3(c.pos.x + 2, 0, c.pos.z) }); m.st = 'chase'; m.t = 0; }
    } else if (m.st === 'chase') {
      const o = m.off; m.t += dt;
      if (o.dead || e.dead || e.hp <= 0 || m.t > 25) { if (!o.dead) removeCitizen(o); m.off = null; m.st = 'return'; m.el = 0; continue; }
      const left = stepToward(o.pos, e.pos.x, e.pos.z, 5.5, dt); o.yaw = Math.atan2(e.pos.x - o.pos.x, e.pos.z - o.pos.z); o.stand = false;
      if (left < 1.8) { e.arrested = true; msg('🚔 Police arrested a thug', 2200); m.st = 'escort'; }
    } else if (m.st === 'escort') {
      const o = m.off; if (o.dead) { m.off = null; m.st = 'return'; m.el = 0; continue; }
      const left = stepToward(o.pos, c.pos.x, c.pos.z, 3.4, dt), dx = c.pos.x - o.pos.x, dz = c.pos.z - o.pos.z, dl = Math.hypot(dx, dz) || 1; o.yaw = Math.atan2(dx, dz);
      if (!e.dead && e.hp > 0) { e.pos.x = o.pos.x - dx / dl * 1.3; e.pos.z = o.pos.z - dz / dl * 1.3; e.mesh.position.copy(e.pos); e.mesh.rotation.y = o.yaw; }
      if (left < 2.5) { if (!e.dead && e.hp > 0) { dropPrisoner(e); b.booked = (b.booked || 0) + 1; } removeCitizen(o); m.off = null; m.st = 'return'; m.el = 0; }
    } else {
      m.el += dt; placePatrol(b, m.rt, m.rt.T - m.el, true, dt); if (m.el >= m.rt.T) endMission(b, m.rt, 40);
    }
  }
}
