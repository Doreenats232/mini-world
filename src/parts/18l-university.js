// ---------- universities: classical portico (steps, columns, pediment, banners), clock tower, lawn; interior = registrar hall, lecture hall, library, atrium statue ----------
const UM = {};
function uniMats() {
  if (UM.stone) return UM; pjMats();
  UM.stone = new THREE.MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.85 });
  UM.brick = new THREE.MeshStandardMaterial({ color: 0x8e3b2c, roughness: 0.95 });
  UM.dwood = new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.7 });
  UM.wood = new THREE.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.75 });
  UM.marble = new THREE.MeshStandardMaterial({ color: 0xeceae4, roughness: 0.3, metalness: 0.1 });
  UM.green = new THREE.MeshLambertMaterial({ color: 0x3f7a35 });
  UM.path = new THREE.MeshLambertMaterial({ color: 0xcfc8b8 });
  UM.board = new THREE.MeshStandardMaterial({ color: 0xf4f6f4, roughness: 0.4 });
  UM.books = new THREE.MeshStandardMaterial({ map: mkTex(64, 64, (g, w, h) => { g.fillStyle = '#2a1d12'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) { let x = 1; while (x < w - 3) { const bw = rr(3, 7); g.fillStyle = `hsl(${rr(0, 360)},${rr(35, 65)}%,${rr(22, 45)}%)`; g.fillRect(x, r * 16 + 2, bw, 13 - rr(0, 3)); x += bw + 0.5; } g.fillStyle = '#1b130c'; g.fillRect(0, r * 16 + 15, w, 1); } }), roughness: 0.9 });
  UM.glassW = new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffc86a, emissiveIntensity: 1.3 });
  return UM;
}
function crestTex(name, bg) { return mkTex(64, 128, (g, w, h) => { g.fillStyle = bg || '#9b1c2c'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(10, 22); g.lineTo(w - 10, 22); g.lineTo(w - 10, 62); g.quadraticCurveTo(w / 2, 100, 10, 62); g.closePath(); g.fill(); g.fillStyle = bg || '#9b1c2c'; g.fillRect(w / 2 - 2, 30, 4, 50); g.fillRect(18, 44, w - 36, 4); g.fillStyle = '#f4efe2'; g.font = 'bold 9px serif'; g.textAlign = 'center'; g.fillText((name || 'VERITAS').slice(0, 9), w / 2, 118); g.fillStyle = '#d6b45a'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); }); }
function uniExterior(b) {
  const M = uniMats(), ew = b.ry === 0 || b.ry === Math.PI, Lw = ew ? b.w : b.d, half = ew ? b.d / 2 : b.w / 2, rz = 25 + 50 * Math.round(((ew ? b.z : b.x) - 25) / 50), center = ew ? b.z : b.x;
  const dist = Math.abs(rz - center) - half, gp = dist - 7 - 1.8 - 0.4, g = new THREE.Group(); g.position.set(b.x, 0, b.z); g.rotation.y = b.ry; scene.add(g); b.uniExt = g;
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  const solidAt = (x, z, r, h) => { const p = new V3(b.x + x * Math.cos(b.ry) + z * Math.sin(b.ry), 0, b.z - x * Math.sin(b.ry) + z * Math.cos(b.ry)); const k = 'ux' + b.id + '_' + (b.uk = (b.uk || 0) + 1); solids.set(k, new THREE.Box3(new V3(p.x - r, 0, p.z - r), new V3(p.x + r, h, p.z + r))); };
  // clock tower on the roof + crimson roof trim
  const th = 5.5, tw = 3.2; add(new THREE.BoxGeometry(tw, th, tw), M.brick, 0, b.h + th / 2, 0); add(new THREE.BoxGeometry(tw + 0.4, 0.3, tw + 0.4), M.stone, 0, b.h + th, 0); add(new THREE.ConeGeometry(tw * 0.78, 2.6, 4), M.dwood, 0, b.h + th + 1.6, 0).rotation.y = Math.PI / 4;
  const clk = new THREE.MeshBasicMaterial({ map: mkTex(64, 64, (c, w, h) => { c.fillStyle = '#f7f3e6'; c.beginPath(); c.arc(32, 32, 29, 0, 6.3); c.fill(); c.strokeStyle = '#3a2a1a'; c.lineWidth = 3; c.stroke(); c.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.moveTo(32 + Math.sin(a) * 24, 32 - Math.cos(a) * 24); c.lineTo(32 + Math.sin(a) * 28, 32 - Math.cos(a) * 28); c.stroke(); } c.lineWidth = 3; c.beginPath(); c.moveTo(32, 32); c.lineTo(32 + 14, 32 - 8); c.stroke(); c.beginPath(); c.moveTo(32, 32); c.lineTo(32 - 4, 32 - 20); c.stroke(); }) });
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.05, 20), clk); const a = i * Math.PI / 2; m.position.set(Math.sin(a) * (tw / 2 + 0.02), b.h + th - 1.3, Math.cos(a) * (tw / 2 + 0.02)); m.rotation.y = a; g.add(m); }
  if (gp < 1.4) return;   // no room in front: skip the portico
  const pd = Math.min(2.8, gp), zf = half, pw = Math.min(Lw / 2 - 1, 6.2), cols = [];
  for (let x = 1.9; x <= pw + 0.01; x += 1.8) cols.push(x, -x);
  for (const x of cols) { const zc = zf + pd - 0.35; add(new THREE.CylinderGeometry(0.3, 0.34, 4.4, 14), M.stone, x, 2.5, zc); add(new THREE.BoxGeometry(0.85, 0.3, 0.85), M.stone, x, 0.35, zc); add(new THREE.BoxGeometry(0.85, 0.28, 0.85), M.stone, x, 4.85, zc); solidAt(x, zc, 0.36, 5); }
  add(new THREE.BoxGeometry(pw * 2 + 1.6, 0.7, pd + 0.3), M.stone, 0, 5.35, zf + pd / 2 + 0.05);
  const sh = new THREE.Shape(); sh.moveTo(-pw - 0.8, 0); sh.lineTo(pw + 0.8, 0); sh.lineTo(0, 1.7); sh.closePath(); const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: pd + 0.3, bevelEnabled: false }), M.stone); ped.position.set(0, 5.7, zf - 0.1); g.add(ped);
  const crest = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshStandardMaterial({ color: 0x9b1c2c })); crest.position.set(0, 6.5, zf + pd + 0.22); g.add(crest);
  const bt = crestTex((b.pname || 'UNIVERSITY').split(' ')[0]); for (const x of [-4.5, -2.7, 2.7, 4.5]) { if (Math.abs(x) > pw - 0.3) continue; const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.9), new THREE.MeshBasicMaterial({ map: bt, side: THREE.DoubleSide })); bn.position.set(x, 2.8, zf + pd - 0.5 * 0 - 0.9); g.add(bn); }
  for (let k = 0; k < 3; k++) { const sd = Math.min(0.5, Math.max(0.2, (gp - pd) / 3)); add(new THREE.BoxGeometry(pw * 2 + 1.2 + k * 0.6, 0.1 * (3 - k), sd), M.stone, 0, 0.05 * (3 - k), zf + pd + 0.2 + k * sd + sd / 2); }
  // lawn with paths, benches and a few trees beyond the steps (only if there is room)
  const lw = Math.max(0, gp - pd - 1.6); if (lw > 1.2) { add(new THREE.PlaneGeometry(Lw, lw), M.green, 0, 0.02, zf + pd + 1.6 + lw / 2).rotation.x = -Math.PI / 2; add(new THREE.PlaneGeometry(2.4, lw), M.path, 0, 0.03, zf + pd + 1.6 + lw / 2).rotation.x = -Math.PI / 2; }
}
function uniGeom(b) {
  const ew = b.ry === 0 || b.ry === Math.PI, Lw = ew ? b.w : b.d, Dd = ew ? b.d : b.w, W = Lw - 2 * CT, D = Dd - 2 * CT, Wh = W / 2, Hh = D / 2, z0 = -Hh + 3.2;
  const th = b.ry + Math.PI, c = Math.cos(th), s = Math.sin(th), toW = (x, z) => ({ x: b.x + x * c + z * s, z: b.z - x * s + z * c });
  const rows = Math.max(1, Math.min(4, Math.floor((Hh - z0 - 2.9) / 1.15))), desks = [], per = Wh - 0.6 >= 5 ? 3 : 2;
  for (let k = 0; k < rows; k++) for (let i = 0; i < per; i++) desks.push({ x: -Wh + 1.0 + i * ((Wh - 2.1) / Math.max(1, per - 1)), z: z0 + 1.4 + k * 1.15 });
  const spots = [{ ...toW(-(Wh + 0.6) / 2, Hh - 1.3), yaw: b.ry, label: 'professor' }, { ...toW(Wh * 0.5, z0 + 0.9), yaw: b.ry, label: 'librarian' }, { ...toW(-Wh * 0.5, -Hh + 1.6), yaw: b.ry + Math.PI, label: 'registrar' }];
  for (const d of desks.slice(0, 4)) spots.push({ ...toW(d.x, d.z - 0.6), yaw: b.ry + Math.PI, label: 'student', sit: true });
  return { W, D, Wh, Hh, z0, th, toW, desks, per, spots };
}
function buildUniInterior(b, groups) {
  const M = uniMats(), P_ = pjMats(), G = uniGeom(b), { Wh, Hh, z0 } = G, IC = CG, keys = [], root = new THREE.Group(); root.position.set(b.x, 0, b.z); root.rotation.y = G.th; scene.add(root); groups.push(root);
  const B = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); root.add(m); return m; };
  const solid = (x0, x1, za, zb, y1) => { const pts = [[x0, za], [x1, za], [x0, zb], [x1, zb]].map(([x, z]) => G.toW(x, z)), k = 'uj' + b.id + '_' + keys.length; solids.set(k, new THREE.Box3(new V3(Math.min(...pts.map(p => p.x)), 0, Math.min(...pts.map(p => p.z))), new V3(Math.max(...pts.map(p => p.x)), y1 || 3.6, Math.max(...pts.map(p => p.z))))); keys.push(k); };
  const wall = (x0, x1, za, zb, mat) => { B(x1 - x0, 3.96, zb - za, (x0 + x1) / 2, 1.98, (za + zb) / 2, mat || M.stone); solid(x0, x1, za, zb); };
  const plane = (w, h, x, y, z, ry, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; root.add(m); return m; };
  const lamp = (x, z) => { B(0.03, 0.7, 0.03, x, IC - 0.35, z, P_.dark); const s = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M.glassW); s.position.set(x, IC - 0.8, z); root.add(s); };
  // partitions: lecture hall (left), library (right), central aisle to the atrium
  const gl = z0 + 1.6; wall(-Wh, -0.6 + 0.0, z0 - 0.1, z0 + 0.1); wall(0.6, Wh, z0 - 0.1, z0 + 0.1);
  wall(-0.7, -0.5, z0 + 0.1, gl - 0.6); wall(-0.7, -0.5, gl + 0.6, Hh - 2.2); wall(0.5, 0.7, z0 + 0.1, gl - 0.6); wall(0.5, 0.7, gl + 0.6, Hh - 2.2);
  B(0.2, 1.2, 1.2, -0.6, 3.4, gl, M.stone); B(0.2, 1.2, 1.2, 0.6, 3.4, gl, M.stone);
  // registrar hall
  { const cx = -Wh * 0.5, cz = -Hh + 1.2; B(2.6, 1.0, 0.7, cx, 0.5, cz, M.dwood); B(2.7, 0.06, 0.78, cx, 1.03, cz, M.wood); solid(cx - 1.3, cx + 1.3, cz - 0.38, cz + 0.38, 1.1); B(0.5, 0.34, 0.04, cx - 0.5, 1.3, cz - 0.12, P_.dark); B(0.4, 0.45, 2.2, Wh - 0.35, 0.23, -Hh + 1.6, M.wood); solid(Wh - 0.55, Wh - 0.15, -Hh + 0.5, -Hh + 2.7, 0.5);
    B(0.5, 1.6, 2.2, Wh - 0.25, 0.8, -Hh + 1.6, M.dwood); B(0.04, 1.3, 2.0, Wh - 0.5, 0.95, -Hh + 1.6, new THREE.MeshStandardMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.3, depthWrite: false })); for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25 + (i % 2) * 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xd6b45a, metalness: 0.8, roughness: 0.3 })); t.position.set(Wh - 0.25, 0.75 + (i % 2) * 0.4, -Hh + 0.8 + i * 0.5); root.add(t); }
    const nb = plane(1.6, 1.0, -Wh + 0.03, 1.7, -Hh + 3.0 - 0.0, Math.PI / 2, new THREE.MeshBasicMaterial({ map: mkTex(128, 64, (g, w, h) => { g.fillStyle = '#7a5230'; g.fillRect(0, 0, w, h); g.fillStyle = '#eee'; for (let i = 0; i < 9; i++) { g.fillStyle = ['#f2f0e6', '#cfe3f5', '#f5dede'][i % 3]; g.fillRect(6 + (i % 5) * 24, 8 + Math.floor(i / 5) * 28, 18, 22); } }) }));
    const cr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshBasicMaterial({ map: crestTex((b.pname || 'UNI').split(' ')[0]), side: THREE.DoubleSide })); cr.position.set(0, 2.2, -Hh + 0.06); root.add(cr); lamp(0, -Hh + 1.4); lamp(-Wh * 0.5, -Hh + 1.6); }
  // lecture hall: whiteboard, podium, desks with chairs, projector
  { const bx = -(Wh + 0.6) / 2; B(Math.min(4, Wh - 1), 1.3, 0.05, bx, 1.9, Hh - 0.05, M.board); B(Math.min(4, Wh - 1) + 0.1, 1.4, 0.04, bx, 1.9, Hh - 0.03, P_.dark); B(1.1, 1.05, 0.6, bx, 0.53, Hh - 1.0, M.dwood); solid(bx - 0.55, bx + 0.55, Hh - 1.3, Hh - 0.7, 1.1);
    B(0.9, 0.04, 0.5, bx + 2.0 * 0, 1.12, Hh - 1.0, M.wood);
    for (const d of G.desks) { B(1.2, 0.05, 0.55, d.x, 0.75, d.z, M.wood); B(0.05, 0.75, 0.5, d.x - 0.55, 0.38, d.z, P_.dark); B(0.05, 0.75, 0.5, d.x + 0.55, 0.38, d.z, P_.dark); solid(d.x - 0.6, d.x + 0.6, d.z - 0.28, d.z + 0.28, 0.8); B(0.45, 0.05, 0.45, d.x, 0.45, d.z - 0.75, M.dwood); B(0.45, 0.5, 0.05, d.x, 0.72, d.z - 0.97, M.dwood); B(0.05, 0.45, 0.05, d.x, 0.22, d.z - 0.75, P_.dark); }
    B(0.5, 0.2, 0.4, bx, IC - 0.5, z0 + 2.2, P_.dark); lamp(bx - 1.0, z0 + 2.0); lamp(bx + 1.0, Hh - 2.0); lamp(bx - 1.0, Hh - 2.0); }
  // library: wall shelves, double-sided stacks, reading table, librarian desk
  { const lw = Wh - 0.7, lx0 = 0.7;
    B(0.4, 2.7, Hh - z0 - 0.6, Wh - 0.2, 1.35, (z0 + Hh) / 2 + 0.1, M.dwood); const fr = new THREE.Mesh(new THREE.PlaneGeometry(Hh - z0 - 0.6, 2.5), M.books); fr.material = M.books.clone(); fr.material.map = M.books.map.clone(); fr.material.map.repeat.set((Hh - z0 - 0.6) / 1.5, 2.5 / 1.1); fr.material.map.needsUpdate = true; fr.position.set(Wh - 0.4, 1.35, (z0 + Hh) / 2 + 0.1); fr.rotation.y = -Math.PI / 2; root.add(fr); solid(Wh - 0.4, Wh, z0 + 0.3, Hh - 0.3, 2.7);
    const stacks = Math.max(1, Math.min(2, Math.floor((lw - 2.4) / 1.6))); for (let k = 0; k < stacks; k++) { const x = lx0 + 1.7 + k * 1.7, len = Hh - z0 - 3.6; B(0.5, 2.3, len, x, 1.15, z0 + 2.2 + len / 2, M.dwood); for (const sd of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.1), M.books.clone()); m.material.map = M.books.map.clone(); m.material.map.repeat.set(len / 1.5, 2); m.material.map.needsUpdate = true; m.position.set(x + sd * 0.26, 1.15, z0 + 2.2 + len / 2); m.rotation.y = sd * Math.PI / 2; root.add(m); } solid(x - 0.3, x + 0.3, z0 + 2.2, z0 + 2.2 + len, 2.3); }
    const tx = lx0 + 1.0, tz = z0 + 1.0; B(1.6, 0.05, 0.8, tx + 1.0, 0.76, tz + 0.2, M.wood); B(0.08, 0.75, 0.08, tx + 0.3, 0.38, tz + 0.2, P_.dark); B(0.08, 0.75, 0.08, tx + 1.7, 0.38, tz + 0.2, P_.dark); solid(tx + 0.2, tx + 1.8, tz - 0.2, tz + 0.6, 0.8); const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x2f6a45, emissive: 0xffd27a, emissiveIntensity: 0.5 })); lm.position.set(tx + 1.0, 0.92, tz + 0.2); root.add(lm);
    lamp(lx0 + 1.6, z0 + 1.6); lamp(lx0 + 1.6, Hh - 2.8); lamp(lx0 + 3.3, Hh - 2.8); }
  // atrium at the back: marble statue on a pedestal, planters, benches
  { const sx = 0, sz = Hh - 1.1; B(1.3, 0.8, 1.3, sx, 0.4, sz, M.marble); B(1.0, 0.1, 1.0, sx, 0.85, sz, M.marble); const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.9, 10), M.marble); legs.position.set(sx, 1.4, sz); root.add(legs); const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.7, 10), M.marble); torso.position.set(sx, 2.15, sz); root.add(torso); const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), M.marble); head.position.set(sx, 2.7, sz); root.add(head); const arm = B(0.1, 0.65, 0.1, sx + 0.3, 2.3, sz, M.marble); arm.rotation.z = -0.5; const book = B(0.25, 0.04, 0.2, sx + 0.45, 2.55, sz, M.marble); solid(sx - 0.7, sx + 0.7, sz - 0.7, sz + 0.7, 3.0);
    for (const x of [-0.3 - 0.0, 0.3]) { } B(1.4, 0.45, 0.4, -2.0 * 0 + 0.0, 0.23, Hh - 3.2, M.wood); lamp(0, Hh - 2.4); }
  for (const x of [-Wh + 0.5, Wh - 0.5]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 10), M.brick); pl.position.set(x * 0.0 + (x < 0 ? -0.1 : 0.1) * 0 + (x < 0 ? -1.3 : 1.3), 0.25, Hh - 0.5); root.add(pl); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), M.green); lf.position.set(pl.position.x, 0.85, Hh - 0.5); root.add(lf); }
  return keys;
}
function uniLife(b) {
  b.staffC = b.staffC || []; const G = uniGeom(b);
  G.spots.forEach((s, i) => {
    const c0 = b.staffC[i]; if (c0 && !c0.dead && !c0.removed) return; if (citizens.length > (isTouch ? 28 : 46)) return;
    try { const c = s.sit ? mkCitizen('sitter', s.x, s.z, s.yaw, { home: new V3(s.x, 0, s.z), isStatic: true, sit: true, label: s.label }) : mkCitizen(s.label === 'professor' ? 'teacher' : 'suit', s.x, s.z, s.yaw, { role: 'worker', label: s.label, name: pick(NAMES), isStatic: true, inst: b, home: new V3(s.x, 0, s.z), tgt: new V3(s.x, 0, s.z) }); c.stand = !s.sit; c.yaw = s.yaw; b.staffC[i] = c; } catch (e) {}
  });
}

for (const b of institutions) if (b.purpose === 'university') uniExterior(b);
