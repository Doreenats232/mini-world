// ---------- Fun Fair (east end of the city): gate, ticket booth, Ferris wheel + carousel you can ride, circus tent with a show, stalls | Shopping Mall (south end): shops, food court, fountain ----------
const EXTRA_PLACES = [], RIDE = { on: null, t: 0, ticket: 0, show: 0 }, FX = 720, FZ = 25, fairBits = [];
const FMT = {
  light: new THREE.MeshStandardMaterial({ color: 0xfff1b0, emissive: 0xffc850, emissiveIntensity: 0.4 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc8372d, roughness: 0.6 }), white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.6 }), blue: new THREE.MeshStandardMaterial({ color: 0x2a5db0, roughness: 0.6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.6, metalness: 0.3 }), steel: new THREE.MeshStandardMaterial({ color: 0xb8bfc7, roughness: 0.4, metalness: 0.5 }), wood: new THREE.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.8 }),
  sand: new THREE.MeshLambertMaterial({ color: 0xd9c08a }), plaza: new THREE.MeshLambertMaterial({ color: 0xcdbf9f }), gold: new THREE.MeshStandardMaterial({ color: 0xd6b45a, metalness: 0.7, roughness: 0.3 }),
};
const stripeTex = (a, b, n) => mkTex(64, 16, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w / n, 0, w / n + 1, h); } });
FMT.tent = new THREE.MeshLambertMaterial({ map: stripeTex('#c8372d', '#f4efe2', 12), side: THREE.DoubleSide });
FMT.awn = (a, b) => new THREE.MeshLambertMaterial({ map: stripeTex(a, b, 8), side: THREE.DoubleSide });
const fairGrp = new THREE.Group(); fairGrp.position.set(FX, 0, FZ); scene.add(fairGrp);
const fb = (w, h, d, x, y, z, mat, par) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || fairGrp).add(m); return m; };
const fcyl = (r1, r2, h, x, y, z, mat, par, seg) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 14), mat); m.position.set(x, y, z); (par || fairGrp).add(m); return m; };
const fsolid = (x0, x1, z0, z1, h, tag) => { const k = 'fx' + (fairBits.length) + (tag || ''); solids.set(k, new THREE.Box3(new V3(FX + x0, 0, FZ + z0), new V3(FX + x1, h || 3, FZ + z1))); fairBits.push(k); };
const fsign = (txt, w, h, x, y, z, ry, bg, fg, px, par) => { const t = mkTex(256, 64, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(4, 4, cw - 8, ch - 8); g.fillStyle = fg; g.font = 'bold ' + (px || 30) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, cw / 2, ch / 2 + 1); }), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; (par || fairGrp).add(m); return m; };
const bulbs = (cx, cy, cz, r, n, plane, par) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283, m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), FMT.light); m.position.set(cx + (plane === 'xz' ? Math.cos(a) * r : plane === 'xy' ? Math.cos(a) * r : 0), cy + (plane === 'xy' ? Math.sin(a) * r : 0), cz + (plane === 'xz' ? Math.sin(a) * r : 0)); (par || fairGrp).add(m); } };
// ground: plaza, road in from the city, picket fence with the gate on the west side
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(60, 52), FMT.plaza); g.rotation.x = -Math.PI / 2; g.position.y = 0.02; fairGrp.add(g);
  const rd = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), roadMat.clone()); rd.rotation.x = -Math.PI / 2; rd.rotation.z = Math.PI / 2; rd.material.map = roadTex.clone(); rd.material.map.repeat.set(1, 2); rd.material.map.needsUpdate = true; rd.position.set(-50, 0.03, 0); fairGrp.add(rd);
  const pick = mkTex(32, 16, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#f4f0e6'; for (let x = 0; x < w; x += 8) { g.fillRect(x + 1, 2, 5, h - 2); g.beginPath(); g.moveTo(x + 1, 2); g.lineTo(x + 3.5, 0); g.lineTo(x + 6, 2); g.fill(); } g.fillRect(0, 5, w, 2); g.fillRect(0, 11, w, 2); });
  for (const [x, z, w, rot] of [[0, -26, 60, 0], [0, 26, 60, 0], [30, 0, 52, Math.PI / 2], [-30, -15.5, 21, Math.PI / 2], [-30, 15.5, 21, Math.PI / 2]]) { const t = pick.clone(); t.needsUpdate = true; t.repeat.set(w / 2, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.2), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.position.set(x, 0.65, z); m.rotation.y = rot; fairGrp.add(m); if (rot === 0) fsolid(x - w / 2, x + w / 2, z - 0.15, z + 0.15, 1.2); else fsolid(x - 0.15, x + 0.15, z - w / 2, z + w / 2, 1.2); }
  // gate arch with bulbs + sign
  fb(0.6, 6, 0.6, -30, 3, -5.5, FMT.red); fb(0.6, 6, 0.6, -30, 3, 5.5, FMT.red); fb(0.7, 0.9, 12.2, -30, 6.3, 0, FMT.blue); fsign('★ FUN FAIR ★', 8, 1.6, -30.4, 6.3, 0, -Math.PI / 2, '#1d3f8a', '#ffe066', 34); for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), FMT.light); m.position.set(-30.45, 7.0, -5.6 + i * 0.75); fairGrp.add(m); } fsolid(-30.4, -29.6, -5.8, -5.2, 6); fsolid(-30.4, -29.6, 5.2, 5.8, 6); }
