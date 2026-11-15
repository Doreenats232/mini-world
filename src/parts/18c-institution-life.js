// ---- life at the institutions: kids at school yards, students on campus, staff outside companies and NASA ----
const INST_JOBS = { school: ['kid', 6], university: ['student', 6], company: ['suit', 3], nasa: ['suit', 4] };
let instT = 0;
function instTgt(c) {
  const b = c.inst, ox = Math.sin(b.ry), oz = Math.cos(b.ry), tx = Math.cos(b.ry), tz = -Math.sin(b.ry), u = (Math.random() - 0.5) * 12, o = Math.random() * 2;
  return new V3(c.home.x + tx * u + ox * o, 0, c.home.z + tz * u + oz * o);
}
function instLife(dt) {
  instT -= dt; if (instT > 0) return; instT = 2;
  if (dayLight < 0.35) return;
  for (const b of institutions) {
    if (Math.hypot(b.x - P.pos.x, b.z - P.pos.z) > 90) continue;
    b.crowd = (b.crowd || []).filter(c => !c.dead);
    const [job, n] = INST_JOBS[b.purpose]; if (b.crowd.length >= n || citizens.length > (isTouch ? 34 : 70)) continue;
    const half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, hx = b.x + Math.sin(b.ry) * (half + 2.5), hz = b.z + Math.cos(b.ry) * (half + 2.5);
    const c = mkCitizen(job, hx, hz, b.ry, { home: new V3(hx, 0, hz), tgt: new V3(hx, 0, hz), isStatic: true, inst: b }); b.crowd.push(c);
  }
}
