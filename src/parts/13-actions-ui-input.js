// ---------- actions ----------
const ray = new THREE.Raycaster(); ray.far = 14;
const gun = new THREE.Raycaster(); gun.far = 70;
let cool = 0;
function aim() { cam.updateMatrixWorld(); ray.setFromCamera({ x: 0, y: 0 }, cam); return ray.intersectObjects(targets, false)[0]; }
function place() {
  const h = aim(); if (!h) return;
  const n = h.face.normal.clone().transformDirection(h.object.matrixWorld), p = h.point.clone().addScaledVector(n, 0.01);
  const cx = Math.floor(p.x / 2), cy = Math.floor(p.y / 2), cz = Math.floor(p.z / 2);
  if (cy < 0) return;
  if (hit(P, new THREE.Box3(new V3(cx * 2, cy * 2, cz * 2), new V3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2)))) return;
  addBlock(cx, cy, cz, sel); sfx('place');
}
function brk() { const h = aim(); if (!h) return; if (h.object.userData.k) { delBlock(h.object.userData.k); sfx('brk'); } else if (h.object.userData.fk) { delFurniture(h.object.userData.fk); sfx('brk'); } }
function tracer(to) {
  const g = new THREE.BufferGeometry().setFromPoints([cam.localToWorld(new V3(0.3, -0.25, -0.8)), to]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffee88 })); scene.add(l); setTimeout(() => { scene.remove(l); g.dispose(); }, 70);
}
function shoot() {
  if (cool > 0) return; scare(P.pos, 28);
  cam.updateMatrixWorld(); const dm = 1 + 0.25 * up.dmg, sg = weapon === 'shotgun';
  cool = sg ? 0.7 : 0.25; sfx('shoot'); vmShoot(); if (sg) sfx('punch');
  gun.far = sg ? 30 : 70;
  for (let i = 0; i < (sg ? 7 : 1); i++) {
    gun.setFromCamera({ x: sg ? (Math.random() - 0.5) * 0.14 : 0, y: sg ? (Math.random() - 0.5) * 0.14 : 0 }, cam);
    let h = gun.intersectObjects([...targets, ...enemyMeshes], false)[0], carHit = null;
    const ch = gun.intersectObjects(cars.map(c => c.body), true)[0]; if (ch && (!h || ch.distance < h.distance)) { h = ch; let o = ch.object; while (o && !o.userData.car) o = o.parent; carHit = o && o.userData.car; }
    if (carHit) damageCar(carHit, (sg ? 6 : 12) * dm, true);
    tracer(h ? h.point : gun.ray.at(gun.far, new V3()));
    if (h) spark(h.point, h.object.userData.enemy ? 0xff6a3d : 0xffe9a0);
    if (h && h.object.userData.enemy) damageEnemy(h.object.userData.enemy, (h.object.userData.head ? (sg ? 28 : 60) : (sg ? 14 : 25)) * dm);
  }
}
function punch() {
  if (cool > 0) return; cool = 0.4; sfx('punch'); vmPunch(); shoveNear();
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  for (const e of [...enemies, ...cops]) { if (e.dead) continue; const dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, d = Math.hypot(dx, dz); if (d < 2.8 && (dx * fx + dz * fz) / (d || 1) > 0.2) damageEnemy(e, 20); }
}
const act1 = () => { if (inCar) return; mode === 'fight' ? shoot() : place(); };
const act2 = () => { if (inCar) return; mode === 'fight' ? punch() : brk(); };
const toggleMode = () => { mode = mode === 'fight' ? 'build' : 'fight'; hud(); };