// ticket booth
{ fb(2.4, 2.4, 2.0, -24, 1.2, -8, FMT.red); fb(2.8, 0.2, 2.4, -24, 2.5, -8, FMT.white); fb(0.05, 0.9, 1.4, -22.8, 1.5, -8, new THREE.MeshStandardMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.35 })); fsign('TICKETS $15', 1.8, 0.5, -22.76, 2.0, -8, Math.PI / 2, '#f4efe2', '#8a1c1c', 20); fsolid(-25.3, -22.7, -9.1, -6.9, 2.5); }
// ---- Ferris wheel ----
const FERR = { cx: 14, cz: -14, R: 9, hy: 10.6, rot: 0, g: new THREE.Group(), cabins: [], speed: 0.22 };
{ const g = FERR.g; g.position.set(FERR.cx, FERR.hy, FERR.cz); fairGrp.add(g);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(FERR.R, 0.14, 6, 40), FMT.red); g.add(rim); const rim2 = new THREE.Mesh(new THREE.TorusGeometry(FERR.R * 0.5, 0.08, 6, 28), FMT.white); g.add(rim2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, s = new THREE.Mesh(new THREE.BoxGeometry(FERR.R, 0.07, 0.07), FMT.steel); s.position.set(Math.cos(a) * FERR.R / 2, Math.sin(a) * FERR.R / 2, 0); s.rotation.z = a; g.add(s); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, cab = new THREE.Group(); cab.userData.a = a; const cols = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22]; const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.3), new THREE.MeshStandardMaterial({ color: cols[i % 6], roughness: 0.5 })); body.position.y = -1.3; cab.add(body); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 4), FMT.white); roof.position.y = -0.45; roof.rotation.y = Math.PI / 4; cab.add(roof); const hg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), FMT.dark); hg.position.y = -0.1; cab.add(hg); cab.position.set(Math.cos(a) * FERR.R, Math.sin(a) * FERR.R, 0); g.add(cab); FERR.cabins.push(cab); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12), FMT.blue); hub.rotation.x = Math.PI / 2; g.add(hub); bulbs(0, 0, 0.12, FERR.R, 24, 'xy', g);
  for (const z of [-1.4, 1.4]) for (const sx of [-1, 1]) { const len = Math.hypot(FERR.hy, 3.5), leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, len, 0.35), FMT.blue); leg.position.set(FERR.cx + sx * 1.75, FERR.hy / 2, FERR.cz + z); leg.rotation.z = -sx * Math.atan2(3.5, FERR.hy); fairGrp.add(leg); }
  fb(0.6, 0.6, 3.2, FERR.cx - 3.5, 0.3, FERR.cz, FMT.dark); fb(0.6, 0.6, 3.2, FERR.cx + 3.5, 0.3, FERR.cz, FMT.dark); fsolid(FERR.cx - 3.8, FERR.cx + 3.8, FERR.cz - 1.8, FERR.cz + 1.8, 1.0, 'w');
}
// ---- Carousel ----
const CAR = { cx: -6, cz: -12, g: new THREE.Group(), horses: [], rot: 0 };
{ const g = CAR.g; g.position.set(CAR.cx, 0, CAR.cz); fairGrp.add(g); fcyl(4.0, 4.0, 0.4, 0, 0.2, 0, FMT.red, g, 24); fcyl(0.35, 0.35, 4.2, 0, 2.3, 0, FMT.gold, g, 10);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 2.2, 24), new THREE.MeshLambertMaterial({ map: stripeTex('#e8c14a', '#c8372d', 12) })); roof.position.y = 5.5; g.add(roof); fcyl(4.4, 4.4, 0.3, 0, 4.4, 0, FMT.white, g, 24);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, h = new THREE.Group(); h.userData.a = a; const col = new THREE.MeshStandardMaterial({ color: [0xf2f0ea, 0x8a5a3a, 0x2a2a2a, 0xe8b6c8][i % 4], roughness: 0.6 }); const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 1.2), col); body.position.y = 0.2; h.add(body); const neck = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.3), col); neck.position.set(0, 0.65, 0.55); neck.rotation.x = 0.4; h.add(neck); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.55), col); hd.position.set(0, 0.95, 0.8); h.add(hd); for (const [x, z] of [[-0.15, -0.45], [0.15, -0.45], [-0.15, 0.45], [0.15, 0.45]]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), col); lg.position.set(x, -0.3, z); h.add(lg); } const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6, 6), FMT.gold); pole.position.set(0, 1.4, 0); h.add(pole); h.position.set(Math.sin(a) * 2.7, 1.2, Math.cos(a) * 2.7); h.rotation.y = a + Math.PI / 2; g.add(h); CAR.horses.push(h); }
  bulbs(0, 4.35, 0, 4.4, 24, 'xz', g); fsolid(CAR.cx - 4.1, CAR.cx + 4.1, CAR.cz - 4.1, CAR.cz + 4.1, 1.0, 'c'); }
