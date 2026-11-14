// ---- plan expansion (architecture DSL) ----
function expandPlan(plan) {
  const m = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
  for (const o of (Array.isArray(plan) ? plan.slice(0, 20) : [])) {
    if (!o || typeof o !== 'object') continue;
    const C = (k, mx) => Math.max(0, Math.min(mx, Math.round(+o[k] || 0))), S = (k, mx) => Math.max(1, Math.min(mx, Math.round(+o[k] || 1)));
    const x0 = C('x', 24), y0 = C('y', 16), z0 = C('z', 24), w = S('w', 24), h = S('h', 16), d = S('d', 24), b = o.block in BIDX ? BIDX[o.block] : 0;
    switch (o.op) {
      case 'block': m.set(key(x0, y0, z0), b); break;
      case 'furniture': if (o.type in FURN) m.set(key(x0, y0, z0), { f: o.type, rot: C('rot', 3) }); break;
      case 'fill': case 'box':
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) { if (o.op === 'box' && o.hollow && !(x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1)) continue; m.set(key(x, y, z), b); }
        break;
      case 'floor': for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) m.set(key(x, y0, z), b); break;
      case 'roof':
        if (o.style === 'flat') { for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) m.set(key(x, y0, z), b); break; }
        for (let i = 0; z0 + i <= z0 + d - 1 - i; i++) for (let x = x0; x < x0 + w; x++) { m.set(key(x, y0 + i, z0 + i), b); m.set(key(x, y0 + i, z0 + d - 1 - i), b); if (x === x0 || x === x0 + w - 1) for (let z = z0 + i; z <= z0 + d - 1 - i; z++) m.set(key(x, y0 + i, z), b); }
        break;
      case 'hole': for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) m.delete(key(x, y, z)); break;
    }
    if (m.size > 900) break;
  }
  const cells = [...m].map(([k, t]) => { const [x, y, z] = k.split(',').map(Number); return typeof t === 'object' ? { x, y, z, f: t.f, rot: t.rot } : { x, y, z, t }; }).slice(0, 700);
  return cells;
}
function rotCells(cells, r) {
  let W = 0, D = 0; for (const c of cells) { W = Math.max(W, c.x + 1); D = Math.max(D, c.z + 1); }
  const out = cells.map(c => {
    const q = { ...c };
    if (r === 1) { q.x = D - 1 - c.z; q.z = c.x; } else if (r === 2) { q.x = W - 1 - c.x; q.z = D - 1 - c.z; } else if (r === 3) { q.x = c.z; q.z = W - 1 - c.x; }
    if (q.f) q.rot = (c.rot + r) % 4; return q;
  });
  return { cells: out, W: r % 2 ? D : W, D: r % 2 ? W : D };
}
const FACE = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function siteFree(x0, z0, S) {
  const box = new THREE.Box3(new V3(x0 * 2 - 2, 0.1, z0 * 2 - 2), new V3((x0 + S) * 2 + 2, 60, (z0 + S) * 2 + 2));
  for (const b of solids.values()) if (box.intersectsBox(b)) return false;
  for (const b of cityFoot) if (box.intersectsBox(b)) return false;
  for (const r of reserved) if (box.intersectsBox(r)) return false;
  for (let x = box.min.x; x <= box.max.x; x += 4) for (let z = box.min.z; z <= box.max.z; z += 4) if (onRoad(x, z, 8)) return false;
  for (const n of nodes) if (n.pos.x > box.min.x - 2 && n.pos.x < box.max.x + 2 && n.pos.z > box.min.z - 2 && n.pos.z < box.max.z + 2) return false;
  if (P.pos.x > box.min.x && P.pos.x < box.max.x && P.pos.z > box.min.z && P.pos.z < box.max.z) return false;
  return true;
}
function findSite(S, rx, rz) {
  for (let r = 6; r < 260; r += 4) {
    const steps = Math.max(8, Math.floor(r * 0.8)), off = Math.random() * 6.28;
    for (let a = 0; a < steps; a++) { const ang = off + a / steps * 6.283, x = rx + Math.cos(ang) * r, z = rz + Math.sin(ang) * r, x0 = Math.floor(x / 2 - S / 2), z0 = Math.floor(z / 2 - S / 2); if (siteFree(x0, z0, S)) return { x0, z0 }; }
  }
  return null;
}
const HUT = [{ op: 'box', x: 0, y: 0, z: 0, w: 5, h: 2, d: 5, block: 'planks', hollow: true }, { op: 'furniture', type: 'door', x: 2, y: 0, z: 0, rot: 0 }, { op: 'fill', x: 1, y: 1, z: 0, w: 1, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: 3, y: 1, z: 0, w: 1, h: 1, d: 1, block: 'glass' }, { op: 'roof', x: 0, y: 2, z: 0, w: 5, d: 5, block: 'roof', style: 'gable' }, { op: 'furniture', type: 'bed', x: 3, y: 0, z: 3, rot: 0 }, { op: 'furniture', type: 'lamp', x: 1, y: 0, z: 3, rot: 0 }, { op: 'furniture', type: 'table', x: 1, y: 0, z: 1, rot: 0 }];

