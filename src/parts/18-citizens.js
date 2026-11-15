// ---------- citizens: a living town (ambient people with jobs, routines and speech) ----------
const citizens = [], cbubs = [];
let citSeq = 0, citT = 0;
const CITMAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const SKINS = [0xf1c8a5, 0xe0b48f, 0xc68e5e, 0xa5714a, 0x8d5a3b, 0x6b4226], HAIRS = [0x1a1a1a, 0x3b2a1e, 0x6b4423, 0xb5651d, 0xd9b36c, 0x777777];
const SHIRTS = [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xecf0f1, 0xe67e22, 0x16a085, 0xd35400, 0x34495e, 0xe84393, 0x7f8c8d], PANTS = [0x2c3e50, 0x34495e, 0x6b4423, 0x222222, 0x556b2f, 0x7f8c8d];
const NAMES = ['Sam', 'Ada', 'Kofi', 'Lena', 'Omar', 'Zuri', 'Ravi', 'Mia', 'Tariq', 'Nia', 'Jon', 'Amara', 'Luca', 'Sana', 'Ben', 'Yara', 'Joel', 'Imani', 'Kai', 'Dara', 'Eli', 'Noor', 'Femi', 'Rosa', 'Hugo', 'Asha', 'Theo', 'Lulu', 'Moses', 'Grace', 'Ivan', 'Aya', 'Paul', 'Zoe', 'Abel', 'Ruth'];
const CLINES = {
  walker: ["Lovely day, isn't it?", 'Careful, thugs roam the roads.', 'Have you seen the houses Archie builds?', 'I love this town!'],
  shopper: ['Just grabbing groceries.', 'The shops here are great.', 'Need anything from the store?', "I'm late for the market!"],
  jogger: ['Keep moving!', "Can't stop, new record today!", 'Morning run, join me!'],
  worker: ['Busy day on the road works.', 'Mind the barrier!', 'We need more bricks.', 'Hammer time!'],
  vendor: ['Fresh fruit! Get your fruit!', 'Best prices in town!', 'Come and look, friend!', 'Apples, bananas, mangoes!'],
  chatter: ['Did you hear about the new tower?', 'Haha, no way!', 'And then he said...', "That's what I told him."],
  sitter: ['Just resting my feet.', 'Nice spot for a break.', 'Watching the town go by.'],
  teacher: ['Open your books to page ten.', 'Who knows the answer?', 'Quiet, please!', 'Homework is due tomorrow.'],
  guard: ['Good morning. School zone, mind the kids.', 'Keep moving, sir.', 'No trouble here, please.'],
  student: ['Exams next week...', 'Have you finished the assignment?', 'Studying is hard!', 'Best university in town.'],
  suit: ['Meeting in five minutes.', 'Busy day at the office.', 'Business is booming.', 'Sorry, no time to chat.'],
  kid: ['Wheee!', 'Catch me!', 'Are you a builder?', 'I want a bike!'],
  dogwalker: ['Good boy!', 'He loves a walk.', "Don't pet him, he's shy.", 'Walkies!'],
  busker: ['♪ la la la ♪', 'Spare a coin?', 'This one is for you!'],
  watcher: ['Wow, a new building!', 'Archie really knows his craft.', 'How long until it is done?', 'Look at them go!'],
  cyclist: ['On your left!', 'Ding ding!', 'Best way to get around!'],
  sweeper: ['Keeping the town tidy.', 'So much dust today.', 'Mind the broom!'],
};
const JW = { walker: [5, 3], shopper: [3, 0.5], jogger: [1.5, 0], worker: [1, 0], vendor: [1, 0], chatter: [1.5, 1], sitter: [1.5, 1.2], kid: [1, 0], dogwalker: [1.5, 0.5], busker: [0.6, 0.8], cyclist: [1.2, 0.3], sweeper: [0.8, 0.6] };
const JMAX = { vendor: 4, worker: 4, busker: 3, chatter: 10, kid: 6, cyclist: 5, sweeper: 3 };
const pick = a => a[Math.floor(Math.random() * a.length)];
const nextI = (p, dir) => 25 + 50 * (dir > 0 ? Math.floor((p - 25) / 50) + 1 : Math.ceil((p - 25) / 50) - 1);

