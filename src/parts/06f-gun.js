// ---------- gun in the soldier's hand + aiming pose (arm bones are re-pointed after the animation each frame) ----------
const _gq = new THREE.Quaternion(), _gq2 = new THREE.Quaternion(), _gm = new THREE.Matrix4(), _gv = new V3(), _gws = new V3();
function mkGunProp(kind) { // barrel along +Y, top along +Z, grip at the origin (metres)
  const g = new THREE.Group(), bx = (w, d, h, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); g.add(m); };
  if (kind === 'shotgun') { bx(0.05, 0.85, 0.055, 0, 0.32, 0.03, 0x2b2b2b); bx(0.06, 0.32, 0.075, 0, 0.0, 0.0, 0x6b4a2b); bx(0.045, 0.4, 0.045, 0, 0.3, -0.03, 0x555555); }
  else { bx(0.04, 0.26, 0.055, 0, 0.1, 0.035, 0x2b2b2b); bx(0.035, 0.09, 0.12, 0, 0.0, -0.03, 0x1c1c1c); bx(0.03, 0.02, 0.02, 0, 0.23, 0.07, 0x888888); }
  return g;
}
function soldBones(s) {
  if (s.bones !== undefined) return s.bones;
  const r = s.root, bn = n => r.getObjectByName('mixamorig' + n) || r.getObjectByName('mixamorig:' + n), arm = bn('RightArm'), fore = bn('RightForeArm'), hand = bn('RightHand'); // the loader strips the ':' from names
  if (!arm || !fore || !hand) return (s.bones = null);
  hand.getWorldScale(_gws); const holder = new THREE.Group(); holder.scale.setScalar(1 / Math.max(1e-4, _gws.x)); hand.add(holder);
  return (s.bones = { arm, fore, hand, holder, kind: null });
}
function aimBone(b, dir) { // rotate bone so its +Y (along the limb) points along world dir
  b.updateWorldMatrix(true, false); b.getWorldQuaternion(_gq); _gv.set(0, 1, 0).applyQuaternion(_gq).normalize();
  _gq2.setFromUnitVectors(_gv, dir); _gq.premultiply(_gq2); b.parent.getWorldQuaternion(_gq2); b.quaternion.copy(_gq2.invert().multiply(_gq)); b.updateMatrixWorld(true);
}
function setHandBasis(b, dir) { // hand: +Y = dir (barrel), +Z = up, so the gun sits upright
  const up = new V3(0, 1, 0).addScaledVector(dir, -dir.y).normalize(); if (up.lengthSq() < 0.01) up.set(0, 0, 1);
  const x = new V3().crossVectors(dir, up).normalize(); _gm.makeBasis(x, dir, up); _gq.setFromRotationMatrix(_gm);
  b.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(_gq2); b.quaternion.copy(_gq2.invert().multiply(_gq)); b.updateMatrixWorld(true);
}
// call AFTER mixer.update: fwd = world forward of the character (unit), pitch = aim pitch, aiming = raise the gun, kind = 'pistol' | 'shotgun' | null (hide)
function armGun(s, fwd, pitch, aiming, kind) {
  const B = soldBones(s); if (!B) return;
  if (kind !== B.kind) { while (B.holder.children.length) B.holder.remove(B.holder.children[0]); if (kind) { const g = mkGunProp(kind); g.position.set(0, 0.06, 0); B.holder.add(g); } B.kind = kind; }
  if (!kind) return;
  const cp = Math.cos(pitch), dir = new V3(fwd.x * cp, Math.sin(pitch), fwd.z * cp).normalize();
  if (aiming) { aimBone(B.arm, dir); aimBone(B.fore, dir); setHandBasis(B.hand, dir); }
  else setHandBasis(B.hand, new V3(fwd.x, -0.9, fwd.z).normalize());
}
