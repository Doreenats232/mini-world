// ---------- Area 51 (north of the city): fenced desert base, pass gate, hangar with a UFO, research lab. Collect alien samples, research upgrades, trespassing = wanted ----------
const AX = 25, AZ = -790, A51 = { pass: 0, samples: 0, tech: 0, alarm: 0, trT: 0, msgT: 0, gate: 0, staff: [], crates: [] }, a51Bits = [];
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
  asolid(x - 5.6, x + 5.6, z - 9.6, z + 1.6, 6, 'u');
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
USEN.a51desk = 'buy Area 51 pass $300'; USEN.a51research = 'use research console'; USEN.a51crate = 'collect alien sample';
const A51TECH = [['Alloy armor (+25 max HP)', 2, 200, () => { up.hp++; }], ['Ion boots (+15% run speed)', 3, 300, () => { up.spd++; }], ['Plasma rounds (+25% damage)', 4, 400, () => { up.dmg++; }], ['Alien overdrive (+25 HP, +15% speed)', 6, 800, () => { up.hp++; up.spd++; }]];
function a51Use(f, o) {
  if (f === 'a51desk') { if (A51.pass > 0) return msg('🪪 Pass active: ' + Math.ceil(A51.pass / 60) + ' min left', 2000); if (money < 300) return msg('🪪 Area 51 pass costs $300', 2200); money -= 300; A51.pass = 900; hud(); msg('🪪 Visitor pass (15 min): the gate is open, stay out of trouble', 3200); }
  else if (f === 'a51crate') { if (A51.pass <= 0) return msg('👽 Need a pass', 1500); if (o.cd > 0) return; o.cd = 120; o.m.visible = false; A51.samples++; a51Save(); sfx('click'); msg('🧪 Alien sample collected (' + A51.samples + ')', 2200); }
  else if (f === 'a51research') { const t = A51TECH[A51.tech]; if (!t) return msg('👽 All research complete', 2200); if (A51.samples < t[1] || money < t[2]) return msg('🔬 Next: ' + t[0] + ' — needs ' + t[1] + ' samples + $' + t[2] + ' (you have ' + A51.samples + ' samples)', 3600); A51.samples -= t[1]; money -= t[2]; t[3](); A51.tech++; a51Save(); hud(); save(); msg('🔬 Research complete: ' + t[0], 3200); }
}
function a51Tick(dt) {
  const dx = P.pos.x - AX, dz = P.pos.z - AZ; if (Math.abs(dx) > 240 || Math.abs(dz) > 220) return;
  A51.pass = Math.max(0, A51.pass - dt); A51.alarm = Math.max(0, A51.alarm - dt); A51.msgT -= dt; const t = performance.now() / 1000, night = 1 - dayLight;
  A51.ufo.position.y = 4.6 + Math.sin(t * 1.3) * 0.35; A51.ufo.rotation.y += dt * 0.35; A51M.green.emissiveIntensity = 1.0 + Math.sin(t * 3) * 0.5 + night; if (A51.dish) A51.dish.rotation.y += dt * 0.4; if (A51.radar) A51.radar.rotation.y += dt * 0.25;
  for (const l of A51.lights) { l.pv.rotation.y = t * 0.7 + l.ph; l.pv.rotation.x = 0.9 + Math.sin(t * 0.5 + l.ph) * 0.2; l.beam.material.opacity = Math.min(0.2, 0.03 + night * 0.17) * (A51.alarm > 0 ? 1.6 : 1); }
  A51M.red.emissiveIntensity = A51.alarm > 0 ? 1.2 + Math.sin(t * 12) : 0.2;
  const near = Math.abs(dx) < 12 && dz > 36 && dz < 70, tgt = A51.pass > 0 && near ? 1 : 0; A51.gate += (tgt - A51.gate) * Math.min(1, dt * 3); if (Math.abs(A51.gate - tgt) < 0.01) A51.gate = tgt;
  A51.gL.position.x = -3 - A51.gate * 6; A51.gR.position.x = 3 + A51.gate * 6; const open = A51.gate > 0.7; if (open && solids.has(A51.gk.k)) solids.delete(A51.gk.k); else if (!open && !solids.has(A51.gk.k)) solids.set(A51.gk.k, A51.gk.b);
  if (near && A51.pass <= 0 && A51.msgT <= 0 && dz < 56) { A51.msgT = 5; msg('🔒 AREA 51 — restricted. Buy a pass at the booth (E)', 3200); }
  const inside = Math.abs(dx) < 59 && Math.abs(dz) < 49 && P.pos.y < 6;
  if (inside && A51.pass <= 0) { A51.trT += dt; if (A51.trT > 2.5) { A51.alarm = 10; crime(2, 'Trespassing at Area 51', 'a51'); } } else A51.trT = Math.max(0, A51.trT - dt);
  for (const c of A51.crates) if (c.cd > 0) { c.cd -= dt; if (c.cd <= 0) c.m.visible = true; }
  if (Math.abs(dx) < 120 && Math.abs(dz) < 110) a51Life();
}
function a51Life() {
  const spots = [[-6, 47, 0, 'Security'], [8, 47, 0, 'Security'], [-10, -6, 0, 'Security'], [-29, 5, Math.PI / 2, 'Security'], [-44, 2, 0, 'Scientist'], [-38, 8, Math.PI, 'Scientist'], [10, -8, Math.PI, 'Scientist']];
  spots.forEach(([x, z, yaw, label], i) => { const c0 = A51.staff[i]; if (c0 && !c0.dead && !c0.removed) return; if (citizens.length > (isTouch ? 34 : 70)) return;
    try { const c = mkCitizen('suit', AX + x, AZ + z, yaw, { role: 'worker', label, name: pick(NAMES), isStatic: true, home: new V3(AX + x, 0, AZ + z), tgt: new V3(AX + x, 0, AZ + z) }); c.stand = true; c.yaw = yaw; A51.staff[i] = c; } catch (e) {} });
}
EXTRA_PLACES.push({ x: AX, z: AZ + 44, type: 'area51', name: 'AREA 51', b: null });
