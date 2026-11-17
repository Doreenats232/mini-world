// ---- prison: arrested criminals are driven here, serve their sentence in the yard, then are released ----
function addInmate(pr, kind) {
  pr.inmates = pr.inmates || []; pr.inmates.push({ kind, left: kind === 'robber' ? 200 : 120, c: null, name: pick(NAMES) });
  if (Math.hypot(pr.x - P.pos.x, pr.z - P.pos.z) < 250) msg('🔒 A ' + kind + ' was locked up in ' + pr.pname, 2500);
}
function prisonTick(dt) {
  for (const b of institutions) {
    if (b.purpose !== 'prison' || !b.inmates) continue;
    for (let i = b.inmates.length - 1; i >= 0; i--) {
      const r = b.inmates[i]; r.left -= dt; if (r.c && r.c.dead) r.c = null;
      if (r.left <= 0) { if (r.c) removeCitizen(r.c); b.inmates.splice(i, 1); b.released = (b.released || 0) + 1; if (Math.hypot(b.x - P.pos.x, b.z - P.pos.z) < 120) msg('🔓 A prisoner was released', 2000); }
    }
  }
}
function prisonLife(b) {
  b.inmates = b.inmates || []; b.wardens = (b.wardens || []).filter(c => !c.dead);
  const half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, ox = Math.sin(b.ry), oz = Math.cos(b.ry), tx = Math.cos(b.ry), tz = -Math.sin(b.ry);
  for (let k = b.wardens.length; k < 2; k++) {
    const s = k ? 1 : -1, x = b.x + ox * (half + 3) + tx * 3.5 * s, z = b.z + oz * (half + 3) + tz * 3.5 * s;
    const c = mkCitizen('officer', x, z, b.ry, { role: 'officer', name: 'Warden ' + pick(NAMES), label: 'prison guard', isStatic: true, home: new V3(x, 0, z), tgt: new V3(x, 0, z) }); c.stand = true; c.yaw = b.ry; b.wardens.push(c);
  }
  if (b.inmates.filter(r => r.c).length >= 8) return; const r = b.inmates.find(q => !q.c); if (!r) return;
  const hx = b.x + ox * (half + 2.5), hz = b.z + oz * (half + 2.5);
  r.c = mkCitizen('inmate', hx, hz, b.ry, { role: 'inmate', name: r.name, label: r.kind === 'robber' ? 'prisoner (bank robbery)' : 'prisoner', home: new V3(hx, 0, hz), tgt: new V3(hx, 0, hz), isStatic: true, inst: b });
}
