// ---------- first-person viewmodel (gun / fists / held block), hit sparks, knockback, corpses ----------
const VM = { g: new THREE.Group(), kick: 0, punchT: 0, hand: 0, flash: 0, bob: 0 };
const VMMAT = new THREE.MeshLambertMaterial({ vertexColors: true, depthTest: false, depthWrite: false });
const vmMesh = list => { const m = new THREE.Mesh(mergeGeometries(list, false), VMMAT); m.renderOrder = 1000; m.frustumCulled = false; return m; };
const VSK = 0xe0b48f, VSL = 0x3a4a5a;
const vmPistol = vmMesh([cbox(0.06, 0.07, 0.3, 0, 0.02, -0.15, 0x3a3a3f), cbox(0.05, 0.14, 0.07, 0, -0.07, 0, 0x222222), cbox(0.04, 0.04, 0.1, 0, 0, -0.33, 0x555555), cbox(0.1, 0.1, 0.12, 0, -0.09, 0.02, VSK), cbox(0.11, 0.11, 0.35, 0.03, -0.13, 0.22, VSL)]);
const vmShotgun = vmMesh([cbox(0.05, 0.05, 0.75, 0, 0.02, -0.38, 0x3a3a3f), cbox(0.07, 0.07, 0.2, 0, -0.04, -0.3, 0x6b4423), cbox(0.07, 0.1, 0.25, 0, 0, 0, 0x2b2b2b), cbox(0.06, 0.1, 0.3, 0, -0.03, 0.25, 0x6b4423), cbox(0.1, 0.1, 0.12, 0, -0.08, -0.3, VSK), cbox(0.1, 0.1, 0.12, 0, -0.09, 0.05, VSK), cbox(0.11, 0.11, 0.3, 0.03, -0.13, 0.28, VSL)]);
const vmFist = vmMesh([cbox(0.11, 0.11, 0.14, 0, 0, 0, VSK), cbox(0.09, 0.09, 0.4, 0, 0, 0.25, VSL)]);
const vmBlockMats = bmats.map(m => { const c = m.clone(); c.depthTest = false; c.depthWrite = false; return c; });
const vmBlock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), vmBlockMats[0]); vmBlock.renderOrder = 1000; vmBlock.frustumCulled = false;
const vmFlash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, depthTest: false, blending: THREE.AdditiveBlending })); vmFlash.renderOrder = 1001; vmFlash.visible = false; vmFlash.frustumCulled = false;
const vmHold = new THREE.Group(); vmHold.add(vmPistol, vmShotgun, vmBlock, vmFlash); vmFist.visible = false; VM.g.add(vmHold, vmFist);
scene.add(cam); cam.add(VM.g);
function vmShoot() { VM.kick = 1; VM.flash = 0.06; if (pmod) gunFlash(pmod); }
function vmPunch() { VM.punchT = 0.3; VM.hand = 1 - VM.hand; }
function updateViewmodel(dt) {
  VM.g.visible = !inCar && !shopOpen && !tpv; if (!VM.g.visible) return;
  const fight = mode === 'fight', sg = weapon === 'shotgun';
  vmPistol.visible = fight && !sg; vmShotgun.visible = fight && sg; vmBlock.visible = !fight; vmBlock.material = vmBlockMats[sel];
  const moving = P.ground && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || Math.abs(joy.x) + Math.abs(joy.y) > 0.25);
  VM.bob += dt * (moving ? (keys.ShiftLeft ? 13 : 9) : 1.5); const bx = Math.sin(VM.bob) * (moving ? 0.012 : 0.003), by = Math.abs(Math.cos(VM.bob)) * (moving ? 0.014 : 0.002);
  VM.kick = Math.max(0, VM.kick - dt * 7); VM.flash -= dt; VM.punchT = Math.max(0, VM.punchT - dt);
  const pt = VM.punchT > 0 ? Math.sin((1 - VM.punchT / 0.3) * Math.PI) : 0;
  vmHold.position.set((fight ? (sg ? 0.3 : 0.28) : 0.3) + bx, (fight ? -0.26 : -0.3) - by - pt * 0.25, (fight ? -0.55 : -0.5) + VM.kick * 0.1);
  vmHold.rotation.set(VM.kick * 0.3 - pt * 0.5, 0, 0);
  vmFlash.visible = VM.flash > 0 && fight; vmFlash.position.set(0, 0.02, sg ? -0.8 : -0.4); vmFlash.rotation.z = Math.random() * 3;
  vmFist.visible = pt > 0; if (pt > 0) { vmFist.position.set((VM.hand ? 0.2 : -0.2) * (1 - pt * 0.6), -0.22 + pt * 0.05, -0.35 - pt * 0.5); vmFist.rotation.set(0, (VM.hand ? 0.2 : -0.2) * pt, 0); }
}
const corpses = [], sparks = [], sparkGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
function spark(pos, col) { for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: col })); m.position.copy(pos); scene.add(m); sparks.push({ m, v: new V3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4), t: 0.4 }); } }
function knock(e, from, power, stun) { const dx = e.pos.x - from.x, dz = e.pos.z - from.z, d = Math.hypot(dx, dz) || 1; e.kv = new V3(dx / d * power * 4, 0, dz / d * power * 4); e.stun = Math.max(e.stun || 0, stun); }
function stunned(e, dt) {
  const st = e.stun || 0; e.mesh.rotation.order = 'YXZ'; e.mesh.rotation.x += ((st > 0 ? -0.75 : 0) - e.mesh.rotation.x) * Math.min(1, dt * 12);
  if (st <= 0) return false; e.stun -= dt; if (e.kv) { phys(e, e.kv.x, e.kv.z, dt); e.kv.multiplyScalar(Math.max(0, 1 - dt * 5)); } else phys(e, 0, 0, dt); e.mesh.position.copy(e.pos); return true;
}
function updateFx(dt) {
  for (let i = corpses.length - 1; i >= 0; i--) { const c = corpses[i], m = c.m; c.t += dt; m.rotation.x += (-1.5 - m.rotation.x) * Math.min(1, dt * 7); if (c.t > 4) m.scale.multiplyScalar(Math.max(0, 1 - dt * 3)); if (c.t > 5) { scene.remove(m); m.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); corpses.splice(i, 1); } }
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t -= dt; s.v.y -= 12 * dt; s.m.position.addScaledVector(s.v, dt); if (s.t <= 0) { scene.remove(s.m); s.m.material.dispose(); sparks.splice(i, 1); } }
}
