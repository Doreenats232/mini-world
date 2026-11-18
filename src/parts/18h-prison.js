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
  const G = prisonGeom(b);
  for (let k = b.wardens.length; k < 2; k++) {
    const p = k ? G.post : G.desk, yaw = k ? b.ry : b.ry + Math.PI;
    const c = mkCitizen('officer', p.x, p.z, yaw, { role: 'officer', name: 'Warden ' + pick(NAMES), label: 'prison guard', isStatic: true, home: new V3(p.x, 0, p.z), tgt: new V3(p.x, 0, p.z) }); c.stand = true; c.yaw = yaw; b.wardens.push(c);
  }
  if (b.inmates.filter(r => r.c).length >= 8) return; const r = b.inmates.find(q => !q.c); if (!r) return;
  const used = new Set(b.inmates.filter(q => q.c && q.cell !== undefined).map(q => q.cell)), free = G.cells.findIndex((c, i) => !used.has(i));
  let hx, hz, yaw = b.ry; if (free >= 0) { const c = G.cells[free]; r.cell = free; hx = c.x; hz = c.z; yaw = b.ry + (c.side > 0 ? -Math.PI / 2 : Math.PI / 2) + Math.PI; } else { const half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2; hx = b.x + Math.sin(b.ry) * (half + 2.5); hz = b.z + Math.cos(b.ry) * (half + 2.5); r.cell = undefined; }
  r.c = mkCitizen('inmate', hx, hz, yaw, { role: 'inmate', name: r.name, label: r.kind === 'robber' ? 'prisoner (bank robbery)' : 'prisoner', home: new V3(hx, 0, hz), tgt: new V3(hx, 0, hz), isStatic: true, inst: b }); r.c.stand = true; r.c.yaw = yaw;
}
