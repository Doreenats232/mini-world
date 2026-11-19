// ---------- Area 51 (north of the city): fenced desert base, pass gate, hangar with a UFO, research lab. Collect alien samples, research upgrades, trespassing = wanted ----------
const AX = 25, AZ = -790, A51 = { fly: 0, uy: 4.6, alert: 0, guards: [], respawn: [], fv: null, pass: 0, samples: 0, tech: 0, alarm: 0, trT: 0, msgT: 0, gate: 0, staff: [], crates: [] }, a51Bits = [];
try { const s = JSON.parse(localStorage.getItem('mw_a51') || 'null'); if (s) { A51.samples = s.s | 0; A51.tech = s.t | 0; } } catch (e) {}
const a51Save = () => { try { localStorage.setItem('mw_a51', JSON.stringify({ s: A51.samples, t: A51.tech })); } catch (e) {} };
const A51M = {
  sand: new THREE.MeshLambertMaterial({ color: 0xc9a96b }), conc: new THREE.MeshStandardMaterial({ color: 0x8d9094, roughness: 0.85 }), dark: new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.6, metalness: 0.3 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xa9b1b9, roughness: 0.35, metalness: 0.75 }), green: new THREE.MeshStandardMaterial({ color: 0x39ff88, emissive: 0x18c060, emissiveIntensity: 1.4 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.38, emissive: 0x2a8aa0, emissiveIntensity: 0.6 }), olive: new THREE.MeshStandardMaterial({ color: 0x5b6446, roughness: 0.8 }), hazard: new THREE.MeshLambertMaterial({ map: stripeTex('#f1c40f', '#1c1c1c', 16) }),
  red: new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff1100, emissiveIntensity: 0.2 }), white: new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.6 }),
};
const a51Grp = new THREE.Group(); a51Grp.position.set(AX, 0, AZ); scene.add(a51Grp);
const ab = (w, h, d, x, y, z, mat, par) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || a51Grp).add(m); return m; };
const asolid = (x0, x1, z0, z1, h, tag) => { const k = 'a51' + a51Bits.length + (tag || ''); const b = new THREE.Box3(new V3(AX + x0, 0, AZ + z0), new V3(AX + x1, h || 3, AZ + z1)); solids.set(k, b); a51Bits.push(k); return { k, b }; };
// ground + approach road + fence (gate on the south side, facing the city)
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(130, 110), A51M.sand); g.rotation.x = -Math.PI / 2; g.position.y = 0.02; a51Grp.add(g);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(52, 34), new THREE.MeshLambertMaterial({ color: 0x6d7076 })); pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.04, -20); a51Grp.add(pad);
  const rd = new THREE.Mesh(new THREE.PlaneGeometry(14, 90), roadMat.clone()); rd.material.map = roadTex.clone(); rd.material.map.repeat.set(1, 4); rd.material.map.needsUpdate = true; rd.rotation.x = -Math.PI / 2; rd.position.set(0, 0.03, 95); a51Grp.add(rd);
  const chain = mkTex(32, 32, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#c9ced3'; g.lineWidth = 1.2; for (let i = -w; i < w * 2; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); } g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, 2); });
  const seg = (cx, cz, len, rot) => { const t = chain.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(len / 3, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); m.position.set(cx, 1.7, cz); m.rotation.y = rot; a51Grp.add(m); if (rot === 0) asolid(cx - len / 2, cx + len / 2, cz - 0.2, cz + 0.2, 3.4); else asolid(cx - 0.2, cx + 0.2, cz - len / 2, cz + len / 2, 3.4); };
  seg(0, -50, 120, 0); seg(-60, 0, 100, Math.PI / 2); seg(60, 0, 100, Math.PI / 2); seg(-33, 50, 54, 0); seg(33, 50, 54, 0);
  for (let x = -60; x <= 60; x += 12) for (const z of [-50, 50]) if (z < 0 || Math.abs(x) > 6) ab(0.2, 3.6, 0.2, x, 1.8, z, A51M.dark);
  // gate: two sliding panels, open with a pass
  A51.gL = ab(6, 3, 0.3, -3, 1.5, 50, A51M.hazard); A51.gR = ab(6, 3, 0.3, 3, 1.5, 50, A51M.hazard); A51.gate = 0; A51.gk = asolid(-6, 6, 49.7, 50.3, 3, 'gate');
  const sg = fsign('AREA 51 · RESTRICTED', 11, 1.5, 0, 5.2, 50, Math.PI, '#1c1c1c', '#f1c40f', 30, a51Grp); ab(0.5, 5.4, 0.5, -6.6, 2.7, 50, A51M.dark); ab(0.5, 5.4, 0.5, 6.6, 2.7, 50, A51M.dark); ab(13.6, 0.5, 0.5, 0, 5.6, 50, A51M.dark);
  for (const x of [-22, 22, -48, 48]) { fsign('⚠ DEADLY FORCE AUTHORISED', 4, 0.9, x, 2.2, 50.4, 0, '#f1c40f', '#1c1c1c', 18, a51Grp); }
  // corner watchtowers with sweeping searchlights
  A51.lights = []; for (const [x, z] of [[-60, -50], [60, -50], [-60, 50], [60, 50]]) { ab(2.4, 9, 2.4, x, 4.5, z, A51M.olive); ab(3.4, 0.4, 3.4, x, 9.2, z, A51M.dark); ab(3, 1.4, 3, x, 10, z, A51M.glass);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 24, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.geometry.translate(0, -12, 0); const pv = new THREE.Group(); pv.position.set(x, 10, z); pv.add(beam); a51Grp.add(pv); A51.lights.push({ pv, beam, ph: x + z }); asolid(x - 1.3, x + 1.3, z - 1.3, z + 1.3, 9.5, 't'); }
}
// guard booth by the gate: buy a pass
{ ab(4.2, 2.8, 3.2, -12, 1.4, 45, A51M.conc); ab(4.8, 0.3, 3.8, -12, 2.9, 45, A51M.dark); ab(0.1, 1.0, 2.2, -9.85, 1.8, 45, A51M.glass); fsign('PASS OFFICE · $300', 3.4, 0.6, -9.8, 3.4, 45, Math.PI / 2, '#1c1c1c', '#39ff88', 20, a51Grp); asolid(-14.2, -9.8, 43.4, 46.6, 3);
  const g = new THREE.Group(); g.position.set(AX - 8.6, 0, AZ + 45); scene.add(g); regUse(g, 'a51desk', {}); }