function cellFree(cx, cy, cz) {
  const b = new THREE.Box3(new V3(cx * 2, cy * 2, cz * 2), new V3(cx * 2 + 2, cy * 2 + 2, cz * 2 + 2));
  if (hit(P, b)) return false;
  for (const n of npcs) if (hit(n, b)) return false;
  for (const e of enemies) if (!e.dead && hit(e, b)) return false;
  return true;
}
const has = c => { const k = c.cx + ',' + c.cy + ',' + c.cz; return blockMeshes.has(k) || furn.has(k); };
const costOf = c => c.f ? FURN[c.f] : { res: BLOCKS[c.t][1], n: 1 };
const isGuard = n => n.role === 'guard' || (n.task && (n.task.type === 'guard' || n.task.type === 'protect'));
function dropTask(n) { if (n.task && n.task.cur && n.task.st) { n.task.st.retry.push(n.task.cur); n.task.cur = null; } }
function remainingNeed(t) { const need = { wood: 0, stone: 0, sand: 0 }, st = t.st, add = c => { const k = costOf(c); need[k.res] += k.n; }; if (t.cur) add(t.cur); for (let i = st.next; i < st.cells.length; i++) add(st.cells[i]); st.retry.forEach(add); return need; }

function setTask(n, t) {
  if (!t || typeof t !== 'object') return;
  const type = String(t.type || '').toLowerCase();
  dropTask(n); n.sub = null; n.gnode = null; n.work = 0;
  if (type === 'idle' || type === 'stop') { n.task = null; n.status = 'standing by'; return; }
  if (type === 'wander') { n.task = { type: 'wander', wt: 0, tx: n.pos.x, tz: n.pos.z }; return; }
  if (type === 'follow' || type === 'guard') { n.task = { type }; return; }
  if (type === 'protect') { n.task = { type: 'protect', who: String(t.who || '').toLowerCase() }; return; }
  if (type === 'town') { startTown(String(t.name || 'Oakvale').slice(0, 24), Array.isArray(t.buildings) ? t.buildings.map(x => String(x).toLowerCase()) : null, String(t.size || 'small')); return; }
  if (type === 'assist') {
    const who = npcs.find(o => o !== n && o.id === String(t.with || '').toLowerCase() && o.task && o.task.st && o.task.st.status === 'building');
    const st = who ? who.task.st : structures.find(x => x.status === 'building');
    if (!st) { ev(n.name + ' has nothing to help with'); return; }
    n.task = { type: 'assist', st, cur: null, stuckSkip: 0 }; ev(`${n.name} joined the build of ${st.name}`); return;
  }
  if (type === 'gather') {
    const res = String(t.resource || t.res || 'wood').toLowerCase(); if (!(res in n.inv)) { ev(n.name + ': unknown resource ' + res); return; }
    n.task = { type: 'gather', res, amount: Math.max(1, Math.min(60, Math.round(+t.amount || 20))) }; return;
  }
  if (type === 'build') {
    const cells0 = expandPlan(t.plan);
    if (cells0.length < 4) { ev(n.name + "'s plan was empty or too small, ignoring"); n.task = null; return; }
    let mnx = 1e9, mny = 1e9, mnz = 1e9; for (const c of cells0) { mnx = Math.min(mnx, c.x); mny = Math.min(mny, c.y); mnz = Math.min(mnz, c.z); }
    const norm = cells0.map(c => ({ ...c, x: c.x - mnx, y: c.y - mny, z: c.z - mnz }));
    let W = 0, D = 0; for (const c of norm) { W = Math.max(W, c.x + 1); D = Math.max(D, c.z + 1); }
    const S = Math.max(W, D), toMe = String(t.where || '').includes('me'), abs = t.ax != null && t.az != null && Number.isFinite(+t.ax) && Number.isFinite(+t.az);
    const ref = abs ? { x: +t.ax, z: +t.az } : toMe ? n.pos : P.pos, rx = ref.x + (abs ? 0 : (+t.dx || 0)), rz = ref.z + (abs ? 0 : (+t.dz || 0));
    const ex = t.exact, site = ex && siteFree(ex.x0, ex.z0, S) ? ex : findSite(S, rx, rz);
    if (!site) { ev(n.name + ' could not find free space for ' + (t.name || 'the building')); n.task = null; if (towns.includes(t._town)) townDone(t._town); return; }
    const cxm = (site.x0 + S / 2) * 2, czm = (site.z0 + S / 2) * 2;
    let r = 0; if (t.face_player !== false) { const fp = t.fx != null && Number.isFinite(+t.fx) && Number.isFinite(+t.fz) ? { x: +t.fx, z: +t.fz } : P.pos, vx = fp.x - cxm, vz = fp.z - czm; let bd = -9; FACE.forEach((f, i) => { const dd = f[0] * vx + f[1] * vz; if (dd > bd) { bd = dd; r = i; } }); }
    const rot = rotCells(norm, r), ox = site.x0 + Math.floor((S - rot.W) / 2), oz = site.z0 + Math.floor((S - rot.D) / 2);
    const cells = rot.cells.map(c => ({ cx: ox + c.x, cy: c.y, cz: oz + c.z, t: c.t, f: c.f, rot: c.rot })).sort((a, b) => (a.f ? 1 : 0) - (b.f ? 1 : 0) || a.cy - b.cy || a.cz - b.cz || a.cx - b.cx);
    reserved.push(new THREE.Box3(new V3(site.x0 * 2 - 2, 0, site.z0 * 2 - 2), new V3((site.x0 + S) * 2 + 2, 60, (site.z0 + S) * 2 + 2)));
    const st = { name: String(t.name || 'Building').slice(0, 30), by: n.name, status: 'building', done: 0, total: cells.length, cells, next: 0, retry: [], town: towns.includes(t._town) ? t._town : null };
    structures.push(st);
    n.task = { type: 'build', st, cur: null, stuckSkip: 0 };
    const need = remainingNeed(n.task);
    ev(`${n.name} planned "${st.name}": ${cells.length} blocks (wood ${need.wood}, stone ${need.stone}, sand ${need.sand})`);
    return;
  }
  ev(n.name + ': unknown task type ' + type);
}

