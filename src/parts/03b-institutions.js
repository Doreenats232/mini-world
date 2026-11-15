// ---- institutions: buildings with a purpose (schools, universities, companies, NASA centre) ----
const institutions = [];
(function assignInstitutions() {
  const dtn = buildings.filter(b => !b.rich && !b.slum), area = b => b.w * b.d, used = new Set();
  const take = (list, purpose, n, gap, names) => {
    let k = 0;
    for (const b of list) {
      if (k >= n) break;
      if (used.has(b.id) || institutions.some(o => o.purpose === purpose && Math.hypot(o.x - b.x, o.z - b.z) < gap)) continue;
      used.add(b.id); b.purpose = purpose; b.pname = names[k % names.length]; institutions.push(b); k++;
    }
  };
  const PRE = ['Greenfield', 'Sunrise', 'Hilltop', 'St. Mary', 'Riverside', 'Oakwood', 'Maple', 'Lakeview', 'Cedar', 'Bright Future', 'Unity', 'Kingsway', 'Victoria', 'Heritage', 'Golden Star', 'Pearl', 'Rainbow', 'Harmony', 'Pioneer', 'Liberty', 'Eagle', 'Sunny Side', 'Royal', 'Little Stars', 'Hope', 'Wisdom', 'Crescent', 'Palm Grove', 'Northgate', 'Lakeside'], SUF = ['PRIMARY', 'ACADEMY', 'SCHOOL', 'HIGH SCHOOL'];
  const SN = PRE.map((p, i) => p.toUpperCase() + ' ' + SUF[(i * 7 + 1) % 4]);
  const CP = ['MLD', 'Omega', 'Nova', 'Atlas', 'Pixel', 'Blue Sky', 'Titan', 'Helix', 'Apex', 'Zenith', 'Orbit', 'Delta', 'Prime', 'Vertex', 'Summit', 'Quantum', 'Falcon', 'Lion', 'Star', 'Metro', 'Crown', 'Vega', 'Aurora', 'Nimbus'], CS = ['TECH CORP', 'BANK HQ', 'ENERGY', 'LOGISTICS', 'STUDIOS', 'AIRWAYS', 'MOTORS', 'PHARMA'];
  const CN = CP.map((p, i) => p.toUpperCase() + ' ' + CS[(i * 5) % 8]);
  take([...dtn].sort((a, b) => area(b) - area(a)), 'university', 6, 150, ['MLD UNIVERSITY', 'CITY COLLEGE', 'TECH INSTITUTE', 'ROYAL UNIVERSITY', 'NORTHGATE COLLEGE', 'SAINT PAUL UNIVERSITY']);
  take(buildings.filter(b => b.rich).sort((a, b) => area(b) - area(a)), 'nasa', 1, 0, ['NASA SPACE CENTRE']);
  take(buildings.filter(b => b.h <= 14 && area(b) >= 90).sort((a, b) => (a.id * 7919 % 101) - (b.id * 7919 % 101)), 'school', 30, 55, SN);
  take(dtn.filter(b => b.h >= 28).sort((a, b) => b.h - a.h), 'company', 24, 45, CN);
})();
const INST_LOOK = { school: ['#e67e22', '#fff', 'SCHOOL'], university: ['#8e44ad', '#fff', 'UNIVERSITY'], company: ['#1f3a5f', '#e8f1ff', 'COMPANY'], nasa: ['#0b1a3a', '#ffffff', 'SPACE RESEARCH'] };
function signTex(text, sub, bg, fg) {
  return mkTex(512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 42px sans-serif'; g.fillText(text, w / 2, h / 2 - 14, w - 40);
    g.font = '24px sans-serif'; g.fillText(sub, w / 2, h / 2 + 32, w - 40);
  });
}
for (const b of institutions) {
  const [bg, fg, sub] = INST_LOOK[b.purpose], half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, ox = Math.sin(b.ry), oz = Math.cos(b.ry);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: signTex(b.pname, sub, bg, fg) }));
  sg.position.set(b.x + ox * (half + 0.08), CDH + 1.5, b.z + oz * (half + 0.08)); sg.rotation.y = b.ry; scene.add(sg);
  if (b.purpose === 'nasa') {
    const rk = new THREE.Group(), wm = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), rm = new THREE.MeshLambertMaterial({ color: 0xd62828 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 11, 14), wm); body.position.y = 5.5;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.5, 14), rm); nose.position.y = 12.75;
    rk.add(body, nose); for (let a = 0; a < 3; a++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 1.6), rm); const an = a * 2.094; f.position.set(Math.cos(an) * 1.7, 1.3, Math.sin(an) * 1.7); f.rotation.y = -an; rk.add(f); }
    rk.position.set(b.x, b.h, b.z); scene.add(rk);
  }
}

