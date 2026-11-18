// ---- life at the institutions: school day (class / break / home time), gates, guards, students, staff ----
const INST_JOBS = { school: ['kid', 6], university: ['student', 6], company: ['suit', 3], nasa: ['suit', 4], police: ['suit', 0], bank: ['suit', 0], prison: ['suit', 0] };
let instT = 0;
function instTgt(c) {
  const b = c.inst, ox = Math.sin(b.ry), oz = Math.cos(b.ry), tx = Math.cos(b.ry), tz = -Math.sin(b.ry), u = (Math.random() - 0.5) * 12, o = Math.random() * 2;
  return new V3(c.home.x + tx * u + ox * o, 0, c.home.z + tz * u + oz * o);
}
function schoolPhase() {
  if (dayLight < 0.35) return 'closed'; const t = dayT;
  if ((t >= 0.30 && t < 0.42) || (t >= 0.47 && t < 0.60)) return 'class';
  if (t >= 0.60 && t < 0.68) return 'home';
  return 'break';
}
function schoolTick(dt) {
  const ph = schoolPhase();
  for (const b of institutions) {
    if (b.purpose !== 'school') continue; const dP = Math.hypot(b.x - P.pos.x, b.z - P.pos.z);
    b.alert = Math.max(0, (b.alert || 0) - dt);
    if (dP < 30 && ph !== 'closed' && ((wanted > 0 && clock - lastCrime < 6) || (mode === 'fight' && (cool > 0 || held)))) b.alert = 25;
    if (dP > 220 && b.gate.g) dropGate(b);
    if (dP < 130) {
      if (!b.gate.g) buildGate(b);
      const near = Math.hypot(b.gate.x - P.pos.x, b.gate.z - P.pos.z) < 7, open = !b.alert && ((ph !== 'class' && ph !== 'closed') || near), gt = b.gate;
      gt.a += ((open ? 1 : 0) - gt.a) * Math.min(1, dt * 3); gt.L.rotation.y = -gt.a * 1.4; gt.R.rotation.y = gt.a * 1.4;
      const sol = gt.a < 0.3; if (sol && !gt.solid) { solids.set(gt.key, gt.box); gt.solid = true; } else if (!sol && gt.solid) { solids.delete(gt.key); gt.solid = false; }
    }
    if (b.int) for (const c of b.int.crowd || []) { const on = ph === 'class'; c.g.visible = on; c.hidden = !on; }
    for (const c of b.crowd || []) {
      if (c.dead || c.job !== 'kid') continue;
      if (ph === 'class' && !c.goIn) { c.goIn = true; c.goHome = false; }
      if (ph === 'home' && !c.goHome && !c.goIn) { c.goHome = true; const s = Math.random() < 0.5 ? -1 : 1; c.homeTgt = new V3(c.pos.x + Math.cos(b.ry) * s * (60 + Math.random() * 40), 0, c.pos.z - Math.sin(b.ry) * s * (60 + Math.random() * 40)); c.aR.add(prop([cbox(0.3, 0.05, 0.2, 0.05, -0.7, 0.15, 0xc0392b), cbox(0.28, 0.05, 0.18, 0.05, -0.75, 0.15, 0x2980b9)])); citizenSay(c, pick(['Homework time! Off to my family.', 'Mom will help me with homework!', 'See you tomorrow, teacher!'])); }
    }
  }
}
function instLife(dt) {
  schoolTick(dt);
  instT -= dt; if (instT > 0) return; instT = 2;
  if (dayLight < 0.35) return; const ph = schoolPhase();
  for (const b of institutions) {
    if (Math.hypot(b.x - P.pos.x, b.z - P.pos.z) > 90) continue;
    b.crowd = (b.crowd || []).filter(c => !c.dead);
    if (citizens.length > (isTouch ? 34 : 70)) continue;
    if (b.purpose === 'school') {
      if (!b.guard || b.guard.dead) { const g = mkCitizen('guard', b.post.x, b.post.z, b.ry, { home: new V3(b.post.x, 0, b.post.z), isStatic: true, inst: b }); g.aR.add(prop([cbox(0.06, 0.5, 0.06, 0.05, -0.75, 0.3, 0x111111)])); b.guard = g; }
      if (ph === 'class' || ph === 'closed') continue;
    }
    if (b.purpose === 'prison') { prisonLife(b); continue; }
    if (b.purpose === 'nasa') { nasaLife(b); continue; }
    if (b.purpose === 'university') uniLife(b);
    const [job, n] = INST_JOBS[b.purpose]; if (b.crowd.length >= n) continue;
    const half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, hx = b.x + Math.sin(b.ry) * (half + 2.5), hz = b.z + Math.cos(b.ry) * (half + 2.5);
    const c = mkCitizen(job, hx, hz, b.ry, { home: new V3(hx, 0, hz), tgt: new V3(hx, 0, hz), isStatic: true, inst: b }); b.crowd.push(c);
  }
}
