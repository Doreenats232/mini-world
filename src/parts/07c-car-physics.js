// ---------- car physics: velocity-based grip/drift, handbrake slide, body lean, bounce, skid marks, tyre smoke ----------
const SKID_N = 180, SMOKE_N = 28, skids = [], puffs = [];
let skidI = 0, smokeI = 0, skidMat = null, skidGeo = null;
const _wp = new V3(), nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
function fxInit() {
  if (skidMat) return;
  skidMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0b, transparent: true, opacity: 0.55, depthWrite: false });
  skidGeo = new THREE.PlaneGeometry(0.3, 1.0); skidGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < SKID_N; i++) { const m = new THREE.Mesh(skidGeo, skidMat); m.visible = false; m.position.y = 0.06; scene.add(m); skids.push(m); }
  const sg = new THREE.SphereGeometry(0.5, 6, 5);
  for (let i = 0; i < SMOKE_N; i++) { const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0xcfcfcf, transparent: true, opacity: 0, depthWrite: false })); m.visible = false; scene.add(m); puffs.push({ m, t: 0, life: 0 }); }
}
function skidAt(x, z, h) { fxInit(); const m = skids[skidI++ % SKID_N]; m.position.set(x, 0.06, z); m.rotation.y = h; m.visible = true; }
function smokeAt(x, z) { fxInit(); const p = puffs[smokeI++ % SMOKE_N]; p.t = 0; p.life = 0.9 + Math.random() * 0.4; p.m.position.set(x + (Math.random() - 0.5) * 0.4, 0.3, z + (Math.random() - 0.5) * 0.4); p.m.scale.setScalar(0.5); p.m.visible = true; p.m.material.opacity = 0.45; }
function carFxTick(dt) {
  for (const p of puffs) { if (!p.m.visible) continue; p.t += dt; if (p.t >= p.life) { p.m.visible = false; continue; } const k = p.t / p.life; p.m.position.y += dt * 1.1; p.m.scale.setScalar(0.5 + k * 1.8); p.m.material.opacity = 0.45 * (1 - k); }
}
function carPhys(c, dt, thr, steer) {
  const now = nowS();
  if (c.vt === undefined || now - c.vt > 0.4) { c.vx = Math.sin(c.h) * (c.speed || 0); c.vz = Math.cos(c.h) * (c.speed || 0); c.camA = c.h; c.by = 0; c.bv = 0; c.yawV = 0; c.sk = 0; }
  c.vt = now;
  const fx = Math.sin(c.h), fz = Math.cos(c.h), rx = Math.cos(c.h), rz = -Math.sin(c.h);
  let vf = c.vx * fx + c.vz * fz, vl = c.vx * rx + c.vz * rz;
  const hb = !!keys.Space, flat = 1 - 0.2 * (c.flats || 0), sp = Math.hypot(c.vx, c.vz);
  // engine / brakes along the car's own direction
  let a = 0;
  if (thr > 0.1) a = vf < -0.5 ? 26 : 21 * flat * Math.min(1, thr); else if (thr < -0.1) a = vf > 0.5 ? -26 : -10;
  else a = -Math.sign(vf) * Math.min(Math.abs(vf) / Math.max(dt, 1e-3), 6);
  if (hb) a -= Math.sign(vf) * Math.min(Math.abs(vf) / Math.max(dt, 1e-3), 14);
  a -= 0.8 * vf * Math.min(1, Math.abs(vf) / 10);
  vf += a * dt; vf = Math.max(-8, vf);
  // grip: sideways velocity is killed fast, less so when cornering hard at speed or on the handbrake
  const grip = hb ? 1.3 : 9 - 4.5 * Math.min(1, Math.abs(steer) * Math.abs(vf) / 24);
  const vlOld = vl; vl *= Math.exp(-grip * dt);
  const latAcc = (vl - vlOld) / Math.max(dt, 1e-3);
  // steering (understeer at speed, extra rotation on handbrake)
  const dir = Math.sign(vf) || 1, rate = steer * 2.1 * Math.min(1, Math.abs(vf) / 5) * dir / (1 + Math.abs(vf) / 38) * (hb && Math.abs(vf) > 5 ? 1.5 : 1) * (1 - 0.15 * (c.flats || 0));
  c.yawV += (rate - c.yawV) * Math.min(1, dt * 10);
  c.h += c.yawV * dt + (c.pull || 0) * 0.14 * dt * Math.min(1, Math.abs(vf) / 8);
  // rebuild world velocity from the NEW heading so the car keeps sliding in the old direction
  const nfx = Math.sin(c.h), nfz = Math.cos(c.h), nrx = Math.cos(c.h), nrz = -Math.sin(c.h);
  c.vx = nfx * vf + nrx * vl; c.vz = nfz * vf + nrz * vl;
  // collisions (slide along walls, bounce, damage)
  let rammed = null;
  const blk = (x, z) => { const t = { pos: new V3(x, 0, z), R: 1.3, H: 1.2 }; for (const b of solids.values()) if (hit(t, b)) return true; for (const o of cars) if (o !== c && dist2(o.pos, t.pos) < 2.8) { rammed = o; return true; } return false; };
  let nx = c.pos.x + c.vx * dt, nz = c.pos.z + c.vz * dt, impact = 0;
  if (blk(nx, nz)) {
    const bxk = blk(nx, c.pos.z), bzk = blk(c.pos.x, nz); impact = Math.hypot(c.vx, c.vz);
    if (!bxk) { nz = c.pos.z; c.vz *= -0.3; c.vx *= 0.85; } else if (!bzk) { nx = c.pos.x; c.vx *= -0.3; c.vz *= 0.85; } else { nx = c.pos.x; nz = c.pos.z; c.vx *= -0.3; c.vz *= -0.3; }
    c.yawV += (Math.random() - 0.5) * Math.min(2.5, impact * 0.12);
    if (impact > 8) { damageCar(c, impact * 1.4); if (rammed) damageCar(rammed, impact * 2.2, true); }
    if (impact > 12) crime(1, 'reckless driving', 'crash', 1);
    if (impact > 4) sfx('crash');
    if (impact > 5) c.bv = Math.min(3.2, impact * 0.18);
  }
  c.pos.x = nx; c.pos.z = nz;
  c.speed = c.vx * Math.sin(c.h) + c.vz * Math.cos(c.h); engine(Math.abs(c.speed));
  // body: lean in corners, nose dip/lift, spring bounce
  c.bv += (-70 * c.by - 7 * c.bv) * dt; c.by += c.bv * dt;
  const rollT = Math.max(-0.12, Math.min(0.12, -(latAcc * 0.006) - steer * Math.min(1, Math.abs(vf) / 20) * 0.04)), pitchT = Math.max(-0.07, Math.min(0.07, -a * 0.0028));
  c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; animCar(c, dt, steer, thr, pitchT, rollT, hb);
  c.body.position.y = c.by;
  // skid marks + tyre smoke
  const slide = Math.abs(vl) > 3.2 || (hb && Math.abs(vf) > 5) || (thr > 0.1 && vf < 0 && vf > -0.5) || (a < -20 && vf > 8);
  c.sk -= dt; c.skid = slide;
  if (slide && c.sk <= 0) {
    c.sk = 0.05; c.mesh.updateMatrixWorld(true);
    for (const w of c.wheels) { if (w.front && !(a < -20)) continue; w.pivot.getWorldPosition(_wp); skidAt(_wp.x, _wp.z, Math.atan2(c.vx, c.vz)); if (Math.random() < 0.5) smokeAt(_wp.x, _wp.z); }
  }
}
