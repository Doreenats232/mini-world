// ---------- world ----------
const solids = new Map();
const targets = [];
const blockMeshes = new Map();
const furn = new Map(), doors = [];
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ map: grassTex }));
ground.rotation.x = -Math.PI / 2; scene.add(ground); targets.push(ground);
const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
for (let k = -13; k <= 11; k++) {
  const a = new THREE.Mesh(new THREE.PlaneGeometry(14, 1300), roadMat); a.rotation.x = -Math.PI / 2; a.position.set(k * 50 + 25, 0.03, 0); scene.add(a);
  const gr = new THREE.Group(), b = new THREE.Mesh(new THREE.PlaneGeometry(14, 1300), roadMat); b.rotation.x = -Math.PI / 2; gr.add(b); gr.rotation.y = Math.PI / 2; gr.position.set(0, 0.035, k * 50 + 25); scene.add(gr);
}
// ---- enterable city: hollow shells with a door, merged into one mesh per building ----
const buildings = [], cityFoot = [];
const CT = 0.8, CG = 4, CDW = 2.4, CDH = 3.0;
function buildShell(b) {
  const cx = b.x, cz = b.z, w = b.w, d = b.d, h = b.h, PI = Math.PI;
  const L = { fac: [], roof: [], wall: [], floor: [], ceil: [], frame: [] }, boxes = [];
  const quad = (list, qw, qh, px, py, pz, ry, ru, rv) => { const g = new THREE.PlaneGeometry(qw, qh), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); g.rotateY(ry); g.translate(px, py, pz); list.push(g); };
  const flat = (list, fw, fd, y, rx, ru, rv) => { const g = new THREE.PlaneGeometry(fw, fd), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); g.rotateX(rx); g.translate(cx, y, cz); list.push(g); };
  for (const ry of [0, PI / 2, PI, -PI / 2]) {
    const nx = Math.round(Math.sin(ry)), nz = Math.round(Math.cos(ry)), tx = Math.round(Math.cos(ry)), tz = -Math.round(Math.sin(ry));
    const ew = ry === 0 || ry === PI, Lw = ew ? w : d, half = ew ? d / 2 : w / 2, isDoor = ry === b.ry;
    const pieces = isDoor ? [[-Lw / 2, -CDW / 2, 0, h], [CDW / 2, Lw / 2, 0, h], [-CDW / 2, CDW / 2, CDH, h]] : [[-Lw / 2, Lw / 2, 0, h]];
    for (const [u0, u1, y0, y1] of pieces) {
      const uc = (u0 + u1) / 2, len = u1 - u0;
      quad(L.fac, len, y1 - y0, cx + nx * half + tx * uc, (y0 + y1) / 2, cz + nz * half + tz * uc, ry, Math.max(1, Math.round(len / 8)), Math.max(1, Math.round((y1 - y0) / 8)));
      const iy1 = Math.min(y1, CG);
      if (iy1 > y0) quad(L.wall, len, iy1 - y0, cx + nx * (half - CT) + tx * uc, (y0 + iy1) / 2, cz + nz * (half - CT) + tz * uc, ry + PI, Math.max(1, Math.round(len / 3)), Math.max(1, Math.round((iy1 - y0) / 3)));
      const ax = cx + nx * half + tx * u0, az = cz + nz * half + tz * u0, bx2 = cx + nx * (half - CT) + tx * u1, bz2 = cz + nz * (half - CT) + tz * u1;
      boxes.push(new THREE.Box3(new V3(Math.min(ax, bx2), y0, Math.min(az, bz2)), new V3(Math.max(ax, bx2), y1, Math.max(az, bz2))));
    }
    if (isDoor) {
      const fr = (fw, fh, fd, u, y) => { const g = new THREE.BoxGeometry(fw, fh, fd); g.rotateY(ry); g.translate(cx + nx * (half - CT / 2) + tx * u, y, cz + nz * (half - CT / 2) + tz * u); L.frame.push(g); };
      fr(0.2, CDH, CT + 0.06, -CDW / 2 - 0.1, CDH / 2); fr(0.2, CDH, CT + 0.06, CDW / 2 + 0.1, CDH / 2); fr(CDW + 0.4, 0.2, CT + 0.06, 0, CDH + 0.1);
    }
  }
  flat(L.roof, w, d, h + 0.02, -PI / 2, w / 4, d / 4); flat(L.floor, w - 2 * CT, d - 2 * CT, 0.03, -PI / 2, w / 2, d / 2); flat(L.ceil, w - 2 * CT, d - 2 * CT, CG, PI / 2, w / 4, d / 4);
  boxes.push(new THREE.Box3(new V3(cx - w / 2, h - 0.5, cz - d / 2), new V3(cx + w / 2, h, cz + d / 2)));
  const geos = [], mats = [], add = (list, mat) => { if (list.length) { geos.push(list.length === 1 ? list[0] : mergeGeometries(list, false)); mats.push(mat); } };
  add(L.fac, FACMAT[b.v]); add(L.roof, roofTop); add(L.wall, INTWALL[b.iv]); add(L.floor, FLOORMAT[b.fv]); add(L.ceil, CEILMAT); add(L.frame, FRAMEMAT);
  return { mesh: new THREE.Mesh(mergeGeometries(geos, true), mats), boxes };
}
for (let i = -7; i <= 6; i++) for (let j = -7; j <= 6; j++) {
  const n = 1 + Math.floor(rnd() * 3), placed = [];
  for (let q = 0; q < n; q++) {
    const w = 8 + rnd() * 10, d = 8 + rnd() * 10, h = 6 + rnd() * rnd() * 46, v = Math.floor(rnd() * 4);
    const x = i * 50 + (rnd() - 0.5) * 18, z = j * 50 + (rnd() - 0.5) * 18;
    if (placed.some(o => Math.abs(o.x - x) < (o.w + w) / 2 + 2 && Math.abs(o.z - z) < (o.d + d) / 2 + 2)) continue;
    placed.push({ x, z, w, d });
    const rx = Math.round((x - 25) / 50) * 50 + 25, rz = Math.round((z - 25) / 50) * 50 + 25;
    const dX = rx > x ? rx - (x + w / 2) : (x - w / 2) - rx, dZ = rz > z ? rz - (z + d / 2) : (z - d / 2) - rz;
    const id = buildings.length, ry = dX < dZ ? (rx > x ? Math.PI / 2 : -Math.PI / 2) : (rz > z ? 0 : Math.PI);
    const b = { id, x, z, w, d, h, v, iv: id % 4, fv: (id >> 2) % 2, ry, on: false, int: null };
    const sh = buildShell(b); scene.add(sh.mesh); targets.push(sh.mesh); b.boxes = sh.boxes; b.shell = sh.mesh; buildings.push(b);
    cityFoot.push(new THREE.Box3(new V3(x - w / 2, 0, z - d / 2), new V3(x + w / 2, h, z + d / 2)));
  }
}

