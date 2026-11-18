// ---------- NASA interior: lobby + reception, badge-locked security gate, laboratory, Mission Control (glass wall, staff badge), rocket assembly bay with gantry ----------
const NASA = { pass: 0, badge: 0, msgT: 0 }, NM = {}, NIC = 8;
function nasaMats() {
  if (NM.panel) return NM; pjMats();
  const panel = mkTex(64, 64, (g, w, h) => { g.fillStyle = '#d9dde2'; g.fillRect(0, 0, w, h); speck(g, w, h, 300, 'rgba(255,255,255,.2)', 'rgba(0,0,0,.08)'); g.fillStyle = 'rgba(40,60,100,.35)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillStyle = 'rgba(40,60,100,.18)'; g.fillRect(w / 2, 0, 1, h); });
  NM.panel = new THREE.MeshStandardMaterial({ map: panel, roughness: 0.7, metalness: 0.1 });
  NM.blue = new THREE.MeshStandardMaterial({ color: 0x1b3a78, roughness: 0.5, metalness: 0.25 });
  NM.white = new THREE.MeshStandardMaterial({ color: 0xf1f3f6, roughness: 0.4, metalness: 0.2 });
  NM.red = new THREE.MeshStandardMaterial({ color: 0xcf2f22, roughness: 0.5 });
  NM.black = new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.6, metalness: 0.2 });
  NM.glass = new THREE.MeshStandardMaterial({ color: 0x9fc4e8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });
  NM.screenB = new THREE.MeshStandardMaterial({ color: 0x14283f, emissive: 0x2f7fd0, emissiveIntensity: 1.2, roughness: 0.4 });
  NM.screenG = new THREE.MeshStandardMaterial({ color: 0x10281c, emissive: 0x30d070, emissiveIntensity: 1.1, roughness: 0.4 });
  NM.amber = new THREE.MeshStandardMaterial({ color: 0xffb020, emissive: 0xff9a10, emissiveIntensity: 1.8 });
  const hz = mkTex(64, 64, (g, w, h) => { g.fillStyle = '#e8c21c'; g.fillRect(0, 0, w, h); g.fillStyle = '#17181a'; for (let i = -h; i < w + h; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 8 - h, h); g.lineTo(i - h, h); g.fill(); } });
  NM.hazard = new THREE.MeshBasicMaterial({ map: hz, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  NM.drum = [0x2f5fb0, 0xb03a2e, 0x3a8a4a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.35 }));
  NM.crate = new THREE.MeshStandardMaterial({ color: 0x8f6f45, roughness: 0.9 });
  NM.vid = new THREE.MeshBasicMaterial({ map: mkTex(256, 128, (g, w, h) => {
    g.fillStyle = '#06101f'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(70,150,255,.25)'; g.lineWidth = 1; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#37e08a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h * 0.8); g.bezierCurveTo(w * 0.3, h * 0.1, w * 0.6, h * 0.9, w, h * 0.25); g.stroke();
    g.fillStyle = '#3fa0ff'; for (let i = 0; i < 70; i++) g.fillRect(rr(0, w), rr(0, h), 2, 2); g.fillStyle = '#ff6a3a'; g.beginPath(); g.arc(w * 0.78, h * 0.3, 7, 0, 6.3); g.fill();
    g.fillStyle = '#9fd0ff'; g.font = 'bold 13px monospace'; g.fillText('MISSION CONTROL', 8, 16); g.font = '10px monospace'; g.fillText('T-00:42:17   ALT 408 KM   VEL 7.66 KM/S', 8, 30); g.fillText('ALL SYSTEMS NOMINAL', 8, h - 8); }) });
  NM.logo = new THREE.MeshBasicMaterial({ map: mkTex(128, 128, (g, w, h) => { g.fillStyle = '#0b3d91'; g.beginPath(); g.arc(w / 2, h / 2, 60, 0, 6.3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.strokeStyle = '#fc3d21'; g.lineWidth = 6; g.beginPath(); g.moveTo(14, 96); g.quadraticCurveTo(64, 20, 118, 62); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('NASA', w / 2, h / 2 + 10); g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect(rr(20, 108), rr(20, 108), 1.5, 1.5); }), transparent: true });
  return NM;
}
function nasaGeom(b) {
  const ew = b.ry === 0 || b.ry === Math.PI, Lw = ew ? b.w : b.d, Dd = ew ? b.d : b.w, W = Lw - 2 * CT, D = Dd - 2 * CT, Wh = W / 2, Hh = D / 2, zg = -Hh + 4, lz = Math.min(4.2, Math.max(2.6, (Hh - zg) * 0.5)), zc = zg + lz;
  const th = b.ry + Math.PI, c = Math.cos(th), s = Math.sin(th), toW = (x, z) => ({ x: b.x + x * c + z * s, z: b.z - x * s + z * c });
  const rows = Math.max(1, Math.min(3, Math.floor((Hh - zc - 1.7) / 1.4))), cons = []; for (let k = 0; k < rows; k++) for (const x of [-Wh + 1.15, -2.25]) cons.push({ x, z: zc + 0.85 + k * 1.4 });
  const spots = [{ ...toW(-Wh * 0.5, -Hh + 2.9), yaw: b.ry, label: 'receptionist' }, { ...toW(1.5, zg - 0.8), yaw: b.ry, label: 'security guard' }, { ...toW(-(Wh + 1.1) / 2, zg + lz * 0.5 + 0.9), yaw: b.ry + Math.PI, label: 'scientist' }, { ...toW(-Wh + 1.2, zg + 0.9), yaw: b.ry + Math.PI / 2 * 1, label: 'lab technician' }, { ...toW(Wh - 1.3, zg + 1.0), yaw: b.ry + Math.PI, label: 'rocket engineer' }];
  for (const k of cons.slice(0, 3)) spots.push({ ...toW(k.x, k.z + 0.75), yaw: b.ry + Math.PI, label: 'flight controller' });
  return { W, D, Wh, Hh, zg, lz, zc, th, toW, rows, cons, spots, desk: toW(-Wh * 0.5, -Hh + 2.0) };
}
function buildNasaInterior(b, groups) {
  const M = nasaMats(), P_ = pjMats(), G = nasaGeom(b), { Wh, Hh, zg, lz, zc } = G, IC = NIC, keys = [], doors = [], root = new THREE.Group(); root.position.set(b.x, 0, b.z); root.rotation.y = G.th; scene.add(root); groups.push(root);
  const B = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); root.add(m); return m; };
  const mkBox = (x0, x1, z0, z1, y1) => { const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => G.toW(x, z)); return new THREE.Box3(new V3(Math.min(...pts.map(p => p.x)), 0, Math.min(...pts.map(p => p.z))), new V3(Math.max(...pts.map(p => p.x)), y1, Math.max(...pts.map(p => p.z)))); };
  const solid = (x0, x1, z0, z1, y1) => { const k = 'nj' + b.id + '_' + keys.length; solids.set(k, mkBox(x0, x1, z0, z1, y1 || IC)); keys.push(k); };
  const wall = (x0, x1, za, zb, y0, y1, mat, noSolid) => { y0 = y0 || 0; y1 = y1 || IC; B(x1 - x0, y1 - y0, zb - za, (x0 + x1) / 2, (y0 + y1) / 2, (za + zb) / 2, mat || M.panel); if (!noSolid) solid(x0, x1, za, zb, y1); };
  const door = (lx, lz_, axis, w, level, label) => {
    const h = 2.6, A = B(1, h, 0.1, 0, h / 2, 0, M.blue), Bm = B(1, h, 0.1, 0, h / 2, 0, M.blue), k = 'nd' + b.id + '_' + doors.length, p = G.toW(lx, lz_);
    const d = { lx, lz: lz_, axis, w, level, A, B: Bm, o: 0, k, box: axis === 'x' ? mkBox(lx - w / 2, lx + w / 2, lz_ - 0.1, lz_ + 0.1, h) : mkBox(lx - 0.1, lx + 0.1, lz_ - w / 2, lz_ + w / 2, h), solid: true, wx: p.x, wz: p.z, label };
    solids.set(k, d.box); keys.push(k); doors.push(d); nasaDoorPose(d); return d;
  };
  const panelTxt = (txt, w, h, x, y, z, ry, bg, fg, px) => { const m = txtPlane(txt, w, h, bg || '#10233f', fg || '#e8f1ff', px || 26); m.position.set(x, y, z); m.rotation.y = ry; root.add(m); return m; };
  // ---- gate wall + lobby ----
  wall(-Wh, -0.8, zg - 0.12, zg + 0.12); wall(0.8, Wh, zg - 0.12, zg + 0.12); B(1.6, IC - 2.6, 0.24, 0, 2.6 + (IC - 2.6) / 2, zg, M.panel);
  door(0, zg, 'x', 1.6, 1, 'Visitor pass');
  panelTxt('SECURITY — AUTHORISED ONLY', 2.4, 0.34, 0, 3.0, zg - 0.14, Math.PI, '#e0b41e', '#17181a', 15);
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), M.logo); lg.position.set(-Wh * 0.5, 3.1, -Hh + 0.06); root.add(lg);
  { const cx = -Wh * 0.5, cz = -Hh + 2.0; B(2.7, 1.05, 0.75, cx, 0.53, cz, M.white); B(2.76, 0.06, 0.82, cx, 1.08, cz, M.blue); solid(cx - 1.35, cx + 1.35, cz - 0.4, cz + 0.4, 1.1);
    const mn = B(0.5, 0.34, 0.04, cx - 0.5, 1.35, cz + 0.2, M.screenB); mn.rotation.y = Math.PI; B(0.4, 0.02, 0.14, cx - 0.5, 1.12, cz - 0.08, M.black); B(0.16, 0.12, 0.12, cx + 0.7, 1.15, cz, M.black); }
  panelTxt('WELCOME TO THE SPACE CENTRE', 2.2, 0.3, Wh * 0.5, 2.4, -Hh + 0.07, 0, '#0c2547', '#d8ecff', 14);
  { const x = Wh * 0.55, z = -Hh + 2.3; const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.7, 14), M.blue); ped.position.set(x, 0.35, z); root.add(ped);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 12), M.white); body.position.set(x, 1.4, z); root.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 12), M.red); nose.position.set(x, 2.35, z); root.add(nose);
    for (let i = 0; i < 4; i++) { const f = B(0.04, 0.4, 0.3, x + Math.cos(i * 1.57) * 0.2, 0.9, z + Math.sin(i * 1.57) * 0.2, M.blue); f.rotation.y = -i * 1.57; }
    solid(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 2.6);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.6 })); gl.position.set(Wh * 0.55 - 1.7, 1.05, -Hh + 3.0); root.add(gl); B(0.08, 0.7, 0.08, Wh * 0.55 - 1.7, 0.35, -Hh + 3.0, M.black); solid(Wh * 0.55 - 2.0, Wh * 0.55 - 1.4, -Hh + 2.7, -Hh + 3.3, 1.4); }
  for (const [t, x] of [['APOLLO', -Wh + 0.04], ['MARS', -Wh + 0.04]]) { const m = txtPlane(t, 0.9, 0.6, '#16213a', '#ffd27a', 22); m.position.set(x, 1.9, t === 'APOLLO' ? -Hh + 1.2 : zg - 0.8); m.rotation.y = Math.PI / 2; root.add(m); }
  B(0.4, 0.45, 2.0, Wh - 0.35, 0.23, zg - 1.0, M.steel || P_.steel); solid(Wh - 0.55, Wh - 0.15, zg - 2.0, zg - 0.0, 0.5);
  // ---- behind the gate: aisle with yellow guide lines; left wing (lab + control), right wing = assembly bay ----
  for (const x of [-0.78, 0.98]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, Hh - zg), P_.yellow); m.position.set(x, 0.045, (zg + Hh) / 2); root.add(m); }
  // left partition x = -1: lab doorway (open) + control glass wall with badge door
  const lm = zg + lz / 2;
  wall(-1.1, -0.9, zg + 0.12, lm - 0.55); wall(-1.1, -0.9, lm + 0.55, zc - 0.1); B(0.2, IC - 2.5, 1.1, -1.0, 2.5 + (IC - 2.5) / 2, lm, M.panel); solid(-1.1, -0.9, lm - 0.55, lm + 0.55, IC); solids.delete(keys.pop());  // lintel is not solid in the doorway
  wall(-Wh, -0.9, zc - 0.1, zc + 0.1);
  const cm = zc + (Hh - zc) / 2;
  wall(-1.1, -0.9, zc + 0.1, cm - 0.6, 0, 0.9); B(0.2, 2.3, cm - 0.6 - zc - 0.1, -1.0, 2.05, (zc + 0.1 + cm - 0.6) / 2, M.glass); wall(-1.1, -0.9, zc + 0.1, cm - 0.6, 3.2, IC, M.panel, true);
  wall(-1.1, -0.9, cm + 0.6, Hh, 0, 0.9); B(0.2, 2.3, Hh - cm - 0.6, -1.0, 2.05, (cm + 0.6 + Hh) / 2, M.glass); wall(-1.1, -0.9, cm + 0.6, Hh, 3.2, IC, M.panel, true);
  solid(-1.1, -0.9, zc + 0.1, cm - 0.6, 3.2); solid(-1.1, -0.9, cm + 0.6, Hh, 3.2); B(0.2, IC - 2.6, 1.2, -1.0, 2.6 + (IC - 2.6) / 2, cm, M.panel);
  door(-1.0, cm, 'z', 1.2, 2, 'Staff badge');
  panelTxt('MISSION CONTROL — STAFF ONLY', 2.0, 0.3, -0.86, 3.5, cm, Math.PI / 2, '#5a1010', '#ffe0e0', 13); panelTxt('LABORATORY — VISITORS', 1.8, 0.3, -0.86, 3.0, lm, Math.PI / 2, '#10233f', '#e8f1ff', 13);
  // laboratory
  { const bx = -(Wh + 1.1) / 2; B(2.4, 0.95, 0.85, bx, 0.48, lm, M.white); B(2.46, 0.06, 0.9, bx, 0.98, lm, M.black); solid(bx - 1.2, bx + 1.2, lm - 0.45, lm + 0.45, 1.0);
    const flaskM = [0x58c2ff, 0xff7a58, 0x7dff9a].map(c => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.6, roughness: 0.2 }));
    for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(i % 2 ? new THREE.ConeGeometry(0.1, 0.22, 10) : new THREE.CylinderGeometry(0.05, 0.05, 0.24, 8), flaskM[i % 3]); f.position.set(bx - 0.9 + i * 0.35, 1.13, lm + (i % 2 ? 0.15 : -0.12)); root.add(f); }
    B(0.14, 0.34, 0.14, bx + 0.9, 1.17, lm, M.black); const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), M.steel || P_.steel); sc.position.set(bx + 0.9, 1.16, lm + 0.08); root.add(sc);
    const lx = -Wh + 0.4; B(0.7, 0.95, lz - 1.6, lx, 0.48, zg + 0.7 + (lz - 1.6) / 2, M.white); solid(lx - 0.35, lx + 0.35, zg + 0.7, zg + lz - 0.9, 1.0);
    for (let y of [1.5, 2.1]) { B(0.3, 0.05, lz - 1.6, lx - 0.1, y, zg + 0.7 + (lz - 1.6) / 2, M.white); for (let i = 0; i < 6; i++) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), flaskM[(i + (y > 1.6 ? 1 : 0)) % 3]); bt.position.set(lx - 0.1, y + 0.12, zg + 0.9 + i * ((lz - 2) / 5)); root.add(bt); } }
    B(0.9, 2.2, 1.0, lx + 0.1, 1.1, zc - 0.65, M.white); B(0.04, 1.2, 0.9, lx + 0.56, 1.4, zc - 0.65, M.glass); solid(lx - 0.35, lx + 0.55, zc - 1.15, zc - 0.15, 2.2);
    B(0.7, 1.8, 0.7, -1.7, 0.9, zg + 0.45, M.white); B(0.04, 0.9, 0.5, -1.35, 1.3, zg + 0.45, M.screenG); solid(-2.05, -1.35, zg + 0.1, zg + 0.8, 1.8); }
  // mission control: consoles facing the video wall
  for (const k of G.cons) { B(1.5, 0.75, 0.7, k.x, 0.38, k.z, M.black); B(1.5, 0.06, 0.74, k.x, 0.78, k.z, M.blue); for (const dx of [-0.4, 0.4]) { const m = B(0.5, 0.34, 0.04, k.x + dx, 1.08, k.z + 0.15, Math.random() < 0.5 ? M.screenB : M.screenG); m.rotation.x = -0.2; } B(0.5, 0.45, 0.45, k.x, 0.3, k.z - 0.9, M.black); B(0.5, 0.5, 0.06, k.x, 0.75, k.z - 1.12, M.black); solid(k.x - 0.75, k.x + 0.75, k.z - 0.37, k.z + 0.37, 1.0); }
  { const vw = new THREE.Mesh(new THREE.PlaneGeometry(Wh - 1.5, 2.4), M.vid); vw.position.set(-(Wh + 1.0) / 2, 3.3, Hh - 0.06); vw.rotation.y = Math.PI; root.add(vw); B(Wh - 1.4, 2.5, 0.08, -(Wh + 1.0) / 2, 3.3, Hh - 0.03, M.black); }
  // ---- assembly bay: rocket on a hazard-striped pad, gantry, crane, drums, crates, pipes ----
  const rx = 1.0 + 1.9, rz = zg + (Hh - zg) * 0.52;
  { const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.25, 20), M.black); pad.position.set(rx, 0.13, rz); root.add(pad); const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.5, 24), M.hazard); ring.rotation.x = -Math.PI / 2; ring.position.set(rx, 0.27, rz); root.add(ring);
    for (let i = 0; i < 3; i++) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.75, 12, 1, true), M.black); e.position.set(rx + Math.cos(i * 2.09) * 0.32, 0.65, rz + Math.sin(i * 2.09) * 0.32); e.rotation.x = Math.PI; root.add(e); }
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 4.4, 20), M.white); body.position.set(rx, 3.2, rz); root.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.73, 0.5, 20), M.black); band.position.set(rx, 2.0, rz); root.add(band); const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.73, 0.16, 20), M.red); band2.position.set(rx, 4.5, rz); root.add(band2);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.8, 20), M.white); nose.position.set(rx, 6.3, rz); root.add(nose);
    for (let i = 0; i < 4; i++) { const f = B(0.06, 1.3, 0.7, rx + Math.cos(i * 1.57) * 0.95, 1.3, rz + Math.sin(i * 1.57) * 0.95, M.blue); f.rotation.y = -i * 1.57; f.rotation.z = Math.cos(i * 1.57) * 0.0; }
    for (const y of [3.0, 4.0]) { const pr = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), M.black); pr.position.set(rx, y, rz - 0.7); root.add(pr); }
    solid(rx - 1.0, rx + 1.0, rz - 1.0, rz + 1.0, IC);
    // gantry tower on the right wall
    const gx = Wh - 0.45; for (const z of [rz - 1.7, rz + 1.7]) { B(0.14, IC - 0.5, 0.14, gx, (IC - 0.5) / 2, z, M.black); B(0.14, IC - 0.5, 0.14, gx - 0.9, (IC - 0.5) / 2, z, M.black); solid(gx - 0.07, gx + 0.07, z - 0.07, z + 0.07, IC); }
    for (const y of [2.4, 4.4, 6.4]) { B(1.1, 0.08, 3.5, gx - 0.45, y, rz, M.steel || P_.steel); for (const z of [rz - 1.7, rz + 1.7]) B(1.1, 0.5, 0.04, gx - 0.45, y + 0.28, z, M.black); }
    B(1.7, 0.1, 0.8, gx - 1.7, 4.4, rz, M.steel || P_.steel); B(0.1, 0.1, 0.1, rx, 4.4, rz, M.red);
    for (const [y0, y1] of [[0.1, 2.4], [2.4, 4.4], [4.4, 6.4]]) for (const z of [rz - 1.7, rz + 1.7]) { const br = B(0.05, Math.hypot(y1 - y0, 0.9), 0.05, gx - 0.45, (y0 + y1) / 2, z, M.black); br.rotation.z = Math.atan2(0.9, y1 - y0) * 0.0; br.rotation.x = 0; }
    // overhead crane + hook
    B(Wh - 0.8, 0.3, 0.3, (1.0 + Wh) / 2 - 0.0, IC - 0.5, rz, M.amber); B(0.08, 1.2, 0.08, rx, IC - 1.2, rz, M.black); B(0.3, 0.2, 0.3, rx, IC - 1.9, rz, M.amber);
    // drums, crates, pipes, hazard border and tanks
    for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12), NM.drum[i % 3]); d.position.set(1.4 + (i % 3) * 0.4, 0.45, Hh - 0.45 - (i > 2 ? 0.45 : 0)); root.add(d); } solid(1.05, 2.5, Hh - 1.0, Hh - 0.1, 1.0);
    B(0.9, 0.9, 0.9, 1.6, 0.45, zg + 0.65, NM.crate); B(0.7, 0.7, 0.7, 1.65, 1.25, zg + 0.65, NM.crate); solid(1.15, 2.05, zg + 0.2, zg + 1.1, 1.6);
    for (const y of [3.2, 3.6]) { const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, Wh - 1.2, 8), y < 3.4 ? M.black : (M.red)); pp.rotation.z = Math.PI / 2; pp.position.set((1.0 + Wh) / 2, y, Hh - 0.12); root.add(pp); }
    for (const x of [2.3, 3.9]) { const vw = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 14), M.red); vw.position.set(x, 2.0, Hh - 0.1); root.add(vw); B(0.06, 2.0, 0.06, x, 1.0, Hh - 0.12, M.black); }
    for (const [x0, x1, z0_, z1] of [[1.1, Wh - 0.1, zg + 0.1, zg + 0.35], [1.1, 1.35, zg + 0.1, Hh - 0.1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0_), M.hazard); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.05, (z0_ + z1) / 2); root.add(m); }
    if (G.D >= 12.5) for (const x of [2.0, 4.0]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.1, 16), M.white); t.rotation.x = Math.PI / 2; t.position.set(x, 0.62, zg + 1.2); root.add(t); B(0.1, 0.35, 1.8, x, 0.17, zg + 1.2, M.black); solid(x - 0.5, x + 0.5, zg + 0.1, zg + 2.3, 1.1); }
  }
  // lighting fixtures + beacons
  for (const [x, z, l] of [[0, -Hh + 2.0, 2.6], [0, (zg + Hh) / 2, 4], [-Wh / 2 - 0.5, lm, 2], [-Wh / 2 - 0.5, cm + 0.2, 2.2], [3.0, rz, 3.6]]) B(0.22, 0.08, l, x, IC - 0.1, z, P_.lamp);
  for (const z of [rz - 1.2, rz + 1.2]) { const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.35, 0.28, 10), M.black); hl.position.set(3.0, IC - 1.2, z); root.add(hl); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), P_.lamp); bulb.position.set(3.0, IC - 1.38, z); root.add(bulb); B(0.03, 1.0, 0.03, 3.0, IC - 0.6, z, M.black); }
  B(0.2, 0.2, 0.2, Wh - 0.2, IC - 0.4, zg + 0.3, M.amber); B(0.2, 0.2, 0.2, -Wh + 0.2, IC - 0.4, Hh - 0.3, M.red);
  // reception use + door visuals state
  const gdesk = new THREE.Group(); gdesk.position.set(G.desk.x, 0, G.desk.z); scene.add(gdesk); groups.push(gdesk); const dm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), M.amber); dm.position.y = 1.4; dm.visible = false; gdesk.add(dm); regUse(gdesk, 'nasadesk', b);
  for (const [ox, dest] of [[-1.2, 'moon'], [1.2, 'mars']]) { const w = G.toW(rx + ox, rz + 1.9), gr = new THREE.Group(); gr.position.set(w.x, 0, w.z); scene.add(gr); groups.push(gr); regUse(gr, 'nasarocket', { dest }); }
  return { keys, doors };
}
function nasaDoorPose(d) {
  const half = d.w / 2, gap = Math.max(0.03, half * (1 - d.o));
  for (const [m, sg] of [[d.A, -1], [d.B, 1]]) {
    if (d.axis === 'x') { m.rotation.y = 0; m.scale.set(gap, 1, 1); m.position.set(d.lx + sg * (half - gap / 2), 1.3, d.lz); }
    else { m.rotation.y = Math.PI / 2; m.scale.set(gap, 1, 1); m.position.set(d.lx, 1.3, d.lz + sg * (half - gap / 2)); }
  }
}
function nasaDesk() {
  if (!NASA.pass && !NASA.badge) { NASA.pass = 600; msg('🎫 Visitor pass issued (10 min): laboratory and assembly bay unlocked', 3500); }
  else if (!NASA.badge) { if (money >= 500) { money -= 500; NASA.badge = 1; msg('🪪 Staff clearance granted ($500): Mission Control unlocked', 3500); } else msg('🪪 Staff clearance costs $500', 2500); }
  else msg('You already have full staff clearance.', 2000);
}
function nasaTick(dt) {
  NASA.pass = Math.max(0, NASA.pass - dt); NASA.msgT -= dt; const lvl = NASA.badge ? 2 : NASA.pass > 0 ? 1 : 0;
  for (const b of institutions) {
    if (b.purpose !== 'nasa' || !b.int || !b.int.ndoors) continue;
    for (const d of b.int.ndoors) {
      const dist = Math.hypot(P.pos.x - d.wx, P.pos.z - d.wz), near = dist < 2.8 && P.pos.y < 3, ok = lvl >= d.level;
      const tgt = near && ok ? 1 : 0, old = d.o; d.o += (tgt - d.o) * Math.min(1, dt * 5); if (Math.abs(d.o - tgt) < 0.01) d.o = tgt;
      if (d.o !== old) nasaDoorPose(d);
      const want = d.o < 0.6; if (want !== d.solid) { d.solid = want; if (want) solids.set(d.k, d.box); else solids.delete(d.k); }
      if (near && !ok && NASA.msgT <= 0) { NASA.msgT = 4; msg(d.level === 1 ? '🔒 Authorised personnel only — get a visitor pass at reception (E)' : '🔒 Restricted — staff clearance needed (ask at reception, E)', 3200); }
    }
  }
}
function nasaLife(b) {
  b.staffC = b.staffC || []; const G = nasaGeom(b);
  G.spots.forEach((s, i) => {
    const c0 = b.staffC[i]; if (c0 && !c0.dead && !c0.removed) return; if (citizens.length > (isTouch ? 28 : 46)) return;
    try { const c = mkCitizen('suit', s.x, s.z, s.yaw, { role: 'worker', label: s.label, name: pick(NAMES), isStatic: true, home: new V3(s.x, 0, s.z), tgt: new V3(s.x, 0, s.z) }); c.stand = true; c.yaw = s.yaw; b.staffC[i] = c; } catch (e) {}
  });
}
