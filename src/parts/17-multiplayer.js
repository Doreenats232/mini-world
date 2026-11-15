// ---------- online multiplayer (peer-to-peer, host-authoritative world) ----------
let netT = 0;
const PEER_CFG = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }, { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }, { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }] } };
const nsend = (m, except) => { for (const c of net.conns) if (c.open && c !== except) c.send(m); };
const toHost = m => { if (net.hostConn && net.hostConn.open) net.hostConn.send(m); };
function netSend(m) { if (net.host) nsend(m); else toHost(m); }
const r2 = v => Math.round(v * 100) / 100;
function mpUpdate() {
  const st = $('mpstat');
  if (!net.on) { st.textContent = net.status || 'Not in a room'; return; }
  const names = net.host ? [net.name + ' (host)', ...net.conns.map(c => c.nm)] : net.names;
  st.innerHTML = '<div style="font-size:12px;opacity:.8">' + (net.host ? 'Hosting room code' : 'Connected to room') + '</div><div style="font-size:30px;font-weight:700;letter-spacing:4px;color:#ffd400"></div><div style="font-size:12px"></div>';
  st.children[1].textContent = net.code; st.children[2].textContent = 'Players: ' + names.join(', ');
}
function netApply(m) {
  net.applying = true;
  try {
    if (m.t === 'b+' && Array.isArray(m.a)) { const a = m.a; if (a.slice(0, 4).every(Number.isFinite) && a[3] >= 0 && a[3] < BLOCKS.length) addBlock(a[0], a[1], a[2], a[3], true, false); }
    else if (m.t === 'b-') delBlock(String(m.k));
    else if (m.t === 'f+' && Array.isArray(m.a)) { const a = m.a; if ([a[0], a[1], a[2]].every(Number.isFinite)) addFurniture(a[0], a[1], a[2], String(a[3]), (a[4] | 0) & 3, false, true); }
    else if (m.t === 'f-') delFurniture(String(m.k));
  } finally { net.applying = false; }
}
function hashColor(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360; return new THREE.Color().setHSL(h / 360, 0.65, 0.5); }
function mkAvatar(id, name) {
  const H = mkHuman({ skin: [0xf1c8a5, 0xc68e5e, 0x8d5a3b, 0xe0b48f][name.length % 4], shirt: hashColor(name).getHex(), pants: 0x2d3436, hair: 0x2a1a0e, role: 'player' }), g = H.g; scene.add(g);
  const el = document.createElement('div'); el.className = 'nl'; const bub = document.createElement('div'); bub.className = 'bub'; const nm = document.createElement('div'); nm.innerHTML = '<b style="color:#7fe7ff"></b>'; nm.firstChild.textContent = name; el.append(bub, nm); $('labels').appendChild(el);
  net.remotes.set(id, { id, name, g, aL: H.aL, aR: H.aR, lL: H.lL, lR: H.lR, el, bub, pos: new V3(0, -50, 0), tp: new V3(0, -50, 0), yaw: 0, first: true, bubT: 0 });
}
function removeAvatar(id) { const r = net.remotes.get(id); if (!r) return; scene.remove(r.g); r.el.remove(); net.remotes.delete(id); }
function updateRemotes(dt) {
  for (const r of net.remotes.values()) {
    const b = r.pos.clone(); r.pos.lerp(r.tp, Math.min(1, dt * 12)); const sp = r.pos.distanceTo(b) / Math.max(dt, 0.001);
    r.g.position.copy(r.pos); let dr = r.yaw + Math.PI - r.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); r.g.rotation.y += dr * Math.min(1, dt * 10);
    const w = sp > 0.6 ? Math.sin(clock * 9) * 0.8 : 0; r.aL.rotation.x = w; r.aR.rotation.x = -w; r.lL.rotation.x = -w; r.lR.rotation.x = w;
    r.bubT -= dt; r.bub.style.display = r.bubT > 0 ? 'block' : 'none';
    const v = new V3(r.pos.x, r.pos.y + 2.5, r.pos.z).project(cam);
    if (v.z > 1 || v.z < -1 || dist2(r.pos, cam.position) > 120) r.el.style.display = 'none'; else { r.el.style.display = 'block'; r.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  }
}
function remoteChat(name, text) { text = String(text || '').slice(0, 200); logLine(name + ': ' + text, 'me'); for (const r of net.remotes.values()) if (r.name === name) { r.bub.textContent = text; r.bubT = 6; } }
function netTick() {
  const yaw = inCar ? inCar.h + Math.PI : P.yaw;
  if (net.host) {
    const pl = [{ id: 'host', name: net.name, x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), yaw: r2(yaw) }];
    for (const c of net.conns) if (c.st) pl.push({ id: c.peer, name: c.nm, ...c.st });
    net.names = pl.map(p => p.name);
    const live = new Set();
    for (const c of net.conns) if (c.st && c.peer) {
      live.add(c.peer); if (!net.remotes.has(c.peer)) mkAvatar(c.peer, c.nm || 'Player');
      const r = net.remotes.get(c.peer); r.tp.set(c.st.x, c.st.y, c.st.z); r.yaw = c.st.yaw; if (r.first) { r.pos.copy(r.tp); r.first = false; }
    }
    for (const id of [...net.remotes.keys()]) if (!live.has(id)) removeAvatar(id);
    nsend({ t: 'ps', pl, day: dayT, npcs: npcs.map(n => ({ id: n.id, x: r2(n.pos.x), y: r2(n.pos.y), z: r2(n.pos.z), f: r2(n.face), w: n.walking ? 1 : 0, k: n.working ? 1 : 0, s: n.swing > 0 ? 1 : 0, st: n.status, hp: Math.round(n.hp) })) });
  } else toHost({ t: 'p', x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), yaw: r2(yaw) });
}
function hostData(c, m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hello') {
    c.nm = String(m.name || 'Player').slice(0, 16); if (!net.conns.includes(c)) net.conns.push(c);
    c.send({ t: 'welcome', code: net.code, host: net.name, ver: VER, snap: { b: [...blockMeshes.values()].map(b => [b.userData.cx, b.userData.cy, b.userData.cz, b.userData.c]), f: [...furn.values()].map(o => [o.cx, o.cy, o.cz, o.f, o.rot]), pos: [P.pos.x, P.pos.z], day: dayT } });
    logLine('🌐 ' + c.nm + ' joined the room', 'ev'); nsend({ t: 'chat', name: '🌐', text: c.nm + ' joined' }, c); mpUpdate();
    if (m.ver && m.ver !== VER) logLine('⚠ ' + c.nm + ' runs a different version (v' + m.ver + ')', 'ev');
  } else if (m.t === 'p') c.st = { x: +m.x || 0, y: +m.y || 0, z: +m.z || 0, yaw: +m.yaw || 0 };
  else if (m.t === 'b+' || m.t === 'b-' || m.t === 'f+' || m.t === 'f-') { netApply(m); nsend(m, c); }
  else if (m.t === 'chat') { remoteChat(c.nm, m.text); nsend({ t: 'chat', name: c.nm, text: String(m.text || '').slice(0, 200) }, c); }
  else if (m.t === 'npcchat') playerSay(String(m.text || '').slice(0, 300), c.nm);
}
function clientData(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'welcome') {
    net.noSave = true; net.applying = true;
    try { for (const k of [...blockMeshes.keys()]) delBlock(k); for (const k of [...furn.keys()]) delFurniture(k); m.snap.b.forEach(a => addBlock(a[0], a[1], a[2], a[3], false, false)); m.snap.f.forEach(a => addFurniture(a[0], a[1], a[2], a[3], a[4], false, false)); } finally { net.applying = false; }
    P.pos.set(m.snap.pos[0] + 2, 1, m.snap.pos[1] + 2); P.vel.set(0, 0, 0); dayT = m.snap.day;
    net.on = true; net.client = true; net.code = m.code; net.names = [m.host + ' (host)', net.name]; mpUpdate(); $('mp').style.display = 'none';
    msg('Joined ' + m.host + "'s room", 2500); logLine('🌐 Joined ' + m.host + "'s world. Type !text to chat with players, plain text talks to the NPCs.", 'ev');
    if (m.ver && m.ver !== VER) logLine('⚠ Host runs v' + m.ver + ', you run v' + VER + '. Reload to match.', 'ev');
  } else if (m.t === 'ps') {
    const seen = new Set();
    for (const p of m.pl) {
      if (p.id === net.myId) continue; seen.add(p.id);
      if (!net.remotes.has(p.id)) mkAvatar(p.id, String(p.name || 'Player'));
      const r = net.remotes.get(p.id); r.tp.set(p.x, p.y, p.z); r.yaw = p.yaw; if (r.first) { r.pos.copy(r.tp); r.first = false; }
    }
    for (const id of [...net.remotes.keys()]) if (!seen.has(id)) removeAvatar(id);
    net.names = m.pl.map(p => p.name); dayT = m.day;
    for (const d of m.npcs || []) { const n = npcs.find(x => x.id === d.id); if (!n) continue; if (!n.tp) { n.tp = new V3(); n.pos.set(d.x, d.y, d.z); } n.tp.set(d.x, d.y, d.z); n.face = d.f; n.walking = !!d.w; n.working = !!d.k; if (d.s) n.swing = 0.25; n.status = d.st; n.hp = d.hp; }
  } else if (m.t === 'b+' || m.t === 'b-' || m.t === 'f+' || m.t === 'f-') netApply(m);
  else if (m.t === 'chat') remoteChat(m.name, m.text);
  else if (m.t === 'log') logLine(String(m.txt), m.cls);
  else if (m.t === 'say') { const n = npcs.find(x => x.id === m.id); if (n) { n.bub.textContent = String(m.text); n.bubT = 7; } }
}
function mpErr(t) { net.status = t; mpUpdate(); }
function hostRoom(tries = 0) {
  if (net.on || net.peer) return;
  const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  mpErr('Creating room…');
  const peer = new Peer('mwld-' + code, PEER_CFG); net.peer = peer;
  peer.on('open', () => { net.on = true; net.host = true; net.code = code; mpUpdate(); logLine('🌐 Room open. Share the code ' + code, 'ev'); });
  peer.on('connection', c => { c.on('data', m => hostData(c, m)); c.on('close', () => { const i = net.conns.indexOf(c); if (i >= 0) net.conns.splice(i, 1); removeAvatar(c.peer); nsend({ t: 'chat', name: '🌐', text: (c.nm || 'A player') + ' left' }); logLine('🌐 ' + (c.nm || 'A player') + ' left', 'ev'); mpUpdate(); }); });
  peer.on('error', e => { if (e.type === 'unavailable-id' && tries < 4) { net.peer = null; peer.destroy(); hostRoom(tries + 1); } else mpErr('Could not create room (' + e.type + '). Check your connection.'); });
}
function joinRoom(code) {
  if (net.on || net.peer || !code) return;
  code = code.toUpperCase().replace(/[^A-Z0-9]/g, ''); mpErr('Connecting to ' + code + '…');
  const peer = new Peer(undefined, PEER_CFG); net.peer = peer;
  peer.on('open', id => {
    net.myId = id; const c = peer.connect('mwld-' + code, { reliable: true }); net.hostConn = c;
    c.on('open', () => c.send({ t: 'hello', name: net.name, ver: VER })); c.on('data', clientData);
    c.on('close', () => { net.on = false; net.client = false; msg('Disconnected from room', 3000); logLine('🌐 Lost connection to the host. Tap Leave (🌐) to return to your own world.', 'ev'); mpErr('Disconnected'); });
  });
  peer.on('error', e => { net.peer = null; mpErr(e.type === 'peer-unavailable' ? 'Room not found. Check the code (the host must keep the game open).' : 'Connection problem (' + e.type + ')'); });
  setTimeout(() => { if (!net.on && net.peer === peer) { mpErr('Still connecting… the host may be offline or behind a strict network.'); } }, 15000);
}
const setName = () => { net.name = ($('mpname').value.trim() || net.name).slice(0, 16); try { localStorage.setItem('mw_name', net.name); } catch (e) {} };
$('mpbtn').addEventListener('click', () => { $('mpname').value = net.name; mpUpdate(); $('mp').style.display = 'block'; document.exitPointerLock && document.exitPointerLock(); });
$('mpclose').addEventListener('click', () => { $('mp').style.display = 'none'; });
$('mphost').addEventListener('click', () => { setName(); hostRoom(); });
$('mpjoin').addEventListener('click', () => { setName(); joinRoom($('mpcode').value); });
$('mpleave').addEventListener('click', () => location.reload());

