// ---------- graphics: quality levels (Low/Med/High), sky dome with clouds + stars, sun shadows ----------
const GQ = { cur: isTouch ? 'low' : 'med', t: 0, flag: 0 };
try { const q = localStorage.getItem('mw_q'); if (q === 'low' || q === 'med' || q === 'high') GQ.cur = q; } catch (e) {}
const sunOff = new THREE.Vector3(60, 100, 30), _c1 = new THREE.Color(), _c2 = new THREE.Color();
const SKYTOP = { n: new THREE.Color(0x02040c), d: new THREE.Color(0x2f6fc4), k: new THREE.Color(0x3a3f78) };
const skyUni = { top: { value: new THREE.Color(0x2f6fc4) }, hor: { value: new THREE.Color(0x87ceeb) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color(1, 0.9, 0.6) }, night: { value: 0 }, t: { value: 0 }, clouds: { value: 1 } };
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyUni, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }',
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float night, t, clouds; varying vec3 vD;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec3 d = normalize(vD); float y = d.y;
  vec3 c = y > 0.0 ? mix(hor, top, pow(clamp(y, 0.0, 1.0), 0.5)) : hor;
  float sd = max(dot(d, sunDir), 0.0);
  if (y > -0.05) c += sunCol * (pow(sd, 700.0) * 3.0 + pow(sd, 18.0) * 0.3);
  float md = max(dot(d, -sunDir), 0.0); c += vec3(0.8, 0.85, 1.0) * pow(md, 1500.0) * 2.0 * night * step(0.0, y);
  if (clouds > 0.5 && y > 0.02) {
    vec2 p = d.xz / (y + 0.3) * 1.5 + vec2(t * 0.012, 0.0);
    float f = n(p) * 0.55 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.15;
    float m = smoothstep(0.5, 0.78, f) * smoothstep(0.02, 0.18, y);
    vec3 cc = mix(vec3(0.82, 0.86, 0.95), vec3(1.0), f) * (1.0 - night * 0.88);
    cc += sunCol * 0.18 * pow(sd, 5.0);
    c = mix(c, cc, m * 0.9);
  }
  if (night > 0.02 && y > 0.0) { vec2 sp = floor(d.xz / (y + 0.3) * 80.0); c += vec3(step(0.9972, h(sp)) * smoothstep(0.0, 0.25, y) * night); }
  gl_FragColor = vec4(c, 1.0);
}`
});
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(50, 20, 14), skyMat);
skyMesh.frustumCulled = false; skyMesh.renderOrder = -1000; scene.add(skyMesh);
scene.add(sun.target);
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60; sun.shadow.camera.near = 1; sun.shadow.camera.far = 400;
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
function applyQuality(first) {
  const q = GQ.cur, sh = q !== 'low', sz = q === 'high' ? 2048 : 1024;
  if (!ren.shadowMap) ren.shadowMap = {};
  ren.shadowMap.enabled = sh; ren.shadowMap.type = THREE.PCFSoftShadowMap; sun.castShadow = sh;
  if (sun.shadow.mapSize.x !== sz) { sun.shadow.mapSize.set(sz, sz); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  ren.toneMapping = q === 'high' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping; ren.toneMappingExposure = 1.05;
  skyUni.clouds.value = q === 'low' ? 0 : 1;
  if (!first) scene.traverse(o => { const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { x.needsUpdate = true; }); });
  GQ.flag = 0; GQ.t = 0;
  try { localStorage.setItem('mw_q', q); } catch (e) {}
  if (GQ.btn) GQ.btn.textContent = '🎨' + ({ low: 'L', med: 'M', high: 'H' })[q];
}
function setupGfxButton() {
  try {
    const b = document.createElement('button'); b.id = 'gfx'; b.title = 'Graphics quality'; b.style.cssText = 'position:fixed;top:1px;right:152px;font-size:15px;background:none;border:0;color:#fff;z-index:9';
    b.addEventListener('click', () => { GQ.cur = GQ.cur === 'low' ? 'med' : GQ.cur === 'med' ? 'high' : 'low'; applyQuality(false); if (typeof msg === 'function') msg('Graphics: ' + GQ.cur.toUpperCase(), 1200); });
    document.body.appendChild(b); GQ.btn = b;
  } catch (e) {}
}
setupGfxButton(); applyQuality(true);
// called every frame from updateSky: dome colours, sun follows the player, flag shadow casters
function skyTick(dt, day, dusk, sy, a) {
  const px = (typeof P !== 'undefined' && P.pos) ? P.pos.x : 0, pz = (typeof P !== 'undefined' && P.pos) ? P.pos.z : 0, step = 120 / sun.shadow.mapSize.x, cx = Math.round(px / step) * step, cz = Math.round(pz / step) * step;
  sunOff.set(Math.sin(a) * 100, sy * 100 + 5, 30); sun.target.position.set(cx, 0, cz); sun.position.set(cx + sunOff.x, sunOff.y, cz + sunOff.z); sun.target.updateMatrixWorld();
  skyUni.hor.value.copy(scene.fog.color);
  _c1.copy(SKYTOP.n).lerp(SKYTOP.d, day); skyUni.top.value.copy(_c1).lerp(SKYTOP.k, dusk * 0.8);
  skyUni.sunDir.value.set(Math.sin(a), sy + 0.05, 0.3).normalize();
  skyUni.sunCol.value.setRGB(1, 0.92 - 0.45 * dusk, 0.7 - 0.5 * dusk).multiplyScalar(Math.min(1, day * 1.5 + dusk));
  skyUni.night.value = 1 - day; skyUni.t.value += dt;
  sun.color.setRGB(1, 0.97 - 0.3 * dusk, 0.9 - 0.5 * dusk);
  skyMesh.position.copy(cam.position);
  if (GQ.cur !== 'low') { GQ.t -= dt; if (GQ.t <= 0) { GQ.t = 1.2; flagShadows(); } }
}
function flagShadows() {
  scene.traverse(o => {
    if (!o.isMesh || o === skyMesh || o.userData.noShadow) return; const m = o.material; if (!m || (Array.isArray(m) ? m[0] : m).transparent) return;
    if (!o.receiveShadow) o.receiveShadow = true;
    if (!o.castShadow && o.geometry && o.geometry.type !== 'PlaneGeometry') o.castShadow = true;
  });
}
