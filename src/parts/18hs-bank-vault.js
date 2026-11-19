// ---------- Player bank heists: every bank has a vault at the back. Buy/use a thermal drill (25 s, alarm + 3 stars), grab cash stacks and gold, dodge armed guards and dye packs, escape the police ----------
const BK = { v: new Map(), drill: null, hasDrill: false, hud: null, t: 0 };
const bkHud = document.createElement('div'); bkHud.style.cssText = 'position:fixed;top:44px;left:50%;transform:translateX(-50%);padding:5px 14px;border-radius:12px;color:#fff;font:bold 14px sans-serif;z-index:20;display:none;border:1px solid #fff4;text-shadow:0 1px 2px #000'; document.body.appendChild(bkHud);
const BKM = { steel: new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.8, roughness: 0.3 }), dark: new THREE.MeshStandardMaterial({ color: 0x2a2f35, metalness: 0.6, roughness: 0.5 }), wall: new THREE.MeshStandardMaterial({ color: 0x6d7378, roughness: 0.7, metalness: 0.3 }), cash: new THREE.MeshLambertMaterial({ color: 0x3f9c52 }), band: new THREE.MeshLambertMaterial({ color: 0xf3e9c6 }), gold: new THREE.MeshStandardMaterial({ color: 0xffc933, metalness: 0.9, roughness: 0.25, emissive: 0x6b4a00, emissiveIntensity: 0.35 }), floor: new THREE.MeshLambertMaterial({ color: 0x4b5157 }) };
USEN.bkvault = 'crack the vault'; USEN.bkcash = 'grab cash'; USEN.bkgold = 'grab gold bar';
function bkBuild(b) {
  const ry = b.ry, dx = Math.sin(ry), dz = Math.cos(ry), half = (ry === 0 || ry === Math.PI) ? b.d / 2 : b.w / 2, depth = 6, wid = 7.6;
  const bx = b.x - dx * (half - CT), bz = b.z - dz * (half - CT), cx = bx + dx * (depth / 2 + 0.3), cz = bz + dz * (depth / 2 + 0.3);
  const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; scene.add(g); const V = { b, g, keys: [], stacks: [], gold: [], open: 0, cool: 0, guards: [], doorKey: null, dg: null, ang: 0 };
  const L2W = (lx, lz) => ({ x: cx + lx * Math.cos(ry) + lz * Math.sin(ry), z: cz - lx * Math.sin(ry) + lz * Math.cos(ry) });
  const wbox = (x0, x1, z0, z1, h) => { const a = L2W(x0, z0), c = L2W(x1, z1), k = 'bk' + b.id + '_' + V.keys.length; solids.set(k, new THREE.Box3(new V3(Math.min(a.x, c.x), 0, Math.min(a.z, c.z)), new V3(Math.max(a.x, c.x), h, Math.max(a.z, c.z)))); V.keys.push(k); return k; };
  const mb = (w, h, d, x, y, z, m) => { const e = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); e.position.set(x, y, z); g.add(e); return e; }, H = 3.4, zf = depth / 2 + 0.25;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(wid, depth), BKM.floor); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.07, 0); g.add(fl);
  mb(0.5, H, depth + 0.5, -wid / 2 - 0.25, H / 2, 0, BKM.wall); wbox(-wid / 2 - 0.5, -wid / 2, -depth / 2 - 0.25, depth / 2 + 0.25, H); mb(0.5, H, depth + 0.5, wid / 2 + 0.25, H / 2, 0, BKM.wall); wbox(wid / 2, wid / 2 + 0.5, -depth / 2 - 0.25, depth / 2 + 0.25, H);
  mb(wid / 2 - 1.1 + 0.5, H, 0.5, -(wid / 2 + 1.1) / 2 - 0.1, H / 2, zf, BKM.wall); wbox(-wid / 2 - 0.5, -1.1, zf - 0.25, zf + 0.25, H); mb(wid / 2 - 1.1 + 0.5, H, 0.5, (wid / 2 + 1.1) / 2 + 0.1, H / 2, zf, BKM.wall); wbox(1.1, wid / 2 + 0.5, zf - 0.25, zf + 0.25, H); mb(2.4, H - 2.6, 0.5, 0, 2.6 + (H - 2.6) / 2, zf, BKM.wall);
  mb(wid + 1, 0.4, depth + 0.8, 0, H + 0.2, 0, BKM.wall);
  // round vault door (a hinged group)
  const dg = new THREE.Group(); dg.position.set(-1.15, 1.3, zf); g.add(dg); V.dg = dg; const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.45, 28), BKM.steel); disc.rotation.x = Math.PI / 2; disc.position.set(1.15, 0, 0); dg.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 6, 28), BKM.dark); ring.position.set(1.15, 0, 0.24); dg.add(ring); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, bt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 6), BKM.dark); bt.rotation.x = Math.PI / 2; bt.position.set(1.15 + Math.cos(a) * 1.12, Math.sin(a) * 1.12, 0.24); dg.add(bt); }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16), BKM.dark); wheel.position.set(1.15, 0, 0.34); dg.add(wheel); mb(0.12, 0.12, 0.5, 0, 1.3, zf, BKM.dark).visible = false;
  V.doorKey = wbox(-1.1, 1.1, zf - 0.3, zf + 0.3, 3); V.doorBox = solids.get(V.doorKey); dg.position.y = 1.3;
  // shelves: cash stacks + gold
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { for (const y of [0.5, 1.3]) { if (y === 1.3 && i % 2) continue; const lx = s * (wid / 2 - 0.55), lz = -2.2 + i * 1.0; mb(0.7, 0.08, 0.9, lx, y - 0.25, lz, BKM.dark); const st = mb(0.55, 0.3, 0.4, lx, y, lz, BKM.cash); const bd = mb(0.57, 0.12, 0.2, lx, y, lz, BKM.band); st.add(bd); bd.position.set(0, 0, 0); bd.scale.set(1, 1, 1); const w = L2W(lx, lz); const o = { v: V, m: st, cd: 0, dye: Math.random() < 0.15 }; const ug = new THREE.Group(); ug.position.set(w.x, 0, w.z); scene.add(ug); regUse(ug, 'bkcash', o); V.stacks.push(o); } }
  mb(1.6, 0.7, 0.9, 0, 0.35, -depth / 2 + 0.8, BKM.dark); for (let i = 0; i < 3; i++) { const gb = mb(0.7, 0.2, 0.35, -0.8 + i * 0.8, 0.8, -depth / 2 + 0.8, BKM.gold); const w = L2W(-0.8 + i * 0.8, -depth / 2 + 0.8); const o = { v: V, m: gb, cd: 0 }; const ug = new THREE.Group(); ug.position.set(w.x, 0, w.z); scene.add(ug); regUse(ug, 'bkgold', o); V.gold.push(o); }
  const fp = L2W(0, zf + 1.4), ug = new THREE.Group(); ug.position.set(fp.x, 0, fp.z); scene.add(ug); regUse(ug, 'bkvault', { v: V }); V.use = ug;
  b.vault = { x0: Math.min(L2W(-wid / 2 - 0.5, -depth / 2).x, L2W(wid / 2 + 0.5, zf + 2).x) - 0.5, x1: Math.max(L2W(-wid / 2 - 0.5, -depth / 2).x, L2W(wid / 2 + 0.5, zf + 2).x) + 0.5, z0: Math.min(L2W(-wid / 2 - 0.5, -depth / 2).z, L2W(wid / 2 + 0.5, zf + 2).z) - 0.5, z1: Math.max(L2W(-wid / 2 - 0.5, -depth / 2).z, L2W(wid / 2 + 0.5, zf + 2).z) + 0.5 };
  V.fp = fp; V.L2W = L2W; BK.v.set(b.id, V); return V;
}
function bkAlarm(V, why) { const b = V.b; V.angry = 120; if (!(b.alarm > 0)) msg('🚨 ALARM! ' + (why || 'Robbery in progress'), 2500); b.alarm = Math.max(b.alarm || 0, 90); crime(3, 'Bank robbery', 'bank' + b.id); }
function bkUse(f, o) {
  if (f === 'bkvault') { const V = o.v; if (V.open) return msg('🏦 The vault is open. Grab the cash!', 2000); if (BK.drill) return; if (!BK.hasDrill) { if (money < 200) return msg('🔩 A thermal drill costs $200', 2200); money -= 200; hud(); BK.hasDrill = true; msg('🔩 Drill bought. Press E again to start: it takes 25 s and sets off the alarm', 4000); return; } BK.hasDrill = false; BK.drill = { V, t: 0 }; bkAlarm(V, 'Vault breach'); }
  else if (f === 'bkcash' || f === 'bkgold') { if (!o.v.open || o.cd > 0) return; o.cd = 480; o.m.visible = false; if (f === 'bkgold') { const w = 2500; money += w; msg('🥇 Gold bar +$' + w, 2000); } else if (o.dye) { money -= Math.min(money, 300); P.hp = Math.max(1, P.hp - 12); msg('💥 DYE PACK! The money is ruined and you take damage (-$300)', 3000); smokeAt(P.pos.x, P.pos.z, 0xe0245e); } else { const w = 600 + Math.floor(Math.random() * 1200); money += w; msg('💵 Cash +$' + w, 1800); } hud(); sfx('click'); bkAlarm(o.v); }
}
function mkBankGuard(V, i) {
  const b = V.b, L = V.L2W(i ? 3 : -3, 8.5), g = new THREE.Group(), tm = new THREE.MeshLambertMaterial({ color: 0x23324a });
  const parts = [[new THREE.BoxGeometry(0.7, 0.7, 0.4), 0x15181c, 0.35], [new THREE.BoxGeometry(0.85, 0.85, 0.55), 0x23324a, 1.1], [new THREE.BoxGeometry(0.5, 0.5, 0.5), 0xe0b48f, 1.78]].map(([ge, c, y]) => { const m = new THREE.Mesh(ge, c === 0x23324a ? tm : new THREE.MeshLambertMaterial({ color: c })); m.position.y = y; g.add(m); return m; });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.56), new THREE.MeshLambertMaterial({ color: 0x111418 })); cap.position.y = 2.06; g.add(cap); const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.5), new THREE.MeshStandardMaterial({ color: 0x222 })); gun.position.set(0.42, 1.15, 0.4); g.add(gun); g.position.set(L.x, 0, L.z); scene.add(g);
  const e = { ...mkEnt(L.x, 0, L.z, 0.4, 1.95), mesh: g, hp: 110, hurt: 0, cd: 1, dead: false, mat: tm, col: 0x23324a, bank: V, i, home: L };
  parts.forEach(m => { m.userData.enemy = e; enemyMeshes.push(m); }); parts[2].userData.head = true; try { attachSoldier(e, 0x2a5aa8); } catch (er) {} V.guards[i] = e; return e;
}
function bkGuards(V, dt) {
  const b = V.b, T = P.pos, hostile = (V.angry || 0) > 0; V.angry = Math.max(0, (V.angry || 0) - dt);
  for (let i = 0; i < 2; i++) {
    let e = V.guards[i]; if (!e || e.dead) { if (e && !e.counted) { e.counted = true; V.gT = 120; } V.gT = (V.gT || 0) - dt; if (V.gT <= 0 && !hostile) e = mkBankGuard(V, i); else continue; }
    if (stunned(e, dt)) continue; if (e.hp < (e.hpL === undefined ? 110 : e.hpL)) { V.angry = Math.max(V.angry || 0, 40); } e.hpL = e.hp; e.hurt -= dt; e.mat.color.setHex(e.hurt > 0 ? 0xffffff : e.col); e.cd -= dt;
    const dx = T.x - e.pos.x, dz = T.z - e.pos.z, d = Math.hypot(dx, dz); let mx = 0, mz = 0, sp = 5.2;
    if (hostile && d < 45) { if (d > 9) { mx = dx / d; mz = dz / d; } e.mesh.rotation.y = Math.atan2(dx, dz); } else { const hx = e.home.x - e.pos.x, hz = e.home.z - e.pos.z, hd = Math.hypot(hx, hz); if (hd > 0.8) { mx = hx / hd; mz = hz / hd; sp = 2; e.mesh.rotation.y = Math.atan2(hx, hz); } }
    const ox = e.pos.x, oz = e.pos.z; phys(e, mx * sp, mz * sp, dt); if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = 9; e.mesh.position.copy(e.pos);
    if (hostile && d < 32 && e.cd <= 0) { e.cd = 0.55 + Math.random() * 0.2; sfxAt(e.pos, 'shoot'); e.flashAt = clock; e.aimT = 1.0; beam(new V3(e.pos.x, 1.6, e.pos.z), new V3(T.x, T.y + 1.1, T.z), 0xffd23a, 80); if (Math.random() < (d < 14 ? 0.5 : 0.28)) hurt(8, true); }
  }
}
function bankVaultTick(dt) {
  BK.t += dt; let nearest = null, nd = 90;
  for (const b of institutions) { if (b.purpose !== 'bank') continue; const d = Math.hypot(b.x - P.pos.x, b.z - P.pos.z); if (d < nd) { nd = d; nearest = b; } }
  for (const V of BK.v.values()) if (V !== (nearest && BK.v.get(nearest.id)) && Math.hypot(V.b.x - P.pos.x, V.b.z - P.pos.z) > 160 && V.guards.length) { for (const e of V.guards) if (e && !e.dead) { scene.remove(e.mesh); e.mesh.traverse(m => { const k = enemyMeshes.indexOf(m); if (k >= 0) enemyMeshes.splice(k, 1); }); } V.guards.length = 0; }
  if (nearest) { const V = BK.v.get(nearest.id) || bkBuild(nearest); bkGuards(V, dt);
    for (const o of V.stacks.concat(V.gold)) if (o.cd > 0) { o.cd -= dt; if (o.cd <= 0) o.m.visible = true; }
    if (V.open) { V.openT = (V.openT || 0) + dt; const all = V.stacks.concat(V.gold).every(o => o.cd > 0); if (V.openT > 150 || (all && V.openT > 25)) { V.open = 0; V.openT = 0; solids.set(V.doorKey, V.doorBox); msg('🔒 The vault door slams shut', 2000); } }
    if (BK.drill && BK.drill.V === V) { const D = BK.drill, dd = Math.hypot(P.pos.x - V.fp.x, P.pos.z - V.fp.z); if (dd < 4.5) { D.t += dt; if (D.t >= 25) { BK.drill = null; V.open = 1; solids.delete(V.doorKey); msg('🔓 Vault open! Grab the loot and run', 3500); bkHud.style.display = 'none'; } else { bkHud.style.display = 'block'; bkHud.textContent = '🔩 Drilling ' + Math.round(D.t / 25 * 100) + '%  (stay by the vault door)'; bkHud.style.background = 'linear-gradient(90deg,#d35400 ' + Math.round(D.t / 25 * 100) + '%,#1a1d22 ' + Math.round(D.t / 25 * 100) + '%)'; } } else { bkHud.style.display = 'block'; bkHud.textContent = '🔩 Drill paused: get back to the door'; } if (nearest.alarm < 20) nearest.alarm = 60; }
    if (V.open) { V.ang = Math.min(1.7, V.ang + dt * 1.2); V.dg.rotation.y = -V.ang; } else { V.dg.rotation.y = 0; V.ang = 0; }
  } else if (BK.drill) { BK.drill = null; bkHud.style.display = 'none'; }
  if (!BK.drill && bkHud.style.display !== 'none' && BK.t > 0) bkHud.style.display = 'none';
}
