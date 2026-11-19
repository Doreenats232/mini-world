// ---------- Entertainment Plaza (far west of the city): casino (slots, roulette, sports betting on a live TV) + concert arena (ticket pit, band, light show, crowd) ----------
const EX = -720, EZ = 25, ENT = { tv: null, bet: null, con: { t: 0, on: 0, ticket: 0, att: 0 }, keys: [], phase: 'open', pt: 20 }, entGrp = new THREE.Group(); entGrp.position.set(EX, 0, EZ); scene.add(entGrp);
const eb = (w, h, d, x, y, z, mat) => ab(w, h, d, x, y, z, mat, entGrp);
const esolid = (x0, x1, z0, z1, h, tag) => { const k = 'en' + ENT.keys.length + (tag || ''); const b = new THREE.Box3(new V3(EX + x0, 0, EZ + z0), new V3(EX + x1, h || 3, EZ + z1)); solids.set(k, b); ENT.keys.push(k); return { k, b }; };
const EM = { felt: new THREE.MeshStandardMaterial({ color: 0x0f6b3a, roughness: 0.9 }), neon: new THREE.MeshBasicMaterial({ color: 0xff3cc8 }), gold: FMT.gold, red: new THREE.MeshStandardMaterial({ color: 0xb3202a, roughness: 0.6 }), carpet: new THREE.MeshLambertMaterial({ color: 0x5a1a2e }), wall: new THREE.MeshStandardMaterial({ color: 0x241628, roughness: 0.8 }), stage: new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.5, metalness: 0.4 }) };
const eUse = (x, z, f, o) => { const g = new THREE.Group(); g.position.set(EX + x, 0, EZ + z); scene.add(g); regUse(g, f, o); return g; };
// ground + road in from the city (east side)
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(80, 70), new THREE.MeshLambertMaterial({ color: 0x4a4d55 })); g.rotation.x = -Math.PI / 2; g.position.y = 0.02; entGrp.add(g);
  const rd = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), roadMat.clone()); rd.material.map = roadTex.clone(); rd.material.map.repeat.set(1, 3); rd.material.map.needsUpdate = true; rd.rotation.x = -Math.PI / 2; rd.rotation.z = Math.PI / 2; rd.position.set(70, 0.03, 0); entGrp.add(rd);
  fsign('★ ENTERTAINMENT PLAZA ★', 12, 1.8, 38, 7.5, 0, Math.PI / 2, '#1a0d2e', '#ff7ad9', 28, entGrp); eb(0.6, 7.5, 0.6, 38, 3.75, -7.5, EM.wall); eb(0.6, 7.5, 0.6, 38, 3.75, 7.5, EM.wall); }
