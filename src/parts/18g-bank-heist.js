// ---- bank robberies: thieves walk in, trigger the alarm, run out with the loot; police chase them, you can knock them down for a bounty ----
const thieves = [];
function dropThief(t) { const i = thieves.indexOf(t); if (i >= 0) thieves.splice(i, 1); }
function startHeist(b) {
  const A = doorPt(b), vert = Math.abs(Math.round(Math.sin(b.ry))) === 1, sg = Math.random() < 0.5 ? -1 : 1, far = 80, off = 6.4;
  const S = vert ? { x: roadLn(A.x) + off, z: A.z } : { x: A.x, z: roadLn(A.z) + off }, sp = vert ? { x: S.x, z: S.z + sg * far } : { x: S.x + sg * far, z: S.z }, ep = vert ? { x: S.x, z: S.z - sg * 220 } : { x: S.x - sg * 220, z: S.z };
  const cl = v => Math.max(WB.lim0, Math.min(WB.lim1, v)); sp.x = cl(sp.x); sp.z = cl(sp.z); ep.x = cl(ep.x); ep.z = cl(ep.z);
  const ts = []; for (let k = 0; k < 2; k++) { const x = sp.x + k * 1.6, z = sp.z + k * 1.6, t = mkCitizen('thief', x, z, 0, { role: 'thief', name: pick(NAMES), label: 'bank robber', isStatic: true, home: new V3(x, 0, z), tgt: new V3(x, 0, z), seg: 1 }); ts.push(t); thieves.push(t); }
  b.heist = { st: 'approach', ts, appr: [sp, S, A], flee: [A, S, ep], wait: 0 };
}
function walkPath(t, pts, sp, dt) {
  if (t.downT > 0 || t.fleeT > 0) return false; const w = pts[Math.min(t.seg, pts.length - 1)], left = stepToward(t.pos, w.x + (t.k || 0), w.z + (t.k || 0), sp, dt);
  t.yaw = Math.atan2(w.x - t.pos.x, w.z - t.pos.z); t.stand = false; if (left < 0.6) { t.seg++; if (t.seg >= pts.length) return true; } return false;
}
function updateHeist(b, dt) {
  const h = b.heist, A = h.flee[0];
  for (const t of h.ts) { if (t.arrested && t.hidden) { t.hidden = false; t.g.visible = true; } }
  const alive = h.ts.filter(t => !t.dead && !t.arrested && thieves.includes(t));
  if (!alive.length) { b.heist = null; b.alarm = 0; b.heistT = 100 + Math.random() * 70; return; }
  if (h.st === 'approach') {
    let done = 0; for (const t of alive) { if (t.inside) { done++; continue; } if (walkPath(t, h.appr, 3.8, dt)) { t.inside = true; t.hidden = true; t.g.visible = false; } }
    if (done === alive.length) { h.st = 'rob'; h.wait = 9; b.alarm = 25; b.alT = 0; for (const t of alive) t.robbed = true; if (Math.hypot(b.x - P.pos.x, b.z - P.pos.z) < 220) msg('🚨 BANK ROBBERY at ' + b.pname + '!', 3200); }
  } else if (h.st === 'rob') {
    h.wait -= dt; if (h.wait > 0) return; h.st = 'flee';
    alive.forEach((t, i) => { t.hidden = false; t.g.visible = true; t.inside = false; t.pos.set(A.x + i * 1.2, 0, A.z); t.seg = 1; t.k = i * 1.2; t.aR.add(prop([cbox(0.35, 0.3, 0.22, 0.05, -0.8, 0.2, 0x1e8449), cbox(0.2, 0.05, 0.2, 0.05, -0.62, 0.2, 0x145a32)])); citizenSay(t, pick(['Run!', 'Go go go!', 'Got the cash!'])); });
  } else {
    for (const t of alive) {
      if (t.downT > 0 && !t.bounty && Math.hypot(t.pos.x - P.pos.x, t.pos.z - P.pos.z) < 25) { t.bounty = true; money += 250; msg('💰 Bounty +$250: bank robber stopped!', 2500); }
      if (walkPath(t, h.flee, 6.2, dt)) { removeCitizen(t); dropThief(t); }
    }
  }
}
function bankTick(dt) {
  for (const b of institutions) {
    if (b.purpose !== 'bank') continue; const dP = Math.hypot(b.x - P.pos.x, b.z - P.pos.z);
    b.alarm = Math.max(0, (b.alarm || 0) - dt); if (b.alarm > 0 && dP < 150) { b.alT = (b.alT || 0) - dt; if (b.alT <= 0) { b.alT = 2.2; sfxAt(doorPt(b), 'horn'); } }
    if (dP > 420 && b.heist) { for (const t of b.heist.ts) { if (thieves.includes(t)) { removeCitizen(t); dropThief(t); } } b.heist = null; b.alarm = 0; b.heistT = 60 + Math.random() * 60; continue; }
    if (dP > 260) continue;
    if (b.heist) { updateHeist(b, dt); continue; }
    b.heistT = (b.heistT === undefined ? 20 + Math.random() * 40 : b.heistT) - dt;
    if (b.heistT <= 0 && dayLight > 0.3 && thieves.filter(t => Math.hypot(t.pos.x - P.pos.x, t.pos.z - P.pos.z) < 260).length < 4 && citizens.length < (isTouch ? 40 : 90)) startHeist(b);
  }
}
