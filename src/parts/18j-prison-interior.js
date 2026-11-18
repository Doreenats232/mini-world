// ---------- prison interior: entry/reception, security arch, cell block with barred cells, bunks, toilets, pipes, caged lights, moody dim lighting ----------
const intLight = new THREE.PointLight(0xd6e4ff, 0, 15, 1.5); scene.add(intLight);
const PJ = {};
function pjMats() {
  if (PJ.conc) return PJ;
  const conc = mkTex(128, 128, (g, w, h) => { g.fillStyle = '#7d8083'; g.fillRect(0, 0, w, h); speck(g, w, h, 1400, 'rgba(255,255,255,.12)', 'rgba(0,0,0,.2)'); g.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 1); for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 32; x < w; x += 64) g.fillRect(x, y, 1, 32); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(40,30,20,.12)'; g.fillRect(rr(0, w), 0, rr(2, 6), rr(30, h)); } });
  const bump = mkTex(64, 64, (g, w, h) => { g.fillStyle = '#888'; g.fillRect(0, 0, w, h); speck(g, w, h, 900, '#aaa', '#555'); });
  PJ.conc = new THREE.MeshStandardMaterial({ map: conc, bumpMap: bump, bumpScale: 1.2, roughness: 0.95, metalness: 0 });
  PJ.bar = new THREE.MeshStandardMaterial({ color: 0x2c3034, roughness: 0.5, metalness: 0.45 });
  PJ.steel = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.35, metalness: 0.5 });
  PJ.dark = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.7, metalness: 0.3 });
  PJ.lamp = new THREE.MeshStandardMaterial({ color: 0xe8f0ff, emissive: 0xcfe0ff, emissiveIntensity: 1.6, roughness: 0.4 });
  PJ.mat = new THREE.MeshStandardMaterial({ color: 0x5f6f80, roughness: 0.95 });
  PJ.blanket = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.95 });
  PJ.white = new THREE.MeshStandardMaterial({ color: 0xe4e4de, roughness: 0.8 });
  PJ.locker = new THREE.MeshStandardMaterial({ color: 0x4d6b5a, roughness: 0.55, metalness: 0.35 });
  PJ.wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.85 });
  PJ.yellow = new THREE.MeshBasicMaterial({ color: 0xe3b81c, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  PJ.stain = new THREE.MeshBasicMaterial({ map: mkTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(10,8,6,.55)'); r.addColorStop(1, 'rgba(10,8,6,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return PJ;
}
function txtPlane(txt, w, h, bg, fg, px) { const t = mkTex(128, 64, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(3, 3, cw - 6, ch - 6); g.fillStyle = fg; g.font = 'bold ' + (px || 30) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, cw / 2, ch / 2); }); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); }
// geometry of the cell block in local building coordinates (x across, z entry -> back); shared by the builder and by the inmate/guard placement
function prisonGeom(b) {
  const ew = b.ry === 0 || b.ry === Math.PI, Lw = ew ? b.w : b.d, Dd = ew ? b.d : b.w, W = Lw - 2 * CT, D = Dd - 2 * CT, Wh = W / 2, Hh = D / 2, z0 = -Hh + 4.2, n = Math.max(1, Math.floor((D - 4.2) / 2.8));
  const th = b.ry + Math.PI, c = Math.cos(th), s = Math.sin(th), toW = (x, z) => ({ x: b.x + x * c + z * s, z: b.z - x * s + z * c });
  const cells = []; for (const side of [-1, 1]) for (let k = 0; k < n; k++) { const zc = z0 + k * 2.8 + 1.4, xc = side * (1.3 + (Wh - 1.3) * 0.6), p = toW(xc, zc + 0.35); cells.push({ side, k, zc, xc, x: p.x, z: p.z }); }
  return { W, D, Wh, Hh, z0, n, th, c, s, toW, cells, desk: toW(-(Wh + 0.9) / 2, -Hh + 3.5), post: toW(0, Hh - 0.9) };
}
function buildPrisonInterior(b, groups) {
  const M = pjMats(), G = prisonGeom(b), { Wh, Hh, z0, n } = G, keys = [], root = new THREE.Group(); root.position.set(b.x, 0, b.z); root.rotation.y = G.th; scene.add(root); groups.push(root);
  const B = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); root.add(m); return m; };
  const solid = (x0, x1, z0_, z1, y1) => { const pts = [[x0, z0_], [x1, z0_], [x0, z1], [x1, z1]].map(([x, z]) => G.toW(x, z)), k = 'pj' + b.id + '_' + keys.length; solids.set(k, new THREE.Box3(new V3(Math.min(...pts.map(p => p.x)), 0, Math.min(...pts.map(p => p.z))), new V3(Math.max(...pts.map(p => p.x)), y1 || 3.6, Math.max(...pts.map(p => p.z))))); keys.push(k); };
  const wall = (x0, x1, za, zb) => { B(x1 - x0, 3.96, zb - za, (x0 + x1) / 2, 1.98, (za + zb) / 2, M.conc); solid(x0, x1, za, zb); };
  const bars = [], cyl = (x, z, h) => { const g = new THREE.CylinderGeometry(0.024, 0.024, h, 5); g.translate(x, h / 2, z); bars.push(g); }, rail = (x, y, za, zb, t) => { const g = new THREE.BoxGeometry(t || 0.06, t || 0.06, zb - za); g.translate(x, y, (za + zb) / 2); bars.push(g); };
  // dividers + barred fronts + cell props
  for (const side of [-1, 1]) {
    for (let k = 0; k <= n; k++) { const zz = z0 + k * 2.8; wall(side > 0 ? 1.3 : -Wh, side > 0 ? Wh : -1.3, zz - 0.11, zz + 0.11); }
    for (let k = 0; k < n; k++) {
      const za = z0 + k * 2.8 + 0.11, zb = z0 + (k + 1) * 2.8 - 0.11, zm = (za + zb) / 2, bx0 = side * 1.3;
      for (let z = za + 0.05; z <= zb - 0.05; z += 0.13) if (Math.abs(z - zm) > 0.42) cyl(bx0, z, 3.4);
      for (const y of [0.12, 1.0, 2.0, 3.4]) { rail(bx0, y, za, zb); }
      for (const dz of [-0.45, 0.45]) { const g = new THREE.BoxGeometry(0.09, 3.4, 0.09); g.translate(bx0, 1.7, zm + dz); bars.push(g); }
      for (const z of [zm - 0.3, zm - 0.15, zm, zm + 0.15, zm + 0.3]) cyl(bx0, z, 2.0);   // door bars
      B(0.1, 0.18, 0.12, bx0 - side * 0.05, 1.05, zm + 0.36, new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.6, roughness: 0.4 }));  // lock
      solid(bx0 - 0.06, bx0 + 0.06, za, zb, 3.4);
      const lab = txtPlane((side < 0 ? 'A' : 'B') + (k + 1), 0.5, 0.25, '#1d2227', '#e6e6e6', 34); lab.position.set(bx0 - side * 0.04, 2.75, zm); lab.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; root.add(lab);
      // bunk bed against the divider, steel toilet + sink on the back wall
      const bxc = side * (Wh - 0.1 - 0.95), bz = za + 0.62;
      for (const [cx, cz] of [[-0.93, -0.42], [0.93, -0.42], [-0.93, 0.42], [0.93, 0.42]]) B(0.06, 1.75, 0.06, bxc + cx, 0.88, bz + cz, M.dark);
      for (const y of [0.45, 1.3]) { B(1.95, 0.05, 0.9, bxc, y, bz, M.dark); B(1.9, 0.12, 0.85, bxc, y + 0.09, bz, M.mat); B(0.45, 0.1, 0.5, bxc + side * 0.7, y + 0.2, bz, M.white); B(1.1, 0.05, 0.86, bxc - side * 0.3, y + 0.17, bz, M.blanket); }
      const tz = zb - 0.55; B(0.42, 0.42, 0.42, side * (Wh - 0.25), 0.21, tz, M.steel); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.14, 10), M.steel); bowl.position.set(side * (Wh - 0.28), 0.47, tz); root.add(bowl);
      B(0.4, 0.14, 0.4, side * (Wh - 0.22), 0.95, tz - 0.55, M.steel); B(0.04, 0.3, 0.5, side * (Wh - 0.05), 1.3, tz - 0.55, M.steel);
    }
    if (z0 + n * 2.8 < Hh - 0.3) wall(side > 0 ? 1.2 : -1.4, side > 0 ? 1.4 : -1.2, z0 + n * 2.8, Hh);
  }
  const barMesh = new THREE.Mesh(mergeGeometries(bars, false), M.bar); root.add(barMesh);
  // entry: reception counter, guard post props, benches, lockers, security arch, signs
  const cx0 = -Wh + 0.1, cx1 = -0.9, ccx = (cx0 + cx1) / 2, cz = -Hh + 2.5;
  B(cx1 - cx0, 1.05, 0.7, ccx, 0.53, cz, M.wood); B(cx1 - cx0 + 0.06, 0.06, 0.78, ccx, 1.08, cz, M.dark); solid(cx0, cx1, cz - 0.35, cz + 0.35, 1.1);
  const mon = B(0.5, 0.36, 0.05, ccx - 0.4, 1.38, cz + 0.2, new THREE.MeshStandardMaterial({ color: 0x223a55, emissive: 0x2f6aa8, emissiveIntensity: 1.1 })); mon.rotation.y = Math.PI; B(0.45, 0.02, 0.16, ccx - 0.4, 1.12, cz - 0.05, M.dark); B(0.2, 0.1, 0.12, ccx + 0.5, 1.14, cz, M.dark);
  B(0.4, 0.45, 2.0, Wh - 0.35, 0.23, -Hh + 1.8, M.steel); solid(Wh - 0.55, Wh - 0.15, -Hh + 0.8, -Hh + 2.8, 0.5);
  for (let i = 0; i < 3; i++) { B(0.45, 1.9, 0.5, -Wh + 0.27, 0.95, -Hh + 0.45 + i * 0.5 + 0.1, M.locker); B(0.02, 0.2, 0.3, -Wh + 0.53, 1.5, -Hh + 0.55 + i * 0.5, M.dark); } solid(-Wh, -Wh + 0.52, -Hh + 0.2, -Hh + 1.9, 1.9);
  for (const sx of [-0.78, 0.78]) { B(0.12, 2.15, 0.4, sx, 1.08, z0 - 0.45, M.dark); B(0.04, 0.3, 0.04, sx, 1.6, z0 - 0.45 + 0.21, new THREE.MeshBasicMaterial({ color: 0x35e06a })); } B(1.68, 0.14, 0.4, 0, 2.2, z0 - 0.45, M.dark);
  const sign = txtPlane('CELL BLOCK', 1.5, 0.45, '#c8ccd0', '#1d2227', 26); sign.position.set(0, 3.15, z0 - 0.02); sign.rotation.y = Math.PI; root.add(sign);
  const wp = txtPlane('WANTED', 0.8, 1.0, '#d8c79a', '#3b2a14', 22); wp.position.set(Wh - 0.03, 1.7, -Hh + 3.4); wp.rotation.y = -Math.PI / 2; root.add(wp);
  const cam = B(0.22, 0.14, 0.3, Wh - 0.3, 3.7, -Hh + 0.3, M.dark); cam.rotation.y = 0.8; B(0.04, 0.04, 0.04, Wh - 0.3, 3.74, -Hh + 0.46, new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  // pipes, duct and caged ceiling lights
  const pipe = (x, y, r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Hh * 2 - 4.2 + 0.2, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, (z0 + Hh) / 2); root.add(m); };
  pipe(0.95, 3.72, 0.07, M.steel); pipe(1.05, 3.55, 0.045, M.dark); B(0.5, 0.28, Hh - z0, -0.95, 3.8, (z0 + Hh) / 2, M.dark);
  for (let z = z0 + 1.4; z < Hh - 0.4; z += 2.8) { B(1.0, 0.08, 0.28, 0, 3.78, z, M.lamp); B(1.08, 0.04, 0.34, 0, 3.84, z, M.dark); }
  B(1.0, 0.08, 0.28, 0, 3.78, -Hh + 2.1, M.lamp); B(1.0, 0.08, 0.28, -Wh / 2, 3.78, -Hh + 3.5, M.lamp);
  // floor: yellow safety lines + grime
  for (const x of [-1.0, 1.0]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.01, Hh - z0), M.yellow); m.position.set(x, 0.045, (z0 + Hh) / 2); root.add(m); }
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(rr(1.2, 2.6), rr(1.2, 2.6)), M.stain); m.rotation.x = -Math.PI / 2; m.position.set(rr(-Wh + 1, Wh - 1), 0.05, rr(-Hh + 1, Hh - 1)); root.add(m); }
  for (const m of root.children) { if (m.isMesh) { m.userData.noShadowRecv = false; } }
  return keys;
}
// moody dim lighting while the player is inside a prison (any institution listed here gets the dim treatment)
const MOODY = { prison: 1, nasa: 0.5 };
function moodTick(dt) {
  INT.it -= dt; if (INT.it <= 0) { INT.it = 0.25; INT.tgt = 0; for (const b of institutions) if (MOODY[b.purpose] && b.on && Math.abs(cam.position.x - b.x) < b.w / 2 && Math.abs(cam.position.z - b.z) < b.d / 2 && cam.position.y < (b.purpose === 'nasa' ? 9 : 4.5)) { INT.tgt = Math.max(INT.tgt, MOODY[b.purpose]); } }
  INT.dim += (INT.tgt - INT.dim) * Math.min(1, dt * 3);
  if (INT.dim < 0.01) { INT.dim = 0; intLight.intensity = 0; return; }
  intLight.position.set(P.pos.x, 3.2, P.pos.z); intLight.intensity = 1.5 * INT.dim;
}
