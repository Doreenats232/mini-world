// ---------- police / wanted ----------
const cops = [], copRay = new THREE.Raycaster();
function hudStars() { const el = $('stars'); el.style.display = wanted ? 'block' : 'none'; el.textContent = '★'.repeat(wanted) + '☆'.repeat(3 - wanted); }
function crime(n, why, key, cap = 3) {
  if (key) { if (clock - (crimeCD[key] || -99) < 8) return; crimeCD[key] = clock; }
  const before = wanted; wanted = Math.max(wanted, Math.min(cap, wanted + n)); lastCrime = clock; calmT = 0;
  if (wanted > before) { hudStars(); msg('WANTED: ' + why, 1800); sfx('siren'); }
}
function beam(a, b, col, ms) { const g = new THREE.BufferGeometry().setFromPoints([a, b]), l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col })); scene.add(l); setTimeout(() => { scene.remove(l); g.dispose(); }, ms); }
function mkCop(x, z) {
  const g = new THREE.Group(), tm = new THREE.MeshLambertMaterial({ color: 0x1d3a8a });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x14213d })); legs.position.y = 0.35;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), tm); torso.position.y = 1.1;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshLambertMaterial({ color: 0xe0b48f })); head.position.y = 1.75;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), new THREE.MeshLambertMaterial({ color: 0x0b1d4a })); cap.position.y = 2.05;
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), new THREE.MeshLambertMaterial({ color: 0xffd400 })); badge.position.set(0.2, 1.3, 0.27);
  g.add(legs, torso, head, cap, badge); g.position.set(x, 0, z); scene.add(g);
  const e = { ...mkEnt(x, 0, z, 0.4, 1.95), mesh: g, hp: 80, mat: tm, col: 0x1d3a8a, hurt: 0, cd: 1, dead: false, cop: true };
  [legs, torso, head, cap].forEach(m => { m.userData.enemy = e; enemyMeshes.push(m); }); head.userData.head = true; cops.push(e); attachSoldier(e, 0x5d86e8);
}
function spawnCop() {
  for (let t = 0; t < 12; t++) {
    const v = Math.random() < 0.5, k = Math.floor(Math.random() * 16) - 8, a = (v ? P.pos.z : P.pos.x) + (Math.random() - 0.5) * 140;
    const x = v ? k * 50 + 25 : a, z = v ? a : k * 50 + 25, d = Math.hypot(x - P.pos.x, z - P.pos.z);
    if (d < 35 || d > 75) continue; mkCop(x, z); return;
  }
}
function clearCops() { for (const e of cops) { scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); } cops.length = 0; }
function copStep(e, dt) {
  if (stunned(e, dt)) return;
  const T = inCar ? inCar.pos : P.pos, dx = T.x - e.pos.x, dz = T.z - e.pos.z, d = Math.hypot(dx, dz);
  if (d > 160) { e.hp = 0; e.dead = true; scene.remove(e.mesh); e.mesh.children.forEach(m => { const i = enemyMeshes.indexOf(m); if (i >= 0) enemyMeshes.splice(i, 1); }); return; }
  const sp = 5.8 + wanted * 0.6, mx = d > 7 ? dx / d : 0, mz = d > 7 ? dz / d : 0, ox = e.pos.x, oz = e.pos.z;
  phys(e, mx * sp, mz * sp, dt);
  if (e.ground && (mx || mz) && Math.hypot(e.pos.x - ox, e.pos.z - oz) < sp * dt * 0.3) e.vel.y = 11;
  e.mesh.position.copy(e.pos); e.mesh.rotation.y = Math.atan2(dx, dz);
  e.hurt -= dt; e.mat.color.setHex(e.hurt > 0 ? 0xffffff : e.col); e.cd -= dt;
  if (e.cd > 0) return;
  if (d < 2 && !inCar) { hurt(10, true); e.cd = 0.8; return; }
  if (d < 26) {
    e.cd = 1.1 + Math.random() * 0.5;
    const o = new V3(e.pos.x, 1.6, e.pos.z), tg = new V3(T.x, inCar ? 1.2 : P.pos.y + 1.2, T.z), dir = tg.clone().sub(o), dl = dir.length(); dir.normalize();
    copRay.set(o, dir); copRay.far = dl; if (copRay.intersectObjects(targets, false)[0]) return;
    sfxAt(e.pos, 'shoot'); e.flashAt = clock; e.aimT = 1.0; beam(o, tg, 0xff5555, 80); if (Math.random() < 0.35) hurt(8, true);
  }
}

