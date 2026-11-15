// ---------- real 3D car model (Ferrari, three.js examples, CC-BY 4.0 by vicent091036); falls back to the box car if it can't load ----------
let FERRARI = null;
try {
  const dr = new DRACOLoader(); dr.setDecoderPath('draco/'); const gl = new GLTFLoader(); gl.setDRACOLoader(dr); gl.load('models/ferrari.glb', gl => { FERRARI = gl.scene; }, undefined, () => {});
} catch (e) {}
function mkFerrariModel(col) {
  const root = FERRARI.clone(true), g = new THREE.Group(), body = new THREE.Group();
  root.rotation.y = Math.PI; body.add(root); g.add(body);
  const wheels = [];
  for (const [nm, front] of [['wheel_fl', 1], ['wheel_fr', 1], ['wheel_rl', 0], ['wheel_rr', 0]]) {
    const w = root.getObjectByName(nm); if (!w) continue;
    const pivot = new THREE.Group(), spin = new THREE.Group(); pivot.position.copy(w.position); w.position.set(0, 0, 0);
    w.parent.add(pivot); pivot.add(spin); spin.add(w); wheels.push({ pivot, spin, front });
  }
  root.traverse(m => {
    if (!m.isMesh || !m.material) return; const mt = m.material, nm = mt.name || '';
    if (nm === 'Body_Color') { m.material = mt.clone(); m.material.color.set(col); m.userData.role = 'paint'; }
    else if (nm === 'Glass_Gray' || nm === 'Projector_Glass') { m.material = mt.clone(); m.userData.role = 'glass'; }
  });
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6).rotateX(-Math.PI / 2).translate(0, 0.05, 5.4), CARBEAM));
  return { g, body, wheels, wr: 0.36 };
}
