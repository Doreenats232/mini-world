// ---- GPS map: every place on a full-screen map, tap to set a waypoint, route follows you like GTA ----
const gSnap = v => Math.round((v - 25) / 50) * 50 + 25;
const PLACE_TYPES = { school: ['🏫', '#e67e22', 'Schools'], university: ['🎓', '#8e44ad', 'Universities'], company: ['🏢', '#2e86de', 'Companies'], nasa: ['🚀', '#e0301e', 'NASA'], police: ['🚔', '#1e3a8a', 'Police'], bank: ['🏦', '#16a085', 'Banks'], prison: ['🔒', '#7f8c8d', 'Prison'], shop: ['🛒', '#f1c40f', 'Shop'], mall: ['🛍', '#e84393', 'Mall'], fair: ['🎡', '#f39c12', 'Fun Fair'], area51: ['👽', '#27ae60', 'Area 51'], plaza: ['🎰', '#e91e8c', 'Entertainment Plaza'] };
let placeList = null; const places = () => placeList || (placeList = institutions.map(b => ({ x: b.x, z: b.z, type: b.purpose, name: b.pname, b })).concat([{ x: SHOP.x, z: SHOP.z, type: 'shop', name: 'General Shop', b: null }].concat(EXTRA_PLACES)));
let gwp = null, route = null, gpsT = 0, gbeam = null, mapOpen = false, bmRaf = 0;
const gpsEl = document.createElement('div'); gpsEl.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);background:#000b;color:#fff;padding:6px 14px;border-radius:14px;z-index:20;font:13px sans-serif;display:none;cursor:pointer'; document.body.appendChild(gpsEl);
gpsEl.onclick = () => clearWaypoint(); gpsEl.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); clearWaypoint(); }, { passive: false });
function gpsPath(from, to) {
  const ax = p => { const lx = gSnap(p.x), lz = gSnap(p.z); return Math.abs(p.x - lx) <= Math.abs(p.z - lz) ? { x: lx, z: p.z, v: true } : { x: p.x, z: lz, v: false }; };
  const S = ax(from), E = ax(to); let mid = [];
  if (S.v && E.v) { if (S.x !== E.x) { const zi = gSnap(S.z); mid = [{ x: S.x, z: zi }, { x: E.x, z: zi }]; } }
  else if (S.v) mid = [{ x: S.x, z: E.z }]; else if (E.v) mid = [{ x: E.x, z: S.z }];
  else if (S.z !== E.z) { const xi = gSnap(S.x); mid = [{ x: xi, z: S.z }, { x: xi, z: E.z }]; }
  const raw = [{ x: from.x, z: from.z }, S, ...mid, E, { x: to.x, z: to.z }], pts = [raw[0]]; let len = 0;
  for (let i = 1; i < raw.length; i++) { const p = pts[pts.length - 1], d = Math.hypot(raw[i].x - p.x, raw[i].z - p.z); if (d > 0.01) { pts.push({ x: raw[i].x, z: raw[i].z }); len += d; } }
  return { pts, len };
}
function setWaypoint(x, z, name, type) {
  clearWaypoint(); gwp = { x, z, name: name || 'Dropped pin', type };
  gbeam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 160, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xff2d95, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })); gbeam.position.set(x, 80, z); scene.add(gbeam);
  gpsT = 0; gpsTick(0);
}
function clearWaypoint() { gwp = null; route = null; if (gbeam) { scene.remove(gbeam); gbeam.geometry.dispose(); gbeam.material.dispose(); gbeam = null; } gpsEl.style.display = 'none'; }
function gpsTick(dt) {
  if (!gwp) return; gpsT -= dt; if (gpsT > 0) return; gpsT = 0.5;
  const me = inCar ? inCar.pos : P.pos; if (Math.hypot(gwp.x - me.x, gwp.z - me.z) < 12) { msg('📍 You have arrived: ' + gwp.name, 2500); clearWaypoint(); return; }
  route = gpsPath({ x: me.x, z: me.z }, gwp); const eta = Math.round(route.len / (inCar ? 12 : 5));
  gpsEl.textContent = '📍 ' + gwp.name + ' · ' + Math.round(route.len) + ' m · ~' + eta + ' s  (tap to cancel)'; gpsEl.style.display = 'block';
}
function mapMiniRoute(g, sc) { if (!route) return; g.strokeStyle = '#ff2d95'; g.lineWidth = 5 / sc; g.lineJoin = 'round'; g.beginPath(); route.pts.forEach((p, i) => i ? g.lineTo(p.x, p.z) : g.moveTo(p.x, p.z)); g.stroke(); }
function mapMiniIcons(dot) { for (const p of places()) dot(p.x, p.z, PLACE_TYPES[p.type][1], 5, false); if (gwp) dot(gwp.x, gwp.z, '#ff2d95', 8, true); }
// ---- full-screen map ----
const bmv = { cx: 0, cz: 0, s: 0.6, hidden: new Set(), ptrs: new Map(), down: null, pinch: null };
const bmEl = document.createElement('div'); bmEl.style.cssText = 'position:fixed;inset:0;background:#0b1220;z-index:32;display:none;font:13px sans-serif;color:#fff';
const bmc = document.createElement('canvas'); bmc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none'; bmEl.appendChild(bmc);
const bmTop = document.createElement('div'); bmTop.style.cssText = 'position:absolute;top:0;left:0;right:0;padding:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:linear-gradient(#000c,#0000)';
const bmBot = document.createElement('div'); bmBot.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:10px;display:flex;gap:8px;align-items:center;background:linear-gradient(#0000,#000c)';
const bmInfo = document.createElement('span'); bmInfo.style.flex = '1'; bmInfo.textContent = 'Tap a place or anywhere on the map to set a route';
const mkBtn = (t, f, bg) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'padding:8px 12px;border-radius:8px;border:0;color:#fff;font-size:13px;background:' + (bg || '#2e86de'); b.onclick = f; return b; };
bmBot.append(bmInfo, mkBtn('📍 Me', () => centerMe()), mkBtn('Clear route', () => { clearWaypoint(); bmInfo.textContent = 'Route cleared'; }, '#555'));
for (const t in PLACE_TYPES) { const n = places().filter(p => p.type === t).length; if (!n) continue; const c = mkBtn(PLACE_TYPES[t][0] + ' ' + n, () => { bmv.hidden.has(t) ? bmv.hidden.delete(t) : bmv.hidden.add(t); c.style.opacity = bmv.hidden.has(t) ? 0.35 : 1; }, PLACE_TYPES[t][1]); c.title = PLACE_TYPES[t][2]; bmTop.appendChild(c); }
bmTop.appendChild(mkBtn('✕ Close', () => closeMap(), '#c0392b')); bmEl.append(bmTop, bmBot); document.body.appendChild(bmEl);
function centerMe() { const me = inCar ? inCar.pos : P.pos; bmv.cx = me.x; bmv.cz = me.z; }
function openMap() { if (shopOpen) return; mapOpen = true; shopOpen = true; for (const k in keys) keys[k] = false; document.exitPointerLock && document.exitPointerLock(); bmc.width = innerWidth; bmc.height = innerHeight; bmv.s = Math.min(innerWidth, innerHeight) / 700; centerMe(); bmEl.style.display = 'block'; loopMap(); }
function closeMap() { mapOpen = false; shopOpen = false; bmEl.style.display = 'none'; }
const rafF = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : f => setTimeout(f, 50);
function loopMap() { if (!mapOpen) return; drawBig(); rafF(loopMap); }
function toggleMap() { mapOpen ? closeMap() : openMap(); }
const mapBtn = document.createElement('div'); mapBtn.className = 'b'; mapBtn.textContent = '🗺'; mapBtn.style.cssText = 'right:234px;bottom:210px;font-size:24px'; document.body.appendChild(mapBtn);
mapBtn.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); toggleMap(); }, { passive: false });
addEventListener('keydown', e => { if (e.code === 'KeyN' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { e.preventDefault(); toggleMap(); } });
addEventListener('resize', () => { if (mapOpen) { bmc.width = innerWidth; bmc.height = innerHeight; } });
const bmW = (sx, sy) => ({ x: bmv.cx + (sx - bmc.width / 2) / bmv.s, z: bmv.cz + (sy - bmc.height / 2) / bmv.s });
function mapTap(sx, sy) {
  const w = bmW(sx, sy); let best = null, bd = (24 / bmv.s) ** 2;
  for (const p of places()) { if (bmv.hidden.has(p.type)) continue; const d = (p.x - w.x) ** 2 + (p.z - w.z) ** 2; if (d < bd) { bd = d; best = p; } }
  if (best) { const t = best.b ? doorPt(best.b) : best; setWaypoint(t.x, t.z, best.name, best.type); } else setWaypoint(w.x, w.z, 'Dropped pin', 'pin');
  bmInfo.textContent = route ? '📍 ' + gwp.name + ' · ' + Math.round(route.len) + ' m — follow the pink line' : 'Route set';
}
bmc.addEventListener('pointerdown', e => { bmc.setPointerCapture && bmc.setPointerCapture(e.pointerId); bmv.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (bmv.ptrs.size === 1) bmv.down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; else { const [a, b] = [...bmv.ptrs.values()]; bmv.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: bmv.s }; if (bmv.down) bmv.down.moved = true; } });
bmc.addEventListener('pointermove', e => {
  const p = bmv.ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (bmv.ptrs.size >= 2 && bmv.pinch) { const [a, b] = [...bmv.ptrs.values()]; bmv.s = Math.max(0.25, Math.min(6, bmv.pinch.s * (Math.hypot(a.x - b.x, a.y - b.y) / bmv.pinch.d))); }
  else { bmv.cx -= dx / bmv.s; bmv.cz -= dy / bmv.s; if (bmv.down && Math.hypot(e.clientX - bmv.down.x, e.clientY - bmv.down.y) > 6) bmv.down.moved = true; }
});
const mapUp = e => { if (bmv.ptrs.size === 1 && bmv.down && !bmv.down.moved && performance.now() - bmv.down.t < 500) mapTap(e.clientX, e.clientY); bmv.ptrs.delete(e.pointerId); if (bmv.ptrs.size < 2) bmv.pinch = null; if (!bmv.ptrs.size) bmv.down = null; };
bmc.addEventListener('pointerup', mapUp); bmc.addEventListener('pointercancel', e => { bmv.ptrs.delete(e.pointerId); bmv.pinch = null; bmv.down = null; });
bmc.addEventListener('wheel', e => { e.preventDefault(); const w = bmW(e.clientX, e.clientY), f = e.deltaY < 0 ? 1.15 : 1 / 1.15; bmv.s = Math.max(0.25, Math.min(6, bmv.s * f)); const w2 = bmW(e.clientX, e.clientY); bmv.cx += w.x - w2.x; bmv.cz += w.z - w2.z; }, { passive: false });
function drawBig() {
  const g = bmc.getContext('2d'), W = bmc.width, H = bmc.height, s = bmv.s, X = x => W / 2 + (x - bmv.cx) * s, Z = z => H / 2 + (z - bmv.cz) * s;
  g.fillStyle = '#141c2e'; g.fillRect(0, 0, W, H);
  const zone = (x0, x1, z0, z1, col) => { g.fillStyle = col; g.fillRect(X(x0), Z(z0), (x1 - x0) * s, (z1 - z0) * s); };
  for (const [a, b, c, d] of [[330, 650, -650, 650], [0, 330, -650, -360], [0, 330, 330, 650]]) zone(a, b, c, d, '#16322f');
  for (const [a, b, c, d] of [[-650, -360, -650, 650], [-360, 0, -650, -360], [-360, 0, 330, 650]]) zone(a, b, c, d, '#1d2233');
  zone(-360, 330, -360, 330, '#192339');
  const RN = ['Kampala Rd', 'Sir Apollo Kaggwa Rd', 'Hoima Rd', 'Jinja Rd', 'Entebbe Rd', 'Bombo Rd', 'Gayaza Rd', 'Masaka Rd', 'Mityana Rd', 'Ntinda Rd', 'Kira Rd', 'Kyambogo Rd', 'Lugogo Bypass', 'Nile Ave', 'Victoria Ave', 'Pioneer Rd', 'Station Rd', 'Market St', 'Church Rd', 'Mbogo Rd', 'Albert Cook Rd', 'Wakaliga Rd', 'Sixth St', 'Spring Rd', 'Kitgum Rd'];
  g.lineCap = 'butt'; for (const [col, wd] of [['#2b3a5a', 14 * s + 2], ['#3b5180', 14 * s - 2]]) { g.strokeStyle = col; g.lineWidth = Math.max(2, wd); for (let k = -13; k <= 11; k++) { const c = k * 50 + 25; g.beginPath(); g.moveTo(X(c), Z(-650)); g.lineTo(X(c), Z(650)); g.stroke(); g.beginPath(); g.moveTo(X(-650), Z(c)); g.lineTo(X(650), Z(c)); g.stroke(); } }
  g.strokeStyle = 'rgba(210,225,255,.22)'; g.lineWidth = 1; g.setLineDash([6, 8]); for (let k = -13; k <= 11; k++) { const c = k * 50 + 25; g.beginPath(); g.moveTo(X(c), Z(-650)); g.lineTo(X(c), Z(650)); g.stroke(); g.beginPath(); g.moveTo(X(-650), Z(c)); g.lineTo(X(650), Z(c)); g.stroke(); } g.setLineDash([]);
  g.fillStyle = '#26324d'; g.strokeStyle = '#33426a'; g.lineWidth = 1; for (const b of cityFoot) { const x0 = X(b.min.x), z0 = Z(b.min.z), w = (b.max.x - b.min.x) * s, h = (b.max.z - b.min.z) * s; if (x0 > W || z0 > H || x0 + w < 0 || z0 + h < 0) continue; g.fillRect(x0, z0, w, h); if (s > 0.8) g.strokeRect(x0 + 0.5, z0 + 0.5, w, h); }
  for (const p of places()) if (p.b && !bmv.hidden.has(p.type)) { g.fillStyle = PLACE_TYPES[p.type][1]; g.globalAlpha = 0.85; g.fillRect(X(p.b.x - p.b.w / 2), Z(p.b.z - p.b.d / 2), p.b.w * s, p.b.d * s); g.globalAlpha = 1; }
  if (s >= 0.8) { g.fillStyle = '#8ea4cf'; g.font = 'bold ' + Math.round(Math.min(13, 9 + s * 3)) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = -13; k <= 11; k++) { const c = k * 50 + 25, xs = X(c), zs = Z(c), nm = RN[(k + 13) % RN.length], nm2 = RN[(k * 7 + 40) % RN.length];
      if (xs > 20 && xs < W - 20) for (let t = 0; t < 4; t++) { const ty = H * (0.15 + 0.25 * t) + (k * 37 % 80); g.save(); g.translate(xs, ty); g.rotate(-Math.PI / 2); g.fillText(nm, 0, 0); g.restore(); }
      if (zs > 20 && zs < H - 20) for (let t = 0; t < 3; t++) g.fillText(nm2, W * (0.18 + 0.3 * t) + (k * 53 % 90), zs); } }
  g.textAlign = 'center'; g.fillStyle = 'rgba(180,200,240,.55)'; g.font = 'bold ' + Math.max(12, 22 * s) + 'px sans-serif'; g.fillText('RICH SIDE', X(500), Z(0)); g.fillText('SLUMS', X(-500), Z(0)); g.fillText('DOWNTOWN', X(-25), Z(-30));
  if (route) { g.strokeStyle = '#ff2d95'; g.lineWidth = Math.max(4, 4 * s); g.lineJoin = 'round'; g.beginPath(); route.pts.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z))); g.stroke(); }
  const r = Math.max(9, Math.min(14, 10 * s * 1.4)); g.textBaseline = 'middle';
  for (const p of places()) {
    if (bmv.hidden.has(p.type)) continue; const x = X(p.x), y = Z(p.z); if (x < -30 || y < -30 || x > W + 30 || y > H + 30) continue; const col = PLACE_TYPES[p.type][1];
    g.fillStyle = col; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - r - 3, r, Math.PI * 0.8, Math.PI * 0.2, false); g.lineTo(x, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - r - 3, r * 0.72, 0, 6.2832); g.fill(); g.font = Math.round(r) + 'px sans-serif'; g.fillStyle = '#000'; g.textAlign = 'center'; g.fillText(PLACE_TYPES[p.type][0], x, y - r - 2);
    if (s >= 0.7) { g.font = 'bold 11px sans-serif'; g.lineWidth = 3; g.strokeStyle = '#0b1220'; g.strokeText(p.name, x, y + 9); g.fillStyle = '#e8eefc'; g.fillText(p.name, x, y + 9); }
  }
  if (gwp) { const x = X(gwp.x), y = Z(gwp.z); g.fillStyle = '#ff2d95'; g.beginPath(); g.arc(x, y - 14, 10, 0, 6.2832); g.fill(); g.beginPath(); g.moveTo(x - 7, y - 8); g.lineTo(x + 7, y - 8); g.lineTo(x, y); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 14, 4, 0, 6.2832); g.fill(); }
  const me = inCar ? inCar.pos : P.pos, fx = inCar ? Math.sin(inCar.h) : -Math.sin(P.yaw), fz = inCar ? Math.cos(inCar.h) : -Math.cos(P.yaw);
  g.save(); g.translate(X(me.x), Z(me.z)); g.rotate(Math.atan2(fx, -fz)); g.fillStyle = '#00e5ff'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -13); g.lineTo(-9, 10); g.lineTo(0, 5); g.lineTo(9, 10); g.closePath(); g.fill(); g.stroke(); g.restore();
  if (gwp && route) bmInfo.textContent = '📍 ' + gwp.name + ' · ' + Math.round(route.len) + ' m — follow the pink line';
}
