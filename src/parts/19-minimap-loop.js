// ---------- minimap ----------
const mini = $('mini'), mg = mini.getContext('2d'), MS = isTouch ? 110 : 150, MR = 70;
mini.width = mini.height = MS * 2; mini.style.width = mini.style.height = MS + 'px';
let miniT = 0;
function drawMini() {
  const S = MS * 2, c = S / 2, sc = c / MR, yaw = inCar ? inCar.h + Math.PI : P.yaw, cs = Math.cos(yaw), sn = Math.sin(yaw), px = P.pos.x, pz = P.pos.z, lim = MR + 25;
  mg.clearRect(0, 0, S, S); mg.save(); mg.beginPath(); mg.arc(c, c, c - 2, 0, 6.2832); mg.clip();
  mg.fillStyle = '#35592b'; mg.fillRect(0, 0, S, S);
  mg.translate(c, c); mg.rotate(yaw); mg.scale(sc, sc); mg.translate(-px, -pz);
  mg.fillStyle = '#3a3a3d'; for (let k = -13; k <= 11; k++) { mg.fillRect(k * 50 + 18, -650, 14, 1300); mg.fillRect(-650, k * 50 + 18, 1300, 14); }
  mg.fillStyle = '#8a8f98';
  for (const b of cityFoot) { if (Math.abs((b.min.x + b.max.x) / 2 - px) > lim || Math.abs((b.min.z + b.max.z) / 2 - pz) > lim) continue; mg.fillRect(b.min.x, b.min.z, b.max.x - b.min.x, b.max.z - b.min.z); }
  mapMiniRoute(mg, sc);
  mg.fillStyle = '#d4a85f';
  for (const m of blockMeshes.values()) { const x = m.position.x, z = m.position.z; if (Math.abs(x - px) > lim || Math.abs(z - pz) > lim) continue; mg.fillRect(x - 1, z - 1, 2, 2); }
  mg.setTransform(1, 0, 0, 1, 0, 0);
  const toS = (x, z, clamp) => { const dx = x - px, dz = z - pz; let sx = (dx * cs - dz * sn) * sc, sy = (dx * sn + dz * cs) * sc; const d = Math.hypot(sx, sy), mx = c - 10; if (clamp && d > mx) { sx *= mx / d; sy *= mx / d; } return [c + sx, c + sy, d <= c - 4]; };
  const dot = (x, z, col, r, clamp) => { const [sx, sy, inside] = toS(x, z, clamp); if (!inside && !clamp) return; mg.fillStyle = col; mg.beginPath(); mg.arc(sx, sy, r, 0, 6.2832); mg.fill(); };
  for (const nd of nodes) if (nd.left > 0) dot(nd.pos.x, nd.pos.z, nd.type === 'wood' ? '#2ecc40' : nd.type === 'stone' ? '#e0e0e0' : '#f1c40f', 4, false);
  for (const e of enemies) if (!e.dead) dot(e.pos.x, e.pos.z, '#ff3b30', 5, false);
  for (const e of cops) if (!e.dead) dot(e.pos.x, e.pos.z, '#3b82f6', 6, false);
  for (const c of citizens) if (!c.hidden) dot(c.pos.x, c.pos.z, '#e8e8e8', 3, false);
  for (const r of net.remotes.values()) dot(r.pos.x, r.pos.z, '#00e5ff', 6, true);
  mapMiniIcons(dot);
  for (const cr of cars) { const [sx, sy, inside] = toS(cr.pos.x, cr.pos.z); if (inside) { mg.fillStyle = '#fff'; mg.fillRect(sx - 4, sy - 4, 8, 8); } }
  for (const n of npcs) { const [sx, sy] = toS(n.pos.x, n.pos.z, true); mg.fillStyle = '#' + n.col.toString(16).padStart(6, '0'); mg.beginPath(); mg.arc(sx, sy, 8, 0, 6.2832); mg.fill(); mg.strokeStyle = '#fff'; mg.lineWidth = 2; mg.stroke(); mg.fillStyle = '#fff'; mg.font = 'bold 12px sans-serif'; mg.textAlign = 'center'; mg.fillText(n.name[0], sx, sy + 4); }
  mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(c, c - 12); mg.lineTo(c - 8, c + 9); mg.lineTo(c + 8, c + 9); mg.closePath(); mg.fill();
  mg.restore();
  mg.strokeStyle = '#fff'; mg.lineWidth = 3; mg.beginPath(); mg.arc(c, c, c - 2, 0, 6.2832); mg.stroke();
  const [nx, ny] = toS(px, pz - MR * 0.82); mg.fillStyle = '#ffd400'; mg.font = 'bold 16px sans-serif'; mg.textAlign = 'center'; mg.fillText('N', nx, ny + 5);
}