// ---- bigger city: rich east side, slums on the west side, around the old downtown ----
function addCityBuilding(x, z, w, d, h, v) {
  const rx = Math.round((x - 25) / 50) * 50 + 25, rz = Math.round((z - 25) / 50) * 50 + 25;
  const dX = rx > x ? rx - (x + w / 2) : (x - w / 2) - rx, dZ = rz > z ? rz - (z + d / 2) : (z - d / 2) - rz;
  const id = buildings.length, ry = dX < dZ ? (rx > x ? Math.PI / 2 : -Math.PI / 2) : (rz > z ? 0 : Math.PI);
  const b = { id, x, z, w, d, h, v, iv: id % 4, fv: (id >> 2) % 2, ry, on: false, int: null };
  const sh = buildShell(b); scene.add(sh.mesh); targets.push(sh.mesh); b.boxes = sh.boxes; b.shell = sh.mesh; buildings.push(b);
  cityFoot.push(new THREE.Box3(new V3(x - w / 2, 0, z - d / 2), new V3(x + w / 2, h, z + d / 2)));
  return b;
}
for (let i = -12; i <= 11; i++) for (let j = -12; j <= 11; j++) {
  if (i >= -7 && i <= 6 && j >= -7 && j <= 6) continue;
  const rich = i > 0, n = rich ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 2), placed = [];
  for (let q = 0; q < n; q++) {
    const w = rich ? 11 + rnd() * 6 : 6 + rnd() * 4, d = rich ? 11 + rnd() * 6 : 6 + rnd() * 4, h = rich ? 5 + rnd() * 6 : 4 + rnd() * 5, v = Math.floor(rnd() * 4);
    const sp = rich ? 12 : 16, x = i * 50 + (rnd() - 0.5) * sp, z = j * 50 + (rnd() - 0.5) * sp;
    if (placed.some(o => Math.abs(o.x - x) < (o.w + w) / 2 + 2 && Math.abs(o.z - z) < (o.d + d) / 2 + 2)) continue;
    placed.push({ x, z, w, d }); const b = addCityBuilding(x, z, w, d, h, v); b.rich = rich; b.slum = !rich;
  }
}
// ground tint: lush lawns on the rich side, dirt on the slum side
function tintZone(x0, x1, z0, z1, col) {
  const t = grassTex.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 8, (z1 - z0) / 8);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshLambertMaterial({ map: t, color: col }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); scene.add(m);
}
tintZone(330, 650, -650, 650, 0xa8e090); tintZone(0, 330, -650, -360, 0xa8e090); tintZone(0, 330, 330, 650, 0xa8e090);
tintZone(-650, -360, -650, 650, 0xb8a07a); tintZone(-360, 0, -650, -360, 0xb8a07a); tintZone(-360, 0, 330, 650, 0xb8a07a);
const onRoad = (x, z, m = 8.5) => { const a = ((x - 25) % 50 + 50) % 50, b = ((z - 25) % 50 + 50) % 50; return a < m || a > 50 - m || b < m || b > 50 - m; };

