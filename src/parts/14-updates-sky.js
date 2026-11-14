// ---------- updates ----------
function newer(a, b) { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
if (native) {
  fetch('https://api.github.com/repos/' + REPO + '/releases/latest').then(r => r.json()).then(j => {
    const v = (j.tag_name || '').replace(/^v/, ''); if (!v || !newer(v, VER)) return;
    const u = $('upd'); u.style.display = 'block'; u.textContent = 'Update v' + v + ' downloading, restarts automatically';
  }).catch(() => {});
} else if (location.protocol.startsWith('http')) {
  setInterval(async () => {
    try {
      const j = await (await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' })).json();
      if (j.version && j.version !== VER) { if (net.on) { const u2 = $('upd'); u2.style.display = 'block'; u2.textContent = 'New version available. Leave the room to update.'; return; } save(); const u = $('upd'); u.style.display = 'block'; u.textContent = 'New version v' + j.version + ', reloading...'; setTimeout(() => location.replace(location.pathname + '?v=' + j.version), 3000); }
    } catch (e) {}
  }, 30000);
}

// ---------- day / night ----------
let dayT = 0.3, dayLight = 1;
const cNight = new THREE.Color(0x070b1f), cDay = new THREE.Color(0x87ceeb), cDusk = new THREE.Color(0xff8a50), cTmp = new THREE.Color();
function updateSky(dt) {
  dayT = (dayT + dt / 300) % 1;
  const a = dayT * Math.PI * 2, sy = -Math.cos(a);
  const day = Math.min(1, Math.max(0, (sy + 0.15) / 0.4)), dusk = Math.max(0, 1 - Math.abs(sy) / 0.3) * 0.6;
  cTmp.copy(cNight).lerp(cDay, day).lerp(cDusk, dusk);
  dayLight = day; scene.background.copy(cTmp); scene.fog.color.copy(cTmp);
  sun.position.set(Math.sin(a) * 100, sy * 100 + 5, 30); sun.intensity = 0.05 + 1.15 * day;
  hemi.intensity = 0.28 + 0.82 * day;
  for (const k in matCache) matCache[k].emissiveIntensity = (1 - day) * 1.1;
  for (const m of FACMAT) m.emissiveIntensity = (1 - day) * 1.1; for (const m of nightMats) m.emissiveIntensity = (1 - day) * 0.5;
}
setInterval(() => { const h = Math.floor(dayT * 24), m = Math.floor((dayT * 24 - h) * 60); $('ver').textContent = 'v' + VER + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }, 1000);
updateSky(0);