// ---- casino ----
const CAS = { x: -22, z: -20, w: 28, d: 20, h: 6.4 };
{ const { x, z, w, d, h } = CAS, wl = (cx, cz, sx, sz) => { eb(sx, h, sz, cx, h / 2, cz, EM.wall); esolid(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, h, 'c'); };
  eb(w + 0.6, 0.5, d + 0.6, x, h, z, EM.stage); wl(x, z - d / 2, w, 0.5); wl(x - w / 2, z, 0.5, d); wl(x + w / 2, z, 0.5, d); wl(x - 7.5, z + d / 2, 13, 0.5); wl(x + 7.5, z + d / 2, 13, 0.5); eb(3, 1.4, 0.5, x, h - 0.7, z + d / 2, EM.wall);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, d - 0.6), EM.carpet); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.06, z); entGrp.add(fl);
  fsign('🎰 STAR CASINO 🎰', 11, 1.6, x, h + 1.4, z + d / 2 + 0.3, 0, '#21062b', '#ffd23a', 34, entGrp); for (let i = 0; i < 14; i++) eb(0.35, 0.35, 0.35, x - 6.5 + i, h + 0.45, z + d / 2 + 0.2, EM.neon);
  // slot machines (6) along the back wall
  const sm = new THREE.MeshStandardMaterial({ color: 0xc8372d, metalness: 0.4, roughness: 0.4 }), sc = new THREE.MeshBasicMaterial({ color: 0xffe066 });
  for (let i = 0; i < 6; i++) { const sx = x - 10 + i * 3.6, sz = z - d / 2 + 1.2; eb(1.1, 2.0, 0.9, sx, 1.0, sz, sm); eb(0.8, 0.5, 0.05, sx, 1.5, sz + 0.47, sc); eb(0.9, 0.1, 0.5, sx, 1.0, sz + 0.5, EM.gold); esolid(sx - 0.6, sx + 0.6, sz - 0.5, sz + 0.5, 2, 's'); eUse(sx, sz + 1.3, 'entslot', { i }); }
  // roulette table (3 bet spots)
  const tx = x - 8, tz = z + 1; const tb = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.9, 24), EM.felt); tb.position.set(tx, 0.45, tz); entGrp.add(tb); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24), EM.gold); wh.position.set(tx, 0.96, tz); entGrp.add(wh); ENT.wheel = wh; esolid(tx - 2.3, tx + 2.3, tz - 2.3, tz + 2.3, 1, 'r');
  eUse(tx - 3.2, tz, 'entroul', { c: 'red' }); eUse(tx, tz + 3.2, 'entroul', { c: 'black' }); eUse(tx + 3.2, tz, 'entroul', { c: 'green' });
  for (const [ox, oz, col] of [[-1.4, 0, 0xd0202a], [0, 1.4, 0x111111], [1.4, 0, 0x1fb050]]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12), new THREE.MeshBasicMaterial({ color: col })); ch.position.set(tx + ox, 0.95, tz + oz); entGrp.add(ch); }
  // sportsbook: TV wall on the east wall + two bet stations
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; ENT.tv = { cv, g: cv.getContext('2d'), tex, t: 0 };
  const tvm = new THREE.MeshBasicMaterial({ map: tex }); const tv = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), tvm); tv.position.set(x + w / 2 - 0.4, 3.6, z - 2); tv.rotation.y = -Math.PI / 2; entGrp.add(tv); eb(0.3, 5.4, 10.4, x + w / 2 - 0.2, 3.6, z - 2, EM.stage);
  const tv2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), tvm); tv2.position.set(8, 3.4, -6); tv2.rotation.y = Math.PI; entGrp.add(tv2); eb(6.3, 3.3, 0.3, 8, 3.4, -5.85, EM.stage); eb(0.4, 3.4, 0.4, 8, 1.7, -6); esolid(7.8, 8.2, -6.2, -5.8, 3.5, 't');
  eb(2.4, 1.1, 1.0, x + w / 2 - 2.5, 0.55, z + 4, EM.stage); eb(2.4, 1.1, 1.0, x + w / 2 - 2.5, 0.55, z + 8, EM.stage); esolid(x + w / 2 - 3.8, x + w / 2 - 1.2, z + 3.4, z + 4.6, 1.2, 'b'); esolid(x + w / 2 - 3.8, x + w / 2 - 1.2, z + 7.4, z + 8.6, 1.2, 'b');
  fsign('BET · TEAM A', 2.2, 0.5, x + w / 2 - 2.5, 1.5, z + 3.4, Math.PI, '#0f2b6b', '#fff', 20, entGrp); fsign('BET · TEAM B', 2.2, 0.5, x + w / 2 - 2.5, 1.5, z + 7.4, Math.PI, '#6b0f1f', '#fff', 20, entGrp);
  eUse(x + w / 2 - 2.5, z + 2.4, 'entbet', { side: 'a' }); eUse(x + w / 2 - 2.5, z + 6.4, 'entbet', { side: 'b' }); }
