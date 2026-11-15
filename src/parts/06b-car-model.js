// ---------- car models: merged + vertex-coloured; wheels spin and steer, body leans, lights glow at night ----------
const CARBODY = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.35 });
const CARGLASS = new THREE.MeshStandardMaterial({ color: 0x1b2a38, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.78 });
const CARHEAD = new THREE.MeshLambertMaterial({ color: 0xfff4c2, emissive: 0xfff0b0, emissiveIntensity: 0.4 });
const CARTAIL = new THREE.MeshLambertMaterial({ color: 0xaa2222, emissive: 0xff2222, emissiveIntensity: 0.35 });
const CARBEAM = new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const CARSHADOW = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
const CAR_TYPES = {
  sedan: { L: 4.4, W: 1.9, bodyH: 0.62, cabL: 2.0, cabH: 0.6, cabZ: -0.25, hoodL: 1.3, wr: 0.38 },
  hatch: { L: 3.8, W: 1.8, bodyH: 0.62, cabL: 2.0, cabH: 0.66, cabZ: -0.35, hoodL: 0.9, wr: 0.36 },
  suv: { L: 4.6, W: 2.0, bodyH: 0.82, cabL: 2.7, cabH: 0.7, cabZ: -0.3, hoodL: 1.0, wr: 0.46 },
  sport: { L: 4.3, W: 1.95, bodyH: 0.5, cabL: 1.5, cabH: 0.48, cabZ: -0.1, hoodL: 1.6, wr: 0.36 },
};
CAR_TYPES.taxi = CAR_TYPES.sedan;
function cgeo(g, x, y, z, col) {
  g.translate(x, y, z); const n = g.attributes.position.count, a = new Float32Array(n * 3), k = new THREE.Color(col);
  for (let i = 0; i < n; i++) { a[i * 3] = k.r; a[i * 3 + 1] = k.g; a[i * 3 + 2] = k.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
function taper(w, h, d, tx, tz) { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * tx); p.setZ(i, p.getZ(i) * tz); } g.computeVertexNormals(); return g; }
function mkCarModel(typeName, col, driver) {
  const T = CAR_TYPES[typeName] || CAR_TYPES.sedan, L = T.L, W = T.W, wr = T.wr, y0 = wr * 0.85, bh = T.bodyH;
  const body = [], glass = [], head = [], tail = [], g = new THREE.Group(), bodyG = new THREE.Group(), B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  body.push(cgeo(B(W, bh, L), 0, y0 + bh / 2, 0, col));
  body.push(cgeo(taper(W - 0.08, 0.16, T.hoodL, 1, 0.8), 0, y0 + bh + 0.08, L / 2 - T.hoodL / 2 - 0.05, col));
  body.push(cgeo(taper(W - 0.08, 0.14, 0.85, 1, 0.85), 0, y0 + bh + 0.07, -L / 2 + 0.5, col));
  const cy = y0 + bh + 0.14 + T.cabH / 2, cw = W - 0.26;
  glass.push(cgeo(taper(cw, T.cabH, T.cabL, 0.9, 0.7), 0, cy, T.cabZ, 0x1b2a38));
  body.push(cgeo(B(cw * 0.9, 0.07, T.cabL * 0.7 + 0.12), 0, cy + T.cabH / 2 + 0.03, T.cabZ, col));
  for (const sx of [-1, 1]) {
    body.push(cgeo(B(0.07, T.cabH, 0.12), sx * cw * 0.47, cy, T.cabZ + T.cabL * 0.12, col), cgeo(B(0.1, 0.1, 0.16), sx * (W / 2 + 0.08), cy - 0.12, T.cabZ + T.cabL * 0.38, col));
    body.push(cgeo(B(0.02, bh * 0.9, 0.02), sx * (W / 2 + 0.005), y0 + bh * 0.5, T.cabZ + 0.2, 0x222222), cgeo(B(0.02, bh * 0.9, 0.02), sx * (W / 2 + 0.005), y0 + bh * 0.5, T.cabZ - 0.6, 0x222222));
    head.push(cgeo(B(0.42, 0.15, 0.05), sx * (W / 2 - 0.32), y0 + bh * 0.62, L / 2 + 0.01, 0xfff4c2)); tail.push(cgeo(B(0.42, 0.14, 0.05), sx * (W / 2 - 0.32), y0 + bh * 0.62, -L / 2 - 0.01, 0xaa2222));
  }
  body.push(cgeo(B(W + 0.06, 0.2, 0.18), 0, y0 + 0.16, L / 2, 0x2b2b2b), cgeo(B(W + 0.06, 0.2, 0.18), 0, y0 + 0.16, -L / 2, 0x2b2b2b), cgeo(B(1.0, 0.18, 0.05), 0, y0 + bh * 0.55, L / 2 + 0.02, 0x111111), cgeo(B(0.5, 0.13, 0.03), 0, y0 + 0.17, L / 2 + 0.1, 0xf2f2f2), cgeo(B(0.5, 0.13, 0.03), 0, y0 + 0.17, -L / 2 - 0.1, 0xf2f2f2));
  if (driver) body.push(cgeo(B(0.34, 0.42, 0.2), 0.42, cy - 0.12, T.cabZ + 0.4, 0x556677), cgeo(B(0.22, 0.22, 0.22), 0.42, cy + 0.18, T.cabZ + 0.4, 0xe0b48f));
  if (typeName === 'taxi') body.push(cgeo(B(0.55, 0.15, 0.25), 0, cy + T.cabH / 2 + 0.17, T.cabZ, 0xffe14d));
  const mk = (list, mat) => bodyG.add(new THREE.Mesh(mergeGeometries(list, false), mat));
  mk(body, CARBODY); mk(glass, CARGLASS); mk(head, CARHEAD); mk(tail, CARTAIL); g.add(bodyG);
  const wheels = [];
  for (const [sx, sz, front] of [[-1, 1, 1], [1, 1, 1], [-1, -1, 0], [1, -1, 0]]) {
    const tire = new THREE.CylinderGeometry(wr, wr, 0.3, 16), rim = new THREE.CylinderGeometry(wr * 0.6, wr * 0.6, 0.32, 10), hub = new THREE.CylinderGeometry(wr * 0.2, wr * 0.2, 0.34, 6);
    [tire, rim, hub].forEach(q => q.rotateZ(Math.PI / 2));
    const spin = new THREE.Group(), pivot = new THREE.Group();
    spin.add(new THREE.Mesh(mergeGeometries([cgeo(tire, 0, 0, 0, 0x151515), cgeo(rim, 0, 0, 0, 0xb8bcc2), cgeo(hub, 0, 0, 0, 0x555a60)], false), CARBODY));
    pivot.position.set(sx * (W / 2 - 0.08), wr, sz * (L / 2 - 0.85)); pivot.add(spin); g.add(pivot); wheels.push({ pivot, spin, front });
  }
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6).rotateX(-Math.PI / 2).translate(0, 0.05, L / 2 + 3.3), CARBEAM), new THREE.Mesh(new THREE.PlaneGeometry(W + 0.5, L + 0.5).rotateX(-Math.PI / 2).translate(0, 0.045, 0), CARSHADOW));
  return { g, body: bodyG, wheels, wr };
}
function animCar(c, dt, steer, thr) {
  c.spin += c.speed * dt / c.wr; c.steerV += ((steer || 0) - c.steerV) * Math.min(1, dt * 8);
  for (const w of c.wheels) { w.spin.rotation.x = c.spin; if (w.front) w.pivot.rotation.y = Math.max(-0.5, Math.min(0.5, c.steerV * 0.45)); }
  const k = Math.min(1, dt * 5); c.body.rotation.x += (-(thr || 0) * 0.02 - c.body.rotation.x) * k; c.body.rotation.z += (-c.steerV * Math.min(1, Math.abs(c.speed) / 15) * 0.05 - c.body.rotation.z) * k;
}
