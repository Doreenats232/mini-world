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
  n.lL.rotation.x = -w; n.lR.rotation.x = w; n.aL.rotation.x = w; n.aR.rotation.x = n.swing > 0 ? -1.6 + Math.sin(clock * 40) * 0.5 : n.working ? -1.1 + Math.sin(clock * 14) * 0.6 : -w;
  n.bubT -= dt; n.bub.style.display = n.bubT > 0 ? 'block' : 'none';
  if (n._st !== n.status) { n._st = n.status; n.st.textContent = n.status; }
  const v = new V3(n.pos.x, n.pos.y + 2.5, n.pos.z).project(cam);
  if (v.z > 1 || v.z < -1 || dist2(n.pos, cam.position) > 70) n.el.style.display = 'none';
  else { n.el.style.display = 'block'; n.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
}