// ---------- loop ----------
hud();
for (let i = 0; i < 6; i++) spawnEnemy();
msg(isTouch ? 'FIGHT mode: SHOOT and PUNCH buttons (MODE = build)' : 'FIGHT mode: click = shoot, F = punch, Q = build mode', 5000);
logLine('Press T (or CHAT) to talk to Archie, Mason and Ranger. ⚙ = set your relay key.', 'ev');
if (!REL.key) setTimeout(() => logLine('Your NPCs are in scripted mode (no AI key). Tap ⚙, paste your RelayAPI key and press Test connection so they can really talk and think.', 'ev'), 4000);
let last = performance.now(), spawnT = 0;
ren.setAnimationLoop(now => {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt; cool -= dt;
  cityT -= dt; if (cityT <= 0) { cityT = 0.3; updateCity(); }
  updateSky(dt); updateUse(dt); elevTick(dt); carFxTick(dt); updateCitizens(dt); instLife(dt); policeTick(dt); bankTick(dt); prisonTick(dt); gpsTick(dt); updateResidents(dt); updateTraffic(dt); updateViewmodel(dt); updateFx(dt); updateCarFx(dt); updateSoldiers(dt);
  { const pre = isTouch ? 'Tap DOOR: ' : 'Press E: '; let ht = ''; let carNear = null; if (!inCar) for (const c of cars) if (!c.dead && dist2(c.pos, P.pos) < 5) { carNear = c; break; } if (!inCar && !shopOpen) { if (shopNear()) ht = pre + 'open shop'; else { const u = nearestUse(); if (u) ht = pre + USEN[u.f]; else if (carNear) ht = pre + (carNear.bike ? 'get on bike' : 'open door'); else { const cz = nearestCitizen(); if (cz) ht = pre + 'talk to ' + cz.name + ' (' + (cz.label || cz.job) + ')'; } } } if (isTouch) { const cb = $('car'), want = !shopOpen && (inCar || !!ht); const lbl = inCar ? (inCar.bike ? 'OFF' : 'EXIT') : (carNear && !shopNear() && !nearestUse() ? 'DOOR' : 'USE'); if (cb._w !== want) { cb._w = want; cb.style.display = want ? 'flex' : 'none'; } if (cb._l !== lbl) { cb._l = lbl; cb.textContent = lbl; } } if (ht !== hintTxt) { hintTxt = ht; $('hint').textContent = ht; $('hint').style.display = ht ? 'block' : 'none'; } }
  miniT -= dt; if (miniT <= 0) { miniT = 0.066; drawMini(); }
  if (inCar) driveCar(dt); else if (enter) updateEnter(dt); else playerStep(dt);
  updatePlayerModel(dt);
  if (held && mode === 'fight' && !inCar) shoot();
  for (let i = enemies.length - 1; i >= 0; i--) { if (!enemies[i]) continue; if (enemies[i].dead) enemies.splice(i, 1); else enemyStep(enemies[i], dt); }
  spawnT -= dt; if (spawnT <= 0 && enemies.length < (inSlum(P.pos.x, P.pos.z) ? 18 : 10)) { spawnEnemy(); spawnT = 3; }
  for (let i = cops.length - 1; i >= 0; i--) { if (!cops[i]) continue; if (cops[i].dead) cops.splice(i, 1); else copStep(cops[i], dt); }
  if (wanted > 0) {
    copLeaveT = 5; copT -= dt; if (copT <= 0 && cops.length < wanted * 2) { spawnCop(); copT = 1.5; }
    calmT = cops.some(c => dist2(c.pos, P.pos) < 60) ? 0 : calmT + dt;
    if (calmT > 10 || clock - lastCrime > 60) { wanted--; calmT = 0; lastCrime = clock; hudStars(); }
  } else if (cops.length) { copLeaveT -= dt; if (copLeaveT <= 0) clearCops(); }
  if (net.client) { for (const n of npcs) if (n.tp) n.pos.lerp(n.tp, Math.min(1, dt * 10)); } else for (const n of npcs) npcStep(n, dt);
  updateDoors(dt);
  cam.updateMatrixWorld();
  for (const n of npcs) npcVisuals(n, dt);
  updateRemotes(dt);
  netT -= dt; if (net.on && netT <= 0) { netT = 0.1; netTick(); }
  for (let i = grow.length - 1; i >= 0; i--) { const g = grow[i]; g.t += dt * 4; const s = Math.min(1, 0.2 + g.t); g.m.scale.setScalar(s); if (s >= 1) grow.splice(i, 1); }
  for (const nd of nodes) { if (nd.left < nd.max) { nd.regen += dt; if (nd.regen > 6) { nd.regen = 0; nd.left++; nd.mesh.visible = true; nd.mesh.scale.setScalar(0.45 + 0.55 * nd.left / nd.max); } } }
  flashV = Math.max(0, flashV - dt * 1.5); $('flash').style.opacity = flashV;
  ren.render(scene, cam);
});
