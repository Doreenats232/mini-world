// ---------- effects: explosions (fireball, shockwave, embers), rain + lightning, wet roads, player headlight headBeam, dust ----------
const WX = { rain: 0, target: 0, timer: 60 + Math.random() * 90, flash: 0, nextBolt: 8, inside: false, it: 0 }, RAIN_N = isTouch ? 450 : 900;
const rainBase = new Float32Array(RAIN_N * 3), rainPos = new Float32Array(RAIN_N * 6);
for (let i = 0; i < RAIN_N; i++) { rainBase[i * 3] = (Math.random() - 0.5) * 44; rainBase[i * 3 + 1] = Math.random() * 26; rainBase[i * 3 + 2] = (Math.random() - 0.5) * 44; }
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMesh = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc8d6e6, transparent: true, opacity: 0.4, depthWrite: false }));
rainMesh.frustumCulled = false; rainMesh.visible = false; rainMesh.userData.noShadow = true; scene.add(rainMesh);
const GREY = new THREE.Color(0x77818c), _g = new THREE.Color();
function setWeather(r) { WX.target = r; WX.timer = 90 + Math.random() * 150; }
// called from skyTick every frame
function weatherTick(dt, day) {
  WX.timer -= dt; if (WX.timer <= 0) { WX.timer = 80 + Math.random() * 180; WX.target = Math.random() < 0.35 ? 0.5 + Math.random() * 0.5 : 0; }
  WX.rain += (WX.target - WX.rain) * Math.min(1, dt * 0.25); if (Math.abs(WX.rain - WX.target) < 0.005) WX.rain = WX.target;
  const r = WX.rain;
  // lightning in heavy rain
  if (r > 0.6) { WX.nextBolt -= dt; if (WX.nextBolt <= 0) { WX.nextBolt = 10 + Math.random() * 22; WX.flash = 1; setTimeout(() => { try { sfx('thunder'); } catch (e) {} }, 400 + Math.random() * 1200); } }
  WX.flash = Math.max(0, WX.flash - dt * 3.5);
  skyUni.cover.value = r; skyUni.flash.value = WX.flash;
  if (r > 0.01) {
    _g.copy(GREY).multiplyScalar(0.25 + 0.75 * day); scene.fog.color.lerp(_g, Math.min(1, r * 0.8)); scene.background.copy(scene.fog.color);
    sun.intensity *= 1 - 0.55 * r; hemi.intensity *= 1 - 0.25 * r;
  }
  hemi.intensity += WX.flash * 1.6;
  scene.fog.near = 60 * (1 - 0.6 * r); scene.fog.far = 260 * (1 - 0.45 * r);
  roadMat.color.setScalar(1 - 0.42 * r);
  // rain streaks around the camera (hidden indoors)
  WX.it -= dt; if (WX.it <= 0) { WX.it = 0.3; WX.inside = false; for (const b of buildings) if (b.on && cam.position.x > b.x - b.w / 2 && cam.position.x < b.x + b.w / 2 && cam.position.z > b.z - b.d / 2 && cam.position.z < b.z + b.d / 2 && cam.position.y < b.h) { WX.inside = true; break; } }
  const show = r > 0.05 && !WX.inside; rainMesh.visible = show;
  if (show) {
    const n = Math.floor(RAIN_N * Math.min(1, r * 1.2)), fall = 28, t = (WX.tt = (WX.tt || 0) + dt), cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (let i = 0; i < n; i++) {
      const bx = rainBase[i * 3], by = rainBase[i * 3 + 1], bz = rainBase[i * 3 + 2];
      let y = ((by - fall * t) % 26 + 26) % 26, x = bx + (y * 0.12), z = bz;
      x = ((x - cx + 22) % 44 + 44) % 44 - 22; z = ((z - cz + 22) % 44 + 44) % 44 - 22;
      const o = i * 6; rainPos[o] = cx + x; rainPos[o + 1] = cy - 8 + y; rainPos[o + 2] = cz + z; rainPos[o + 3] = cx + x + 0.08; rainPos[o + 4] = cy - 8 + y + 0.7; rainPos[o + 5] = cz + z;
    }
    rainGeo.setDrawRange(0, n * 2); rainGeo.attributes.position.needsUpdate = true;
  }
}
// ---- explosions ----
const boomFx = [], boomLight = new THREE.PointLight(0xff9a40, 0, 60, 2); boomLight.position.set(0, 3, 0); scene.add(boomLight);
const ballGeo = new THREE.SphereGeometry(1, 12, 9), ringGeo = new THREE.RingGeometry(0.85, 1, 28); ringGeo.rotateX(-Math.PI / 2);
function boom(p, size = 1) {
  const mk = (geo, col, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.copy(p); m.userData.noShadow = true; scene.add(m); return m; };
  const fire = mk(ballGeo, 0xff7a1a, 0.9), core = mk(ballGeo, 0xfff2b0, 1), ring = mk(ringGeo, 0xffd9a0, 0.7); ring.position.y = 0.15;
  boomFx.push({ fire, core, ring, t: 0, size });
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffa030 : 0xffe9a0 })); m.position.copy(p); m.scale.setScalar(1 + Math.random() * 1.5); scene.add(m); sparks.push({ m, v: new V3((Math.random() - 0.5) * 16, 4 + Math.random() * 10, (Math.random() - 0.5) * 16).multiplyScalar(size), t: 0.7 + Math.random() * 0.9 }); }
  boomLight.position.copy(p); boomLight.position.y += 2; boomLight.intensity = 14 * size; boomLight.userData.p = boomLight.intensity;
}
function boomTick(dt) {
  if (boomLight.intensity > 0) boomLight.intensity = Math.max(0, boomLight.intensity - dt * 30);
  for (let i = boomFx.length - 1; i >= 0; i--) {
    const e = boomFx[i]; e.t += dt; const k = e.t / 0.9, s = e.size;
    e.fire.scale.setScalar((0.6 + k * 3.4) * s); e.fire.material.opacity = Math.max(0, 0.9 * (1 - k)); e.fire.position.y += dt * 1.6;
    e.core.scale.setScalar((0.5 + k * 1.2) * s); e.core.material.opacity = Math.max(0, 1 - k * 2.2);
    e.ring.scale.setScalar((1 + k * 13) * s); e.ring.material.opacity = Math.max(0, 0.7 * (1 - k));
    if (k >= 1) { for (const m of [e.fire, e.core, e.ring]) { scene.remove(m); m.material.dispose(); } boomFx.splice(i, 1); }
  }
}
// ---- player's headlight headBeam (one spot light, only lit at night while driving) ----
const headBeam = new THREE.SpotLight(0xfff0c8, 0, 55, 0.55, 0.6, 1.2); headBeam.position.set(0, -50, 0); headBeam.target.position.set(0, -50, 1); scene.add(headBeam, headBeam.target);
function beamTick() {
  const c = (typeof inCar !== 'undefined') ? inCar : null, n = 1 - (typeof dayLight !== 'undefined' ? dayLight : 1);
  if (!c || n < 0.05) { headBeam.intensity = 0; return; }
  const f = Math.sin(c.h), g = Math.cos(c.h); headBeam.position.set(c.pos.x + f * 1.9, 0.85, c.pos.z + g * 1.9); headBeam.target.position.set(c.pos.x + f * 22, 0, c.pos.z + g * 22); headBeam.target.updateMatrixWorld(); headBeam.intensity = 5 * n;
}
function fxTick(dt) { boomTick(dt); beamTick(); moodTick(dt); nasaTick(dt); }
