// ---------- tall buildings: upper floors + elevators (roadmap 4) ----------
const elevators = [], ELV_SPEED = 6.5, ET = 0.12;
USEN.elevcall = 'call elevator';
const flab = k => k === 0 ? 'G' : String(k);
function elevRect(b, a0, a1, c0, c1, y0, y1) { const ew = b.ry === 0 || b.ry === Math.PI; return ew ? new THREE.Box3(new V3(a0, y0, c0), new V3(a1, y1, c1)) : new THREE.Box3(new V3(c0, y0, a0), new V3(c1, y1, a1)); }
function mkElevator(b, groups) {
  const S = b.shaft, n = b.floors, ew = b.ry === 0 || b.ry === Math.PI, nx = Math.round(Math.sin(b.ry)), nz = Math.round(Math.cos(b.ry)), tx = Math.round(Math.cos(b.ry)), tz = -Math.round(Math.sin(b.ry));
  const lo = ew ? S.x0 : S.z0, hi = ew ? S.x1 : S.z1, mid = (lo + hi) / 2, cA0 = ew ? S.z0 : S.x0, cA1 = ew ? S.z1 : S.x1;
  const fMax = ew ? nz > 0 : nx > 0, fc = fMax ? cA1 : cA0, fs = fMax ? -1 : 1;
  const sMax = ew ? tx < 0 : tz < 0, sc = ew ? (sMax ? S.x1 : S.x0) : (sMax ? S.z1 : S.z0), ss = sMax ? -1 : 1;
  const grp = new THREE.Group(); scene.add(grp); groups.push(grp);
  const e = { b, S, n, grp, top: 0, floor: 0, tgt: 0, state: 'idle', door: 0, wait: 0, q: [], keys: [], doors: [] };
  const H = CG - 0.3, H0 = n * CG - 0.3;
  const place = (m, a0, a1, c, y0, y1) => { const len = Math.max(0.02, a1 - a0); m.scale.set(ew ? len : ET, y1 - y0, ew ? ET : len); m.position.set(ew ? (a0 + a1) / 2 : c, (y0 + y1) / 2, ew ? c : (a0 + a1) / 2); };
  // side wall (solid + visual) along the whole shaft
  const sideBox = ew ? new THREE.Box3(new V3(ss > 0 ? sc : sc - ET, 0, S.z0), new V3(ss > 0 ? sc + ET : sc, H0, S.z1)) : new THREE.Box3(new V3(S.x0, 0, ss > 0 ? sc : sc - ET), new V3(S.x1, H0, ss > 0 ? sc + ET : sc));
  { const m = bx(grp, 1, 1, 1, 0, 0, 0, 0x8d949c); m.scale.set(sideBox.max.x - sideBox.min.x, H0, sideBox.max.z - sideBox.min.z); m.position.set((sideBox.min.x + sideBox.max.x) / 2, H0 / 2, (sideBox.min.z + sideBox.max.z) / 2); }
  e.keys.push('esw' + b.id); solids.set('esw' + b.id, sideBox);
  // doors per floor
  for (let k = 0; k < n; k++) {
    const y0 = k * CG, y1 = y0 + H, c = fc + fs * ET / 2;
    const A = bx(grp, 1, 1, 1, 0, 0, 0, 0xc9ced4), B = bx(grp, 1, 1, 1, 0, 0, 0, 0xc9ced4);
    const box = ew ? new THREE.Box3(new V3(lo, y0, c - ET / 2), new V3(hi, y1, c + ET / 2)) : new THREE.Box3(new V3(c - ET / 2, y0, lo), new V3(c + ET / 2, y1, hi));
    const d = { k, A, B, box, key: 'ed' + b.id + '_' + k, y0, y1, c, solid: true }; solids.set(d.key, box); e.keys.push(d.key); e.doors.push(d);
    place(A, lo, mid, c, y0, y1); place(B, mid, hi, c, y0, y1);
    // call button outside the door
    const g = new THREE.Group(), out = fMax ? 0.3 : -0.3; g.position.set(ew ? mid : fc + out, y0, ew ? fc + out : mid);
    bx(g, 0.28, 0.4, 0.12, 0, 1.25, 0, 0x2b2f36); bx(g, 0.14, 0.14, 0.14, 0, 1.27, 0, 0xffc400);
    scene.add(g); groups.push(g); const u = regUse(g, 'elevcall', b); u.k = k;
  }
  // moving platform
  const pbox = new THREE.Box3(new V3(S.x0 + 0.05, -0.2, S.z0 + 0.05), new V3(S.x1 - 0.05, 0, S.z1 - 0.05));
  const plat = bx(grp, S.x1 - S.x0 - 0.1, 0.2, S.z1 - S.z0 - 0.1, (S.x0 + S.x1) / 2, 0.02, (S.z0 + S.z1) / 2, 0x555b63);
  e.box = pbox; e.plat = plat; e.place = place; e.lo = lo; e.hi = hi; e.mid = mid; e.pkey = 'ep' + b.id; solids.set(e.pkey, pbox); e.keys.push(e.pkey);
  elevators.push(e); elevDoors(e); return e;
}
function elevDoors(e) {
  for (const d of e.doors) {
    const o = d.k === e.floor ? e.door : 0;
    e.place(d.A, e.lo, e.lo + (e.mid - e.lo) * (1 - o), d.c, d.y0, d.y1); e.place(d.B, e.hi - (e.hi - e.mid) * (1 - o), e.hi, d.c, d.y0, d.y1);
    const want = o < 0.6; if (want !== d.solid) { d.solid = want; if (want) solids.set(d.key, d.box); else solids.delete(d.key); }
  }
}
function elevDispose(e) { for (const k of e.keys) solids.delete(k); const i = elevators.indexOf(e); if (i >= 0) elevators.splice(i, 1); if (elevPanelFor === e) showElevPanel(null); }
function elevCall(b, k) { const e = b.int && b.int.elev; if (e) elevGo(e, k); }
function elevGo(e, k) {
  if (k < 0 || k >= e.n) return;
  if (e.floor === k && (e.state === 'idle' || e.state === 'open' || e.state === 'closing' || e.state === 'opening')) { if (e.state !== 'opening') { e.state = 'opening'; } e.wait = 4; return; }
  if (e.tgt === k && e.state === 'moving') return;
  if (!e.q.includes(k)) e.q.push(k); sfx('click'); msg('🛗 Elevator coming…', 1200);
  if (e.state === 'open') e.wait = Math.min(e.wait, 1.2);
}
function onElev(e, p, top) { const S = e.S; return p.pos.x > S.x0 + 0.1 && p.pos.x < S.x1 - 0.1 && p.pos.z > S.z0 + 0.1 && p.pos.z < S.z1 - 0.1 && p.pos.y >= top - 0.25 && p.pos.y <= top + 0.8; }
let elevPanel = null, elevPanelFor = null;
function showElevPanel(e) {
  if (e === elevPanelFor) { if (e) refreshElevPanel(e); return; }
  elevPanelFor = e;
  if (!elevPanel && typeof document !== 'undefined' && document.createElement) { try { elevPanel = document.createElement('div'); elevPanel.style.cssText = 'position:fixed;right:10px;top:34%;z-index:30;background:rgba(15,18,24,.88);border-radius:12px;padding:8px;display:none;grid-template-columns:repeat(2,52px);gap:6px;font:700 17px sans-serif;color:#fff;touch-action:manipulation'; document.body.appendChild(elevPanel); } catch (er) { elevPanel = null; } }
  if (!elevPanel) return;
  elevPanel.innerHTML = '';
  if (!e) { elevPanel.style.display = 'none'; return; }
  elevPanel.style.display = 'grid';
  for (let k = e.n - 1; k >= 0; k--) { const bt = document.createElement('button'); bt.textContent = flab(k); bt.dataset.k = k; bt.style.cssText = 'height:46px;border:0;border-radius:9px;font:inherit;background:#2c3440;color:#fff'; const go = ev => { ev.preventDefault(); ev.stopPropagation(); if (elevPanelFor) elevGo(elevPanelFor, k); }; bt.addEventListener('pointerdown', go); elevPanel.appendChild(bt); }
  refreshElevPanel(e);
}
function refreshElevPanel(e) { if (!elevPanel) return; for (const bt of elevPanel.children) { const k = +bt.dataset.k; bt.style.background = (k === e.floor && e.state !== 'moving') ? '#2e8b57' : (k === e.tgt && e.state === 'moving') || e.q.includes(k) ? '#c78a00' : '#2c3440'; } }
function elevTick(dt) {
  let panel = null;
  for (const e of elevators) {
    const old = e.top;
    if (e.state === 'moving') {
      const ty = e.tgt * CG, dir = Math.sign(ty - e.top); e.top += dir * ELV_SPEED * dt;
      if (dir === 0 || (dir > 0 && e.top >= ty) || (dir < 0 && e.top <= ty)) { e.top = ty; e.floor = e.tgt; e.state = 'opening'; sfx('click'); }
    } else if (e.state === 'opening') { e.door = Math.min(1, e.door + dt * 1.4); if (e.door >= 1) { e.state = 'open'; e.wait = Math.max(e.wait, 4); } }
    else if (e.state === 'open') { e.wait -= dt; if (e.q.length) e.wait = Math.min(e.wait, 1.2); if (e.wait <= 0) e.state = 'closing'; }
    else if (e.state === 'closing') { e.door -= dt * 1.4; if (e.door <= 0) { e.door = 0; e.state = 'idle'; } }
    if (e.state === 'idle' && e.q.length) { e.tgt = e.q.shift(); if (e.tgt === e.floor) e.state = 'opening'; else e.state = 'moving'; }
    const dy = e.top - old;
    if (dy !== 0 && !inCar && onElev(e, P, old)) { P.pos.y = e.top; P.vel.y = 0; P.ground = true; }
    if (dy !== 0 || e.state === 'opening' || e.state === 'closing') { e.box.min.y = e.top - 0.2; e.box.max.y = e.top; e.plat.position.y = e.top + 0.02; elevDoors(e); }
    if (!inCar && onElev(e, P, e.top)) panel = e;
    // lazy upper floors: only furnish a tower once you are inside it
    const b = e.b; if (b.int && !b.int.up && Math.abs(P.pos.x - b.x) < b.w / 2 && Math.abs(P.pos.z - b.z) < b.d / 2) spawnUpper(b);
  }
  showElevPanel(panel);
}
function spawnUpper(b) {
  const it = b.int; if (!it) return; it.up = true;
  const PI = Math.PI, S = b.shaft, UP = ['shelf', 'plant', 'lamp', 'shelf', 'plant'], slots = it.slots || [];
  const inSh = (x, z) => x > S.x0 - 1 && x < S.x1 + 1 && z > S.z0 - 1 && z < S.z1 + 1;
  const put = (type, x, z, rot, y) => { if (inSh(x, z)) return; const g = new THREE.Group(); mkFurn(type, g); g.position.set(x, y, z); g.rotation.y = rot; scene.add(g); it.groups.push(g); if (USEF.has(type)) regUse(g, type, b); };
  for (let k = 1; k < b.floors; k++) {
    const used = new Set();
    for (let i = 0; i < UP.length && slots.length; i++) { const idx = (k * 3 + i * 2) % slots.length; if (used.has(idx)) continue; used.add(idx); const sl = slots[idx]; put(UP[i], sl.x, sl.z, sl.rot, k * CG); }
    if (Math.min(b.w, b.d) >= 10) { const y = k * CG; put('table', b.x - 0.5, b.z + 0.5, 0, y); put('chair', b.x - 1.8, b.z + 0.5, PI / 2, y); put('chair', b.x + 0.8, b.z + 0.5, -PI / 2, y); }
  }
}