// ---------- chat / settings UI ----------
const typing = () => { const a = document.activeElement; return a && a.tagName === 'INPUT'; };
function openChat() { for (const k in keys) keys[k] = false; document.exitPointerLock && document.exitPointerLock(); $('chatbar').style.display = 'flex'; $('chatin').focus(); }
function closeChat() { $('chatbar').style.display = 'none'; $('chatin').blur(); }
function sendChat() { const v = $('chatin').value; $('chatin').value = ''; closeChat(); playerSay(v); }
$('chatin').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); else if (e.key === 'Escape') closeChat(); });
$('chatsend').addEventListener('click', sendChat);
$('gear').addEventListener('click', () => { $('relurl').value = REL.url; $('relkey').value = REL.key; $('panel').style.display = 'block'; document.exitPointerLock && document.exitPointerLock(); });
$('reltest').addEventListener('click', async () => {
  const url = $('relurl').value.trim() || REL.url, key = $('relkey').value.trim(), out = $('relres');
  if (!key) { out.textContent = 'Paste your key first.'; return; }
  out.textContent = 'Testing… (up to a minute if the server is asleep)'; const t0 = performance.now(), ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 90000);
  try {
    const r = await fetch(url.replace(/\/$/, '') + '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model: 'relay', messages: [{ role: 'user', content: 'Reply with only the word OK' }] }), signal: ctrl.signal });
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
    const secs = Math.round((performance.now() - t0) / 1000);
    out.textContent = r.ok && j && j.choices ? '✅ Works! Reply in ' + secs + 's: ' + String(j.choices[0].message.content).slice(0, 80) : '❌ HTTP ' + r.status + ': ' + (j && j.error ? (j.error.message || JSON.stringify(j.error)) : txt.slice(0, 160));
  } catch (e) { out.textContent = '❌ ' + (e.name === 'AbortError' ? 'Timed out after 90s (server asleep or provider not responding)' : e.message + ' (usually: wrong URL, server asleep, or CORS blocked)'); }
  clearTimeout(to);
});
$('relclose').addEventListener('click', () => { $('panel').style.display = 'none'; });
$('relsave').addEventListener('click', () => {
  REL = { url: $('relurl').value.trim() || REL.url, key: $('relkey').value.trim() };
  try { localStorage.setItem('mw_relay', JSON.stringify(REL)); } catch (e) {}
  aiFail = 0; lastAI = performance.now() - 20000; $('panel').style.display = 'none'; setStat(REL.key ? 'AI: ready' : 'AI: no key (⚙) · scripted mode', REL.key ? '#fff' : '#ffb347');
});

// ---------- input: desktop ----------
const cv = ren.domElement;
addEventListener('keydown', e => {
  if (typing()) return;
  if (shopOpen) { if (e.code === 'Escape' || e.code === 'KeyE') closeShop(); return; }
  keys[e.code] = true;
  if (e.code === 'Space') { if (!inCar) jump(); e.preventDefault(); }
  if (e.code === 'KeyQ') toggleMode();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyR') swapWeapon();
  if (e.code === 'KeyE') toggleCar();
  if (e.code === 'KeyT') { e.preventDefault(); openChat(); }
  if (e.code === 'KeyF' && !inCar) punch();
  if (e.code >= 'Digit1' && e.code <= 'Digit6') selBlock(+e.code.slice(5) - 1);
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('wheel', e => { if (!typing()) selBlock(sel + (e.deltaY > 0 ? 1 : -1)); });
addEventListener('contextmenu', e => e.preventDefault());
let held = false;
if (!isTouch) {
  cv.addEventListener('click', () => { if (document.pointerLockElement !== cv) cv.requestPointerLock(); });
  addEventListener('mousedown', e => { if (document.pointerLockElement !== cv) return; if (e.button === 0) { held = true; act1(); } else if (e.button === 2) act2(); });
  addEventListener('mouseup', e => { if (e.button === 0) held = false; });
  addEventListener('mousemove', e => { if (document.pointerLockElement !== cv || inCar) return; P.yaw -= e.movementX * 0.0025; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - e.movementY * 0.0025)); });
}

// ---------- input: touch ----------
const tch = {};
function btn(id, fn) { $(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false }); }
btn('jump', () => { if (!inCar) jump(); }); btn('place', act1); btn('brk', act2); btn('col', colAct); btn('mode', toggleMode); btn('car', toggleCar); btn('chatbtn', openChat);
const uiTarget = t => t.closest && t.closest('#chatbar,#panel,#shop,#mp,#mpbtn,#gear,#mute,.b');
addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (uiTarget(t.target)) continue; tch[t.identifier] = { x: t.clientX, y: t.clientY, mode: t.clientX < innerWidth / 2 ? 'joy' : 'look' }; } }, { passive: false });
addEventListener('touchmove', e => {
  if (!uiTarget(e.target)) e.preventDefault();
  for (const t of e.changedTouches) {
    const s = tch[t.identifier]; if (!s) continue;
    if (s.mode === 'joy') { joy.x = Math.max(-1, Math.min(1, (t.clientX - s.x) / 50)); joy.y = Math.max(-1, Math.min(1, (t.clientY - s.y) / 50)); }
    else if (!inCar) { P.yaw -= (t.clientX - s.x) * 0.006; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - (t.clientY - s.y) * 0.006)); s.x = t.clientX; s.y = t.clientY; }
  }
}, { passive: false });
const tend = e => { for (const t of e.changedTouches) { const s = tch[t.identifier]; if (s && s.mode === 'joy') { joy.x = joy.y = 0; } delete tch[t.identifier]; } };
addEventListener('touchend', tend); addEventListener('touchcancel', tend);

