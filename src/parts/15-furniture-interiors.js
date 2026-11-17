// ---------- furniture + doors ----------
const FURN = { bed: { res: 'wood', n: 3 }, table: { res: 'wood', n: 2 }, chair: { res: 'wood', n: 1 }, lamp: { res: 'sand', n: 1 }, shelf: { res: 'wood', n: 2 }, rug: { res: 'wood', n: 1 }, plant: { res: 'wood', n: 1 }, door: { res: 'wood', n: 2 }, sink: { res: 'stone', n: 2 }, toilet: { res: 'stone', n: 2 }, tub: { res: 'stone', n: 3 }, fridge: { res: 'stone', n: 3 }, stove: { res: 'stone', n: 3 } };
const fmc = {}, FM = c => fmc[c] || (fmc[c] = new THREE.MeshLambertMaterial({ color: c }));
function bx(g, w, h, d, x, y, z, col) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), FM(col)); m.position.set(x, y, z); g.add(m); return m; }
function mkFurn(type, g) {
  const legs = (w, d, h, col, th) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, th, h, th, sx * w, h / 2, sz * d, col); };
  switch (type) {
    case 'bed': bx(g, 1.8, 0.45, 1.9, 0, 0.225, 0, 0x6b4423); bx(g, 1.7, 0.22, 1.3, 0, 0.56, 0.3, 0xf2f2f2); bx(g, 1.0, 0.14, 0.4, 0, 0.7, -0.65, 0x4dabf7); bx(g, 1.8, 0.9, 0.12, 0, 0.7, -0.95, 0x6b4423); break;
    case 'table': bx(g, 1.8, 0.12, 1.2, 0, 0.85, 0, 0x9c6b3a); legs(0.8, 0.5, 0.85, 0x7a5230, 0.12); break;
    case 'chair': bx(g, 0.7, 0.1, 0.7, 0, 0.45, 0, 0x9c6b3a); bx(g, 0.7, 0.6, 0.1, 0, 0.8, -0.3, 0x9c6b3a); legs(0.28, 0.28, 0.45, 0x7a5230, 0.08); break;
    case 'lamp': bx(g, 0.5, 0.08, 0.5, 0, 0.04, 0, 0x333333); bx(g, 0.06, 1.5, 0.06, 0, 0.8, 0, 0x555555); { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a0 })); sp.position.y = 1.7; g.add(sp); g.userData.sph = sp.material; } break;
    case 'shelf': bx(g, 1.8, 1.8, 0.1, 0, 0.9, -0.85, 0x5a3b1f); bx(g, 0.1, 1.8, 0.4, -0.85, 0.9, -0.7, 0x5a3b1f); bx(g, 0.1, 1.8, 0.4, 0.85, 0.9, -0.7, 0x5a3b1f);
      for (const y of [0.05, 0.6, 1.15, 1.75]) bx(g, 1.8, 0.08, 0.4, 0, y, -0.7, 0x8b5a2b);
      for (const y of [0.1, 0.65, 1.2]) for (let i = 0; i < 5; i++) bx(g, 0.18, 0.35 + (i % 2) * 0.1, 0.25, -0.65 + i * 0.32, y + 0.22, -0.7, [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad][i]); break;
    case 'rug': bx(g, 1.7, 0.03, 1.7, 0, 0.02, 0, 0xb03a48); bx(g, 1.2, 0.035, 1.2, 0, 0.025, 0, 0xe8c07a); break;
    case 'sink': bx(g, 1.2, 0.85, 0.6, 0, 0.425, -0.5, 0xe8e8e8); bx(g, 1.2, 0.06, 0.6, 0, 0.88, -0.5, 0xbdbdbd); bx(g, 0.7, 0.04, 0.38, 0, 0.9, -0.48, 0x9ec9e8); bx(g, 0.05, 0.3, 0.05, 0, 1.03, -0.75, 0x9aa0a6); bx(g, 0.05, 0.05, 0.22, 0, 1.18, -0.65, 0x9aa0a6);
      { const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.26, 6), new THREE.MeshBasicMaterial({ color: 0x6cc6ff, transparent: true, opacity: 0.65 })); wm.position.set(0, 1.03, -0.55); wm.visible = false; g.add(wm); g.userData.water = wm; } break;
    case 'toilet': bx(g, 0.45, 0.4, 0.55, 0, 0.2, -0.45, 0xf4f4f4); bx(g, 0.5, 0.55, 0.2, 0, 0.65, -0.75, 0xf4f4f4); bx(g, 0.5, 0.05, 0.5, 0, 0.43, -0.42, 0xdcdcdc); break;
    case 'tub': bx(g, 1.8, 0.55, 0.9, 0, 0.275, -0.45, 0xf4f4f4); bx(g, 1.6, 0.04, 0.7, 0, 0.5, -0.45, 0x7fc8ee); break;
    case 'fridge': bx(g, 0.9, 1.8, 0.8, 0, 0.9, -0.45, 0xdfe6ea); { const pv = new THREE.Group(); pv.position.set(-0.45, 0.9, -0.03); bx(pv, 0.9, 1.7, 0.06, 0.45, 0, 0, 0xf0f4f6); bx(pv, 0.05, 0.4, 0.06, 0.8, 0.2, 0.05, 0x999999); g.add(pv); g.userData.pivot = pv; } break;
    case 'stove': bx(g, 1.0, 0.9, 0.7, 0, 0.45, -0.5, 0x4b4f54); bx(g, 0.8, 0.5, 0.04, 0, 0.4, -0.14, 0x8a8f94); g.userData.burn = [];
      for (const [x, z] of [[-0.25, -0.35], [0.25, -0.35], [-0.25, -0.65], [0.25, -0.65]]) { const bm = new THREE.MeshBasicMaterial({ color: 0x222222 }), c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 10), bm); c.position.set(x, 0.91, z); g.add(c); g.userData.burn.push(bm); } break;
    case 'plant': { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.4, 10), FM(0xb5651d)); pot.position.y = 0.2; g.add(pot); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), FM(0x2f8f3f)); lf.position.y = 0.85; g.add(lf); } break;
  }
}
function addFurniture(cx, cy, cz, type, rot = 0, anim = false, doSave = true) {
  const k = cx + ',' + cy + ',' + cz;
  if (!FURN[type] || furn.has(k) || blockMeshes.has(k)) return false;
  const g = new THREE.Group(), x = cx * 2 + 1, z = cz * 2 + 1, y = cy * 2; let pivot = null;
  if (type === 'door') { pivot = new THREE.Group(); pivot.position.set(-0.9, 0, 0); bx(pivot, 1.8, 1.95, 0.16, 0.9, 0.975, 0, 0x8b5a2b); bx(pivot, 0.1, 0.1, 0.22, 1.55, 0.95, 0, 0xd4af37); g.add(pivot); } else mkFurn(type, g);
  g.position.set(x, y, z); g.rotation.y = -rot * Math.PI / 2; scene.add(g); g.updateMatrixWorld(true);
  const o = { k, cx, cy, cz, f: type, rot, grp: g, pivot, meshes: [] };
  g.traverse(m => { if (m.isMesh) { m.userData.fk = k; targets.push(m); o.meshes.push(m); } });
  furn.set(k, o); if (USEF.has(type)) regUse(g, type, o);
  if (type === 'door') { const al = rot % 2 === 0, hw = al ? 0.9 : 0.1, hd = al ? 0.1 : 0.9; o.box = new THREE.Box3(new V3(x - hw, y, z - hd), new V3(x + hw, y + 1.95, z + hd)); o.open = 0; o.solid = true; solids.set('d' + k, o.box); doors.push(o); }
  if (anim) { g.scale.setScalar(0.3); grow.push({ m: g, t: 0 }); }
  if (net.on && !net.applying) netSend({ t: 'f+', a: [cx, cy, cz, type, rot] });
  if (doSave) queueSave();
  return true;
}
function delFurniture(k) {
  const o = furn.get(k); if (!o) return;
  scene.remove(o.grp); o.meshes.forEach(m => { const i = targets.indexOf(m); if (i >= 0) targets.splice(i, 1); });
  furn.delete(k); unregOwner(o); if (o.f === 'door') { doors.splice(doors.indexOf(o), 1); solids.delete('d' + k); } if (net.on && !net.applying) netSend({ t: 'f-', k }); queueSave();
}
function updateDoors(dt) {
  for (const d of doors) {
    const cx = d.cx * 2 + 1, cz = d.cz * 2 + 1, cy = d.cy * 2; let near = false;
    const chk = p => { if (Math.abs(p.x - cx) < 3.2 && Math.abs(p.z - cz) < 3.2 && Math.abs(p.y - cy) < 3) near = true; };
    if (!inCar) chk(P.pos); for (const n of npcs) chk(n.pos); for (const e of enemies) if (!e.dead) chk(e.pos); for (const e of cops) if (!e.dead) chk(e.pos);
    d.open += ((near ? 1 : 0) - d.open) * Math.min(1, dt * 8); d.pivot.rotation.y = d.open * 1.55;
    if (d.open > 0.5 && d.solid) { solids.delete('d' + d.k); d.solid = false; } else if (d.open <= 0.5 && !d.solid) { solids.set('d' + d.k, d.box); d.solid = true; }
  }
}