// ---- Circus tent with a show ----
const TENT = { x: 14, z: 14, r: 8.4, parts: {} };
{ const g = new THREE.Group(); g.position.set(TENT.x, 0, TENT.z); fairGrp.add(g); TENT.g = g; const gap = 0.5;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(TENT.r, TENT.r, 3.6, 32, 1, true, -Math.PI / 2 + gap, 6.283 - gap * 2), FMT.tent); wall.position.y = 1.8; g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(TENT.r + 0.5, 4.6, 32, 1, true), FMT.tent); roof.position.y = 5.9; g.add(roof); fcyl(0.1, 0.1, 3, 0, 9.6, 0, FMT.dark, g, 6); const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ color: 0xffd23a, side: THREE.DoubleSide })); flag.position.set(0.7, 10.7, 0); g.add(flag);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(TENT.r - 0.2, 32), FMT.sand); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.03; g.add(fl); const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.2, 32), FMT.red); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + gap + 0.15 + i * ((6.283 - gap * 2 - 0.3) / 17); const px = TENT.x + Math.sin(a) * TENT.r, pz = TENT.z + Math.cos(a) * TENT.r; solids.set('fxt' + i, new THREE.Box3(new V3(FX + px - 0.7, 0, FZ + pz - 0.7), new V3(FX + px + 0.7, 3.6, FZ + pz + 0.7))); fairBits.push('fxt' + i); }
  for (const [rr_, h] of [[6.2, 0.45], [6.9, 0.85]]) for (let i = 0; i < 9; i++) { const a = 0.6 + i * 0.6, bl = fb(1.4, h, 0.6, Math.sin(a + 1.5) * rr_, h / 2, Math.cos(a + 1.5) * rr_, FMT.wood, g); bl.rotation.y = a + 1.5; }
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 20), new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 1.6 })); hoop.position.set(-2.2, 1.8, 0); hoop.rotation.y = Math.PI / 2; g.add(hoop); fb(0.1, 1.2, 0.1, -2.2, 0.6, 0, FMT.dark, g); TENT.parts.hoop = hoop;
  TENT.balls = [0xe74c3c, 0x3498db, 0xf1c40f].map(c => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.5 })); g.add(m); return m; });
  TENT.spots = [0, 1, 2].map(i => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: [0xfff0b0, 0xb0d8ff, 0xffb0d8][i], transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); c.position.set(Math.cos(i * 2.1) * 3, 6.2, Math.sin(i * 2.1) * 3); g.add(c); return c; });
  fsign('★ GRAND CIRCUS ★', 6, 1.2, TENT.x - TENT.r - 0.2, 4.4, TENT.z, -Math.PI / 2, '#8a1c1c', '#ffe066', 26); }