// ---- concert arena ----
const CONC = { x: 12, z: 22 };
{ const sx = CONC.x, sz = CONC.z; eb(30, 1.2, 12, sx, 0.6, sz + 8, EM.stage); esolid(sx - 15, sx + 15, sz + 2, sz + 14, 1.2, 'st'); eb(32, 0.6, 14, sx, 12, sz + 8, EM.stage); for (const dx of [-15.5, 15.5]) eb(1, 12, 1, sx + dx, 6, sz + 14, EM.stage); eb(30, 11, 0.6, sx, 6, sz + 14, new THREE.MeshStandardMaterial({ color: 0x0c0d12 }));
  fsign('LIVE TONIGHT · THE NEON WOLVES', 18, 2.2, sx, 10.4, sz + 1.6, Math.PI, '#120820', '#ff7ad9', 28, entGrp);
  for (const dx of [-13, 13]) { eb(2, 3, 1.6, sx + dx, 2.7, sz + 4, EM.stage); const cone = new THREE.Mesh(new THREE.CircleGeometry(0.7, 14), new THREE.MeshBasicMaterial({ color: 0x222222 })); cone.position.set(sx + dx, 2.2, sz + 3.18); cone.rotation.y = Math.PI; entGrp.add(cone); }
  ENT.band = []; const hm = (c) => new THREE.MeshLambertMaterial({ color: c });
  for (const [dx, col, kind] of [[-6, 0xff3cc8, 'sing'], [0, 0x36c6ff, 'sing2'], [6, 0xffd23a, 'gtr'], [-11, 0x9b59b6, 'dj']]) { const p = new THREE.Group(); p.position.set(sx + dx, 1.2, sz + 6.5); const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.5), hm(col)); b.position.y = 1.0; const hd = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), hm(0xe0b48f)); hd.position.y = 1.85; const lg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), hm(0x14161c)); lg.position.y = 0.35; p.add(b, hd, lg); if (kind === 'gtr') { const gt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.1), hm(0x8a5a2b)); gt.position.set(0.4, 1.0, 0.35); gt.rotation.z = 0.9; p.add(gt); } p.rotation.y = Math.PI; entGrp.add(p); ENT.band.push(p); }
  const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 12), EM.red); dr.position.set(sx + 12, 1.6, sz + 8); entGrp.add(dr); ENT.drum = dr;
  ENT.spots = [0, 1, 2, 3].map(i => { const c = new THREE.Mesh(new THREE.ConeGeometry(1.1, 12, 12, 1, true), new THREE.MeshBasicMaterial({ color: [0xff3cc8, 0x36c6ff, 0xffd23a, 0x7dff6b][i], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); c.geometry.translate(0, -6, 0); const pv = new THREE.Group(); pv.position.set(sx - 12 + i * 8, 11.6, sz + 4); pv.add(c); entGrp.add(pv); return { pv, c }; });
  // pit fence + ticket gate + booth
  const pit = { x0: sx - 15, x1: sx + 15, z0: sz - 16, z1: sz + 1.5 }; ENT.pit = pit;
  for (const [cx, cz, sx2, sz2] of [[sx, pit.z0, 30, 0.2], [pit.x0, (pit.z0 + pit.z1) / 2, 0.2, pit.z1 - pit.z0], [pit.x1, (pit.z0 + pit.z1) / 2, 0.2, pit.z1 - pit.z0]]) { eb(sx2, 1.2, sz2, cx, 0.6, cz, EM.neon); esolid(cx - sx2 / 2, cx + sx2 / 2, cz - sz2 / 2, cz + sz2 / 2, 1.2, 'p'); }
  ENT.gate = esolid(sx - 3, sx + 3, pit.z0 - 0.3, pit.z0 + 0.3, 1.4, 'gate'); eb(6, 1.0, 0.4, sx, 0.5, pit.z0, EM.gold);
  eb(2.6, 2.6, 2.2, sx - 8, 1.3, pit.z0 - 3, EM.red); eb(3, 0.2, 2.6, sx - 8, 2.7, pit.z0 - 3, EM.wall); esolid(sx - 9.4, sx - 6.6, pit.z0 - 4.2, pit.z0 - 1.8, 2.7, 'bo'); fsign('CONCERT TICKETS $25', 2.6, 0.5, sx - 8, 2.2, pit.z0 - 1.9, 0, '#fff', '#8a1c1c', 17, entGrp); eUse(sx - 8, pit.z0 - 1.2, 'entticket', {});
  // crowd: one instanced mesh
  const N = 60; ENT.crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 1.6, 0.5), new THREE.MeshLambertMaterial({ color: 0xffffff }), N); ENT.cpos = []; const col = new THREE.Color();
  for (let i = 0; i < N; i++) { ENT.cpos.push([sx + (Math.random() - 0.5) * 26, sz - 14 + Math.random() * 14, Math.random() * 6]); col.setHSL(Math.random(), 0.6, 0.55); ENT.crowd.setColorAt(i, col); } entGrp.add(ENT.crowd); ENT.crowd.frustumCulled = false; }
