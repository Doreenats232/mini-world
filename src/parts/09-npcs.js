// ---------- NPCs ----------
const npcs = [], structures = [], reserved = [];
const hmc = {}, HMt = c => hmc[c] || (hmc[c] = new THREE.MeshLambertMaterial({ color: c }));
function faceTex(skin) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = skin; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff'; g.fillRect(12, 26, 15, 10); g.fillRect(37, 26, 15, 10); g.fillStyle = '#4a3322'; g.fillRect(18, 27, 8, 9); g.fillRect(43, 27, 8, 9); g.fillStyle = '#0b0b0b'; g.fillRect(20, 29, 4, 6); g.fillRect(45, 29, 4, 6);
  g.fillStyle = 'rgba(40,25,10,.85)'; g.fillRect(10, 19, 18, 4); g.fillRect(36, 19, 18, 4);
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(29, 37, 6, 9); g.fillStyle = '#9c3f36'; g.fillRect(24, 50, 16, 4); g.fillStyle = '#c4665c'; g.fillRect(26, 51, 12, 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
function mkHuman(o) {
  const g = new THREE.Group(), hexs = n => '#' + n.toString(16).padStart(6, '0');
  const skin = HMt(o.skin), shirt = HMt(o.shirt), pants = HMt(o.pants), hair = HMt(o.hair);
  const part = (w, h, d, x, y, z, m, parent = g) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); parent.add(me); return me; };
  part(0.64, 0.7, 0.34, 0, 1.15, 0, shirt); part(0.6, 0.26, 0.32, 0, 0.74, 0, pants); part(0.15, 0.12, 0.15, 0, 1.56, 0, skin);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.4, 0.38), [skin, skin, skin, skin, new THREE.MeshLambertMaterial({ map: faceTex(hexs(o.skin)) }), skin]); head.position.set(0, 1.84, 0); g.add(head);
  part(0.42, 0.12, 0.42, 0, 2.06, 0, hair); part(0.42, 0.32, 0.1, 0, 1.92, -0.17, hair); part(0.06, 0.22, 0.34, -0.2, 1.95, 0, hair); part(0.06, 0.22, 0.34, 0.2, 1.95, 0, hair); part(0.07, 0.1, 0.07, 0, 1.8, 0.2, skin);
  const arm = sx => { const p = new THREE.Group(); p.position.set(sx * 0.42, 1.44, 0); part(0.2, 0.36, 0.2, 0, -0.18, 0, shirt, p); part(0.16, 0.3, 0.16, 0, -0.5, 0, skin, p); part(0.15, 0.13, 0.15, 0, -0.72, 0, skin, p); g.add(p); return p; };
  const leg = sx => { const p = new THREE.Group(); p.position.set(sx * 0.16, 0.72, 0); part(0.24, 0.72, 0.26, 0, -0.36, 0, pants, p); part(0.26, 0.12, 0.36, 0, -0.66, 0.05, HMt(0x222222), p); g.add(p); return p; };
  const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1), dark = HMt(0x222222);
  if (o.role === 'architect') { part(0.14, 0.1, 0.02, -0.1, 1.86, 0.2, dark); part(0.14, 0.1, 0.02, 0.1, 1.86, 0.2, dark); part(0.08, 0.02, 0.02, 0, 1.88, 0.2, dark); part(0.52, 0.08, 0.52, 0.02, 2.14, 0, HMt(0x1b4f8a)); part(0.12, 0.08, 0.12, 0.05, 2.2, 0, HMt(0x1b4f8a)); part(0.12, 0.34, 0.03, 0, 1.2, 0.19, HMt(0x1b4f8a)); }
  if (o.role === 'builder') { part(0.5, 0.14, 0.5, 0, 2.14, 0, HMt(0xf1c40f)); part(0.5, 0.04, 0.2, 0, 2.08, 0.28, HMt(0xf1c40f)); part(0.3, 0.14, 0.08, 0, 1.68, 0.18, hair); part(0.68, 0.1, 0.36, 0, 0.9, 0, HMt(0x6b4423)); part(0.12, 0.2, 0.1, 0.36, 0.78, 0, HMt(0x888888)); }
  if (o.role === 'guard') { part(0.46, 0.14, 0.46, 0, 2.12, 0, HMt(0x1e5631)); part(0.46, 0.03, 0.18, 0, 2.07, 0.28, HMt(0x14391f)); part(0.68, 0.5, 0.38, 0, 1.2, 0, HMt(0x2f6b3d)); part(0.1, 0.1, 0.02, 0.18, 1.3, 0.2, HMt(0xffd400)); part(0.68, 0.08, 0.38, 0, 0.92, 0, dark); }
  return { g, aL, aR, lL, lR };
}
const NPCDEF = [
  { id: 'archie', name: 'Archie', role: 'architect', pers: 'thoughtful, loves clean elegant design, a little pedantic, polite', col: 0x2e86de, skin: 0xf1c8a5, shirt: 0x4a90d9, pants: 0x2c3e50, hair: 0x3b2a1e, x: 31, z: 25 },
  { id: 'mason', name: 'Mason', role: 'builder', pers: 'blunt hard worker, hates wasting materials, dry humor', col: 0xe67e22, skin: 0xc68e5e, shirt: 0xe67e22, pants: 0x34495e, hair: 0x2a1a0e, x: 19, z: 27 },
  { id: 'ranger', name: 'Ranger', role: 'guard', pers: 'brave and protective, jokes when in danger, suspicious of strangers', col: 0x27ae60, skin: 0x8d5a3b, shirt: 0x4b6b3a, pants: 0x3a3a2a, hair: 0x111111, x: 25, z: 17 },
];
function mkNpc(d) {
  const H = mkHuman(d), g = H.g, aL = H.aL, aR = H.aR, lL = H.lL, lR = H.lR; g.position.set(d.x, 0, d.z); scene.add(g);
  const el = document.createElement('div'); el.className = 'nl';
  const bub = document.createElement('div'); bub.className = 'bub'; const nm = document.createElement('div'); const st = document.createElement('div'); st.className = 'st';
  nm.innerHTML = '<b></b> <small></small>'; nm.firstChild.textContent = d.name; nm.lastChild.textContent = '(' + d.role + ')';
  el.append(bub, nm, st); $('labels').appendChild(el);
  npcs.push({ ...mkEnt(d.x, 0, d.z, 0.4, 1.9), ...d, mesh: g, aL, aR, lL, lR, el, bub, st, hp: 80, inv: { wood: 0, stone: 0, sand: 0 }, task: null, sub: null, queue: [], status: 'standing by', last: 'just arrived', stuck: 0, work: 0, cd: 0, bubT: 0, idleT: 0, swing: 0, face: 0, home: { x: d.x, z: d.z }, walking: false, working: false });
}
NPCDEF.forEach(mkNpc);
const nearestNpc = pos => { let b = null, bd = 1e9; for (const n of npcs) { const d = dist2(n.pos, pos); if (d < bd) { bd = d; b = n; } } return b; };
const COSTRES = i => BLOCKS[i][1];
function logLine(txt, cls) { if (net.on && net.host && cls !== 'me') nsend({ t: 'log', txt, cls }); const d = document.createElement('div'); d.textContent = txt; if (cls) d.className = cls; const L = $('log'); L.appendChild(d); while (L.children.length > 10) L.firstChild.remove(); setTimeout(() => d.remove(), 90000); }
let events = [];
const ev = t => { events.push(t); logLine('· ' + t, 'ev'); };
function say(n, t) { t = String(t || '').slice(0, 220); if (!t) return; if (net.on && net.host) nsend({ t: 'say', id: n.id, text: t }); n.bub.textContent = t; n.bubT = 8 + t.length / 12; logLine(n.name + ': ' + t); }
function npcHurt(n, d) { n.hp -= d; if (n.hp <= 0) { dropTask(n); n.hp = 80; n.pos.set(n.home.x, 0, n.home.z); n.task = null; n.sub = null; n.last = 'was knocked out and woke up at home'; ev(n.name + ' was knocked out by thugs and woke up at home'); } }

