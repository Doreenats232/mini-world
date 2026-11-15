// ---------- real animated human (Soldier, Mixamo free model via three.js examples); falls back to the blocky humans if it can't load ----------
let SOLDIER = null;
try { new GLTFLoader().load('models/soldier.glb', gl => { SOLDIER = { scene: gl.scene, animations: gl.animations }; }, undefined, () => {}); } catch (e) {}
function makeSoldier(tint, scale = 1) {
  const root = SkeletonUtils.clone(SOLDIER.scene), wrap = new THREE.Group(); root.scale.setScalar(scale); root.rotation.y = Math.PI; wrap.add(root);
  root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); if (tint != null) o.material.color.set(tint); o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(root), act = {}; for (const c of SOLDIER.animations) act[c.name] = mixer.clipAction(c);
  const s = { root: wrap, mixer, act, cur: null, last: null }; soldAnim(s, 'Idle'); return s;
}
function soldAnim(s, name) {
  if (s.cur === name) return; const a = s.act[name]; if (!a) return;
  a.reset().fadeIn(0.2).play(); if (s.cur && s.act[s.cur]) s.act[s.cur].fadeOut(0.2); s.cur = name;
}
function attachSoldier(e, tint) {
  if (!SOLDIER || e.sold) return false;
  e.mesh.children.forEach(m => { m.visible = false; }); // the blocky boxes stay as invisible hit-boxes for shooting
  const s = makeSoldier(tint, 1.05); s.last = e.pos.clone(); e.mesh.add(s.root); e.sold = s; return true;
}
function updateSoldiers(dt) {
  if (dt <= 0) return;
  for (const e of enemies.concat(cops)) {
    const s = e.sold; if (!s) continue;
    if (e.dead) { if (!s.frozen) { s.frozen = true; soldAnim(s, 'Idle'); s.mixer.update(0.01); } continue; }
    if (dist2(e.pos, P.pos) > 90) { s.last.copy(e.pos); continue; }
    const sp = e.pos.distanceTo(s.last) / dt; s.last.copy(e.pos);
    soldAnim(s, sp > 4 ? 'Run' : sp > 0.5 ? 'Walk' : 'Idle'); s.mixer.update(dt);
  }
}
