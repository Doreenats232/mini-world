// ---------- resources ----------
const nodes = [];
function mkNode(type, x, z) {
  const g = new THREE.Group();
  if (type === 'wood') {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 8), new THREE.MeshLambertMaterial({ color: 0x6b4423 })); tr.position.y = 1.5;
    const lv = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 8), new THREE.MeshLambertMaterial({ color: 0x2d7a33 })); lv.position.y = 5; g.add(tr, lv);
  } else if (type === 'stone') {
    const m = new THREE.MeshLambertMaterial({ color: 0x7d8185, flatShading: true });
    const a = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), m); a.position.y = 1.1; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1), m); b.position.set(1.6, 0.6, 0.6); g.add(a, b);
  } else {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.7, 10), new THREE.MeshLambertMaterial({ color: 0xe3cf96 })); m.position.y = 0.35;
    const b = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6, 0, 6.3, 0, 1.5), new THREE.MeshLambertMaterial({ color: 0xead8a2 })); b.position.y = 0.6; g.add(m, b);
  }
  g.position.set(x, 0, z); scene.add(g);
  nodes.push({ type, pos: new V3(x, 0, z), left: 30, max: 30, mesh: g, regen: 0 });
}
function nodeSpotOk(x, z) {
  if (onRoad(x, z, 9)) return false;
  const e = { pos: new V3(x, 0, z), R: 3, H: 6 };
  for (const b of cityFoot) if (hit(e, b)) return false;
  for (const n of nodes) if (Math.hypot(n.pos.x - x, n.pos.z - z) < 7) return false;
  return true;
}
for (const [type, cnt] of [['wood', 16], ['stone', 12], ['sand', 10]]) {
  let placed = 0;
  for (let t = 0; t < 1500 && placed < cnt; t++) { const a = Math.random() * 6.283, r = 18 + Math.random() * 170, x = 25 + Math.cos(a) * r, z = 25 + Math.sin(a) * r; if (nodeSpotOk(x, z)) { mkNode(type, x, z); placed++; } }
}
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const dirName = (from, to) => DIRS[((Math.round(Math.atan2(to.x - from.x, -(to.z - from.z)) / (Math.PI / 4)) % 8) + 8) % 8];
function nearestNode(pos, type) { let b = null, bd = 1e9; for (const n of nodes) { if (n.type !== type || n.left <= 0) continue; const d = dist2(n.pos, pos); if (d < bd) { bd = d; b = n; } } return b; }

