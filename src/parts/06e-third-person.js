// ---------- third-person view: you see your own soldier walk, run and walk up to a car door before getting in (V toggles) ----------
const _gv2 = new V3(); let tpv = true, pmod = null, enter = null, enterGo = false;
try { if (localStorage.getItem('mw_tpv') === '0') tpv = false; } catch (e) {}
function toggleView() { tpv = !tpv; try { localStorage.setItem('mw_tpv', tpv ? '1' : '0'); } catch (e) {} msg(tpv ? 'Third-person view (V to switch)' : 'First-person view (V to switch)', 1500); }
function tpCamera() {
  const cp = Math.cos(P.pitch), d = new V3(-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp), head = new V3(P.pos.x, P.pos.y + 1.6, P.pos.z), right = new V3(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  let dist = 4.2;
  for (let s = 0.6; s <= 4.2; s += 0.4) {
    const p = head.clone().addScaledVector(d, -s).addScaledVector(right, 0.55 * Math.min(1, s / 2)); if (p.y < 0.3) { dist = Math.max(0.6, s - 0.4); break; }
    const t = { pos: new V3(p.x, p.y - 0.1, p.z), R: 0.2, H: 0.2 }; let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; } if (bad) { dist = Math.max(0.6, s - 0.4); break; }
  }
  cam.position.copy(head).addScaledVector(d, -dist).addScaledVector(right, 0.55 * Math.min(1, dist / 2)); if (cam.position.y < 0.3) cam.position.y = 0.3; cam.rotation.set(P.pitch, P.yaw, 0);
}
function startEnter(c) {
  if (enter) return; const r = c.bike ? 1.1 : 2.0; enter = { c, t: 0, ph: 0, tgt: new V3(c.pos.x + Math.cos(c.h) * r, 0, c.pos.z - Math.sin(c.h) * r), face: null, hide: false };
}
function updateEnter(dt) {
  const e = enter, c = e.c; e.t += dt;
  if (c.dead || dist2(P.pos, c.pos) > 14) { enter = null; return; }
  if (e.ph === 0) {
    const dx = e.tgt.x - P.pos.x, dz = e.tgt.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.35 || e.t > 2.5) { e.ph = 1; e.t = 0; e.face = Math.atan2(c.pos.x - P.pos.x, c.pos.z - P.pos.z); c.doorT = 1.0; }
    else { const s = Math.min(d, 5 * dt); P.pos.x += dx / d * s; P.pos.z += dz / d * s; e.face = Math.atan2(dx, dz); }
  } else if (e.t > 0.5) { e.hide = true; enter = null; enterGo = true; toggleCar(); enterGo = false; }
  tpCamera();
}
function updatePlayerModel(dt) {
  if (!SOLDIER) return;
  if (!pmod) { pmod = makeSoldier(null, 1.0); pmod.last = P.pos.clone(); pmod.face = 0; scene.add(pmod.root); }
  const show = tpv && !inCar && !shopOpen; pmod.root.visible = show;
  if (!show) { pmod.last.copy(P.pos); return; }
  const dx = P.pos.x - pmod.last.x, dz = P.pos.z - pmod.last.z, sp = Math.hypot(dx, dz) / Math.max(dt, 0.001); pmod.last.copy(P.pos);
  const armed = mode === 'fight' && !enter; if (armed && (cool > 0 || held)) pmod.aimT = 2.2; else pmod.aimT = Math.max(0, (pmod.aimT || 0) - dt);
  let tg = pmod.face; if (enter && enter.face != null) tg = enter.face; else if (armed && pmod.aimT > 0) tg = P.yaw + Math.PI; else if (sp > 0.8) tg = Math.atan2(dx, dz);
  let dr = tg - pmod.face; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); pmod.face += dr * Math.min(1, dt * 12);
  pmod.root.position.set(P.pos.x, P.pos.y, P.pos.z); pmod.root.rotation.y = pmod.face;
  soldAnim(pmod, sp > 5 ? 'Run' : sp > 0.5 ? 'Walk' : 'Idle'); pmod.mixer.update(dt);
  armGun(pmod, _gv2.set(Math.sin(pmod.face), 0, Math.cos(pmod.face)), P.pitch * 0.8, armed && pmod.aimT > 0, mode === 'fight' && !enter ? weapon : null);
}