// ---------- interactive fixtures (E to use) ----------
const useables = [], USEF = new Set(['lamp', 'sink', 'toilet', 'fridge', 'stove', 'bed']);
const USEN = { lamp: 'switch lamp', sink: 'turn tap', toilet: 'flush', fridge: 'open fridge', stove: 'use stove', bed: 'sleep' };
function regUse(grp, f, owner) { const u = { grp, f, owner, st: 0, t: 0, snd: 0 }; useables.push(u); return u; }
function unregOwner(o) { for (let i = useables.length - 1; i >= 0; i--) if (useables[i].owner === o) useables.splice(i, 1); }
function nearestUse() { let b = null, bd = 2.8; for (const u of useables) { const d = Math.hypot(u.grp.position.x - P.pos.x, u.grp.position.z - P.pos.z); if (d < bd && Math.abs(u.grp.position.y - P.pos.y) < 2.5) { bd = d; b = u; } } return b; }
function useIt(u) {
  const f = u.f, ud = u.grp.userData;
  if (f === 'lamp') { u.st = u.st ? 0 : 1; ud.sph.color.setHex(u.st ? 0x555555 : 0xffe9a0); sfx('click'); }
  else if (f === 'sink') { u.st = u.st ? 0 : 1; ud.water.visible = !!u.st; u.t = 14; sfx('click'); }
  else if (f === 'toilet') sfx('flush');
  else if (f === 'fridge') { u.st = u.st ? 0 : 1; sfx('click'); }
  else if (f === 'stove') { u.st = u.st ? 0 : 1; ud.burn.forEach(m => m.color.setHex(u.st ? 0xff4422 : 0x222222)); sfx('click'); if (u.st) sfx('sizzle'); }
  else if (f === 'bed') { dayT = 0.27; msg('You slept. Good morning!', 2200); sfx('click'); }
}
function tryUse() { const u = nearestUse(); if (!u) return false; useIt(u); return true; }
function updateUse(dt) {
  for (const u of useables) {
    const ud = u.grp.userData;
    if (u.f === 'sink' && u.st) { u.t -= dt; if (u.t <= 0) { u.st = 0; ud.water.visible = false; } else { u.snd -= dt; if (u.snd <= 0) { u.snd = 0.28; sfxAt(u.grp.position, 'water'); } } }
    if (u.f === 'fridge') ud.pivot.rotation.y += ((u.st ? -1.6 : 0) - ud.pivot.rotation.y) * Math.min(1, dt * 6);
  }
}

