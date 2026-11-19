// ---------- Area 51 extras: hack the gate / loot a guard's pass, UFO plasma cannon + tractor-beam abductions, containment breaches ----------
Object.assign(A51, { ft: 0, abd: null, hack: null, esc: [], escT: 150 });
{ ab(1.2, 1.6, 0.6, 10, 0.8, 53, A51M.dark); const sc = ab(0.9, 0.6, 0.06, 10, 1.4, 52.66, A51M.green); fsign('GATE PANEL', 1.6, 0.4, 10, 2.1, 52.7, 0, '#111', '#39ff88', 14, a51Grp); asolid(9.3, 10.7, 52.6, 53.4, 1.7, 'hk'); const g = new THREE.Group(); g.position.set(AX + 10, 0, AZ + 54.4); scene.add(g); regUse(g, 'a51hack', {}); a51Grp.traverse(o => { if (o.isMesh) o.userData.noShadow = true; }); }
USEN.a51hack = 'hack the gate panel';
const a51UseBase = a51Use;
a51Use = function (f, o) { if (f === 'a51hack') { if (A51.pass > 0) return msg('🔓 You already have access', 1500); A51.hack = { t: 0 }; msg('💻 Hacking the gate… stay at the panel', 2500); return; } return a51UseBase(f, o); };
function ufoFire() {
  const u = A51.ufo.position, o = new V3(AX + u.x, u.y - 0.6, AZ + u.z), sy = Math.sin(P.yaw), cy = Math.cos(P.yaw), cp = Math.cos(P.pitch), d = new V3(-sy * cp, Math.sin(P.pitch), -cy * cp).normalize();
  copRay.set(o, d); copRay.far = 160; const hit = copRay.intersectObjects(enemyMeshes, false)[0], len = hit ? hit.distance : 120;
  beam(o, o.clone().addScaledVector(d, len), 0x66ffaa, 110); sfx('shoot', 0.8); if (hit && hit.object.userData.enemy && !hit.object.userData.enemy.dead) damageEnemy(hit.object.userData.enemy, 80);
}
function abductStep(dt) {
  const u = A51.ufo.position, ux = AX + u.x, uz = AZ + u.z; let c = A51.abd && A51.abd.c;
  if (c && (c.dead || c.removed || Math.hypot(c.pos.x - ux, c.pos.z - uz) > 13)) { if (c && c.g) c.g.scale.setScalar(1); A51.abd = null; c = null; }
  if (!c) { let nd = 12; for (const k of citizens) { if (k.dead || k.removed || k.fam) continue; const d = Math.hypot(k.pos.x - ux, k.pos.z - uz); if (d < nd && u.y > 3) { nd = d; c = k; } } if (!c) return; A51.abd = { c, t: 0 }; }
  const D = A51.abd; D.t += dt; c.g.scale.setScalar(Math.max(0.05, 1 - D.t / 1.6)); c.g.rotation.y += dt * 8;
  if (D.t >= 1.6) { removeCitizen(c); A51.abd = null; money += 120; A51.samples++; a51Save(); hud(); crime(2, 'Abducting people', 'abd'); msg('👽 Abducted ' + (c.name || 'a person') + ': +$120, +1 research sample', 3000); }
}
function a51Breach() {
  const kinds = [8, 1, 2, 5, 4, 6, 10, 11, 9], n = 4 + Math.floor(Math.random() * 2); A51.alarm = 25;
  for (let i = 0; i < n; i++) { const kind = kinds[Math.floor(Math.random() * kinds.length)], x = AX + 58 + Math.random() * 4, z = AZ - 15 + (Math.random() - 0.5) * 4, g = new THREE.Group(); g.userData.hunter = 1; const anim = CRE[kind][2](g), big = kind === 4 ? 1.5 : 1.1; g.scale.setScalar(big); g.position.set(x, 0, z); scene.add(g);
    const e = { ...mkEnt(x, 0, z, 0.5 * big, 1.7 * big), mesh: g, hp: kind === 4 ? 260 : 110, hurt: 0, cd: 1, dead: false, mob: 1, anim, sp: kind === 4 ? 4 : 5.2, dmg: 11, kind, hd: Math.random() * 6.283, ht: 0, esc: 1, life: 200 }; g.traverse(m => { if (m.isMesh) { m.userData.enemy = e; enemyMeshes.push(m); } }); A51.esc.push(e); }
  msg('🚨 CONTAINMENT BREACH at Area 51! Creatures have escaped', 5000);
}
function a51ExTick(dt) {
  if (A51.fly) { A51.ft -= dt; if (typeof held !== 'undefined' && held && A51.ft <= 0) { A51.ft = 0.22; ufoFire(); } if (keys.KeyF) abductStep(dt); else if (A51.abd) { A51.abd.c.g.scale.setScalar(1); A51.abd = null; } }
  if (A51.hack) { const H = A51.hack, d = Math.hypot(P.pos.x - (AX + 10), P.pos.z - (AZ + 54)); if (d > 4) { A51.hack = null; msg('💻 Hack cancelled', 1500); } else { H.t += dt; if (H.t >= 6) { A51.hack = null; if (Math.random() < 0.55) { A51.pass = Math.max(A51.pass, 300); msg('🔓 Gate hacked: access for 5 min', 3500); } else { A51.alarm = 15; A51.alert = Math.max(A51.alert, 60); crime(2, 'Hacking Area 51', 'a51h'); msg('🚨 Hack failed! Alarm triggered', 3000); } } } }
  const far = Math.hypot(P.pos.x - AX, P.pos.z - AZ) > 450; A51.escT -= dt; if (!far && A51.escT <= 0 && !A51.esc.length) { a51Breach(); A51.escT = 240 + Math.random() * 120; }
  for (let i = A51.esc.length - 1; i >= 0; i--) { const e = A51.esc[i]; e.life -= dt; if (e.dead || e.life <= 0 || far) { e.mesh.traverse(m => { const k = enemyMeshes.indexOf(m); if (k >= 0) enemyMeshes.splice(k, 1); }); if (!e.dead) scene.remove(e.mesh); else if (Math.random() < 0.35) { A51.samples++; a51Save(); msg('🧪 Escaped specimen tissue +1 sample', 2000); } A51.esc.splice(i, 1); continue; } plMobStep(e, dt); }
}
