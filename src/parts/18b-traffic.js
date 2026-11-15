// ---------- traffic: cars that drive themselves around the city (carjack them with E) ----------
let trafT = 0;
const TCOL = [0xd62828, 0x2a6fdb, 0xf4f4f4, 0x222222, 0xe9c46a, 0x2a9d8f, 0x8d99ae, 0x6a4c93, 0xc77dff];
function carSpot() {
  for (let t = 0; t < 8; t++) {
    const axis = Math.random() < 0.5 ? 'x' : 'z', other = axis === 'x' ? P.pos.z : P.pos.x, along = axis === 'x' ? P.pos.x : P.pos.z;
    const line = Math.round((other - 25) / 50 + (Math.floor(Math.random() * 3) - 1)) * 50 + 25; if (line < WB.lo || line > WB.hi) continue;
    const dir = Math.random() < 0.5 ? 1 : -1, a = along + (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 55), lat = line + (axis === 'x' ? dir : -dir) * 3;
    const x = axis === 'x' ? a : lat, z = axis === 'x' ? lat : a;
    if (x < WB.lim0 || x > WB.lim1 || z < WB.lim0 || z > WB.lim1 || Math.hypot(x - P.pos.x, z - P.pos.z) < 40 || cars.some(o => Math.hypot(o.pos.x - x, o.pos.z - z) < 8)) continue;
    return { axis, line, dir, x, z, h: axis === 'x' ? Math.atan2(dir, 0) : Math.atan2(0, dir) };
  }
  return null;
}
function spawnTrafficCar() {
  const s = carSpot(); if (!s) return;
  const c = mkCar(s.x, s.z, s.h, pick(TCOL), false, null, true); c.ai = { axis: s.axis, line: s.line, dir: s.dir, nextI: nextI(s.axis === 'x' ? s.x : s.z, s.dir) }; c.speed = 6;
}
function removeCar(c) { scene.remove(c.mesh); c.mesh.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); const i = cars.indexOf(c); if (i >= 0) cars.splice(i, 1); }
function manageTraffic() {
  const want = Math.round((isTouch ? 6 : 12) * (0.4 + 0.6 * dayLight)); let n = 0;
  for (const c of cars.slice()) if (c.ai) { n++; if (c !== inCar && dist2(c.pos, P.pos) > 150) removeCar(c); }
  if (n < want) spawnTrafficCar();
}
function trafficStep(c, dt) {
  const a = c.ai, fx = a.axis === 'x' ? a.dir : 0, fz = a.axis === 'z' ? a.dir : 0; let block = false;
  const chk = (p, r) => { const dx = p.x - c.pos.x, dz = p.z - c.pos.z, al = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx); if (al > 0.5 && al < 8 && lat < r) block = true; };
  chk(P.pos, 2.2); for (const o of cars) if (o !== c) chk(o.pos, 2.4); for (const q of citizens) if (!q.hidden && !q.dead) chk(q.pos, 1.8); for (const n of npcs) chk(n.pos, 1.8);
  c.speed += ((block ? 0 : 9) - c.speed) * Math.min(1, dt * (block ? 4 : 1.2));
  if (block && c.speed < 0.6 && dist2(c.pos, P.pos) < 10) { a.horn = (a.horn || 0) + dt; if (a.horn > 2.5) { a.horn = 0; sfxAt(c.pos, 'horn'); } }
  const ax = a.axis, lt = ax === 'x' ? 'z' : 'x', laneT = a.line + (ax === 'x' ? a.dir : -a.dir) * 3;
  c.pos[ax] += a.dir * c.speed * dt; c.pos[lt] += (laneT - c.pos[lt]) * Math.min(1, dt * 2);
  if ((c.pos[ax] - a.nextI) * a.dir >= 0) { const here = a.nextI; if (Math.random() < 0.4) { a.axis = lt; a.line = here; a.dir = Math.random() < 0.5 ? 1 : -1; } let nx = nextI(c.pos[a.axis], a.dir); if (nx < WB.lo || nx > WB.hi) { a.dir = -a.dir; nx = nextI(c.pos[a.axis], a.dir); } a.nextI = nx; }
  const hT = a.axis === 'x' ? Math.atan2(a.dir, 0) : Math.atan2(0, a.dir), dh = Math.atan2(Math.sin(hT - c.h), Math.cos(hT - c.h)); c.h += dh * Math.min(1, dt * 3);
  c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; animCar(c, dt, dh * 1.5, 0);
}
function updateTraffic(dt) { trafT -= dt; if (trafT <= 0) { trafT = 0.5; manageTraffic(); } for (const c of cars) if (c.ai && c !== inCar) trafficStep(c, dt); }