// ---- hangar with the UFO ----
const HG = { x: 0, z: -20, w: 40, d: 30, h: 12 };
{ const { x, z, w, d, h } = HG; ab(w + 0.6, 0.6, d + 0.6, x, h, z, A51M.conc); for (let i = 0; i < 9; i++) ab(w + 0.8, 0.25, 0.5, x, h + 0.45, z - d / 2 + i * d / 8, A51M.dark);
  ab(w, h, 0.6, x, h / 2, z - d / 2, A51M.metal); asolid(x - w / 2, x + w / 2, z - d / 2 - 0.4, z - d / 2 + 0.4, h, 'h');
  ab(0.6, h, d, x - w / 2, h / 2, z, A51M.metal); asolid(x - w / 2 - 0.4, x - w / 2 + 0.4, z - d / 2, z + d / 2, h, 'h');
  ab(0.6, h, d, x + w / 2, h / 2, z, A51M.metal); asolid(x + w / 2 - 0.4, x + w / 2 + 0.4, z - d / 2, z + d / 2, h, 'h');
  for (const sx of [-1, 1]) { ab(1.2, h, 1.2, x + sx * (w / 2 - 0.6), h / 2, z + d / 2, A51M.dark); ab(8, 0.6, 0.6, x + sx * (w / 2 - 4), h - 0.3, z + d / 2, A51M.hazard); }
  fsign('HANGAR 18', 10, 1.6, x, h + 1.7, z + d / 2 + 0.2, 0, '#1c1c1c', '#f1c40f', 34, a51Grp);
  for (let i = 0; i < 4; i++) ab(0.4, 0.3, 24, x - 12 + i * 8, h - 0.6, z, A51M.white).material = new THREE.MeshBasicMaterial({ color: 0xdff6ff });
  const u = new THREE.Group(); u.position.set(x, 4.6, z - 4); a51Grp.add(u); A51.ufo = u;
  const sa = new THREE.Mesh(new THREE.SphereGeometry(5.2, 28, 14), A51M.metal); sa.scale.y = 0.2; u.add(sa); const dome = new THREE.Mesh(new THREE.SphereGeometry(2.3, 20, 12, 0, 6.283, 0, 1.6), A51M.glass); dome.position.y = 0.4; u.add(dome);
  const under = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.3, 20), A51M.green); under.position.y = -1.1; u.add(under);
  A51.rim = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), A51M.green); m.position.set(Math.cos(a) * 4.7, -0.05, Math.sin(a) * 4.7); u.add(m); }
  const bm = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.4, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); bm.position.y = -3.4; bm.rotation.x = Math.PI; u.add(bm);
  for (const [px, pz] of [[-3.5, 0], [3.5, 0], [0, 3.5], [0, -3.5]]) ab(0.35, 3.2, 0.35, px, 1.6, pz - 4 + 4, A51M.dark, a51Grp).position.set(x + px, 1.6, z - 4 + pz);
  A51.uk = asolid(x - 5.6, x + 5.6, z - 9.6, z + 1.6, 6, 'u'); const ug = new THREE.Group(); ug.position.set(AX + x, 0, AZ + z - 4 + 6.4); scene.add(ug); regUse(ug, 'a51ufo', {}); A51.ug = ug;
  for (const [cx, cz] of [[-15, -8], [15, -8], [-15, -30], [15, -30]]) ab(2.4, 0.5, 2.4, cx, 0.25, cz, A51M.hazard);
}
// ---- research lab ----
const LAB = { x: -40, z: 5, w: 20, d: 14, h: 4.6 };
{ const { x, z, w, d, h } = LAB; ab(w + 0.6, 0.5, d + 0.6, x, h, z, A51M.dark); const wl = (cx, cz, sx, sz) => { ab(sx, h, sz, cx, h / 2, cz, A51M.white); asolid(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, h, 'l'); };
  wl(x, z - d / 2, w, 0.5); wl(x, z + d / 2, w, 0.5); wl(x - w / 2, z, 0.5, d); wl(x + w / 2, z - 4.3, 0.5, d / 2 - 3.1); wl(x + w / 2, z + 4.3, 0.5, d / 2 - 3.1);
  ab(0.5, 1.2, 3, x + w / 2, h - 0.6, z, A51M.white); fsign('RESEARCH LAB', 6, 1.0, x + w / 2 + 0.3, h + 0.9, z, Math.PI / 2, '#0f2b1a', '#39ff88', 26, a51Grp);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, d - 0.6), new THREE.MeshLambertMaterial({ color: 0xcfd8dc })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.06, z); a51Grp.add(fl);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(2, 14, 8, 0, 6.283, 0, 1.2), A51M.white); dish.position.set(x - 4, h + 1.6, z - 2); dish.rotation.x = 0.5; a51Grp.add(dish); A51.dish = dish; ab(0.2, 1.8, 0.2, x - 4, h + 0.9, z - 2, A51M.dark);
  // research console (E), glass tanks, tables
  ab(2.6, 1.0, 1.2, x - 6, 0.5, z - 2, A51M.dark); const scr = ab(2.2, 0.9, 0.08, x - 6, 1.55, z - 2.5, A51M.green); scr.rotation.x = -0.25; const cg = new THREE.Group(); cg.position.set(AX + x - 6, 0, AZ + z - 0.6); scene.add(cg); regUse(cg, 'a51research', {}); asolid(x - 7.4, x - 4.6, z - 2.7, z - 1.3, 1.3, 'c');
  for (let i = 0; i < 3; i++) { const tx = x + 0.5 + i * 3.2, t = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.2, 14), A51M.glass); t.position.set(tx, 1.2, z + 4); a51Grp.add(t); const sp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), A51M.green); sp.position.set(tx, 1.2, z + 4); a51Grp.add(sp); }
  asolid(x - 0.5, x + 7.5, z + 3, z + 5, 2.4, 'k'); ab(4, 0.9, 1.4, x - 6, 0.45, z + 4, A51M.conc); asolid(x - 8, x - 4, z + 3.3, z + 4.7, 1, 'd');
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.2), new THREE.MeshBasicMaterial({ map: mkTex(256, 110, (g, W, H) => { g.fillStyle = '#04140c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#39ff88'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < W; i += 4) { const y = H / 2 + Math.sin(i * 0.09) * 26 * Math.sin(i * 0.02); i ? g.lineTo(i, y) : g.moveTo(i, y); } g.stroke(); g.fillStyle = '#39ff88'; g.font = 'bold 15px monospace'; g.fillText('SPECIMEN A-51  BIOSIGNAL', 12, 18); }) })); sc.position.set(x - 5.2, 3, z - d / 2 + 0.4); a51Grp.add(sc); }
// ---- radar dish, fuel tank, barracks (decor) ----
{ fcyl(0.5, 0.8, 7, -46, 3.5, -32, A51M.dark, a51Grp); const dd = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 10, 0, 6.283, 0, 1.15), A51M.white); dd.position.set(-46, 8.2, -32); dd.rotation.x = 0.7; a51Grp.add(dd); A51.radar = dd; asolid(-47.2, -44.8, -33.2, -30.8, 7, 'r');
  fcyl(3.4, 3.4, 5, 44, 2.5, 24, A51M.metal, a51Grp, 18); asolid(40.6, 47.4, 20.6, 27.4, 5, 'f'); ab(18, 4, 8, 40, 2, -38, A51M.olive); asolid(31, 49, -42, -34, 4, 'b'); fsign('BARRACKS', 5, 0.8, 40, 4.6, -33.8, 0, '#2d3320', '#e9ecef', 22, a51Grp);
  for (const [x, z] of [[-18, 30], [20, 36], [-30, -40]]) { ab(1.8, 1.2, 1.8, x, 0.6, z, A51M.olive); asolid(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 1.2, 'x'); } }
