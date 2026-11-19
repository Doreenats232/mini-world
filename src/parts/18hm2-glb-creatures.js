// ---------- Real 3D creature models (CC0, rigged + animated) replace the primitive creatures: Area 51 cells, escapees and planet aliens. Falls back to the old shapes until a model has loaded ----------
const CRGLB = ['alien_big', 'slime_green', 'armored_bee', 'jelly_flyer', 'orc_brute', 'raptor', 'pebble_flyer', 'crystal_rock', 'slime_horned', 'skull_hopper', 'ghost', 'wyvern'], CRH = [2.0, 1.5, 1.6, 1.7, 2.8, 2.0, 1.5, 1.7, 1.5, 1.4, 1.9, 2.4], CRC = {}, CRW = {};
function crLoad(i) { if (CRC[i] !== undefined) return; CRC[i] = null; try { const gl = new GLTFLoader(); gl.setMeshoptDecoder(MeshoptDecoder); gl.load('models/creatures/' + CRGLB[i] + '.glb', g => { CRC[i] = { scene: g.scene, anims: g.animations }; (CRW[i] || []).forEach(f => f()); CRW[i] = []; }, undefined, () => {}); } catch (e) {} }
function crPick(clips, re) { return clips.find(c => re.test(c.name)) || clips[0]; }
function crAttach(i, holder, mode) { // mode 'idle' for cells, 'move' for hunters
  const d = CRC[i], model = SkeletonUtils.clone(d.scene); model.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  const bb = new THREE.Box3().setFromObject(model), h = Math.max(0.01, bb.max.y - bb.min.y), s = CRH[i] / h; model.scale.setScalar(s); model.position.y = -bb.min.y * s; holder.add(model);
  const mixer = d.anims.length ? new THREE.AnimationMixer(model) : null; if (mixer) { const clip = crPick(d.anims, mode === 'move' ? /walk|run|flying(?!_idle)|dragon_flying/i : /idle|flying_idle|dragon_flying/i); if (clip) mixer.clipAction(clip).play(); }
  return mixer;
}
// swap the builders: same signature (g -> anim(t)), but backed by a real model when ready
function crWrap(CRE) { CRE.forEach((c, i) => { const proc = c[2]; c[2] = function (g) {
  crLoad(i); const holder = new THREE.Group(); g.add(holder); let mixer = null, last = null, procAnim = null; const mode = g.userData.hunter ? 'move' : 'idle';
  const useGlb = () => { while (holder.children.length) holder.remove(holder.children[0]); mixer = crAttach(i, holder, g.userData.hunter ? 'move' : 'idle'); procAnim = null; };
  if (CRC[i]) useGlb(); else { const tmp = new THREE.Group(); holder.add(tmp); procAnim = proc(tmp); (CRW[i] = CRW[i] || []).push(() => { if (holder.parent) useGlb(); }); }
  return function (t) { if (procAnim) return procAnim(t); if (mixer) { const dt = last === null ? 0.016 : Math.min(0.06, Math.max(0, t - last)); last = t; mixer.update(dt); } };
}; }); }
CRGLB.forEach((_, i) => crLoad(i));
