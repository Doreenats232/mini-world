// ---------- NPC fights in the slums: two brawlers, onlookers, punches, knock-outs; step in and shove/shoot to break it up ----------
const FIGHT = { t: 8, list: [] };
const isSlum = (x, z) => x < -360 || (x < 0 && (z < -360 || z > 330));
const TAUNTS = ["You want some?!", "Come on then!", "Say that again!", "You owe me money!", "Stay off my street!", "I'll finish you!", "Hit me!"];
function startFight() {
  const s = roadSpot(); if (!s || !isSlum(s.x, s.z) || citizens.length > (isTouch ? 30 : 64)) return false;
  const ax = s.axis, mk = (d, col) => { const x = ax === 'x' ? s.x + d * 1.0 : s.x, z = ax === 'x' ? s.z : s.z + d * 1.0, c = mkCitizen('walker', x, z, d > 0 ? Math.PI / 2 * (ax === 'x' ? -1 : 0) : 0, { axis: ax, line: s.line, lane: s.lane, dir: 1, doorT: 99, label: 'brawler', brawl: true, shirtTint: col }); c.nextI = nextI(c.pos[ax], 1); return c; };
  const A = mk(-1.2), B = mk(1.2); const f = { A, B, t: 0, ends: 0, spect: [] };
  A.fight = { opp: B, hp: 42, sw: 0.3, arm: 0, id: f }; B.fight = { opp: A, hp: 42, sw: 0.6, arm: 0, id: f };
  const cx = (A.pos.x + B.pos.x) / 2, cz = (A.pos.z + B.pos.z) / 2;
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + Math.random(), x = cx + Math.cos(a) * 5.2, z = cz + Math.sin(a) * 5.2; try { const w = mkCitizen('watcher', x, z, Math.atan2(cx - x, cz - z), { home: new V3(x, 0, z), isStatic: true, site: { x: cx, z: cz }, label: 'onlooker', brawl: true }); f.spect.push(w); } catch (e) {} }
  FIGHT.list.push(f); citizenSay(A, pick(TAUNTS)); setTimeout(() => { if (!B.dead) citizenSay(B, pick(TAUNTS)); }, 900); return true;
}
function endFight(f, loser) {
  if (f.done) return; f.done = true;
  for (const c of [f.A, f.B]) { if (c.dead) continue; c.fight = null; c.resnap = true; if (c !== loser) { c.fleeT = 0; c.celebT = 2.5; } }
  for (const w of f.spect) if (!w.dead) w.scareAt = 1;
}
function fightStep(c, dt) {
  const f = c.fight, o = f.opp, F = f.id;
  if (!o || o.dead || !o.fight) { endFight(F, null); return; }
  const dx = o.pos.x - c.pos.x, dz = o.pos.z - c.pos.z, d = Math.hypot(dx, dz) || 1; c.yaw = Math.atan2(dx, dz);
  if (d > 1.15) { c.pos.x += dx / d * 3.4 * dt; c.pos.z += dz / d * 3.4 * dt; animWalk(c, 3.4, dt, 0.9); c.aR.rotation.x = -0.9; c.aL.rotation.x = -0.9; return; }
  c.lL.rotation.x = 0; c.lR.rotation.x = 0; f.sw -= dt; f.arm = Math.max(0, f.arm - dt);
  const k = f.arm > 0 ? Math.sin((1 - f.arm / 0.28) * Math.PI) : 0; c.aR.rotation.x = -0.9 - 1.0 * k; c.aL.rotation.x = -0.7 + 0.2 * Math.sin(c.t * 8);
  if (f.sw <= 0) {
    f.sw = 0.55 + Math.random() * 0.55; f.arm = 0.28; F.t += 0.1;
    if (Math.random() < 0.62) { const dmg = 6 + Math.random() * 8; o.fight.hp -= dmg; o.kv = o.kv || new V3(); o.kv.set(dx / d * 2.5, 0, dz / d * 2.5); o.pos.x += dx / d * 0.25; o.pos.z += dz / d * 0.25; o.bounce = 0.12; setTimeout(() => { if (!o.dead) o.bounce = 0; }, 120); try { sfxAt(c.pos, 'punch'); } catch (e) {} if (Math.random() < 0.2) citizenSay(o, pick(['Argh!', 'You...!', 'Ow!'])); }
    if (o.fight && o.fight.hp <= 0) { o.downT = 9 + Math.random() * 4; o.fight = null; o.fleeT = 0; endFight(F, o); citizenSay(c, pick(['Stay down!', 'Told you.', 'Nobody messes with me.'])); }
  }
}
function fightTick(dt) {
  FIGHT.t -= dt; FIGHT.list = FIGHT.list.filter(f => !f.done || f.spect.some(w => !w.dead));
  if (FIGHT.t <= 0) { FIGHT.t = 30 + Math.random() * 40; if (FIGHT.list.filter(f => !f.done).length < 2) startFight(); }
  for (const f of FIGHT.list) {
    if (!f.done) { f.ends += dt; if (f.ends > 60 || Math.hypot(f.A.pos.x - P.pos.x, f.A.pos.z - P.pos.z) > 140) { for (const c of [f.A, f.B]) if (!c.dead) c.fight = null; f.done = true; } }
    else { f.after = (f.after || 0) + dt; for (const w of f.spect) if (!w.dead && f.after > 5) removeCitizen(w); }
    for (const c of [f.A, f.B]) if (!c.dead && c.celebT > 0) { c.celebT -= dt; c.aR.rotation.x = -2.6 + Math.sin(c.t * 10) * 0.3; if (c.celebT <= 0) { c.aR.rotation.x = 0; scareOne(c, P.pos, 10); } }
  }
}