function cbox(w, h, d, x, y, z, col) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), k = new THREE.Color(col);
  for (let i = 0; i < n; i++) { c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
// a whole person in 5 draw calls: body, 2 arms, 2 legs (vertex colours, merged)
function mkCitizenModel(o) {
  const sh = o.shirt, pn = o.pants, sk = o.skin, body = [], arm = [], leg = [];
  body.push(cbox(0.64, 0.7, 0.34, 0, 1.15, 0, sh), cbox(0.6, 0.26, 0.32, 0, 0.74, 0, pn), cbox(0.15, 0.12, 0.15, 0, 1.56, 0, sk), cbox(0.38, 0.4, 0.38, 0, 1.84, 0, sk), cbox(0.42, 0.12, 0.42, 0, 2.06, 0, o.hair), cbox(0.42, 0.32, 0.1, 0, 1.92, -0.17, o.hair), cbox(0.07, 0.1, 0.07, 0, 1.8, 0.2, sk),
    cbox(0.07, 0.06, 0.02, -0.09, 1.87, 0.19, 0x111111), cbox(0.07, 0.06, 0.02, 0.09, 1.87, 0.19, 0x111111), cbox(0.12, 0.025, 0.02, 0, 1.74, 0.19, 0x9c3f36));
  if (o.hat) body.push(cbox(0.5, 0.12, 0.5, 0, 2.14, 0, o.hat), cbox(0.5, 0.03, 0.2, 0, 2.09, 0.27, o.hat));
  if (o.glasses) body.push(cbox(0.3, 0.07, 0.02, 0, 1.87, 0.2, 0x222222));
  if (o.pack) body.push(cbox(0.5, 0.55, 0.18, 0, 1.2, -0.26, o.pack));
  if (o.vest) body.push(cbox(0.68, 0.5, 0.38, 0, 1.2, 0, o.vest));
  if (o.apron) body.push(cbox(0.5, 0.6, 0.04, 0, 1.0, 0.2, 0xf2f2f2));
  if (o.guitar) body.push(cbox(0.5, 0.45, 0.12, 0, 1.0, 0.28, 0x8b5a2b), cbox(0.08, 0.7, 0.06, 0.22, 1.5, 0.3, 0x5a3b1f));
  arm.push(cbox(0.2, 0.36, 0.2, 0, -0.18, 0, sh), cbox(0.16, 0.3, 0.16, 0, -0.5, 0, sk), cbox(0.15, 0.13, 0.15, 0, -0.72, 0, sk));
  leg.push(cbox(0.24, 0.72, 0.26, 0, -0.36, 0, pn), cbox(0.26, 0.12, 0.36, 0, -0.66, 0.05, 0x222222));
  const extraR = []; if (o.bag) extraR.push(cbox(0.3, 0.34, 0.14, 0.05, -0.95, 0.08, o.bag)); if (o.tool) extraR.push(cbox(0.08, 0.4, 0.08, 0, -0.9, 0.1, 0x8a8a8a), cbox(0.2, 0.1, 0.1, 0, -1.1, 0.1, 0x555555));
  const g = new THREE.Group(), part = (list, x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); p.add(new THREE.Mesh(mergeGeometries(list.map(q => q.clone()), false), CITMAT)); g.add(p); return p; };
  g.add(new THREE.Mesh(mergeGeometries(body, false), CITMAT));
  return { g, aL: part(arm, -0.42, 1.44), aR: part([...arm, ...extraR], 0.42, 1.44), lL: part(leg, -0.16, 0.72), lR: part(leg, 0.16, 0.72) };
}
function outfit(job) {
  const o = { skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS), hat: Math.random() < 0.25 ? pick(SHIRTS) : 0, glasses: Math.random() < 0.2, pack: Math.random() < 0.2 ? pick(SHIRTS) : 0 };
  if (job === 'worker') Object.assign(o, { hat: 0xf1c40f, vest: 0xff7f11, shirt: 0x7f8c8d, tool: true, pack: 0 });
  if (job === 'vendor') Object.assign(o, { hat: 0, apron: true, pack: 0 });
  if (job === 'busker') Object.assign(o, { guitar: true, hat: 0x1b4f8a, pack: 0 });
  if (job === 'jogger') Object.assign(o, { pack: 0, hat: 0, shirt: pick([0xff4d4d, 0x4dd2ff, 0xb6ff4d]), pants: 0x222222 });
  if (job === 'shopper') o.bag = pick([0xc0392b, 0x2980b9, 0xf1c40f, 0xecf0f1]);
  if (job === 'cyclist') Object.assign(o, { hat: pick([0xff4d4d, 0x4dd2ff, 0xf1c40f]), pack: 0 });
  if (job === 'sweeper') Object.assign(o, { hat: 0x2ecc71, vest: 0x2ecc71, pack: 0 });
  if (job === 'teacher') Object.assign(o, { glasses: true, shirt: 0x8e6bbf, pants: 0x3b3b4f, hat: 0, pack: 0 });
  if (job === 'guard') Object.assign(o, { hat: 0x1b2a49, shirt: 0x1b2a49, pants: 0x14213d, pack: 0, glasses: false });
  if (job === 'student') Object.assign(o, { pack: pick(SHIRTS), hat: 0 });
  if (job === 'suit') Object.assign(o, { shirt: 0xecf0f1, pants: 0x2c3e50, hat: 0, pack: 0, glasses: Math.random() < 0.4 });
  return o;
}
const prop = list => new THREE.Mesh(mergeGeometries(list, false), CITMAT);
function mkStallProp() { const l = [cbox(2.4, 0.9, 0.9, 0, 0.45, 0.5, 0x8b5a2b)]; for (let i = 0; i < 5; i++) l.push(cbox(0.4, 0.22, 0.4, -0.9 + i * 0.45, 1.0, 0.5, pick(SHIRTS))); for (const [x, z] of [[-1.2, -0.2], [1.2, -0.2], [-1.2, 1.0], [1.2, 1.0]]) l.push(cbox(0.08, 2.4, 0.08, x, 1.2, z, 0xdddddd)); for (let i = 0; i < 6; i++) l.push(cbox(0.4, 0.1, 1.5, -1.0 + i * 0.4, 2.45, 0.4, i % 2 ? 0xffffff : 0xd62828)); return prop(l); }
function mkBenchProp() { return prop([cbox(1.6, 0.1, 0.5, 0, 0.45, 0, 0x8b5a2b), cbox(1.6, 0.5, 0.08, 0, 0.8, -0.22, 0x8b5a2b), cbox(0.1, 0.45, 0.45, -0.7, 0.22, 0, 0x333333), cbox(0.1, 0.45, 0.45, 0.7, 0.22, 0, 0x333333)]); }
function mkBarrierProp() { return prop([cbox(1.6, 0.45, 0.08, 0, 0.8, 0, 0xff7f11), cbox(1.6, 0.12, 0.09, 0, 0.8, 0, 0xffffff), cbox(0.08, 0.9, 0.08, -0.7, 0.45, 0, 0x555555), cbox(0.08, 0.9, 0.08, 0.7, 0.45, 0, 0x555555), cbox(0.6, 0.6, 0.6, 1.4, 0.3, 0.6, 0x8b5a2b), cbox(0.3, 0.5, 0.3, -1.2, 0.25, 0.5, 0xff7f11)]); }
function mkDogProp(col) { const l = [cbox(0.25, 0.3, 0.55, 0, 0.4, 0, col), cbox(0.2, 0.2, 0.22, 0, 0.55, 0.38, col), cbox(0.06, 0.06, 0.25, 0, 0.5, -0.38, col), cbox(0.14, 0.08, 0.08, 0, 0.5, 0.52, 0x222222)]; for (const [x, z] of [[-0.08, -0.2], [0.08, -0.2], [-0.08, 0.2], [0.08, 0.2]]) l.push(cbox(0.07, 0.25, 0.07, x, 0.125, z, col)); return prop(l); }