// ---- alien sample crates: collect (E), they refill after a while ----
{ const spots = [[-15, -8], [15, -8], [-15, -30], [15, -30], [-26, 22], [28, 6]]; spots.forEach(([x, z], i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1), A51M.green); m.position.set(x, 0.9, z); if (i < 4) m.position.y = 0.8; a51Grp.add(m); const g = new THREE.Group(); g.position.set(AX + x, 0, AZ + z); scene.add(g); const o = { i, m, cd: 0 }; regUse(g, 'a51crate', o); A51.crates.push(o); }); }
USEN.a51ufo = 'board / land the UFO'; USEN.a51creature = 'examine specimen'; USEN.a51desk = 'buy Area 51 pass $300'; USEN.a51research = 'use research console'; USEN.a51crate = 'collect alien sample';
const A51TECH = [['Alloy armor (+25 max HP)', 2, 200, () => { up.hp++; }], ['Ion boots (+15% run speed)', 3, 300, () => { up.spd++; }], ['Plasma rounds (+25% damage)', 4, 400, () => { up.dmg++; }], ['Alien overdrive (+25 HP, +15% speed)', 6, 800, () => { up.hp++; up.spd++; }]];
function a51Use(f, o) {
  if (f === 'a51desk') { if (A51.pass > 0) return msg('🪪 Pass active: ' + Math.ceil(A51.pass / 60) + ' min left', 2000); if (money < 300) return msg('🪪 Area 51 pass costs $300', 2200); money -= 300; A51.pass = 900; hud(); msg('🪪 Visitor pass (15 min): the gate is open, stay out of trouble', 3200); }
  else if (f === 'a51crate') { if (A51.pass <= 0) return msg('👽 Need a pass', 1500); if (o.cd > 0) return; o.cd = 120; o.m.visible = false; A51.samples++; a51Save(); sfx('click'); msg('🧪 Alien sample collected (' + A51.samples + ')', 2200); }
  else if (f === 'a51ufo') ufoToggle();
  else if (f === 'a51creature') { const c = o; if (A51.pass <= 0) return msg('👽 Need a pass', 1500); let t = '🧬 #' + (c.i + 1) + ' ' + c.name + ': ' + c.lore; if (c.cd <= 0) { c.cd = 150; A51.samples++; a51Save(); t += ' (+1 sample)'; } msg(t, 4200); }
  else if (f === 'a51research') { const t = A51TECH[A51.tech]; if (!t) return msg('👽 All research complete', 2200); if (A51.samples < t[1] || money < t[2]) return msg('🔬 Next: ' + t[0] + ' — needs ' + t[1] + ' samples + $' + t[2] + ' (you have ' + A51.samples + ' samples)', 3600); A51.samples -= t[1]; money -= t[2]; t[3](); A51.tech++; a51Save(); hud(); save(); msg('🔬 Research complete: ' + t[0], 3200); }
}
function a51Tick(dt) {
  const dx = P.pos.x - AX, dz = P.pos.z - AZ; a51Grp.visible = !!A51.fly || (Math.abs(dx) < 420 && Math.abs(dz) < 400); if (Math.abs(dx) > 240 || Math.abs(dz) > 220) return;
  A51.pass = Math.max(0, A51.pass - dt); A51.alarm = Math.max(0, A51.alarm - dt); A51.msgT -= dt; const t = performance.now() / 1000, night = 1 - dayLight;
  if (!A51.fly) A51.ufo.position.y = A51.uy + Math.sin(t * 1.3) * 0.35; A51.ufo.rotation.y += dt * (A51.fly ? 1.2 : 0.35); A51M.green.emissiveIntensity = 1.0 + Math.sin(t * 3) * 0.5 + night; if (A51.dish) A51.dish.rotation.y += dt * 0.4; if (A51.radar) A51.radar.rotation.y += dt * 0.25;
  for (const l of A51.lights) { l.pv.rotation.y = t * 0.7 + l.ph; l.pv.rotation.x = 0.9 + Math.sin(t * 0.5 + l.ph) * 0.2; l.beam.material.opacity = Math.min(0.2, 0.03 + night * 0.17) * (A51.alarm > 0 ? 1.6 : 1); }
  A51M.red.emissiveIntensity = A51.alarm > 0 ? 1.2 + Math.sin(t * 12) : 0.2;
  const near = Math.abs(dx) < 12 && dz > 36 && dz < 70, tgt = A51.pass > 0 && near ? 1 : 0; A51.gate += (tgt - A51.gate) * Math.min(1, dt * 3); if (Math.abs(A51.gate - tgt) < 0.01) A51.gate = tgt;
  A51.gL.position.x = -3 - A51.gate * 6; A51.gR.position.x = 3 + A51.gate * 6; const open = A51.gate > 0.7; if (open && solids.has(A51.gk.k)) solids.delete(A51.gk.k); else if (!open && !solids.has(A51.gk.k)) solids.set(A51.gk.k, A51.gk.b);
  if (near && A51.pass <= 0 && A51.msgT <= 0 && dz < 56) { A51.msgT = 5; msg('🔒 AREA 51 — restricted. Buy a pass at the booth (E)', 3200); }
  const inside = Math.abs(dx) < 59 && Math.abs(dz) < 49 && P.pos.y < 6;
  if (inside && A51.pass <= 0) { A51.trT += dt; if (A51.trT > 2.5) { A51.alarm = 10; crime(2, 'Trespassing at Area 51', 'a51'); } } else A51.trT = Math.max(0, A51.trT - dt);
  for (const c of A51.crates) if (c.cd > 0) { c.cd -= dt; if (c.cd <= 0) c.m.visible = true; }
  if (Math.abs(dx) < 120 && Math.abs(dz) < 110) { a51Life(); a51Guards(dt); }
  a51Creatures(dt, t); if (A51.ug) { const u = A51.ufo.position; A51.ug.position.set(AX + u.x, A51.fly ? P.pos.y : 0, AZ + u.z + (A51.fly ? 0 : 6.4)); }
}
function a51Life() {
  const spots = [[-44, 2, 0, 'Scientist'], [-38, 8, Math.PI, 'Scientist'], [10, -8, Math.PI, 'Scientist']];
  spots.forEach(([x, z, yaw, label], i) => { const c0 = A51.staff[i]; if (c0 && !c0.dead && !c0.removed) return; if (citizens.length > (isTouch ? 28 : 46)) return;
    try { const c = mkCitizen('suit', AX + x, AZ + z, yaw, { role: 'worker', label, name: pick(NAMES), isStatic: true, home: new V3(AX + x, 0, AZ + z), tgt: new V3(AX + x, 0, AZ + z) }); c.stand = true; c.yaw = yaw; A51.staff[i] = c; } catch (e) {} });
}
EXTRA_PLACES.push({ x: AX, z: AZ + 44, type: 'area51', name: 'AREA 51', b: null });