// ---------- shop ----------
const SHOP = { x: 36, z: 22 };
let hintOn = false, hintTxt = '';
$('hint').textContent = isTouch ? 'Tap CAR button: open shop' : 'Press E: open shop';
(function () {
  const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: c });
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 5), M(0x555a60)); base.position.y = 0.15; g.add(base);
  for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), M(0xdddddd)); p.position.set(x, 1.8, z); g.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.4, 5.6), M(0xc0392b)); roof.position.y = 3.6; g.add(roof);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1), M(0x8b5a2b)); counter.position.set(0, 0.85, -1); g.add(counter);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128; const sg = sc.getContext('2d');
  sg.fillStyle = '#d4a017'; sg.fillRect(0, 0, 256, 128); sg.fillStyle = '#111'; sg.font = 'bold 60px sans-serif'; sg.textAlign = 'center'; sg.fillText('$ SHOP', 128, 84);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: st })); sp.scale.set(5, 2.5, 1); sp.position.y = 5.4; g.add(sp);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 40, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: 0.25, depthWrite: false })); beam.position.y = 20; g.add(beam);
  g.position.set(SHOP.x, 0, SHOP.z); scene.add(g);
})();
const shopNear = () => dist2(P.pos, SHOP) < 5;
function spawnCarNearby() {
  for (const a of [0, 1.57, -1.57, 3.14]) {
    const x = P.pos.x - Math.sin(P.yaw + a) * 8, z = P.pos.z - Math.cos(P.yaw + a) * 8, t = { pos: new V3(x, 0, z), R: 2, H: 1.2 };
    let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
    if (!bad) { mkCar(x, z, P.yaw + a + Math.PI, [0xff6b6b, 0x4dabf7, 0xffd43b, 0x69db7c, 0xda77f2][Math.floor(Math.random() * 5)], true); return true; }
  }
  return false;
}
function spawnBikeNearby() {
  for (const a of [0, 1.57, -1.57, 3.14]) {
    const x = P.pos.x - Math.sin(P.yaw + a) * 3, z = P.pos.z - Math.cos(P.yaw + a) * 3, t = { pos: new V3(x, 0, z), R: 1, H: 1.2 };
    let bad = false; for (const b of solids.values()) if (hit(t, b)) { bad = true; break; }
    if (!bad) { mkBike(x, z, P.yaw + a + Math.PI / 2); return true; }
  }
  return false;
}
function swapWeapon() { if (!hasShotgun) { msg('Buy the shotgun at the shop', 1500); return; } weapon = weapon === 'pistol' ? 'shotgun' : 'pistol'; hud(); }
function colAct() { if (mode === 'fight') swapWeapon(); else selBlock(sel + 1); }
const ITEMS = [
  { name: 'Health pack', desc: 'Restore full health', cost: () => 50, can: () => P.hp < maxHp(), buy: () => { P.hp = maxHp(); } },
  { name: 'Gun damage +25%', desc: () => 'Level ' + up.dmg + '/3', cost: () => 150 + 100 * up.dmg, can: () => up.dmg < 3, buy: () => { up.dmg++; } },
  { name: 'Max health +25', desc: () => 'Level ' + up.hp + '/3', cost: () => 200 + 150 * up.hp, can: () => up.hp < 3, buy: () => { up.hp++; P.hp = maxHp(); } },
  { name: 'Run speed +15%', desc: () => 'Level ' + up.spd + '/2', cost: () => 150 + 100 * up.spd, can: () => up.spd < 2, buy: () => { up.spd++; } },
  { name: 'Shotgun', desc: 'Press R (or GUN button) in fight mode', cost: () => 300, can: () => !hasShotgun, buy: () => { hasShotgun = true; weapon = 'shotgun'; } },
  { name: 'Supplies for NPCs', desc: '+40 wood, +30 stone, +15 sand each', cost: () => 120, can: () => true, buy: () => { for (const n of npcs) { n.inv.wood = Math.min(60, n.inv.wood + 40); n.inv.stone = Math.min(60, n.inv.stone + 30); n.inv.sand = Math.min(60, n.inv.sand + 15); } ev('You gave the crew supplies from the shop'); } },
  { name: 'New bike', desc: 'Delivered next to you', cost: () => 40, can: () => true, buy: () => spawnBikeNearby() },
  { name: 'New car', desc: 'Delivered next to you', cost: () => 200, can: () => true, buy: () => spawnCarNearby() },
];
function renderShop() {
  $('shopmoney').textContent = '$' + money;
  const box = $('shopitems'); box.innerHTML = '';
  for (const it of ITEMS) {
    const row = document.createElement('div'); row.className = 'srow';
    const cost = it.cost(), ok = it.can();
    const info = document.createElement('div'); info.innerHTML = '<b></b><br><small></small>';
    info.firstChild.textContent = it.name; info.lastChild.textContent = typeof it.desc === 'function' ? it.desc() : it.desc;
    const b = document.createElement('button'); b.textContent = ok ? '$' + cost : 'MAX'; b.disabled = !ok || money < cost;
    b.onclick = () => { if (money < cost || !it.can()) return; if (it.buy() === false) { msg('No room for that here', 1200); return; } money -= cost; sfx('place'); save(); hud(); renderShop(); };
    row.append(info, b); box.appendChild(row);
  }
}
function openShop() { shopOpen = true; for (const k in keys) keys[k] = false; document.exitPointerLock && document.exitPointerLock(); renderShop(); $('shop').style.display = 'block'; }
function closeShop() { if (phoneOpen) { closePhone(); return; } shopOpen = false; $('shop').style.display = 'none'; }
$('shopclose').addEventListener('click', closeShop);