function mkBikeProp() {
  const wheel = z => { const g = new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12); g.rotateZ(Math.PI / 2); return cgeo(g, 0, 0.34, z, 0x222222); };
  return prop([wheel(0.55), wheel(-0.55), cbox(0.05, 0.05, 1.0, 0, 0.62, 0, 0xd62828), cbox(0.05, 0.4, 0.05, 0, 0.45, 0.45, 0xd62828), cbox(0.4, 0.04, 0.04, 0, 0.9, 0.5, 0x333333), cbox(0.1, 0.05, 0.25, 0, 0.82, -0.2, 0x333333)]);
}
function spawnWatcher(st) {
  const ang = Math.random() * 6.283, r = 10 + Math.random() * 6, x = st.x + Math.cos(ang) * r, z = st.z + Math.sin(ang) * r;
  if (Math.hypot(x - P.pos.x, z - P.pos.z) < 6) return false;
  mkCitizen('watcher', x, z, Math.atan2(st.x - x, st.z - z), { home: new V3(x, 0, z), isStatic: true, site: st }); return true;
}
function shoveNear() {
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  for (const c of citizens) {
    if (c.hidden || c.dead || c.downT > 0) continue; const dx = c.pos.x - P.pos.x, dz = c.pos.z - P.pos.z, d = Math.hypot(dx, dz) || 1;
    if (d < 2.8 && (dx * fx + dz * fz) / d > 0.2) { c.downT = 1.8; c.fleeT = 0; c.sit = false; c.faceT = 0; c.returning = false; c.kv = new V3(dx / d * 6, 0, dz / d * 6); citizenSay(c, pick(['Hey!', 'Ow!', 'What was that for?!', 'Police!'])); crime(1, 'assault', 'assault', 2); spark(new V3(c.pos.x, 1.4, c.pos.z), 0xffffff); }
  }
}
function roadSpot() {
  for (let t = 0; t < 8; t++) {
    const axis = Math.random() < 0.5 ? 'x' : 'z', other = axis === 'x' ? P.pos.z : P.pos.x, along = axis === 'x' ? P.pos.x : P.pos.z;
    const line = Math.round((other - 25) / 50 + (Math.floor(Math.random() * 3) - 1)) * 50 + 25;
    if (line < WB.lo || line > WB.hi) continue;
    const a = along + (Math.random() < 0.5 ? -1 : 1) * (35 + Math.random() * 55), lane = Math.random() < 0.5 ? -5.5 : 5.5;
    const x = axis === 'x' ? a : line + lane, z = axis === 'x' ? line + lane : a;
    if (x < WB.lim0 || x > WB.lim1 || z < WB.lim0 || z > WB.lim1 || Math.hypot(x - P.pos.x, z - P.pos.z) < 30) continue;
    return { axis, line, lane, x, z };
  }
  return null;
}
function mkCitizen(job, x, z, yaw, extra) {
  const M = mkCitizenModel(outfit((extra && extra.role) || job)), g = M.g; g.position.set(x, 0, z); scene.add(g); if (job === 'kid') g.scale.setScalar(0.65);
  const c = Object.assign({ id: ++citSeq, job, name: pick(NAMES), g, aL: M.aL, aR: M.aR, lL: M.lL, lR: M.lR, pos: new V3(x, 0, z), yaw: yaw || 0, vyaw: yaw || 0, t: Math.random() * 10, ph: Math.random() * 6, state: 'walk', fleeT: 0, chk: 0, from: new V3(), hidden: false, extras: [], speakT: 4 + Math.random() * 8, faceT: 0, dead: false }, extra || {});
  citizens.push(c); return c;
}
function removeCitizen(c) {
  if (c.dead) return; c.dead = true; scene.remove(c.g); c.g.traverse(m => { if (m.isMesh) m.geometry.dispose(); });
  for (const e of c.extras) { scene.remove(e); e.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); }
  const i = citizens.indexOf(c); if (i >= 0) citizens.splice(i, 1);
  if (c.partner && !c.partner.dead) removeCitizen(c.partner);
}
function spawnJob(job) {
  const s = roadSpot(); if (!s) return;
  const sg = Math.sign(s.lane), fx = s.axis === 'z' ? -sg : 0, fz = s.axis === 'x' ? -sg : 0, fyaw = Math.atan2(fx, fz), tx = s.axis === 'x' ? 1 : 0, tz = s.axis === 'z' ? 1 : 0;
  const pl = s.line + s.lane * 1.25, px = s.axis === 'x' ? s.x : pl, pz = s.axis === 'x' ? pl : s.z;
  const place = (m, x, z, yaw) => { m.position.set(x, 0, z); m.rotation.y = yaw; scene.add(m); return m; };
  if (job === 'walker' || job === 'jogger' || job === 'shopper' || job === 'dogwalker' || job === 'cyclist' || job === 'sweeper') {
    const c = mkCitizen(job, s.x, s.z, 0, { axis: s.axis, line: s.line, lane: s.lane, dir: Math.random() < 0.5 ? 1 : -1, doorT: 4 + Math.random() * 8 });
    c.nextI = nextI(c.pos[c.axis], c.dir);
    if (job === 'cyclist') { const bk = mkBikeProp(); bk.position.set(s.x, 0, s.z); scene.add(bk); c.bike = bk; c.extras.push(bk); c.yoff = 0.28; }
    if (job === 'sweeper') c.aR.add(prop([cbox(0.05, 1.3, 0.05, 0.05, -0.7, 0.35, 0x8b5a2b), cbox(0.4, 0.15, 0.2, 0.05, -1.4, 0.35, 0xd4a017)]));
    if (job === 'dogwalker') { const d = mkDogProp(pick([0x8b5a2b, 0x222222, 0xe8d8b0, 0xaaaaaa])); d.position.set(s.x, 0, s.z); scene.add(d); c.dog = d; c.extras.push(d); }
  } else if (job === 'kid') mkCitizen('kid', s.x, s.z, 0, { home: new V3(s.x, 0, s.z), tgt: new V3(s.x, 0, s.z), isStatic: true });
  else if (job === 'vendor') { const st = place(mkStallProp(), px, pz, fyaw), c = mkCitizen('vendor', px - fx * 0.6, pz - fz * 0.6, fyaw, { home: new V3(px - fx * 0.6, 0, pz - fz * 0.6), isStatic: true }); c.extras.push(st); }
  else if (job === 'sitter') { const b = place(mkBenchProp(), px, pz, fyaw), c = mkCitizen('sitter', px, pz, fyaw, { home: new V3(px, 0, pz), isStatic: true, sit: true }); c.extras.push(b); }
  else if (job === 'worker') { const b = place(mkBarrierProp(), px, pz, fyaw), c = mkCitizen('worker', px + tx * 1.9, pz + tz * 1.9, fyaw, { home: new V3(px + tx * 1.9, 0, pz + tz * 1.9), isStatic: true }); c.extras.push(b); }
  else if (job === 'busker') mkCitizen('busker', px, pz, fyaw, { home: new V3(px, 0, pz), isStatic: true });
  else if (job === 'chatter') {
    const a = mkCitizen('chatter', px - tx * 0.65, pz - tz * 0.65, Math.atan2(tx, tz), { home: new V3(px - tx * 0.65, 0, pz - tz * 0.65), isStatic: true, lead: true }), b = mkCitizen('chatter', px + tx * 0.65, pz + tz * 0.65, Math.atan2(-tx, -tz), { home: new V3(px + tx * 0.65, 0, pz + tz * 0.65), isStatic: true });
    a.partner = b; b.partner = a;
  }
}
function manageCitizens() {
  const cap = isTouch ? 30 : 64, target = Math.round(cap * (0.35 + 0.65 * dayLight));
  for (let i = citizens.length - 1; i >= 0; i--) { const c = citizens[i]; if (c && !c.dead && dist2(c.pos, P.pos) > (c.hidden ? 160 : 140)) removeCitizen(c); }
  if (citizens.length > target + 2) { let f = null, fd = 0; for (const c of citizens) { const d = dist2(c.pos, P.pos); if (d > fd && !c.res) { fd = d; f = c; } } if (f && fd > 45) removeCitizen(f); }
  else if (citizens.length < target && citizens.length < 90) {
    const counts = {}; citizens.forEach(c => { counts[c.job] = (counts[c.job] || 0) + 1; });
    const site = structures.find(s => s.status === 'building' && s.x != null && Math.hypot(s.x - P.pos.x, s.z - P.pos.z) < 120);
    if (site && (counts.watcher || 0) < 5 && Math.random() < 0.5 && spawnWatcher(site)) return;
    let tot = 0; const w = Object.entries(JW).map(([j, [d, n]]) => { const x = counts[j] >= (JMAX[j] || 99) ? 0 : d * dayLight + n * (1 - dayLight); tot += x; return [j, x]; });
    let r = Math.random() * tot; for (const [j, x] of w) { if ((r -= x) <= 0) { spawnJob(j); break; } }
  }
}
function citizenSay(c, text) {
  if (dist2(c.pos, cam.position) > 30) return;
  let b = cbubs.find(x => x.t <= 0 || x.c.dead);
  if (!b) { if (cbubs.length < 8) { const el = document.createElement('div'); el.className = 'nl'; const bub = document.createElement('div'); bub.className = 'bub'; bub.style.display = 'block'; el.appendChild(bub); $('labels').appendChild(el); b = { el, bub, t: 0, c }; cbubs.push(b); } else b = cbubs[0]; }
  b.c = c; b.t = 3.5 + text.length / 14; b.bub.textContent = c.name + ': ' + text; b.el.style.display = 'block';
}
const nearestCitizen = () => { let b = null, bd = 2.8; for (const c of citizens) { if (c.hidden || c.dead) continue; const d = dist2(c.pos, P.pos); if (d < bd) { bd = d; b = c; } } return b; };
function tryTalk() { const c = nearestCitizen(); if (!c) return false; const r = c.res; citizenSay(c, r && Math.random() < 0.6 ? (r.st === 'toWork' ? 'Heading to work at ' + r.workName + '.' : r.st === 'toHome' ? 'Finished at ' + r.workName + ', going home.' : 'I work at ' + r.workName + '.') : pick(CLINES[c.role || c.job] || CLINES.walker)); c.faceT = 3; sfx('click'); return true; }
function scareOne(c, from, t) { if (c.job === 'guard') return; c.fleeT = t; c.from.set(from.x, 0, from.z); c.sit = false; if (Math.random() < 0.5) citizenSay(c, pick(['Aah!', 'Run!', 'Help!', 'Watch out!'])); }
function scare(pos, r) { for (const c of citizens) if (!c.hidden && !c.dead && dist2(c.pos, pos) < r) scareOne(c, pos, 6); }