USEN.entslot = 'play slots $20'; USEN.entroul = 'roulette: bet $50'; USEN.entbet = 'sports bet $100'; USEN.entticket = 'buy concert ticket $25';
const SYM = ['🍒', '🍋', '🔔', '⭐', '7️⃣'];
function entUse(f, o) {
  if (f === 'entslot') { if (money < 20) return msg('🎰 Slots cost $20', 1500); money -= 20; const r = Math.random(); let mult = 0, s; if (r < 0.002) mult = 50; else if (r < 0.014) mult = 15; else if (r < 0.054) mult = 5; else if (r < 0.204) mult = 2;
    if (mult) { const sy = SYM[mult === 50 ? 4 : mult === 15 ? 3 : mult === 5 ? 2 : Math.floor(Math.random() * 2)]; s = sy + ' ' + sy + ' ' + sy; money += 20 * mult; tone(500, 900, 0.2, 'square', 0.15); } else { const a = Math.floor(Math.random() * 5), b = (a + 1 + Math.floor(Math.random() * 4)) % 5, c = Math.floor(Math.random() * 5); s = SYM[a] + ' ' + SYM[b] + ' ' + SYM[c]; sfx('click'); }
    hud(); msg('🎰 ' + s + (mult ? '  WIN $' + 20 * mult + '!' : '  no luck'), 2200); }
  else if (f === 'entroul') { if (money < 50) return msg('🎲 Bet is $50', 1500); money -= 50; const n = Math.floor(Math.random() * 37), red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n), col = n === 0 ? 'green' : red ? 'red' : 'black', win = col === o.c, pay = o.c === 'green' ? 1800 : 100;
    if (win) money += pay; hud(); sfx('click'); msg('🎲 ' + n + ' ' + col.toUpperCase() + (win ? '  — you win $' + pay + '!' : '  — you lose $50'), 2600); }
  else if (f === 'entbet') { const B = ENT.bet; if (!B || ENT.phase !== 'open') return msg('📺 Betting is closed. Wait for the next match', 2200); if (B.mine) return msg('📺 You already bet on this match', 2000); if (money < 100) return msg('📺 Bets are $100', 1500); money -= 100; B.mine = o.side; hud(); const od = o.side === 'a' ? B.oa : B.ob; msg('📺 Bet placed on ' + (o.side === 'a' ? B.a : B.b) + ' at x' + od.toFixed(2) + '. Watch the TV!', 3000); }
  else if (f === 'entticket') { const C = ENT.con; if (C.ticket) return msg('🎟 You already have a ticket for this show', 2000); if (money < 25) return msg('🎟 Ticket costs $25', 1500); money -= 25; C.ticket = 1; hud(); solids.delete(ENT.gate.k); msg(C.on ? '🎟 Enjoy the show: pit is open!' : '🎟 Ticket bought: the pit opens when the show starts', 3000); }
}
const TEAMS = ['Lions', 'Tigers', 'Wolves', 'Sharks', 'Eagles', 'Bulls', 'Cobras', 'Rhinos'];
function newMatch() { const i = Math.floor(Math.random() * 8), j = (i + 1 + Math.floor(Math.random() * 7)) % 8, p = 0.3 + Math.random() * 0.4; ENT.bet = { a: TEAMS[i], b: TEAMS[j], p, oa: Math.round(0.92 / p * 20) / 20, ob: Math.round(0.92 / (1 - p) * 20) / 20, sa: 0, sb: 0, mine: null, win: null }; ENT.phase = 'open'; ENT.pt = 35; }
function drawTV() {
  const T = ENT.tv, g = T.g, B = ENT.bet; if (!B) return; g.fillStyle = '#05070f'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#12306a'; g.fillRect(0, 0, 512, 44); g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('SPORTS LIVE', 256, 32);
  g.font = 'bold 40px sans-serif'; g.fillStyle = '#7ec8ff'; g.fillText(B.a, 128, 110); g.fillStyle = '#ff9a9a'; g.fillText(B.b, 384, 110); g.fillStyle = '#fff'; g.font = 'bold 76px monospace'; g.fillText(B.sa + ' : ' + B.sb, 256, 190);
  g.font = 'bold 22px sans-serif'; g.fillStyle = '#ffd23a'; const lab = ENT.phase === 'open' ? 'BETTING OPEN ' + Math.ceil(ENT.pt) + 's   x' + B.oa.toFixed(2) + ' / x' + B.ob.toFixed(2) : ENT.phase === 'live' ? '● LIVE ' + Math.ceil(ENT.pt) + 's' : 'FINAL: ' + (B.win === 'a' ? B.a : B.b) + ' win' + (B.mine ? (B.mine === B.win ? '  · YOU WON' : '  · you lost') : ''); g.fillText(lab, 256, 238); T.tex.needsUpdate = true;
}
function entTick(dt) {
  const dx = P.pos.x - EX, dz = P.pos.z - EZ; const near = Math.abs(dx) < 380 && Math.abs(dz) < 340; entGrp.visible = near; if (!near) return;
  const t = performance.now() / 1000;
  // sports match cycle
  if (!ENT.bet) newMatch(); ENT.pt -= dt; const B = ENT.bet;
  if (ENT.phase === 'open' && ENT.pt <= 0) { ENT.phase = 'live'; ENT.pt = 25; B.win = Math.random() < B.p ? 'a' : 'b'; B.fa = B.win === 'a' ? 2 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3); B.fb = B.win === 'b' ? 2 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3); if (B.fa === B.fb) { if (B.win === 'a') B.fa++; else B.fb++; } }
  else if (ENT.phase === 'live') { const k = 1 - Math.max(0, ENT.pt) / 25; B.sa = Math.floor(B.fa * k); B.sb = Math.floor(B.fb * k); if (ENT.pt <= 0) { ENT.phase = 'done'; ENT.pt = 12; B.sa = B.fa; B.sb = B.fb; if (B.mine === B.win) { const w = Math.round(100 * (B.win === 'a' ? B.oa : B.ob)); money += w; hud(); msg('📺 Your bet won! +$' + w, 3500); } else if (B.mine) msg('📺 Your team lost. -$100', 2500); } }
  else if (ENT.phase === 'done' && ENT.pt <= 0) newMatch();
  ENT.tv.t -= dt; if (ENT.tv.t <= 0) { ENT.tv.t = 0.5; drawTV(); }
  // concert cycle: 200 s period, show on for 100 s
  const C = ENT.con; C.t = (C.t + dt) % 200; const on = C.t >= 100 ? 1 : 0; if (on !== C.on) { C.on = on; if (!on) { if (C.att >= 30) { const w = 60 + Math.floor(Math.random() * 60); money += w; hud(); msg('🎤 Meet & greet raffle! +$' + w, 3500); } C.ticket = 0; C.att = 0; if (!solids.has(ENT.gate.k)) solids.set(ENT.gate.k, ENT.gate.b); } else msg('🎤 The Neon Wolves are LIVE! Tickets at the booth', 4000); }
  const lit = on ? 1 : 0; ENT.spots.forEach((s, i) => { s.pv.rotation.z = Math.sin(t * 1.3 + i * 1.6) * 0.5; s.pv.rotation.x = Math.cos(t * 1.1 + i * 2) * 0.4; s.c.material.opacity += ((lit ? 0.28 : 0) - s.c.material.opacity) * Math.min(1, dt * 4); });
  ENT.band.forEach((p, i) => { p.position.y = 1.2 + (on ? Math.abs(Math.sin(t * 8 + i)) * 0.18 : 0); p.rotation.z = on ? Math.sin(t * 4 + i) * 0.12 : 0; }); ENT.drum.scale.y = on ? 1 + Math.sin(t * 16) * 0.08 : 1;
  if (ENT.wheel) ENT.wheel.rotation.y += dt * 1.2;
  if (on && Math.abs(dx - CONC.x) < 60 && Math.abs(dz - CONC.z) < 60) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    for (let i = 0; i < ENT.cpos.length; i++) { const c = ENT.cpos[i]; p.set(c[0], 0.8 + Math.abs(Math.sin(t * 4 + c[2])) * 0.45, c[1]); m.compose(p, q, s); ENT.crowd.setMatrixAt(i, m); } ENT.crowd.instanceMatrix.needsUpdate = true; ENT.crowd.visible = true;
    ENT.beat = (ENT.beat || 0) - dt; if (ENT.beat <= 0) { ENT.beat = 0.5; ENT.bn = ((ENT.bn || 0) + 1) % 8; tone(130, 45, 0.14, 'sine', 0.22); if (ENT.bn % 2) noise(0.05, 0.06, 6000, 'highpass'); if (ENT.bn % 4 === 2) tone([196, 220, 165, 147][ENT.bn >> 1 & 3], 0, 0.35, 'sawtooth', 0.06); }
    const inPit = P.pos.x > EX + ENT.pit.x0 && P.pos.x < EX + ENT.pit.x1 && P.pos.z > EZ + ENT.pit.z0 && P.pos.z < EZ + ENT.pit.z1; if (inPit) { C.att += dt; if (P.hp < maxHp()) { P.hp = Math.min(maxHp(), P.hp + 4 * dt); } }
  } else ENT.crowd.visible = on ? ENT.crowd.visible : false;
}
newMatch(); drawTV(); ENT.crowd.visible = false;
EXTRA_PLACES.push({ x: EX + 30, z: EZ, type: 'plaza', name: 'Entertainment Plaza', b: null });
entGrp.traverse(o => { if (o.isMesh) o.userData.noShadow = true; });