// ---------- city interiors (spawn when you get close) ----------
let cityT = 0;
function setActive(b, on) { if (b.on === on) return; b.on = on; b.boxes.forEach((bx_, i) => { const k = 'b' + b.id + '_' + i; if (on) solids.set(k, bx_); else solids.delete(k); }); }
function mkCityDoor(b) {
  const ry = b.ry, nx = Math.round(Math.sin(ry)), nz = Math.round(Math.cos(ry)), ew = ry === 0 || ry === Math.PI, half = ew ? b.d / 2 : b.w / 2;
  const wx = b.x + nx * (half - CT / 2), wz = b.z + nz * (half - CT / 2), grp = new THREE.Group(), pivot = new THREE.Group(); pivot.position.set(-CDW / 2, 0, 0);
  bx(pivot, CDW, CDH - 0.05, 0.14, CDW / 2, (CDH - 0.05) / 2, 0, 0x7a4a24); bx(pivot, 0.12, 0.12, 0.24, CDW - 0.25, 1.4, 0, 0xd4af37);
  grp.add(pivot); grp.position.set(wx, 0, wz); grp.rotation.y = ry; scene.add(grp);
  const hw = ew ? CDW / 2 : 0.1, hd = ew ? 0.1 : CDW / 2, box = new THREE.Box3(new V3(wx - hw, 0, wz - hd), new V3(wx + hw, CDH, wz + hd));
  const o = { k: 'cd' + b.id, cx: (wx - 1) / 2, cy: 0, cz: (wz - 1) / 2, pivot, grp, box, solid: true, open: 0 };
  solids.set('d' + o.k, box); doors.push(o); return o;
}
function spawnInterior(b) {
  let sd = (b.id * 7919 + 13) % 2147483647 || 1; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const kind = b.purpose ? ({ school: 'school', university: 'school', company: 'office', nasa: 'office', police: 'office', bank: 'office', prison: 'office' })[b.purpose] : ['home', 'office', 'store', 'cafe'][Math.floor(r() * 4)], groups = [], PI = Math.PI, crowd = [];
  const put = (type, x, z, rot) => { const g = new THREE.Group(); mkFurn(type, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); groups.push(g); if (USEF.has(type)) regUse(g, type, b); };
  const slots = [];
  for (const sr of [0, PI / 2, PI, -PI / 2]) {
    const sx = Math.round(Math.sin(sr)), sz = Math.round(Math.cos(sr)), tx = Math.round(Math.cos(sr)), tz = -Math.round(Math.sin(sr));
    const ew = sr === 0 || sr === PI, Lw = ew ? b.w : b.d, half = ew ? b.d / 2 : b.w / 2;
    for (let u = -Lw / 2 + 2.9; u <= Lw / 2 - 2.9; u += 2.3) { if (sr === b.ry && Math.abs(u) < 2.6) continue; slots.push({ x: b.x + sx * (half - CT - 0.95) + tx * u, z: b.z + sz * (half - CT - 0.95) + tz * u, rot: sr + PI }); }
  }
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const WALL = { home: ['bed', 'fridge', 'stove', 'sink', 'shelf', 'toilet', 'tub', 'lamp', 'plant', 'bed'], office: ['shelf', 'shelf', 'plant', 'lamp', 'shelf', 'sink', 'toilet', 'plant'], store: ['shelf', 'shelf', 'shelf', 'shelf', 'fridge', 'plant', 'lamp', 'shelf'], cafe: ['stove', 'fridge', 'sink', 'shelf', 'plant', 'lamp', 'toilet', 'plant'], school: ['shelf', 'shelf', 'plant', 'lamp', 'shelf', 'toilet', 'sink', 'plant'] }[kind];
  slots.forEach((sl, i) => { if (i < WALL.length) put(WALL[i], sl.x, sl.z, sl.rot); });
  const set = (x, z) => { put('table', x, z, 0); put('chair', x - 1.3, z, PI / 2); put('chair', x + 1.3, z, -PI / 2); };
  const sit = (x, z, yaw) => { if (crowd.length >= 6) return; let c; try { c = mkCitizen('sitter', x, z, yaw, { home: new V3(x, 0, z), isStatic: true, sit: true }); } catch (e) { return; } if (b.purpose === 'school') c.g.scale.setScalar(0.65); crowd.push(c); };
  if (kind === 'school') { const sets = Math.min(b.w, b.d) >= 9 ? [[-2.4, -1.5], [2.4, -1.5], [-2.4, 1.5], [2.4, 1.5]] : [[0, 0]]; for (const [dx, dz] of sets) { set(b.x + dx, b.z + dz); sit(b.x + dx - 1.3, b.z + dz, PI / 2); sit(b.x + dx + 1.3, b.z + dz, -PI / 2); } }
  if (kind === 'school') {
    const ox = Math.sin(b.ry), oz = Math.cos(b.ry), hf = (b.ry === 0 || b.ry === PI) ? b.d / 2 : b.w / 2, bd = mkBoard(b.id); bd.position.set(b.x - ox * (hf - CT - 0.06), 1.7, b.z - oz * (hf - CT - 0.06)); bd.rotation.y = b.ry; scene.add(bd); groups.push(bd);
    try { const tx = b.x - ox * (hf - CT - 1.7), tz = b.z - oz * (hf - CT - 1.7), tc = mkCitizen('teacher', tx, tz, b.ry + PI, { home: new V3(tx, 0, tz), isStatic: true, inst: b }); tc.teacher = true; crowd.push(tc); } catch (e) {}
  }
  if (kind === 'school') {} else if (Math.min(b.w, b.d) >= 9) {
    if (kind === 'home') { put('rug', b.x, b.z, 0); set(b.x, b.z); } else if (kind === 'office') { set(b.x - 2.5, b.z); set(b.x + 2.5, b.z + 1.5); } else if (kind === 'cafe') { set(b.x - 2.2, b.z); set(b.x + 2.2, b.z); } else put('table', b.x, b.z, 0);
  }
  b.int = { groups, crowd, door: mkCityDoor(b) };
}
function despawnInterior(b) {
  const it = b.int; if (!it) return; for (const c of it.crowd || []) removeCitizen(c);
  for (const g of it.groups) { scene.remove(g); g.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); }
  unregOwner(b); const d = it.door; solids.delete('d' + d.k); const i = doors.indexOf(d); if (i >= 0) doors.splice(i, 1); scene.remove(d.grp); b.int = null;
}
function updateCity() {
  const pts = [P.pos, ...npcs.map(n => n.pos)];
  for (const b of buildings) {
    let dm = 1e9; for (const p of pts) { const dx = Math.max(0, Math.abs(p.x - b.x) - b.w / 2), dz = Math.max(0, Math.abs(p.z - b.z) - b.d / 2); dm = Math.min(dm, Math.hypot(dx, dz)); }
    setActive(b, dm < (b.on ? 100 : 85));
    const inter = dm < (b.int ? 48 : 36); if (inter && !b.int) spawnInterior(b); else if (!inter && b.int) despawnInterior(b);
  }
}
// restore saved furniture LAST: addFurniture needs USEF/useables (declared above), otherwise loading a saved world crashes at start-up
if (pendingFurn) pendingFurn.forEach(a => addFurniture(a[0], a[1], a[2], a[3], a[4], false, false));