function animWalk(c, sp, dt, arm) { c.ph += dt * sp * 1.7; const w = Math.sin(c.ph) * (arm || 0.8); c.lL.rotation.x = -w; c.lR.rotation.x = w; c.aL.rotation.x = w; c.aR.rotation.x = -w; }
function animStand(c) { c.lL.rotation.x = 0; c.lR.rotation.x = 0; c.aL.rotation.x = 0; c.aR.rotation.x = 0; }
function resnap(c) {
  c.resnap = false;
  if (c.isStatic) { c.returning = true; return; }
  const lx = Math.round((c.pos.x - 25) / 50) * 50 + 25, lz = Math.round((c.pos.z - 25) / 50) * 50 + 25;
  if (Math.abs(c.pos.x - lx) < Math.abs(c.pos.z - lz)) { c.axis = 'z'; c.line = lx; c.lane = (Math.sign(c.pos.x - lx) || 1) * 5.5; } else { c.axis = 'x'; c.line = lz; c.lane = (Math.sign(c.pos.z - lz) || 1) * 5.5; }
  c.dir = Math.random() < 0.5 ? 1 : -1; c.nextI = nextI(c.pos[c.axis], c.dir);
}
function roadStep(c, dt, sp) {
  const a = c.axis, l = a === 'x' ? 'z' : 'x';
  c.pos[a] += c.dir * sp * dt; c.pos[l] += (c.line + c.lane - c.pos[l]) * Math.min(1, dt * 3); c.yaw = a === 'x' ? Math.atan2(c.dir, 0) : Math.atan2(0, c.dir);
  if ((c.pos[a] - c.nextI) * c.dir >= 0) {
    const here = c.nextI;
    if (Math.random() < 0.45) { c.axis = l; c.line = here; c.dir = Math.random() < 0.5 ? 1 : -1; c.lane = Math.random() < 0.5 ? -5.5 : 5.5; }
    const na = c.axis; let nx = nextI(c.pos[na], c.dir); if (nx < WB.lo || nx > WB.hi) { c.dir = -c.dir; nx = nextI(c.pos[na], c.dir); } c.nextI = nx;
  }
}
function nearestDoor(pos, r) { let bb = null, bd = r; for (const b of buildings) { const d = Math.hypot(b.x - pos.x, b.z - pos.z) - Math.max(b.w, b.d) / 2; if (d < bd) { bd = d; bb = b; } } return bb; }
function doorPt(b) { const nx = Math.round(Math.sin(b.ry)), nz = Math.round(Math.cos(b.ry)), half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2; return new V3(b.x + nx * (half + 1.6), 0, b.z + nz * (half + 1.6)); }
function moveToward(c, tg, sp, dt) { const dx = tg.x - c.pos.x, dz = tg.z - c.pos.z, d = Math.hypot(dx, dz); if (d < 0.05) return true; const s = Math.min(d, sp * dt); c.pos.x += dx / d * s; c.pos.z += dz / d * s; c.yaw = Math.atan2(dx, dz); return d <= sp * dt + 0.05; }

