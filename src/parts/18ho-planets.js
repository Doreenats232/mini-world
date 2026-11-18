// ---------- Other planets: launch the NASA rocket (staff clearance) to the Moon or Mars. Low gravity, oxygen, alien mobs, crystals to sell, base dome to refill, lander to fly home ----------
const PLN = {
  moon: { x: 6000, z: 0, name: 'THE MOON', g: 4.8, jv: 7.6, sky: [0x000000, 0x04040a], fog: [0x04040a, 25, 520], sun: 1.35, hemi: 0.38, mobs: [8, 1, 0, 6], cap: 5, sp: 3.8, hp: 70, dmg: 8, val: 150, rock: 0x9fd8ff },
  mars: { x: -6000, z: 0, name: 'MARS', g: 10.4, jv: 9, sky: [0xb4693a, 0xd9996a], fog: [0xd09468, 30, 300], sun: 1.0, hemi: 0.65, mobs: [2, 5, 4, 9, 7], cap: 8, sp: 5.2, hp: 120, dmg: 12, val: 300, rock: 0xff5a3a },
};
PL.mobs = []; PL.t = 0; PL.rocks = 0; PL.storm = 0; PL.spT = 2;
const plFade = document.createElement('div'); plFade.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;display:none;align-items:center;justify-content:center;font:bold 26px sans-serif;z-index:60;pointer-events:none;text-align:center'; document.body.appendChild(plFade);
const plHud = document.createElement('div'); plHud.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);padding:5px 14px;border-radius:12px;color:#fff;font:bold 14px sans-serif;z-index:20;display:none;border:1px solid #fff4;text-shadow:0 1px 2px #000'; document.body.appendChild(plHud);
function buildPlanet(id) {
  const D = PLN[id]; if (D.grp) return D; const g = new THREE.Group(); g.position.set(D.x, 0, D.z); scene.add(g); D.grp = g; D.nodes = []; D.keys = []; const moon = id === 'moon';
  const tex = mkTex(256, 256, (c, w, h) => { c.fillStyle = moon ? '#8c8c90' : '#a8532f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const v = Math.random() < 0.5; c.fillStyle = moon ? (v ? 'rgba(40,40,44,.12)' : 'rgba(210,210,215,.12)') : (v ? 'rgba(70,25,10,.14)' : 'rgba(235,135,85,.14)'); c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, 6.283); c.fill(); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(60, 60);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshLambertMaterial({ map: tex })); gr.rotation.x = -Math.PI / 2; gr.position.y = 0.01; gr.userData.noShadow = true; g.add(gr);
  const solid = (x, z, rx, rz, h) => { const k = 'pl' + id + D.keys.length; solids.set(k, new THREE.Box3(new V3(D.x + x - rx, 0, D.z + z - rz), new V3(D.x + x + rx, h, D.z + z + rz))); D.keys.push(k); };
  const rnd = (a, b) => a + Math.random() * (b - a), away = (x, z) => Math.hypot(x, z) < 22 || Math.hypot(x - 28, z + 6) < 18;
  const cm = new THREE.MeshLambertMaterial({ color: moon ? 0x5d5d62 : 0x6e3318 }); for (let i = 0; i < 34; i++) { const x = rnd(-600, 600), z = rnd(-600, 600), r = rnd(5, 24); if (away(x, z)) continue; const d = new THREE.Mesh(new THREE.CircleGeometry(r, 24), cm); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.03, z); g.add(d); const rim = new THREE.Mesh(new THREE.RingGeometry(r, r * 1.22, 24), new THREE.MeshLambertMaterial({ color: moon ? 0xb4b4b8 : 0xc27a52 })); rim.rotation.x = -Math.PI / 2; rim.position.set(x, 0.04, z); g.add(rim); }
  const bm = new THREE.MeshLambertMaterial({ color: moon ? 0x77777c : 0x8a4424 }); for (let i = 0; i < 90; i++) { const x = rnd(-700, 700), z = rnd(-700, 700), s = rnd(0.8, 2.8); if (away(x, z)) continue; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), bm); b.position.set(x, s * 0.6, z); b.rotation.set(Math.random(), Math.random(), 0); g.add(b); solid(x, z, s * 0.8, s * 0.8, s * 1.4); }
  if (!moon) for (let i = 0; i < 9; i++) { const x = rnd(-550, 550), z = rnd(-550, 550), w = rnd(14, 26), h = rnd(6, 11); if (away(x, z) || Math.hypot(x, z) < 50) continue; const m = ab(w, h, w * rnd(0.7, 1.2), x, h / 2, z, new THREE.MeshLambertMaterial({ color: 0x9a4a28 }), g); solid(x, z, w / 2, w * 0.5, h); }
  // lander
  { const lg = new THREE.Group(); g.add(lg); const wh = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, metalness: 0.3, roughness: 0.4 }); const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 7, 20), wh); body.position.y = 4.2; lg.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.6, 20), new THREE.MeshStandardMaterial({ color: 0xe0301e, roughness: 0.4 })); nose.position.y = 8.9; lg.add(nose);
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.785, f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.6), new THREE.MeshStandardMaterial({ color: 0xe0301e })); f.position.set(Math.cos(a) * 1.7, 1.6, Math.sin(a) * 1.7); f.rotation.y = -a; lg.add(f); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6), A51M.dark); l.position.set(Math.cos(a) * 2.2, 1.4, Math.sin(a) * 2.2); l.rotation.z = Math.cos(a) * 0.5; l.rotation.x = -Math.sin(a) * 0.5; lg.add(l); }
    fsign('NASA', 2.6, 0.8, 0, 5, 1.45, 0, '#e0301e', '#fff', 36, lg); fsign('NASA', 2.6, 0.8, 0, 5, -1.45, Math.PI, '#e0301e', '#fff', 36, lg); solid(0, 0, 2.2, 2.2, 10);
    const gr2 = new THREE.Group(); gr2.position.set(D.x + 3.6, 0, D.z); scene.add(gr2); regUse(gr2, 'plret', { id }); }
  // base dome with oxygen
  { const dm = { x: 28, z: -6, r: 11 }; D.dome = { x: D.x + dm.x, z: D.z + dm.z, r: dm.r }; const dg = new THREE.Group(); dg.position.set(dm.x, 0, dm.z); g.add(dg);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(dm.r, 28, 14, 0, 6.283, 0, 1.5708), new THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, metalness: 0.2, roughness: 0.1 })); dg.add(gl); const ring = new THREE.Mesh(new THREE.TorusGeometry(dm.r, 0.35, 8, 36), A51M.metal); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; dg.add(ring);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, rb = new THREE.Mesh(new THREE.TorusGeometry(dm.r, 0.08, 4, 20, 3.1416), A51M.metal); rb.rotation.y = a; dg.add(rb); }
    const fl = new THREE.Mesh(new THREE.CircleGeometry(dm.r - 0.4, 28), new THREE.MeshLambertMaterial({ color: 0x3b4148 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.05; dg.add(fl);
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4, t = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.6, 12), new THREE.MeshStandardMaterial({ color: 0x4aa8ff, metalness: 0.5, roughness: 0.3 })); t.position.set(Math.cos(a) * 6, 1.3, Math.sin(a) * 6); dg.add(t); }
    const pn = ab(2.4, 1.6, 0.2, 0, 1.2, 0, A51M.green, dg); ab(2.4, 0.8, 1.2, 0, 0.4, 0, A51M.dark, dg); fsign((moon ? 'LUNAR' : 'MARS') + ' BASE · OXYGEN', 7, 1, 0, 6.2, -dm.r + 0.5, 0, '#0b2030', '#6fd0ff', 22, dg);
    const og = new THREE.Group(); og.position.set(D.x + dm.x, 0, D.z + dm.z + 1.6); scene.add(og); regUse(og, 'plo2', { id }); }
  // crystals
  for (let i = 0; i < 36; i++) { const a = Math.random() * 6.283, r = rnd(28, 330), x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x - 28, z + 6) < 16) continue; const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), new THREE.MeshStandardMaterial({ color: D.rock, emissive: D.rock, emissiveIntensity: 0.7, roughness: 0.2 })); m.scale.y = 1.5; m.position.set(x, 0.9, z); g.add(m);
    const ug = new THREE.Group(); ug.position.set(D.x + x, 0, D.z + z); scene.add(ug); const o = { id, m, cd: 0 }; regUse(ug, 'plnode', o); D.nodes.push(o); }
  if (moon) { const t = mkTex(128, 128, (c, w, h) => { c.fillStyle = '#1f5fb0'; c.fillRect(0, 0, w, h); c.fillStyle = '#3f9a52'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 16, 0, 6.283); c.fill(); } c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 14, 4, 0, 0, 6.283); c.fill(); } }); const e = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 16), new THREE.MeshBasicMaterial({ map: t, fog: false })); e.visible = false; scene.add(e); D.earth = e; }
  return D;
}
USEN.nasarocket = 'launch rocket'; USEN.plret = 'return to Earth'; USEN.plo2 = 'refill oxygen'; USEN.plnode = 'collect crystal';
function nasaRocket(o) {
  if (PL.launch || PL.on) return; if (!NASA.badge) return msg('🔒 Launch clearance needed: staff clearance ($500) at reception', 3200);
  const D = PLN[o.dest]; PL.launch = { t: 0, done: 0, go: () => planetGo(o.dest), a: '🚀 3… 2… 1… LIFTOFF', b: 'Landing on ' + D.name }; msg('🚀 Launch sequence started', 1500);
}
function planetGo(id) {
  const D = buildPlanet(id); PL.ret = P.pos.clone(); if (wanted) { wanted = 0; clearCops(); hudStars(); } try { setWeather('clear'); } catch (e) {}
  PL.on = 1; PL.id = id; GRAV = D.g; PL.jv = D.jv; PL.o2 = 100; PL.storm = 0; D.grp.visible = true; if (D.earth) D.earth.visible = true; P.pos.set(D.x + 7, 0.5, D.z + 9); P.vel.set(0, 0, 0); P.yaw = 0; P.pitch = 0; $('mini').style.display = 'none'; plHud.style.display = 'block'; PL.spT = 1;
  msg('🌌 Welcome to ' + D.name + '. Watch your oxygen: the dome and lander refill it', 4500);
}
function planetLeave(noTp) {
  const D = PLN[PL.id]; PL.on = 0; GRAV = 28; PL.jv = 11; if (D && D.grp) { D.grp.visible = false; if (D.earth) D.earth.visible = false; }
  for (const e of PL.mobs) { scene.remove(e.mesh); e.mesh.traverse(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); } PL.mobs.length = 0;
  scene.fog.near = 60; scene.fog.far = 260; skyUni.clouds.value = GQ.cur === 'low' ? 0 : 1; $('mini').style.display = ''; plHud.style.display = 'none';
  if (!noTp) { const r = PL.ret || new V3(25, 1, 25); P.pos.set(r.x, r.y + 0.2, r.z); } P.vel.set(0, 0, 0); try { updateCity(); } catch (e) {} msg('🌍 Back on Earth', 2500);
}
function planetUse(f, o) {
  const D = PLN[o.id];
  if (f === 'plret') { if (PL.launch) return; PL.launch = { t: 0, done: 0, go: () => planetLeave(), a: '🚀 Liftoff: heading home', b: '🌍 Landing on Earth' }; }
  else if (f === 'plo2') { PL.o2 = 100; msg('🫧 Oxygen refilled', 1500); }
  else if (f === 'plnode') { if (o.cd > 0) return; o.cd = 180; o.m.visible = false; money += D.val; PL.rocks++; hud(); sfx('click'); let t = '💎 Crystal collected +$' + D.val; if (PL.rocks % 3 === 0) { A51.samples++; a51Save(); t += ' · +1 research sample'; } msg(t, 2400); }
}
function planetSky(dt) {
  const D = PLN[PL.id]; scene.background.setHex(D.sky[1]); scene.fog.color.setHex(D.fog[0]); scene.fog.near = D.fog[1]; scene.fog.far = D.fog[2] - 170 * PL.storm;
  skyUni.top.value.setHex(D.sky[0]); skyUni.hor.value.setHex(D.sky[1]); skyUni.clouds.value = 0; skyUni.night.value = PL.id === 'moon' ? 1 : 0.1; skyUni.t.value += dt; skyUni.sunDir.value.set(0.5, 0.65, 0.35).normalize(); skyUni.sunCol.value.setRGB(1, 0.95, 0.85); skyMesh.position.copy(cam.position);
  sun.color.setRGB(1, 0.96, 0.9); sun.intensity = D.sun; hemi.intensity = D.hemi; sun.target.position.set(P.pos.x, 0, P.pos.z); sun.position.set(P.pos.x + 50, 80, P.pos.z + 30); sun.target.updateMatrixWorld(); dayLight = 1;
}
function mkPlMob(id) {
  const D = PLN[id], kind = D.mobs[Math.floor(Math.random() * D.mobs.length)], a = Math.random() * 6.283, r = 38 + Math.random() * 35, x = P.pos.x + Math.cos(a) * r, z = P.pos.z + Math.sin(a) * r;
  if (Math.hypot(x - D.x, z - D.z) > 740 || Math.hypot(x - D.dome.x, z - D.dome.z) < D.dome.r + 3) return;
  const g = new THREE.Group(), anim = CRE[kind][2](g), big = kind === 4 ? 1.5 : 1.1; g.scale.setScalar(big); g.position.set(x, 0, z); scene.add(g);
  const e = { ...mkEnt(x, 0, z, 0.5 * big, 1.7 * big), mesh: g, hp: D.hp * (kind === 4 ? 2 : 1), hurt: 0, cd: 1, dead: false, mob: 1, anim, sp: D.sp * (kind === 4 ? 0.75 : 1), dmg: D.dmg, kind, hd: Math.random() * 6.283, ht: 0 };
  g.traverse(m => { if (m.isMesh) { m.userData.enemy = e; enemyMeshes.push(m); } }); PL.mobs.push(e);
}
function plMobStep(e, dt) {
  if (stunned(e, dt)) return;
  const dx = P.pos.x - e.pos.x, dz = P.pos.z - e.pos.z, d = Math.hypot(dx, dz); let mx = 0, mz = 0, sp = e.sp;
  if (d < 42) { if (d > 1.8) { mx = dx / d; mz = dz / d; } e.mesh.rotation.y = Math.atan2(dx, dz); } else { e.ht -= dt; if (e.ht <= 0) { e.ht = 2 + Math.random() * 3; e.hd = Math.random() * 6.283; } mx = Math.cos(e.hd) * 0.35; mz = Math.sin(e.hd) * 0.35; sp = e.sp * 0.5; e.mesh.rotation.y = Math.atan2(mx, mz); }
  const ox = e.pos.x, oz = e.pos.z; phys(e, mx * sp, mz * sp, dt); if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = PL.jv * 0.9;
  e.mesh.position.set(e.pos.x, 0, e.pos.z); e.anim(PL.t + e.kind); e.mesh.position.y += e.pos.y;
  e.cd -= dt; if (d < 2.6 && e.cd <= 0 && !inCar) { hurt(e.dmg, true); e.cd = 0.9; sfxAt(e.pos, 'hit'); }
}
function plTick(dt) {
  PL.t += dt; const L = PL.launch;
  if (L) { L.t += dt; plFade.style.display = 'flex'; plFade.style.opacity = L.t < 1.2 ? L.t / 1.2 : L.t < 3.6 ? 1 : Math.max(0, 1 - (L.t - 3.6) / 1.2); plFade.textContent = L.done ? L.b : L.a; if (!L.done && L.t >= 2.6) { L.done = 1; L.go(); } if (L.t >= 4.8) { PL.launch = null; plFade.style.display = 'none'; } }
  if (!PL.on) return;
  const D = PLN[PL.id]; if (Math.hypot(P.pos.x - D.x, P.pos.z - D.z) > 1500) { planetLeave(true); return; }
  const dome = Math.hypot(P.pos.x - D.dome.x, P.pos.z - D.dome.z) < D.dome.r, lander = Math.hypot(P.pos.x - D.x, P.pos.z - D.z) < 6;
  if (dome || lander) PL.o2 = Math.min(100, PL.o2 + 30 * dt); else PL.o2 = Math.max(0, PL.o2 - 0.55 * dt);
  if (PL.o2 <= 0) { PL.ot = (PL.ot || 0) + dt; if (PL.ot > 1) { PL.ot = 0; hurt(7, true); msg('😮‍💨 Out of oxygen! Get to the dome or the lander', 1500); } }
  const v = Math.round(PL.o2); if (plHud._v !== v) { plHud._v = v; plHud.textContent = 'O₂ ' + v + '%   ·   💎 ' + PL.rocks; plHud.style.background = 'linear-gradient(90deg,' + (v < 25 ? '#d33' : '#2a8bd8') + ' ' + v + '%,#1a1d22 ' + v + '%)'; }
  const lim = 760; if (Math.abs(P.pos.x - D.x) > lim) P.pos.x = D.x + Math.sign(P.pos.x - D.x) * lim; if (Math.abs(P.pos.z - D.z) > lim) P.pos.z = D.z + Math.sign(P.pos.z - D.z) * lim;
  PL.storm = PL.id === 'mars' ? 0.5 + 0.5 * Math.sin(PL.t * 0.05) : 0;
  if (D.earth) D.earth.position.set(cam.position.x - 150, cam.position.y + 120, cam.position.z - 170);
  for (const n of D.nodes) if (n.cd > 0) { n.cd -= dt; if (n.cd <= 0) n.m.visible = true; }
  for (let i = PL.mobs.length - 1; i >= 0; i--) { const e = PL.mobs[i]; if (e.dead) { e.mesh.traverse(m => { const k = enemyMeshes.indexOf(m); if (k >= 0) enemyMeshes.splice(k, 1); }); if (Math.random() < 0.3) { A51.samples++; a51Save(); msg('🧪 Alien tissue sample +1', 1800); } PL.mobs.splice(i, 1); continue; } plMobStep(e, dt); }
  PL.spT -= dt; if (PL.spT <= 0) { PL.spT = 3; if (PL.mobs.length < D.cap) mkPlMob(PL.id); }
}