// ---- town founding ----
const towns = [], KINDS = ['house', 'cottage', 'shop', 'inn', 'tower'];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function townDone(tw) { tw.done++; ev(`${tw.name}: ${tw.done}/${tw.total} buildings finished`); if (tw.done >= tw.total) { msg('TOWN COMPLETE: ' + tw.name, 3500); ev(`The town of ${tw.name} is complete!`); } }
function genPlan(kind) {
  const wall = ['planks', 'brick', 'stone', 'concrete'][rint(0, 3)], roofB = Math.random() < 0.75 ? 'roof' : 'stone', ops = [];
  const F = (type, x, z, rot = 0) => ops.push({ op: 'furniture', type, x, y: 0, z, rot });
  const G = (x, y, z) => ops.push({ op: 'fill', x, y, z, w: 1, h: 1, d: 1, block: 'glass' });
  if (kind === 'plaza') {
    ops.push({ op: 'box', x: 1, y: 0, z: 1, w: 3, h: 1, d: 3, block: 'stone', hollow: true }, { op: 'fill', x: 2, y: 0, z: 2, w: 1, h: 1, d: 1, block: 'glass' });
    F('lamp', 0, 0); F('lamp', 4, 0); F('lamp', 0, 4); F('lamp', 4, 4); F('plant', 2, 0); F('plant', 2, 4); F('plant', 0, 2); F('plant', 4, 2); return ops;
  }
  if (kind === 'house' || kind === 'cottage') {
    const c = kind === 'cottage', w = c ? 5 : rint(6, 7), d = c ? 5 : rint(5, 7), h = c ? 2 : rint(2, 3), dx = Math.floor(w / 2);
    ops.push({ op: 'box', x: 0, y: 0, z: 0, w, h, d, block: wall, hollow: true }); G(1, 1, 0); G(w - 2, 1, 0); G(0, 1, Math.floor(d / 2)); G(w - 1, 1, Math.floor(d / 2));
    F('door', dx, 0); ops.push({ op: 'roof', x: 0, y: h, z: 0, w, d, block: roofB, style: 'gable' });
    F('bed', w - 2, d - 2); F('shelf', w - 2, d - 3); F('lamp', w - 2, 1); F('table', 1, d - 2); F('chair', 1, d - 3, 1); F('rug', dx, Math.floor(d / 2)); if (c) F('plant', 1, 1); else { F('fridge', 1, 1); F('stove', 2, 1); F('sink', 3, 1); } return ops;
  }
  if (kind === 'shop') {
    const w = rint(7, 9), d = rint(5, 6), h = 3, dx = Math.floor(w / 2);
    ops.push({ op: 'box', x: 0, y: 0, z: 0, w, h, d, block: wall === 'planks' ? 'brick' : wall, hollow: true }, { op: 'fill', x: 1, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: w - 3, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' });
    F('door', dx, 0); ops.push({ op: 'roof', x: 0, y: h, z: 0, w, d, block: 'stone', style: 'flat' });
    F('table', dx, 2); for (let x = 1; x <= w - 2; x += 2) F('shelf', x, d - 2); F('lamp', 1, 1); F('lamp', w - 2, 1); F('plant', w - 2, 2); F('rug', dx, 1); return ops;
  }
  if (kind === 'inn') {
    const w = 9, d = 7, h = 3, dx = 4;
    ops.push({ op: 'box', x: 0, y: 0, z: 0, w, h, d, block: wall === 'stone' ? 'brick' : wall, hollow: true }, { op: 'fill', x: 1, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' }, { op: 'fill', x: w - 3, y: 1, z: 0, w: 2, h: 1, d: 1, block: 'glass' });
    F('door', dx, 0); ops.push({ op: 'roof', x: 0, y: h, z: 0, w, d, block: roofB, style: 'gable' });
    for (const x of [1, 3, 5, 7]) F('bed', x, d - 2); F('table', 2, 2); F('chair', 1, 2, 1); F('chair', 3, 2, 3); F('table', 6, 2); F('chair', 5, 2, 1); F('chair', 7, 2, 3); F('shelf', w - 2, 3); F('lamp', 4, 1); F('plant', 1, 1); F('sink', 7, 1); F('toilet', 6, 1); F('tub', 5, 1); return ops;
  }
  // tower
  ops.push({ op: 'box', x: 0, y: 0, z: 0, w: 4, h: 6, d: 4, block: 'stone', hollow: true }); G(2, 2, 0); G(2, 4, 0); G(0, 2, 2); G(0, 4, 2); G(3, 2, 1); G(3, 4, 1);
  F('door', 1, 0); ops.push({ op: 'roof', x: 0, y: 6, z: 0, w: 4, d: 4, block: 'stone', style: 'flat' });
  for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3], [0, 2], [3, 1]]) ops.push({ op: 'block', x, y: 7, z, block: 'stone' });
  F('bed', 2, 2); F('lamp', 1, 2); F('table', 1, 1); F('chair', 2, 1, 1); return ops;
}
function startTown(name, kinds, size) {
  const builders = npcs.filter(x => x.role !== 'guard');
  if (!builders.length) return;
  const DEF = { small: ['house', 'house', 'cottage', 'shop'], medium: ['house', 'house', 'house', 'cottage', 'shop', 'inn', 'tower'], large: ['house', 'house', 'house', 'house', 'house', 'cottage', 'cottage', 'shop', 'shop', 'inn', 'tower', 'tower'] };
  kinds = (kinds || []).filter(k => KINDS.includes(k)).slice(0, 14); if (kinds.length < 2) kinds = DEF[size] || DEF.small;
  const site = findSite(12, P.pos.x, P.pos.z);
  if (!site) { ev('No open land big enough for a town near you. Try moving to a clearer area.'); return; }
  const cx = (site.x0 + 6) * 2, cz = (site.z0 + 6) * 2, town = { name, cx, cz, total: kinds.length + 1, done: 0 }; towns.push(town);
  const jobs = [{ name: name + ' Plaza', kind: 'plaza', ax: cx, az: cz, exact: { x0: site.x0 + 4, z0: site.z0 + 4 } }];
  const cnt = {};
  kinds.forEach((k, i) => { const ang = i / kinds.length * 6.283 + 0.4, r = 26 + (i % 2) * 10; cnt[k] = (cnt[k] || 0) + 1; jobs.push({ name: `${name} ${k[0].toUpperCase() + k.slice(1)} ${cnt[k]}`, kind: k, ax: cx + Math.cos(ang) * r, az: cz + Math.sin(ang) * r }); });
  jobs.forEach((j, i) => builders[i % builders.length].queue.push({ type: 'build', name: j.name, ax: j.ax, az: j.az, exact: j.exact, fx: cx, fz: cz, plan: genPlan(j.kind), _town: town }));
  for (const w of builders) if (!w.task && w.queue.length) setTask(w, w.queue.shift());
  const rg = npcs.find(x => x.role === 'guard'); if (rg) setTask(rg, { type: 'protect', who: builders[0].id });
  ev(`Founding the town of ${name}: plaza + ${kinds.length} buildings`); msg('FOUNDING: ' + name, 2500); logLine('🏘 ' + name + ' is being planned around a plaza near ' + Math.round(cx) + ', ' + Math.round(cz), 'ev');
}

