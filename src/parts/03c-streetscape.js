// ---------- streetscape: sidewalks, zebra crossings, street lamps (glow at night), street trees ----------
const SW_Y = 0.045, SW_W = 1.8, ROAD_H = 7;
const swTex = mkTex(64, 32, (g, w, h) => {
  g.fillStyle = '#b9b9b4'; g.fillRect(0, 0, w, h); speck(g, w, h, 260, 'rgba(255,255,255,.18)', 'rgba(0,0,0,.14)');
  g.fillStyle = 'rgba(60,60,60,.55)'; g.fillRect(0, 0, 1, h); g.fillRect(w / 2, 0, 1, h);
  g.fillStyle = '#8c8c88'; g.fillRect(0, 0, w, 2); g.fillStyle = '#d6d6d0'; g.fillRect(0, h - 2, w, 2);
});
const zebraTex = mkTex(64, 16, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ececec'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 4, h); });
const swMat = new THREE.MeshLambertMaterial({ map: swTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const zebMat = new THREE.MeshLambertMaterial({ map: zebraTex, transparent: true, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
const _chunks = new Map();
function chunkAdd(mat, name, geo, x, z) { const k = name + '|' + Math.floor(x / 200) + ',' + Math.floor(z / 200); let c = _chunks.get(k); if (!c) _chunks.set(k, c = { mat, list: [] }); c.list.push(geo); }
function flatQuad(w, d, x, y, z, ru, rv) { const g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); g.rotateX(-Math.PI / 2); g.translate(x, y, z); return g; }
const lampPos = [];
for (let a = -13; a <= 11; a++) {                           // a = road index (line at 25 + 50a)
  const L = 25 + 50 * a;
  for (let k = -13; k < 11; k++) {                           // segment between intersection k and k+1
    const s0 = 25 + 50 * k + ROAD_H, s1 = 25 + 50 * (k + 1) - ROAD_H, len = s1 - s0, mid = (s0 + s1) / 2;
    for (const sd of [-1, 1]) {
      const off = sd * (ROAD_H - SW_W / 2);
      chunkAdd(swMat, 'swx', flatQuad(len, SW_W, mid, SW_Y, L + off, len / 2, 1), mid, L);          // road along x (z = L)
      chunkAdd(swMat, 'swz', flatQuad(SW_W, len, L + off, SW_Y, mid, 1, len / 2), L, mid);          // road along z (x = L)
    }
    const side = (a + k) & 1 ? 1 : -1;
    for (const f of [0.28, 0.72]) { const m = s0 + len * f, o = side * (ROAD_H - 0.55); lampPos.push([m, L + o, 0], [L + o, m, 1]); }
  }
  for (let k = -13; k <= 11; k++) {                           // zebra crossings on the 4 arms of intersection (a,k): road a along z, road k along x
    const I = 25 + 50 * k;
    for (const sg of [-1, 1]) {
      chunkAdd(zebMat, 'zz', flatQuad(2 * (ROAD_H - SW_W) - 0.2, 2.4, L, SW_Y + 0.004, I + sg * (ROAD_H + 1.6), 1, 1), L, I);   // arm along z (bars run along z)
      const g = new THREE.PlaneGeometry(2 * (ROAD_H - SW_W) - 0.2, 2.4), uv0 = 0; g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2); g.translate(I + sg * (ROAD_H + 1.6), SW_Y + 0.004, L);
      chunkAdd(zebMat, 'zx', g, I, L);
    }
  }
}
for (const [k, c] of _chunks) { const m = new THREE.Mesh(c.list.length === 1 ? c.list[0] : mergeGeometries(c.list, false), c.mat); m.userData.noShadow = true; m.receiveShadow = true; scene.add(m); }
_chunks.clear();
// ---- street lamps (instanced): pole + arm, glowing head, light pool on the road at night ----
const lampPole = (() => { const a = new THREE.CylinderGeometry(0.07, 0.1, 5.4, 6); a.translate(0, 2.7, 0); const b = new THREE.BoxGeometry(1.1, 0.08, 0.08); b.translate(-0.45, 5.4, 0); return mergeGeometries([a, b], false); })();
const lampHead = new THREE.BoxGeometry(0.5, 0.14, 0.26); lampHead.translate(-0.85, 5.32, 0);
const poolGeo = new THREE.PlaneGeometry(9, 9); poolGeo.rotateX(-Math.PI / 2);
const poolTex = mkTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,220,140,.9)'); r.addColorStop(0.5, 'rgba(255,200,110,.35)'); r.addColorStop(1, 'rgba(255,190,100,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const lampMat = new THREE.MeshLambertMaterial({ color: 0x3d4248 }), headMat = new THREE.MeshLambertMaterial({ color: 0xfff1c0, emissive: 0xffd27a, emissiveIntensity: 0.2 });
const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
const lampI = new THREE.InstancedMesh(lampPole, lampMat, lampPos.length), headI = new THREE.InstancedMesh(lampHead, headMat, lampPos.length), poolI = new THREE.InstancedMesh(poolGeo, poolMat, lampPos.length);
{ const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  lampPos.forEach(([x, z, ax], i) => {
    // arm points toward the road centre line
    const L = ax === 0 ? 25 + 50 * Math.round((z - 25) / 50) : 25 + 50 * Math.round((x - 25) / 50), toRoad = ax === 0 ? Math.sign(L - z) : Math.sign(L - x);
    const rot = ax === 0 ? toRoad * Math.PI / 2 : (toRoad > 0 ? Math.PI : 0);   // local -x is the arm direction
    q.setFromAxisAngle(up, rot); p.set(x, 0, z); m4.compose(p, q, sc); lampI.setMatrixAt(i, m4); headI.setMatrixAt(i, m4);
    p.set(x + (ax === 0 ? 0 : toRoad * 0.85), 0.075, z + (ax === 0 ? toRoad * 0.85 : 0)); m4.compose(p, new THREE.Quaternion(), sc); poolI.setMatrixAt(i, m4);
  });
  lampI.instanceMatrix.needsUpdate = headI.instanceMatrix.needsUpdate = poolI.instanceMatrix.needsUpdate = true;
}
for (const o of [lampI, headI, poolI]) { o.frustumCulled = false; o.userData.noShadow = true; scene.add(o); }
poolI.renderOrder = 2;
function lampUpdate(day) { const n = 1 - day; headMat.emissiveIntensity = 0.2 + n * 2.2; poolMat.opacity = n * 0.55; poolI.visible = n > 0.03; }
// ---- street trees (instanced, low-poly, tinted per tree) in free block corners ----
{
  const trunk = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6); trunk.translate(0, 1.1, 0);
  const f1 = new THREE.IcosahedronGeometry(1.5, 0); f1.translate(0, 3.3, 0); const f2 = new THREE.IcosahedronGeometry(1.05, 0); f2.translate(0.3, 4.4, 0.1);
  const paint = (g, hex) => { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const parts = [paint(trunk.toNonIndexed(), 0x6b4a2b), paint(f1.toNonIndexed(), 0x3f8a3c), paint(f2.toNonIndexed(), 0x4f9d44)];
  const geo = mergeGeometries(parts, false), spots = [];
  const free = (x, z) => { for (const b of cityFoot) if (x > b.min.x - 3 && x < b.max.x + 3 && z > b.min.z - 3 && z < b.max.z + 3) return false; return true; };
  for (let i = -12; i <= 11; i++) for (let j = -12; j <= 11; j++) for (const [dx, dz] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { const x = i * 50 + dx + (rnd() - 0.5) * 3, z = j * 50 + dz + (rnd() - 0.5) * 3; if (rnd() < 0.7 && free(x, z)) spots.push([x, z, 0.8 + rnd() * 0.6, rnd()]); }
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), inst = new THREE.InstancedMesh(geo, mat, Math.max(1, spots.length)), m4 = new THREE.Matrix4(), col = new THREE.Color();
  spots.forEach(([x, z, s, t], i) => { m4.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), t * 6.28), new THREE.Vector3(s, s, s)); inst.setMatrixAt(i, m4); col.setHSL(0.27 + (t - 0.5) * 0.08, 0.5, 0.85 + t * 0.25); inst.setColorAt(i, col); });
  inst.count = spots.length; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; inst.frustumCulled = false; scene.add(inst);
}
