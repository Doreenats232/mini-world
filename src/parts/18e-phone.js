// ---- phones: get an NPC's number by talking to them, call or message them, and they really travel to your place ----
const contacts = []; let phoneOpen = false, phoneSel = null;
const phoneEl = document.createElement('div'); phoneEl.id = 'phone';
phoneEl.style.cssText = 'position:fixed;inset:0;margin:auto;width:min(420px,92vw);height:fit-content;max-height:86vh;overflow:auto;background:#101a28ee;color:#fff;padding:14px;border-radius:14px;display:none;z-index:31;font-size:13px';
const phoneCss = document.createElement('style'); phoneCss.textContent = '#phone button{padding:8px 12px;border-radius:8px;border:0;background:#2e86de;color:#fff;font-size:13px;margin:3px 4px 3px 0}#phone .ct{display:block;width:100%;text-align:left;background:#1d2b40}#phone .lg{background:#0b121c;border-radius:8px;padding:8px;margin:8px 0;max-height:170px;overflow:auto;line-height:1.5}';
document.head.appendChild(phoneCss); document.body.appendChild(phoneEl);
const phoneBtn = document.createElement('div'); phoneBtn.className = 'b'; phoneBtn.id = 'phonebtn'; phoneBtn.textContent = '📱'; phoneBtn.style.cssText = 'right:234px;bottom:150px;font-size:24px'; document.body.appendChild(phoneBtn);
phoneBtn.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); togglePhone(); }, { passive: false });
const resNumber = r => '07' + String(10000000 + (r.id * 7919 * 131 + 4242) % 89999999);
const contactOf = r => contacts.find(c => c.r === r);
function openPhone() { if (shopOpen) return; phoneOpen = true; shopOpen = true; for (const k in keys) keys[k] = false; document.exitPointerLock && document.exitPointerLock(); renderPhone(); phoneEl.style.display = 'block'; }
function closePhone() { phoneOpen = false; shopOpen = false; phoneEl.style.display = 'none'; }
function togglePhone() { phoneOpen ? closePhone() : openPhone(); }
addEventListener('keydown', e => { if (e.code === 'KeyP' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { e.preventDefault(); togglePhone(); } });
function phoneNotify(r, text) { const c = contactOf(r); if (!c) return; c.log.push(r.name + ': ' + text); logLine('📱 ' + r.name + ': ' + text, 'me'); if (phoneOpen) renderPhone(); }
function maybeGiveNumber(r, c) {
  if (contactOf(r)) return false;
  if (Math.random() < 0.65) { contacts.push({ r, log: [] }); const t = 'Sure! My number is ' + resNumber(r) + '.'; if (c) citizenSay(c, t); logLine('📱 Saved ' + r.name + ' ' + resNumber(r) + ' (press P / tap the phone)', 'me'); }
  else if (c) citizenSay(c, "Sorry, I don't give my number to strangers.");
  return true;
}
function resStatus(r) {
  if (r.vis) return { go: 'on my way to you', toDoor: 'outside your place', wait: 'outside your place', back: 'heading back home' }[r.vis.st];
  return { home: 'at home', work: 'at work at ' + r.workName, toWork: 'on the road to work', toHome: 'on my way home' }[r.st] || 'around';
}
function nearestBld(p, except) { let best = null, bd = 1e9; for (const b of buildings) { if (b === except) continue; const d = Math.hypot(b.x - p.x, b.z - p.z); if (d < bd) { bd = d; best = b; } } return best; }
function phoneMsg(r, kind) {
  const c = contactOf(r); if (!c) return; const say = (t, ms = 900) => setTimeout(() => phoneNotify(r, t), ms);
  const out = { how: 'How are you?', where: 'Where are you?', come: 'Come to my place', call: '📞 Calling...' }[kind]; c.log.push('You: ' + out); renderPhone();
  if (kind === 'call') return say('Hello? It\'s ' + r.name + '. I\'m ' + resStatus(r) + '.', 1500);
  if (kind === 'how') { const f = { teacher: 'Busy with my students!', student: 'Exams are stressing me out.', suit: 'Meetings all day...', worker: 'Hard work, but fine.' }[r.role]; return say(pick(['Doing great, thanks! You?', 'Can\'t complain!', 'Tired but fine.', f || 'All good!'])); }
  if (kind === 'where') return say('I\'m ' + resStatus(r) + '.');
  if (r.vis) return say('I\'m already coming!');
  if (dayLight < 0.25) return say('It\'s too late and dark. Maybe tomorrow?');
  if (r.st === 'toWork' || r.st === 'toHome' || r.out > 0) return say('I\'m on the road right now. Call me when I get there.');
  const from = r.st === 'work' ? r.wb : r.hb, dst = nearestBld(P.pos, from); if (!dst) return say('Sorry, I can\'t find you.');
  const rt = buildRoute(from, dst); if (rt.T > 240) return say('That\'s too far, it would take me forever.');
  unmatRes(r); r.vis = { st: 'go', el: 0, rt, dst, retries: 0, wait: 0 };
  say('On my way! I\'ll be there in about ' + Math.max(10, Math.round(rt.T / 10) * 10) + ' seconds by ' + (rt.mode === 'car' ? 'car' : 'foot') + '.');
}
function renderPhone() {
  const e = phoneEl; e.innerHTML = '<b>📱 PHONE</b> <button id="phx" style="float:right;background:#555">Close</button>';
  if (!contacts.length) e.innerHTML += '<p>No contacts yet. Talk to people (press E) and they may give you their number.</p>';
  for (const c of contacts) { const b = document.createElement('button'); b.className = 'ct'; b.textContent = c.r.name + ' · ' + c.r.label + ' · ' + resNumber(c.r); b.onclick = () => { phoneSel = c; renderPhone(); }; e.appendChild(b); }
  if (phoneSel && contacts.includes(phoneSel)) {
    const c = phoneSel, lg = document.createElement('div'); lg.className = 'lg'; lg.innerHTML = '<i>' + c.r.name + ' is ' + resStatus(c.r) + '</i><br>' + c.log.slice(-12).map(t => t.replace(/</g, '&lt;')).join('<br>'); e.appendChild(lg);
    for (const [k, t] of [['call', '📞 Call'], ['how', '💬 How are you?'], ['where', '💬 Where are you?'], ['come', '💬 Come to my place']]) { const b = document.createElement('button'); b.textContent = t; b.onclick = () => phoneMsg(c.r, k); e.appendChild(b); }
    famPhone(c.r, e);
  }
  famSection(e);
  $('phx').onclick = closePhone;
}
// ---- an NPC travelling to you: walks or drives the real roads, waits, then goes home ----
function visPlace(r, w, dt, stand) {
  const dd = Math.hypot(w.x - P.pos.x, w.z - P.pos.z);
  if (dd > 130 || (dd > 100 && !r.c && !r.car)) { if (r.c || r.car) unmatRes(r); return; }
  if (w.m === 'car') {
    if (r.c) { removeCitizen(r.c); r.c = null; }
    if (!r.car) { const c = mkCar(w.x, w.z, w.h, r.col, false, null, true); c.ai = null; c.cm = r; r.car = c; }
    const c = r.car, dh = Math.atan2(Math.sin(w.h - c.h), Math.cos(w.h - c.h)); c.pos.set(w.x, 0, w.z); c.h += dh * Math.min(1, dt * 5); c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.h; c.speed = CAR_SP; animCar(c, dt, dh * 1.5, 0);
  } else {
    if (r.car) { if (r.car !== inCar) removeCar(r.car); r.car = null; }
    if (!r.c) r.c = mkCitizen('commuter', w.x, w.z, w.h, { role: r.role, name: r.name, label: r.label, res: r });
    const c = r.c; if (c.faceT > 0) return; c.pos.set(w.x, 0, w.z); c.yaw = w.h; c.stand = !!stand;
  }
}
function updateVisit(r, dt) {
  const v = r.vis;
  if (r.car && (r.car === inCar || r.car.dead || r.car.stolen)) { r.car = null; r.vis = null; r.out = 40; return; }
  if (r.c && r.c.dead) { r.c = null; r.vis = null; r.out = 60; return; }
  if (r.c && (r.c.fleeT > 0 || r.c.downT > 0)) { r.vis = null; return; }
  const last = v.rt.pts[v.rt.pts.length - 1];
  if (v.st === 'go' || v.st === 'back') {
    v.el += dt; const w = routeAt(v.rt, Math.min(v.el, v.rt.T), false); visPlace(r, w, dt, false);
    if (v.el < v.rt.T) return;
    if (v.st === 'back') { unmatRes(r); r.vis = null; return; }
    if (Math.hypot(last.x - P.pos.x, last.z - P.pos.z) > 70 && v.retries < 2) { const nb = nearestBld(P.pos, v.dst); if (nb) { v.retries++; v.rt = buildRoute(v.dst, nb); v.dst = nb; v.el = 0; phoneNotify(r, 'Where did you go? I\'m coming to you.'); return; } }
    v.st = 'wait'; v.wait = 100; v.pos = new V3(last.x, 0, last.z); v.h = w.h; phoneNotify(r, 'I\'m here! Outside your place.');
  } else if (v.st === 'wait') {
    const d = Math.hypot(P.pos.x - v.pos.x, P.pos.z - v.pos.z); v.wait -= dt * (d > 150 ? 3 : 1); let moving = false;
    if (d < 45 && d > 2.5) { v.h = Math.atan2(P.pos.x - v.pos.x, P.pos.z - v.pos.z); v.pos.x += Math.sin(v.h) * 2.2 * dt; v.pos.z += Math.cos(v.h) * 2.2 * dt; moving = true; }
    visPlace(r, { x: v.pos.x, z: v.pos.z, h: v.h, m: 'walk' }, dt, !moving);
    if (v.wait <= 0) { v.st = 'toDoor'; phoneNotify(r, 'I have to go now. See you!'); }
  } else {
    const dx = last.x - v.pos.x, dz = last.z - v.pos.z, d = Math.hypot(dx, dz);
    if (d > 1) { v.h = Math.atan2(dx, dz); v.pos.x += dx / d * 2.4 * dt; v.pos.z += dz / d * 2.4 * dt; visPlace(r, { x: v.pos.x, z: v.pos.z, h: v.h, m: 'walk' }, dt, false); }
    else { v.st = 'back'; v.el = 0; v.rt = buildRoute(v.dst, r.hb); }
  }
}