// ---- good-looking materials per institution: wainscot walls, linoleum/parquet/carpet/tile floors, brick/stone facades ----
const instMat = (wall, floor) => { const w = lamM(mkTex(64, 64, wall)), f = lamM(mkTex(64, 64, floor)); INTWALL.push(w); FLOORMAT.push(f); nightMats.push(w, f); return [INTWALL.length - 1, FLOORMAT.length - 1]; };
const band = (g, w, h, top, bot, y, rail) => { g.fillStyle = top; g.fillRect(0, 0, w, h); g.fillStyle = bot; g.fillRect(0, h * y, w, h * (1 - y)); g.fillStyle = rail; g.fillRect(0, h * y - 2, w, 3); speck(g, w, h, 160, 'rgba(255,255,255,.12)', 'rgba(0,0,0,.07)'); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, h - 4, w, 4); };
const INSTMATS = {
  school: instMat((g, w, h) => band(g, w, h, '#f3e3a5', '#3f7d58', 0.55, '#f7f1d8'), (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#aebf9a' : '#dfe5cf'; g.fillRect(x * 32, y * 32, 32, 32); } g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0.5, 0.5, 63, 63); g.strokeRect(32.5, 0.5, 0, 63); speck(g, w, h, 120, 'rgba(255,255,255,.2)', 'rgba(0,0,0,.08)'); }),
  university: instMat((g, w, h) => { band(g, w, h, '#efe6d6', '#7a5230', 0.5, '#4a3320'); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < w; x += 10) g.fillRect(x, h * 0.5, 1, h * 0.5); }, (g, w, h) => { for (let r = 0; r < 8; r++) { g.fillStyle = `hsl(25,${rr(40, 50)}%,${rr(28, 38)}%)`; g.fillRect(0, r * 8, w, 8); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, r * 8, w, 1); g.fillRect(((r * 23) % 40) + 8, r * 8, 1, 8); } }),
  company: instMat((g, w, h) => { band(g, w, h, '#e9edf2', '#2e5c9a', 0.7, '#ffffff'); }, (g, w, h) => { g.fillStyle = '#4b5b73'; g.fillRect(0, 0, w, h); speck(g, w, h, 700, 'rgba(255,255,255,.1)', 'rgba(0,0,0,.18)'); }),
  nasa: instMat((g, w, h) => band(g, w, h, '#f5f7fa', '#14284f', 0.7, '#e0301e'), (g, w, h) => { g.fillStyle = '#eef2f7'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(70,110,190,.35)'; g.strokeRect(0.5, 0.5, 31, 31); g.strokeRect(32.5, 32.5, 31, 31); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(33, 1, 30, 30); g.fillRect(1, 33, 30, 30); }),
};
const INSTFAC = { school: 1, university: 3, company: 2, nasa: 0 };
for (const b of institutions) {
  const [iw, ifl] = INSTMATS[b.purpose]; b.iv = iw; b.fv = ifl; b.v = INSTFAC[b.purpose];
  if (b.shell) { scene.remove(b.shell); const i = targets.indexOf(b.shell); if (i >= 0) targets.splice(i, 1); b.shell.geometry.dispose(); }
  const sh = buildShell(b); scene.add(sh.mesh); targets.push(sh.mesh); b.shell = sh.mesh; b.boxes = sh.boxes;
}
// ---- school gates (open for the break and when you walk up; locked when the guard is on alert) ----
function mkGate(b) {
  const half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, gx = b.x + Math.sin(b.ry) * (half + 1.2), gz = b.z + Math.cos(b.ry) * (half + 1.2), ew = b.ry === 0 || b.ry === Math.PI, hx = ew ? 3 : 0.25, hz = ew ? 0.25 : 3;
  b.gate = { g: null, L: null, R: null, key: 'gate' + b.id, box: new THREE.Box3(new V3(gx - hx, 0, gz - hz), new V3(gx + hx, 2.4, gz + hz)), a: 0, solid: false, x: gx, z: gz };
  b.post = { x: gx + Math.cos(b.ry) * 3.9 + Math.sin(b.ry) * 0.9, z: gz - Math.sin(b.ry) * 3.9 + Math.cos(b.ry) * 0.9 };
}
const GMAT = { metal: new THREE.MeshLambertMaterial({ color: 0x22352b }), gold: new THREE.MeshLambertMaterial({ color: 0xc9a227 }), stone: new THREE.MeshLambertMaterial({ color: 0xb9b2a5 }) };
function buildGate(b) {
  const gt = b.gate, g = new THREE.Group(), { metal, gold, stone } = GMAT; g.position.set(gt.x, 0, gt.z); g.rotation.y = b.ry;
  const add = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || g).add(m); return m; };
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.5, 2.8, 0.5), stone, s * 3.1, 1.4, 0); add(new THREE.BoxGeometry(0.72, 0.2, 0.72), stone, s * 3.1, 2.9, 0); add(new THREE.SphereGeometry(0.2, 8, 6), gold, s * 3.1, 3.2, 0); }
  const leaf = side => { const p = new THREE.Group(); p.position.set(side * 2.85, 0, 0); for (let i = 0; i < 10; i++) { add(new THREE.BoxGeometry(0.06, 2.0, 0.06), metal, -side * (0.12 + i * 0.28), 1.2, 0, p); add(new THREE.ConeGeometry(0.06, 0.18, 4), gold, -side * (0.12 + i * 0.28), 2.3, 0, p); } add(new THREE.BoxGeometry(2.8, 0.08, 0.08), metal, -side * 1.4, 0.35, 0, p); add(new THREE.BoxGeometry(2.8, 0.08, 0.08), metal, -side * 1.4, 2.0, 0, p); g.add(p); return p; };
  gt.L = leaf(-1); gt.R = leaf(1); gt.g = g; scene.add(g);
}
function dropGate(b) { const gt = b.gate; if (!gt.g) return; scene.remove(gt.g); gt.g.traverse(m => { if (m.geometry) m.geometry.dispose(); }); gt.g = gt.L = gt.R = null; if (gt.solid) { solids.delete(gt.key); gt.solid = false; } }
for (const b of institutions) if (b.purpose === 'school') mkGate(b);
function mkBoard(seed) {
  const L = ['2 + 3 = 5', 'A  B  C  D', '1/2 + 1/4 = 3/4', 'The Water Cycle', 'Planets: Mercury, Venus...', 'x + 4 = 9'], txt = L[seed % L.length];
  const g = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
  const tex = mkTex(256, 80, (c, w, h) => { c.fillStyle = '#25483a'; c.fillRect(0, 0, w, h); speck(c, w, h, 600, 'rgba(255,255,255,.05)', 'rgba(0,0,0,.12)'); c.fillStyle = 'rgba(255,255,255,.85)'; c.font = 'bold 30px "Comic Sans MS", cursive'; c.textAlign = 'center'; c.fillText(txt, w / 2, h / 2 + 4, w - 20); c.font = '18px cursive'; c.fillText('Homework: page ' + (seed % 9 + 2), w / 2, h - 12, w - 20); });
  const slate = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6), new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12 })); g.add(slate);
  for (const [w, h, x, y] of [[5.2, 0.12, 0, 0.86], [5.2, 0.12, 0, -0.86], [0.12, 1.84, -2.56, 0], [0.12, 1.84, 2.56, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), wood); m.position.set(x, y, 0.03); g.add(m); }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.06, 0.18), wood); tray.position.set(0, -0.9, 0.12); g.add(tray); return g;
}