function citizenStep(c, dt) {
  c.t += dt; const dp = dist2(c.pos, P.pos); c.speakT -= dt;
  if (c.downT > 0) { c.downT -= dt; if (c.kv) { c.pos.x += c.kv.x * dt; c.pos.z += c.kv.z * dt; c.kv.multiplyScalar(Math.max(0, 1 - dt * 4)); } if (c.downT <= 0) scareOne(c, P.pos, 6); return; }
  if (c.state === 'inside') { c.t2 -= dt; if (c.t2 <= 0) { c.hidden = false; c.g.visible = true; c.pos.copy(c.tgt); c.state = 'walk'; c.resnap = true; } return; }
  if (c.fleeT <= 0 && clock - c.chk > 0.5) { c.chk = clock; const e = nearestEnemy(c.pos, 9); if (e) scareOne(c, e.pos, 5); else if (inCar && Math.abs(inCar.speed) > 8 && dist2(inCar.pos, c.pos) < 11) scareOne(c, inCar.pos, 3); }
  if (c.fleeT > 0) { c.fleeT -= dt; const dx = c.pos.x - c.from.x, dz = c.pos.z - c.from.z, d = Math.hypot(dx, dz) || 1; c.pos.x += dx / d * 6.5 * dt; c.pos.z += dz / d * 6.5 * dt; c.yaw = Math.atan2(dx, dz); animWalk(c, 6.5, dt, 1.1); if (c.fleeT <= 0) c.resnap = true; return; }
  if (c.resnap) resnap(c);
  if (c.faceT > 0) { c.faceT -= dt; c.yaw = Math.atan2(P.pos.x - c.pos.x, P.pos.z - c.pos.z); animStand(c); return; }
  if (dp < 0.9) { const dx = c.pos.x - P.pos.x, dz = c.pos.z - P.pos.z, d = Math.hypot(dx, dz) || 1; c.pos.x += dx / d * 2 * dt; c.pos.z += dz / d * 2 * dt; }
  if (c.returning) { if (moveToward(c, c.home, 3, dt)) { c.returning = false; c.yaw = c.homeYaw || c.yaw; } animWalk(c, 3, dt); return; }
  switch (c.job) {
    case 'walker': case 'shopper': case 'dogwalker': case 'jogger': case 'cyclist': case 'sweeper': {
      const jog = c.job === 'jogger', sp = jog ? 6.2 : c.job === 'cyclist' ? 5.6 : c.job === 'sweeper' ? 1.4 : 2.6 + (c.id % 5) * 0.2;
      if (c.state === 'toDoor') { if (moveToward(c, c.tgt, 3.2, dt)) { c.state = 'inside'; c.hidden = true; c.g.visible = false; c.t2 = 15 + Math.random() * 25; if (c.dog) c.dog.visible = false; } animWalk(c, 3.2, dt); break; }
      roadStep(c, dt, sp); animWalk(c, sp, dt, jog ? 1.2 : 0.8); if (c.job === 'cyclist') { c.aL.rotation.x = c.aR.rotation.x = -1.0; } if (c.job === 'sweeper') c.aR.rotation.x = -0.9 + Math.sin(c.t * 4) * 0.35;
      if (!jog && c.job !== 'cyclist' && (c.doorT -= dt) <= 0) { c.doorT = 8 + Math.random() * 12; if (Math.random() < (c.job === 'shopper' ? 0.9 : 0.2)) { const b = nearestDoor(c.pos, 22); if (b) { c.state = 'toDoor'; c.tgt = doorPt(b); } } }
      break;
    }
    case 'watcher': if (c.site.status === 'complete') { c.cheer = (c.cheer || 0) + dt; animStand(c); c.aL.rotation.x = c.aR.rotation.x = -2.6 + Math.sin(c.t * 14) * 0.5; if (!c.clapped) { c.clapped = true; citizenSay(c, pick(['Bravo!', 'Beautiful!', 'What a building!'])); } if (c.cheer > 6) { c.job = 'walker'; c.isStatic = false; c.resnap = true; c.doorT = 5; } } else { animStand(c); c.yaw = Math.atan2(c.site.x - c.pos.x, c.site.z - c.pos.z); } break;
    case 'kid': { if (c.inst && c.goIn) { if (moveToward(c, doorPt(c.inst), 4, dt)) removeCitizen(c); animWalk(c, 4.2, dt, 1.1); break; } if (c.inst && c.goHome) { if (moveToward(c, c.homeTgt, 3.4, dt)) removeCitizen(c); animWalk(c, 3.4, dt, 1); break; }
if (moveToward(c, c.tgt, 4.2, dt) || c.t % 3 < dt) { if (c.inst) c.tgt.copy(instTgt(c)); else c.tgt.set(c.home.x + (Math.random() - 0.5) * 14, 0, c.home.z + (Math.random() - 0.5) * 14); } animWalk(c, 4.2, dt, 1.1); c.bounce = Math.abs(Math.sin(c.t * 9)) * 0.12; break; }
    case 'teacher': { c.teachT = (c.teachT || 0) + dt; const face = c.teachT % 12 > 8; c.yaw = c.inst.ry + (face ? 0 : Math.PI); animStand(c); c.aR.rotation.x = face ? -0.3 : -2.0 + Math.sin(c.t * 3) * 0.35; break; }
    case 'guard': {
      const b = c.inst, T = inCar ? inCar.pos : P.pos, d = dist2(c.pos, T);
      if (b && b.alert > 0) {
        if (!c.alerted) { c.alerted = true; citizenSay(c, pick(['HEY! STOP RIGHT THERE!', 'Security! Get away from the children!', 'You! Hands where I can see them!'])); }
        const shooting = mode === 'fight' && (cool > 0 || held);
        c.yaw = Math.atan2(T.x - c.pos.x, T.z - c.pos.z);
        if (d > 6 && d < 30 && shooting) { animStand(c); c.aR.rotation.x = -1.5; c.gunT = (c.gunT || 0) - dt; if (c.gunT <= 0) { c.gunT = 1.3; sfxAt(c.pos, 'shoot'); if (Math.random() < 0.3) hurt(6, true); } }
        else if (d > 1.7) { moveToward(c, T, 5.4, dt); animWalk(c, 5.4, dt, 1); c.aR.rotation.x = -1.4; }
        else { animStand(c); c.aR.rotation.x = -1.5 + Math.sin(c.t * 14) * 0.9; c.hitT = (c.hitT || 0) - dt; if (c.hitT <= 0) { c.hitT = 0.9; hurt(inCar ? 4 : 9, true); sfxAt(c.pos, 'punch'); } }
      } else { c.alerted = false; if (moveToward(c, c.home, 3, dt)) { c.yaw = b.ry; animStand(c); c.aR.rotation.x = 0; } else animWalk(c, 3, dt, 0.8); }
      break;
    }
    case 'commuter': animWalk(c, WALK_SP, dt, 0.85); break;
    case 'student': case 'suit': { if (moveToward(c, c.tgt, 1.6, dt) || c.t % 6 < dt) { if (c.inst) c.tgt.copy(instTgt(c)); } animWalk(c, 1.6, dt, 0.8); break; }
    case 'worker': c.lL.rotation.x = 0; c.lR.rotation.x = 0; c.aL.rotation.x = 0; c.aR.rotation.x = -1.1 + Math.sin(c.t * 12) * 0.6; if (Math.sin(c.t * 12) > 0.98 && dp < 25) sfxAt(c.pos, 'chop'); break;
    case 'vendor': animStand(c); c.aR.rotation.x = c.t % 6 < 1 ? -2.2 + Math.sin(c.t * 10) * 0.3 : 0; break;
    case 'busker': animStand(c); c.aR.rotation.x = -0.6 + Math.sin(c.t * 8) * 0.25; c.aL.rotation.x = -0.9; if (dp < 22 && (c.noteT = (c.noteT || 0) - dt) <= 0) { c.noteT = 0.4 + Math.random() * 0.3; sfx('note', Math.max(0, 1 - dp / 22)); } break;
    case 'sitter': c.lL.rotation.x = -1.5; c.lR.rotation.x = -1.5; c.aL.rotation.x = -0.5; c.aR.rotation.x = -0.5; break;
    case 'chatter': animStand(c); c.aR.rotation.x = -0.7 + Math.sin(c.t * 3 + c.ph) * 0.5; c.aL.rotation.x = c.lead ? -0.3 : 0; break;
  }
  if (dp < 28 && c.speakT <= 0 && c.job !== 'jogger') { c.speakT = 10 + Math.random() * 12; if (c.job !== 'chatter' || c.lead || Math.random() < 0.5) citizenSay(c, pick(CLINES[c.job] || CLINES.walker)); }
}
function updateCitizens(dt) {
  citT -= dt; if (citT <= 0) { citT = 0.15; manageCitizens(); }
  for (let i = citizens.length - 1; i >= 0; i--) {
    const c = citizens[i]; if (!c || c.dead) continue;
    citizenStep(c, dt);
    let dr = c.yaw - c.vyaw; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.vyaw += dr * Math.min(1, dt * 8);
    c.lieA = (c.lieA || 0) + (((c.downT || 0) > 0 ? 1 : 0) - (c.lieA || 0)) * Math.min(1, dt * 10); c.g.rotation.order = 'YXZ';
    c.g.position.set(c.pos.x, (c.sit ? -0.3 : 0) + (c.yoff || 0) + (c.bounce || 0) + c.lieA * 0.25, c.pos.z); c.g.rotation.y = c.vyaw; c.g.rotation.x = -c.lieA * 1.5;
    if (c.bike) { c.bike.position.set(c.pos.x, 0, c.pos.z); c.bike.rotation.y = c.vyaw; c.bike.visible = !c.hidden; }
    if (c.dog && !c.hidden) { const fx = Math.sin(c.vyaw), fz = Math.cos(c.vyaw); c.dog.position.x += (c.pos.x - fx * 1.4 + fz * 0.6 - c.dog.position.x) * Math.min(1, dt * 4); c.dog.position.z += (c.pos.z - fz * 1.4 - fx * 0.6 - c.dog.position.z) * Math.min(1, dt * 4); c.dog.rotation.y = c.vyaw; }
  }
  for (const b of cbubs) {
    if (b.t > 0 && !b.c.dead && !b.c.hidden) { b.t -= dt; const v = new V3(b.c.pos.x, 2.5, b.c.pos.z).project(cam); if (v.z > 1 || v.z < -1) b.el.style.display = 'none'; else { b.el.style.display = 'block'; b.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; } }
    else { b.t = 0; b.el.style.display = 'none'; }
  }
}