// perf: Area 51 + fair decor does not cast shadows (hundreds of small meshes doubled the draw cost)
[a51Grp, fairGrp].forEach(g => g.traverse(o => { if (o.isMesh) o.userData.noShadow = true; }));

// ---------- stats line (top-left): FPS, frame ms, JS ms, draw calls, triangles, geometries, textures, scene meshes ----------
const perfEl = document.createElement('div'); perfEl.style.cssText = 'position:fixed;top:4px;left:4px;padding:2px 6px;border-radius:6px;background:#000a;color:#9fe;font:11px monospace;z-index:70;pointer-events:none;white-space:pre'; document.body.appendChild(perfEl);
function perfTick(dt) {
  PERF.t += dt; PERF.n++; PERF.sj += PERF.js; PERF.sf += PERF.fr; PERF.mx = Math.max(PERF.mx, PERF.fr);
  if (PERF.t < 1) return; const i = ren.info || { render: {}, memory: {} }, n = PERF.n;
  if (!PERF.m || PERF.m-- <= 0) { PERF.m = 3; let c = 0; scene.traverse(o => { if (o.isMesh) c++; }); PERF.meshes = c; }
  perfEl.textContent = 'FPS ' + Math.round(n / PERF.t) + '  frame ' + (PERF.sf / n).toFixed(0) + 'ms (worst ' + PERF.mx.toFixed(0) + ')  JS ' + (PERF.sj / n).toFixed(1) + 'ms\ncalls ' + i.render.calls + '  tris ' + Math.round(i.render.triangles / 1000) + 'k  geo ' + i.memory.geometries + '  tex ' + i.memory.textures + '  meshes ' + PERF.meshes + '\ncitizens ' + citizens.length + '  cars ' + cars.length + '  enemies ' + enemies.length + '  cops ' + cops.length;
  PERF.t = 0; PERF.n = 0; PERF.sj = 0; PERF.sf = 0; PERF.mx = 0;
}