// ---- stalls ----
const STALLS = [['POPCORN', '#e74c3c', '#f4efe2', 1], ['COTTON CANDY', '#e87aa8', '#f4efe2', 1], ['RING TOSS', '#2a5db0', '#f4efe2', 0], ['SHOOTING', '#2a8a4a', '#f4efe2', 0]];
STALLS.forEach(([nm, a, b, food], i) => { const x = -22 + i * 9, z = 22, aw = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.8), FMT.awn(a, b)); aw.position.set(x, 3.0, z - 0.6); aw.rotation.x = -0.55; fairGrp.add(aw); fb(4, 1.1, 1.0, x, 0.55, z, FMT.wood); fb(0.12, 3.2, 0.12, x - 1.9, 1.6, z + 0.5, FMT.dark); fb(0.12, 3.2, 0.12, x + 1.9, 1.6, z + 0.5, FMT.dark); fb(4, 3, 0.1, x, 1.5, z + 0.95, FMT.white); fsign(nm, 3.4, 0.6, x, 3.5, z - 0.05, Math.PI, a, '#fff', 22); fsolid(x - 2, x + 2, z - 0.5, z + 1.0, 3);
  if (food) { fcyl(0.5, 0.5, 0.9, x - 1.0, 1.55, z, new THREE.MeshStandardMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.4 }), null, 10); for (let k = 0; k < 6; k++) fcyl(0.12, 0.12, 0.5, x + 0.3 + k * 0.25, 1.35, z, k % 2 ? FMT.red : FMT.white); } else for (let k = 0; k < 5; k++) fcyl(0.3, 0.3, 0.1, x - 1.0 + k * 0.5, 1.2, z - 0.2, [FMT.red, FMT.blue, FMT.white][k % 3]);
  const g = new THREE.Group(); g.position.set(FX + x, 0, FZ + z - 1.3); scene.add(g); const u = regUse(g, food ? 'fairfood' : 'fairgame', { stall: nm }); });
for (const [x, z] of [[-16, 6], [-2, 8], [4, -4], [-18, -4]]) { fcyl(0.06, 0.06, 4.5, x, 2.25, z, FMT.dark); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), FMT.light); lamp.position.set(x, 4.6, z); fairGrp.add(lamp); }
fairGrp.traverse(o => { if (o.isMesh) o.userData.noShadow = o.userData.noShadow; });
// rides, tickets, show: useables
{ const mk = (x, z, f, o) => { const g = new THREE.Group(); g.position.set(FX + x, 0, FZ + z); scene.add(g); regUse(g, f, o); };
  mk(-22, -6.5, 'fairticket', {}); mk(FERR.cx - 4.6, FERR.cz, 'fairride', { kind: 'ferris' }); mk(CAR.cx + 5.2, CAR.cz, 'fairride', { kind: 'carousel' }); mk(TENT.x - TENT.r + 1.5, TENT.z, 'fairshow', {}); }
