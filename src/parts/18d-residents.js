// ---- residents: persistent NPCs with a home, a job and a real commute (they walk or drive along the roads on a daily schedule) ----
const residents = [], RES_N = 80, WALK_SP = 2.8, CAR_SP = 11;
const roadLn = v => Math.round((v - 25) / 50) * 50 + 25;
const WORKS = [['the bakery', 'baker'], ['the garage', 'mechanic'], ['the market', 'shop assistant'], ['the factory', 'factory worker'], ['the clinic', 'nurse'], ['the post office', 'postman'], ['the diner', 'cook'], ['the hardware store', 'shopkeeper']];
function buildRoute(hb, wb) {
  const A = doorPt(hb), B = doorPt(wb);
  const snap = (b, d) => (b.ry === 0 || b.ry === Math.PI) ? { x: d.x, z: roadLn(d.z), ax: 'x' } : { x: roadLn(d.x), z: d.z, ax: 'z' };
  const S1 = snap(hb, A), S2 = snap(wb, B); let c;
  if (S1.ax === 'x' && S2.ax === 'x') { const xm = roadLn(S1.x); c = S1.z === S2.z ? [S1, S2] : [S1, { x: xm, z: S1.z }, { x: xm, z: S2.z }, S2]; }
  else if (S1.ax === 'z' && S2.ax === 'z') { const zm = roadLn(S1.z); c = S1.x === S2.x ? [S1, S2] : [S1, { x: S1.x, z: zm }, { x: S2.x, z: zm }, S2]; }
  else if (S1.ax === 'x') c = [S1, { x: S2.x, z: S1.z }, S2]; else c = [S1, { x: S1.x, z: S2.z }, S2];
  c = c.filter((p, i) => i === 0 || Math.hypot(p.x - c[i - 1].x, p.z - c[i - 1].z) > 0.5);
  let cl = 0; for (let i = 1; i < c.length; i++) cl += Math.hypot(c[i].x - c[i - 1].x, c[i].z - c[i - 1].z);
  const mode = cl > 110 ? 'car' : 'walk', off = mode === 'car' ? 3 : 6.4;
  const segs = []; for (let i = 1; i < c.length; i++) { const dx = c[i].x - c[i - 1].x, dz = c[i].z - c[i - 1].z; segs.push(Math.abs(dx) > Math.abs(dz) ? { ax: 'x', h: Math.sign(dx) } : { ax: 'z', h: Math.sign(dz) }); }
  const lane = c.map((p, i) => { let ox = 0, oz = 0; for (const s of [segs[i - 1], segs[i]]) { if (!s) continue; if (s.ax === 'z') ox = -s.h * off; else oz = s.h * off; } return { x: p.x + ox, z: p.z + oz }; });
  const pts = [A, ...lane, B], modes = ['walk', ...lane.slice(1).map(() => mode), 'walk'], lens = [], tt = [0];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); lens.push(l); tt.push(tt[i - 1] + l / (modes[i - 1] === 'car' ? CAR_SP : WALK_SP)); }
  return { pts, modes, tt, T: tt[tt.length - 1], mode };
}
function routeAt(rt, t, rev) {
  let i = 1; while (i < rt.tt.length - 1 && rt.tt[i] < t) i++;
  const a = rt.pts[i - 1], b = rt.pts[i], k = rt.tt[i] > rt.tt[i - 1] ? Math.max(0, Math.min(1, (t - rt.tt[i - 1]) / (rt.tt[i] - rt.tt[i - 1]))) : 1;
  let h = Math.atan2(b.x - a.x, b.z - a.z); if (rev) h += Math.PI;
  return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, h, m: rt.modes[i - 1] };
}
(function makeResidents() {
  const homes = buildings.filter(b => !b.purpose), insts = institutions;
  for (let n = 0, tries = 0; n < RES_N && tries < 600; tries++) {
    const hb = pick(homes), nearList = n % 5 < 2 ? buildings.filter(b => Math.hypot(b.x - hb.x, b.z - hb.z) > 30 && Math.hypot(b.x - hb.x, b.z - hb.z) < 105) : null, wb = nearList ? (nearList.length ? pick(nearList) : hb) : Math.random() < 0.55 ? pick(insts) : pick(homes), d = Math.hypot(hb.x - wb.x, hb.z - wb.z);
    if (hb === wb || d < 30 || d > 420 || false) continue;
    let role, label, workName;
    if (wb.purpose === 'school') { role = 'teacher'; label = 'teacher'; workName = wb.pname; }
    else if (wb.purpose === 'university') { role = 'student'; label = Math.random() < 0.5 ? 'student' : 'lecturer'; workName = wb.pname; }
    else if (wb.purpose === 'company') { role = 'suit'; label = 'office worker'; workName = wb.pname; }
    else if (wb.purpose === 'bank') { role = 'suit'; label = 'bank teller'; workName = wb.pname; }
    else if (wb.purpose === 'police') { role = 'suit'; label = 'police clerk'; workName = wb.pname; }
    else if (wb.purpose === 'nasa') { role = 'suit'; label = 'scientist'; workName = wb.pname; }
    else { const w = WORKS[wb.id % WORKS.length]; workName = w[0]; label = w[1]; role = (label === 'factory worker' || label === 'mechanic') ? 'worker' : 'walker'; }
    const rt = buildRoute(hb, wb), start = (role === 'teacher' ? 0.29 : 0.31) + Math.random() * 0.02, leave = 0.60 + Math.random() * 0.04, f = rt.T / 300;
    if (f > 0.3) continue;
    residents.push({ id: n, name: pick(NAMES), role, label, workName, hb, wb, route: rt, T: rt.T, start, leave, dep: ((start - f) % 1 + 1) % 1, c: null, car: null, out: 0, cool: 0, st: 'home', col: hb.rich ? 0x111111 : pick(TCOL) });
    n++;
  }
})();
function unmatRes(r) { if (r.c) { removeCitizen(r.c); r.c = null; } if (r.car) { if (r.car !== inCar) removeCar(r.car); r.car = null; } }
function resPhase(r) {
  const f = r.T / 300, x = ((dayT - r.dep) % 1 + 1) % 1; if (x < f) return ['toWork', x * 300];
  if (dayT >= r.start && dayT < r.leave) return ['work', 0];
  const y = ((dayT - r.leave) % 1 + 1) % 1; if (y < f) return ['toHome', y * 300]; return ['home', 0];
}
function updateResidents(dt) {
  for (const r of residents) {
    if (r.vis) { updateVisit(r, dt); continue; }
    if (r.out > 0) { r.out -= dt; continue; } if (r.cool > 0) r.cool -= dt;
    if (r.c && r.c.dead) { r.c = null; r.cool = 6; }
    if (r.c && (r.c.fleeT > 0 || r.c.downT > 0)) { r.c.res = null; r.c.job = 'walker'; r.c.axis = 'x'; r.c.line = roadLn(r.c.pos.z); r.c.lane = 3; r.c.dir = 1; r.c.nextI = nextI(r.c.pos.x, 1); r.c.doorT = 99; r.c = null; r.out = 30; continue; }
    if (r.car && (r.car === inCar || r.car.dead || r.car.stolen)) { r.car = null; r.out = 40; continue; }
    const [st, el] = resPhase(r); r.st = st;
    if (st !== 'toWork' && st !== 'toHome') { if (r.c || r.car) unmatRes(r); continue; }
    const w = routeAt(r.route, Math.max(0, Math.min(r.T, st === 'toWork' ? el : r.T - el)), st === 'toHome'), dd = Math.hypot(w.x - P.pos.x, w.z - P.pos.z);
    if (dd > 130 || (dd > 100 && !r.c && !r.car)) { if (r.c || r.car) unmatRes(r); continue; }
    if (w.m === 'car') {
      if (r.c) { removeCitizen(r.c); r.c = null; }
      if (!r.car) { if (r.cool > 0) continue; const c = mkCar(w.x, w.z, w.h, r.col, false, null, true); c.ai = null; c.cm = r; r.car = c; }
      const c = r.car, dh = Math.atan2(Math.sin(w.h - c.h), Math.cos(w.h - c.h)); c.pos.set(w.x, 0, w.z); c.h += dh * Math.min(1, dt * 5); c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; c.speed = CAR_SP; animCar(c, dt, dh * 1.5, 0);
    } else {
      if (r.car) { if (r.car !== inCar) removeCar(r.car); r.car = null; }
      if (!r.c) { if (r.cool > 0 || citizens.length > (isTouch ? 44 : 100)) continue; r.c = mkCitizen('commuter', w.x, w.z, w.h, { role: r.role, name: r.name, label: r.label, res: r }); }
      const c = r.c; if (c.faceT > 0) continue; c.pos.set(w.x, 0, w.z); c.yaw = w.h;
    }
  }
}