// ---------------- fly the UFO ----------------
function ufoToggle() {
  const u = A51.ufo.position;
  if (!A51.fly) { if (A51.pass <= 0) return msg('🛸 Need a pass to touch the UFO', 2000); A51.fly = 1; A51.fv = new V3(); A51.lastP = null; solids.delete(A51.uk.k); msg('🛸 WASD fly · look up/down to climb · Space up · C down · Shift boost · E land', 5000); return; }
  if (u.y > 7) return msg('🛸 Too high to land: descend first', 2000);
  A51.fly = 0; A51.uy = Math.max(2.6, u.y); P.pos.set(AX + u.x, 0, AZ + u.z + 6.4); P.vel.set(0, 0, 0); msg('🛸 Landed', 1500);
}
function ufoStep(dt) {
  const u = A51.ufo.position, W = new V3(AX + u.x, u.y, AZ + u.z);
  if (A51.lastP && P.pos.distanceTo(A51.lastP) > 4) { A51.fly = 0; A51.uy = Math.max(2.6, u.y); return; }
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x, vv = (keys.Space ? 1 : 0) - ((keys.KeyC || keys.ControlLeft) ? 1 : 0);
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw), sp = (keys.ShiftLeft ? 95 : 44), cp = Math.cos(P.pitch), sp2 = Math.sin(P.pitch);
  const want = new V3(-sy * cp * f + cy * s, sp2 * f + vv * 0.7, -cy * cp * f - sy * s).multiplyScalar(sp);
  A51.fv.lerp(want, Math.min(1, dt * 2.5));
  W.addScaledVector(A51.fv, dt); W.x = Math.max(-1150, Math.min(1150, W.x)); W.z = Math.max(-1150, Math.min(1150, W.z)); W.y = Math.max(2.6, Math.min(400, W.y));
  u.set(W.x - AX, W.y, W.z - AZ); A51.ufo.rotation.z = -s * 0.25; A51.ufo.rotation.x = f * 0.12;
  P.pos.set(W.x, W.y - 1.2, W.z); P.vel.set(0, 0, 0); P.ground = true; A51.lastP = P.pos.clone();
  cam.position.set(W.x - sy * cp * 20, Math.max(1.5, W.y - sp2 * 20 + 6), W.z - cy * cp * 20); cam.rotation.set(P.pitch, P.yaw, 0);
}
// ---------------- armed, strict guards ----------------
const GUARD_POSTS = [[-8, 47, 0, 0, [[-8, 47], [-8, 40]]], [9, 47, 0, 0, [[9, 47], [9, 38]]], [-26, 20, 0, 0, [[-26, 20], [-26, -2]]], [-29, 8, 1, 0, [[-29, 8], [-29, 3]]], [25, -3, 0, 0, [[25, -3], [52, -3]]], [-10, -3, 0, 0, [[-10, -3], [10, -3]]], [0, -38, 1, 0, [[0, -38], [0, -10]]], [35, 30, 0, 0, [[35, 30], [50, 30]]]];
function mkA51Guard(i) {
  const [x, z, heavy, , pts] = GUARD_POSTS[i], g = new THREE.Group(), sc = heavy ? 1.25 : 1, tm = new THREE.MeshLambertMaterial({ color: heavy ? 0x3b4048 : 0xe4eaee });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x20242a })); legs.position.y = 0.35;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.55), tm); torso.position.y = 1.1; const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0x15181c })); head.position.y = 1.78;
  const vis = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: 0x39ff88 })); vis.position.set(0, 1.8, 0.27); const str = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.12, 0.56), new THREE.MeshBasicMaterial({ color: 0x39ff88 })); str.position.y = 1.2;
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, heavy ? 1.3 : 1.0), new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.6 })); rifle.position.set(0.42, 1.15, 0.5); const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), new THREE.MeshBasicMaterial({ color: 0x39ff88 })); tip.position.set(0.42, 1.15, heavy ? 1.2 : 1.0);
  g.add(legs, torso, head, vis, str, rifle, tip); g.scale.setScalar(sc); g.position.set(AX + x, 0, AZ + z); scene.add(g);
  const e = { ...mkEnt(AX + x, 0, AZ + z, 0.4 * sc, 1.95 * sc), mesh: g, hp: heavy ? 330 : 150, max: heavy ? 330 : 150, mat: tm, col: heavy ? 0x3b4048 : 0xe4eaee, hurt: 0, cd: 1, dead: false, a51: true, heavy, post: i, pts, pi: 1, lastHp: heavy ? 330 : 150 };
  [legs, torso, head].forEach(m => { m.userData.enemy = e; enemyMeshes.push(m); }); head.userData.head = true; try { attachSoldier(e, 0x39ff88); } catch (er) {} A51.guards[i] = e; return e;
}
function a51Guards(dt) {
  const T = P.pos, inside = Math.abs(T.x - AX) < 62 && Math.abs(T.z - AZ) < 52 && T.y < 8, trespass = inside && A51.pass <= 0; A51.alert = Math.max(0, A51.alert - dt);
  for (let i = 0; i < GUARD_POSTS.length; i++) {
    let e = A51.guards[i];
    if (!e || e.dead) { if (e && !e.counted) { e.counted = true; A51.alert = 90; A51.respawn[i] = 100; if (Math.hypot(e.pos.x - P.pos.x, e.pos.z - P.pos.z) < 25) { A51.pass = Math.max(A51.pass, 600); msg('🪪 You took the guard\'s pass: access for 10 min', 3500); } crime(2, 'killed Area 51 security', 'a51kill'); } A51.respawn[i] = (A51.respawn[i] || 0) - dt; if (A51.respawn[i] <= 0 && A51.alert <= 0 && !trespass) e = mkA51Guard(i); else continue; }
    if (stunned(e, dt)) continue;
    if (e.hp < e.lastHp) { A51.alert = Math.max(A51.alert, 60); e.lastHp = e.hp; }
    const dx = T.x - e.pos.x, dz = T.z - e.pos.z, d = Math.hypot(dx, dz), close = A51.pass <= 0 && d < 8 && !inCar;
    if (close && A51.alert < 20) { A51.alert = 20; if (A51.msgT <= 0 || true) msg('🛑 STOP! Restricted area — step back!', 2200); }
    const hostile = trespass || A51.alert > 0 || A51.alarm > 0;
    e.hurt -= dt; e.mat.color.setHex(e.hurt > 0 ? 0xffffff : e.col); e.cd -= dt;
    let mx = 0, mz = 0, sp = 2.2;
    if (hostile && d < 90) { sp = e.heavy ? 4.6 : 6.6; if (d > 12) { mx = dx / d; mz = dz / d; } e.mesh.rotation.y = Math.atan2(dx, dz); }
    else { const pt = e.pts[e.pi], px = AX + pt[0] - e.pos.x, pz = AZ + pt[1] - e.pos.z, pd = Math.hypot(px, pz); if (pd < 1.2) e.pi = 1 - e.pi; else { mx = px / pd; mz = pz / pd; e.mesh.rotation.y = Math.atan2(px, pz); } }
    const ox = e.pos.x, oz = e.pos.z; phys(e, mx * sp, mz * sp, dt); if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = 9; e.mesh.position.copy(e.pos);
    if (hostile && d < 46 && e.cd <= 0) {
      e.cd = e.heavy ? 0.9 : 0.42 + Math.random() * 0.15; const o = new V3(e.pos.x, 1.7, e.pos.z), tg = new V3(T.x, inCar ? 1.2 : T.y + 1.1, T.z);
      sfxAt(e.pos, 'shoot'); e.flashAt = clock; e.aimT = 1.0; beam(o, tg, 0x39ff88, 90); if (Math.random() < (d < 16 ? 0.55 : 0.35)) hurt(e.heavy ? 20 : 11, true);
    }
  }
}
// ---------------- captured creatures (containment block) ----------------
const CZ = { x: 40, z: -15, w: 32, d: 24, h: 5 }, creatures = [];
const CRE = [
  ['Grey "Zorp"', 'Big-eyed scout. Hums when you stare back.', g => { const m = new THREE.MeshStandardMaterial({ color: 0x9aa5a8 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 4, 8), m); b.position.y = 0.95; const h = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), m); h.scale.set(1, 1.25, 1); h.position.y = 1.85; g.add(b, h); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), A51M.dark); e.scale.set(1, 1.6, 0.5); e.position.set(s * 0.2, 1.85, 0.36); e.rotation.z = -s * 0.4; g.add(e); const ar = ab(0.1, 0.9, 0.1, s * 0.4, 0.9, 0, m, g); } return t => { g.rotation.y = Math.sin(t * 0.6) * 0.5; }; }],
  ['Gloopus', 'A tentacled blob. Eats anything labelled "lunch".', g => { const m = new THREE.MeshStandardMaterial({ color: 0x4cd964, emissive: 0x0a6a20, roughness: 0.3 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), m); b.position.y = 0.9; g.add(b); const ts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 1.4, 6), m); c.position.set(Math.cos(a) * 0.7, 0.5, Math.sin(a) * 0.7); c.rotation.z = Math.cos(a) * 0.6; c.rotation.x = -Math.sin(a) * 0.6; g.add(c); ts.push(c); } const e = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), A51M.white); e.position.set(0, 1.1, 0.75); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), A51M.dark); p.position.set(0, 1.1, 1.0); g.add(p); return t => { b.scale.set(1 + Math.sin(t * 2) * 0.08, 1 - Math.sin(t * 2) * 0.08, 1); ts.forEach((c, i) => { c.rotation.z += Math.sin(t * 3 + i) * 0.01; }); }; }],
  ['Mantis-9', 'Insectoid hunter. Scythe arms, no sense of humour.', g => { const m = new THREE.MeshStandardMaterial({ color: 0x7a3fb0, metalness: 0.3, roughness: 0.4 }); const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.9, 4, 8), m); th.position.set(0, 1.2, 0); th.rotation.x = 0.4; g.add(th); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 5), m); hd.position.set(0, 1.9, 0.35); hd.rotation.x = Math.PI / 2 + 0.3; g.add(hd); const sy = []; for (const s of [-1, 1]) { const ar = ab(0.12, 1.1, 0.12, s * 0.5, 1.4, 0.4, new THREE.MeshStandardMaterial({ color: 0xc9b6e6, metalness: 0.7 }), g); ar.rotation.x = -0.6; sy.push(ar); for (let i = 0; i < 2; i++) ab(0.08, 0.9, 0.08, s * (0.35 + i * 0.1), 0.45, -0.2 + i * 0.4, m, g); } return t => { sy[0].rotation.z = 0.3 + Math.sin(t * 2) * 0.4; sy[1].rotation.z = -0.3 - Math.sin(t * 2 + 1) * 0.4; }; }],
  ['Aeroform', 'Floating jelly drifter. Glows when it is lonely.', g => { const m = new THREE.MeshStandardMaterial({ color: 0xff7ad9, emissive: 0xc02a90, emissiveIntensity: 0.7, transparent: true, opacity: 0.75 }); const d = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 8, 0, 6.283, 0, 1.6), m); d.position.y = 2.1; g.add(d); const ts = []; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4), m); c.position.set(Math.cos(a) * 0.5, 1.3, Math.sin(a) * 0.5); g.add(c); ts.push(c); } return t => { g.position.y = 0.3 + Math.sin(t * 1.2) * 0.25; d.scale.y = 1 + Math.sin(t * 2.4) * 0.12; ts.forEach((c, i) => { c.rotation.x = Math.sin(t * 2 + i) * 0.2; }); }; }],
  ['Cyclops Brute', 'One eye, two horns, zero patience.', g => { const m = new THREE.MeshStandardMaterial({ color: 0xb5523a, roughness: 0.8 }); const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 1.0), m); b.position.y = 1.1; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), m); h.position.y = 2.3; g.add(h); const e = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), A51M.white); e.position.set(0, 2.35, 0.45); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), A51M.red); p.position.set(0, 2.35, 0.66); g.add(p); for (const s of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.6, 6), A51M.white); hn.position.set(s * 0.4, 2.85, 0); hn.rotation.z = -s * 0.4; g.add(hn); ab(0.45, 1.3, 0.45, s * 1.0, 1.1, 0, m, g); } return t => { g.rotation.y = Math.sin(t * 0.4) * 0.3; p.position.x = Math.sin(t * 1.3) * 0.08; }; }],
  ['Saurian', 'Reptilian infiltrator. Dislikes the cold.', g => { const m = new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.6 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), m); b.position.set(0, 1.0, 0); g.add(b); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.7), m); hd.position.set(0, 1.8, 0.3); g.add(hd); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 6), m); tail.position.set(0, 0.5, -0.9); tail.rotation.x = -1.2; g.add(tail); for (let i = 0; i < 5; i++) ab(0.08, 0.3, 0.2, 0, 1.5 - i * 0.2, -0.3 - i * 0.05, A51M.red, g); for (const s of [-1, 1]) { ab(0.1, 0.1, 0.1, s * 0.15, 1.9, 0.62, A51M.green, g); ab(0.15, 0.8, 0.15, s * 0.45, 0.9, 0, m, g); } return t => { tail.rotation.z = Math.sin(t * 1.5) * 0.4; }; }],
  ['Eye Swarm', 'Three eyes, one mind. Do not blink first.', g => { const es = []; for (let i = 0; i < 4; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), A51M.white); const p = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: [0xff3030, 0x30c0ff, 0xffd030, 0x30ff80][i] })); p.position.z = 0.24; e.add(p); g.add(e); es.push(e); } return t => { es.forEach((e, i) => { const a = t * 0.8 + i * 1.57; e.position.set(Math.cos(a) * 0.9, 1.3 + Math.sin(t * 1.4 + i) * 0.4, Math.sin(a) * 0.9); e.lookAt(P.pos); }); }; }],
  ['Crystal Golem', 'Slow, shiny, surprisingly sad.', g => { const m = new THREE.MeshStandardMaterial({ color: 0x66d9ff, emissive: 0x1b7aa0, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.9 }); const b = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), m); b.position.y = 1.4; g.add(b); const bits = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), m); g.add(c); bits.push(c); } return t => { b.rotation.y = t * 0.5; bits.forEach((c, i) => { const a = t + i * 1.57; c.position.set(Math.cos(a) * 1.4, 1.4 + Math.sin(t * 2 + i) * 0.3, Math.sin(a) * 1.4); }); }; }],
  ['Space Slug', 'Segmented crawler. Leaves a glowing trail.', g => { const m = new THREE.MeshStandardMaterial({ color: 0xe0b040, roughness: 0.5 }); const seg = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 - i * 0.04, 10, 8), m); g.add(s); seg.push(s); } const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), A51M.dark); e.position.set(0.2, 0.7, 0.9); g.add(e); const e2 = e.clone(); e2.position.x = -0.2; g.add(e2); return t => { seg.forEach((s, i) => { s.position.set(Math.sin(t * 1.5 - i * 0.7) * 0.8, 0.5 + Math.abs(Math.sin(t * 2 - i * 0.7)) * 0.2, 0.9 - i * 0.65); }); }; }],
  ['Tripod Hopper', 'Three legs, one very big jump.', g => { const m = new THREE.MeshStandardMaterial({ color: 0xff9a3c, roughness: 0.5 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), m); b.position.y = 1.4; g.add(b); const e = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), A51M.white); e.position.set(0, 1.5, 0.45); g.add(e); const lg = []; for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283, l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), m); l.position.set(Math.cos(a) * 0.5, 0.7, Math.sin(a) * 0.5); l.rotation.z = Math.cos(a) * 0.35; l.rotation.x = -Math.sin(a) * 0.35; g.add(l); lg.push(l); } return t => { const j = Math.max(0, Math.sin(t * 2.2)); g.position.y = j * 0.8; b.scale.y = 1 - (1 - j) * 0.1; }; }],
  ['Shadow Wisp', 'Made of dark. Red eyes, no face.', g => { const m = new THREE.MeshBasicMaterial({ color: 0x0b0b12, transparent: true, opacity: 0.85 }); const bl = []; for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 + i * 0.05, 8, 6), m); g.add(s); bl.push(s); } for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 })); e.position.set(s * 0.2, 1.6, 0.4); g.add(e); } return t => { bl.forEach((s, i) => { s.position.set(Math.sin(t * 1.1 + i * 1.7) * 0.25, 0.7 + i * 0.3, Math.cos(t * 1.3 + i) * 0.25); }); }; }],
  ['Moth-Man', 'Winged watcher. Prefers lamps to people.', g => { const m = new THREE.MeshStandardMaterial({ color: 0x6b5b4a, roughness: 0.9 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 4, 8), m); b.position.y = 1.2; g.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), m); hd.position.y = 2.1; g.add(hd); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), A51M.red); e.position.set(s * 0.14, 2.12, 0.24); g.add(e); } const w = []; for (const s of [-1, 1]) { const wg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x8b7762, side: THREE.DoubleSide })); wg.position.set(s * 0.8, 1.6, -0.2); g.add(wg); w.push(wg); } return t => { w[0].rotation.y = 0.5 + Math.sin(t * 3) * 0.3; w[1].rotation.y = -0.5 - Math.sin(t * 3) * 0.3; }; }],
];
{ const { x, z, w, d, h } = CZ, wl = (cx, cz, sx, sz) => { ab(sx, h, sz, cx, h / 2, cz, A51M.conc); asolid(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, h, 'z'); };
  ab(w + 0.6, 0.5, d + 0.6, x, h, z, A51M.dark); wl(x, z - d / 2, w, 0.5); wl(x, z + d / 2, w, 0.5); wl(x - w / 2, z, 0.5, d); wl(x + w / 2, z - 5.4, 0.5, d / 2 - 3); wl(x + w / 2, z + 5.4, 0.5, d / 2 - 3); ab(0.5, 1.2, 3.2, x + w / 2, h - 0.6, z, A51M.conc);
  fsign('CONTAINMENT · SPECIMENS', 8, 1, x + w / 2 + 0.3, h + 0.9, z, Math.PI / 2, '#2a0f0f', '#ff4a3a', 24, a51Grp);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, d - 0.6), new THREE.MeshLambertMaterial({ color: 0x4b5258 })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.06, z); a51Grp.add(fl);
  for (let i = 0; i < 12; i++) { const row = i < 6 ? 0 : 1, k = i % 6, cx = x + (k - 2.5) * 4.6, cz = row ? z + 6 : z - 6.5, fz = row ? cz - 2.5 : cz + 2.5, dir = row ? -1 : 1;
    const gl = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.18, depthWrite: false })); gl.position.set(cx, 1.7, fz); a51Grp.add(gl); ab(4.4, 0.25, 0.2, cx, 0.1, fz, A51M.dark); ab(4.4, 0.25, 0.2, cx, 3.4, fz, A51M.dark);
    for (const s of [-1, 1]) ab(0.18, 3.4, 0.18, cx + s * 2.2, 1.7, fz, A51M.dark); const gm = ab(4.4, 0.1, 4.8, cx, 0.1, cz, new THREE.MeshStandardMaterial({ color: 0x2a3a30, emissive: 0x0f3a20, emissiveIntensity: 0.6 })); asolid(cx - 2.3, cx + 2.3, row ? fz - 0.1 : fz - 0.1, row ? fz + 0.1 : fz + 0.1, 3.4, 'g');
    const cg = new THREE.Group(); cg.position.set(cx, 0.15, cz); cg.rotation.y = row ? Math.PI : 0; a51Grp.add(cg); const anim = CRE[i][2](cg); const bx = cg.position.y, pl = fsign(String(i + 1).padStart(2, '0') + ' ' + CRE[i][0], 3, 0.5, cx, 2.9, fz + dir * 0.12, row ? Math.PI : 0, '#14181c', '#39ff88', 16, a51Grp);
    const ug = new THREE.Group(); ug.position.set(AX + cx, 0, AZ + fz + dir * 1.2); scene.add(ug); const o = { i, name: CRE[i][0], lore: CRE[i][1], cd: 0 }; regUse(ug, 'a51creature', o); creatures.push({ cg, anim, o, base: cg.position.y }); }
}
function a51Creatures(dt, t) { if (Math.hypot(P.pos.x - (AX + CZ.x), P.pos.z - (AZ + CZ.z)) > 70) return; for (const c of creatures) { c.cg.position.y = c.base; c.anim(t + c.o.i * 1.3); if (c.o.cd > 0) c.o.cd -= dt; } }