USEN.fairticket = 'buy ticket $15'; USEN.fairride = 'ride'; USEN.fairshow = 'watch the show'; USEN.fairfood = 'buy snack $5'; USEN.fairgame = 'play'; USEN.mallbuy = 'buy';
function fairUse(f, o) {
  if (f === 'fairticket') { if (money < 15) return msg('🎟 A ticket costs $15', 2000); money -= 15; RIDE.ticket++; msg('🎟 Ticket bought (' + RIDE.ticket + '): use it on a ride or at the circus', 2800); }
  else if (f === 'fairride') { if (RIDE.ticket < 1) return msg('🎟 You need a ticket (booth by the gate)', 2200); RIDE.ticket--; rideOn(o.kind); }
  else if (f === 'fairshow') { if (RIDE.show > 0) return msg('The show is on!', 1200); if (RIDE.ticket < 1) return msg('🎟 You need a ticket', 2000); RIDE.ticket--; RIDE.show = 24; msg('🎪 Ladies and gentlemen, the show begins!', 3000); }
  else if (f === 'fairfood') { if (money < 5) return msg('Snack costs $5', 1500); money -= 5; P.hp = Math.min(maxHp(), P.hp + 25); hud(); msg('🍿 Yum! +25 HP', 1800); }
  else if (f === 'fairgame') msg('🎯 Game booth: coming soon', 1800);
}
function rideOn(kind) {
  const me = P.pos; let idx = 0, best = 1e9;
  if (kind === 'ferris') { FERR.cabins.forEach((c, i) => { const a = c.userData.a + FERR.rot; const y = FERR.hy + Math.sin(a) * FERR.R; if (y < best) { best = y; idx = i; } }); RIDE.on = { kind, idx, t: 30 }; }
  else { let bd = 1e9; CAR.horses.forEach((h, i) => { const a = h.userData.a + CAR.rot, x = FX + CAR.cx + Math.sin(a) * 2.7, z = FZ + CAR.cz + Math.cos(a) * 2.7, d = Math.hypot(x - me.x, z - me.z); if (d < bd) { bd = d; idx = i; } }); RIDE.on = { kind, idx, t: 28 }; }
  RIDE.prev = null; msg('🎡 Enjoy the ride! (E to get off)', 2500); P.vel.set(0, 0, 0);
}
function rideOff() { const r = RIDE.on; RIDE.on = null; const k = r ? r.kind : ''; if (k === 'ferris') P.pos.set(FX + FERR.cx - 4.6, 0, FZ + FERR.cz); else P.pos.set(FX + CAR.cx + 5.2, 0, FZ + CAR.cz); P.vel.set(0, 0, 0); }
function rideStep(dt) {
  const r = RIDE.on; r.t -= dt; if (r.t <= 0) return rideOff();
  if (r.kind === 'ferris') { const c = FERR.cabins[r.idx], a = c.userData.a + FERR.rot; P.pos.set(FX + FERR.cx, FERR.hy + Math.sin(a) * FERR.R - 1.55, FZ + FERR.cz + 0); P.pos.x = FX + FERR.cx + Math.cos(a) * FERR.R; }
  else { const h = CAR.horses[r.idx], a = h.userData.a + CAR.rot; P.pos.set(FX + CAR.cx + Math.sin(a) * 2.7, 1.2 + h.position.y - 1.2 + 0.5, FZ + CAR.cz + Math.cos(a) * 2.7); }
  P.vel.set(0, 0, 0); P.ground = true;
}
let fairT = 0;
function fairTick(dt) {
  fairT += dt; const night = 1 - dayLight; fairGrp.visible = !!RIDE.on || Math.hypot(P.pos.x - (FX + 5), P.pos.z - FZ) < 450; FMT.light.emissiveIntensity = 0.5 + night * 2.4;
  if (Math.hypot(P.pos.x - (FX + 5), P.pos.z - FZ) > 120 && !RIDE.on) return;
  FERR.rot += FERR.speed * dt; FERR.g.rotation.z = FERR.rot; for (const c of FERR.cabins) { c.rotation.z = -FERR.rot; }
  CAR.rot += 0.6 * dt; CAR.g.rotation.y = CAR.rot; CAR.horses.forEach((h, i) => { h.position.y = 1.2 + Math.sin(fairT * 2.4 + i * 1.6) * 0.35; });
  if (RIDE.show > 0) { RIDE.show -= dt; const t = fairT; TENT.balls.forEach((b, i) => { const a = t * 4 + i * 2.1; b.position.set(Math.cos(a) * 0.6 + 0.4, 2.2 + Math.abs(Math.sin(a * 1.3)) * 1.2, Math.sin(a) * 0.3); b.visible = true; }); TENT.spots.forEach((s, i) => { s.material.opacity = 0.22; s.rotation.z = Math.sin(t * 1.4 + i) * 0.5; s.rotation.x = Math.cos(t * 1.1 + i * 2) * 0.5; }); TENT.parts.hoop.rotation.x += dt * 2; if (!RIDE.shown) RIDE.shown = 1; }
  else { TENT.balls.forEach(b => b.visible = false); TENT.spots.forEach(s => { s.material.opacity = 0; }); }
  if (RIDE.on) rideStep(dt);
}
{ const sx = FX - 30, sz = FZ; EXTRA_PLACES.push({ x: FX - 28, z: FZ, type: 'fair', name: 'Fun Fair', b: null }); }
// ---------------- Shopping mall ----------------
const MALL = { x: 25, z: 722, w: 42, d: 26, h: 10 };
{ const b = addCityBuilding(MALL.x, MALL.z, MALL.w, MALL.d, MALL.h, 2); b.ry = Math.PI; b.purpose = 'mall'; b.pname = 'CITY MALL'; b.w = MALL.w; b.d = MALL.d; b.h = MALL.h;
  const mw = instMat((g, w, h) => { g.fillStyle = '#efe6e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c66b8a'; g.fillRect(0, h * 0.84, w, h * 0.16); g.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < w; x += 21) g.fillRect(x, 0, 1, h); speck(g, w, h, 160, 'rgba(255,255,255,.3)', 'rgba(0,0,0,.05)'); }, (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#e9e4dc' : '#b9b2a6'; g.fillRect(x * 32, y * 32, 32, 32); } speck(g, w, h, 300, 'rgba(255,255,255,.2)', 'rgba(0,0,0,.08)'); g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0.5, 0.5, 63, 63); });
  b.iv = mw[0]; b.fv = mw[1]; b.v = 2; if (b.shell) { scene.remove(b.shell); const i = targets.indexOf(b.shell); if (i >= 0) targets.splice(i, 1); b.shell.geometry.dispose(); } const sh = buildShell(b); scene.add(sh.mesh); targets.push(sh.mesh); b.shell = sh.mesh; b.boxes = sh.boxes; institutions.push(b); MALL.b = b;
  EXTRA_PLACES.push({ x: b.x, z: b.z, type: 'mall', name: 'CITY MALL', b });
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(64, 46), new THREE.MeshLambertMaterial({ color: 0x3a3c41 })); lot.rotation.x = -Math.PI / 2; lot.position.set(25, 0.03, 722 - 13 - 24); scene.add(lot); lot.userData.noShadow = true;
  const ln = new THREE.MeshBasicMaterial({ color: 0xdedede, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 4.2), ln); m.rotation.x = -Math.PI / 2; m.position.set(25 - 26 + i * 4, 0.05, 722 - 13 - 38); scene.add(m); }
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 80), roadMat.clone()); road.material.map = roadTex.clone(); road.material.map.repeat.set(1, 3); road.material.map.needsUpdate = true; road.rotation.x = -Math.PI / 2; road.position.set(25, 0.03, 650 + 15 + 0); scene.add(road);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.4), new THREE.MeshBasicMaterial({ map: mkTex(256, 64, (g, w, h) => { g.fillStyle = '#c0306a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🛍 CITY MALL', w / 2, h / 2 + 2); }), side: THREE.DoubleSide })); sg.position.set(25, MALL.h + 1.4, 722 - 13 - 0.4); sg.rotation.y = Math.PI; scene.add(sg);
  const can = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0xc0306a })); can.position.set(25, 4.2, 722 - 13 - 2); scene.add(can); for (const dx of [-6.6, 6.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.2, 8), FMT.white); p.position.set(25 + dx, 2.1, 722 - 13 - 3.6); scene.add(p); }
}
