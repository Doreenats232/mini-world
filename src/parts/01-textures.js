// ---------- procedural textures ----------
function mkTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t._c = c; return t;
}
const rr = (a, b) => a + Math.random() * (b - a);
function speck(g, w, h, n, l, d) { for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? l : d; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }
function facade(base, frame) {
  const lits = [];
  const T = mkTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); speck(g, w, h, 1800, 'rgba(255,255,255,.07)', 'rgba(0,0,0,.08)');
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, w, 4); g.fillRect(0, 128, w, 4);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const x = c * 64 + 12, y = r * 128 + 30, ww = 40, hh = 70;
      g.fillStyle = frame; g.fillRect(x - 3, y - 3, ww + 6, hh + 6);
      const lit = Math.random() < 0.28; if (lit) lits.push([x, y, ww, hh]); const gr = g.createLinearGradient(0, y, 0, y + hh);
      if (lit) { gr.addColorStop(0, '#ffe9a8'); gr.addColorStop(1, '#f5c15b'); } else { gr.addColorStop(0, '#6f97b8'); gr.addColorStop(1, '#1d3347'); }
      g.fillStyle = gr; g.fillRect(x, y, ww, hh);
      g.fillStyle = frame; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh * 0.45, ww, 2);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 2, y + 2, ww / 2 - 4, 8);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 4, y + hh + 3, ww + 8, 3);
    }
  });
  T._em = mkTex(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd27a'; for (const [x, y, ww, hh] of lits) g.fillRect(x, y, ww, hh); });
  return T;
}
const FACADES = [['#b7aea0', '#3a3a3a'], ['#a86656', '#2a2a2a'], ['#8f9aa8', '#20252b'], ['#d0c3a4', '#4a4036']].map(([b, f]) => facade(b, f));
const matCache = {};
function sideMat(v, wm, hm) {
  const rx = Math.max(1, Math.round(wm / 8)), ry = Math.max(1, Math.round(hm / 8)), k = v + '|' + rx + '|' + ry;
  if (!matCache[k]) { const t = FACADES[v].clone(); t.needsUpdate = true; t.repeat.set(rx, ry); const e = FACADES[v]._em.clone(); e.needsUpdate = true; e.repeat.set(rx, ry); matCache[k] = new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: e, emissiveIntensity: 0 }); }
  return matCache[k];
}
const roofTop = new THREE.MeshLambertMaterial({ map: mkTex(64, 64, (g, w, h) => { g.fillStyle = '#6a6c70'; g.fillRect(0, 0, w, h); speck(g, w, h, 500, 'rgba(255,255,255,.1)', 'rgba(0,0,0,.15)'); }) });
const grassTex = mkTex(256, 256, (g, w, h) => { g.fillStyle = '#4b7d3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `hsl(${rr(88, 108)},${rr(35, 50)}%,${rr(26, 40)}%)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); } });
grassTex.repeat.set(300, 300);
const roadTex = mkTex(128, 256, (g, w, h) => {
  g.fillStyle = '#2e2e31'; g.fillRect(0, 0, w, h); speck(g, w, h, 1500, 'rgba(255,255,255,.07)', 'rgba(0,0,0,.2)');
  g.fillStyle = '#dcdcdc'; g.fillRect(6, 0, 3, h); g.fillRect(w - 9, 0, 3, h);
  g.fillStyle = '#e8c41c'; for (let y = 0; y < h; y += 80) g.fillRect(w / 2 - 2, y, 4, 40);
  g.fillStyle = '#555'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
});
roadTex.repeat.set(1, 800 / 28);
const FACMAT = FACADES.map(t => new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t._em, emissiveIntensity: 0 }));
const lamM = map => new THREE.MeshLambertMaterial({ map, emissive: 0xffc980, emissiveIntensity: 0 });
const wallTex = c => mkTex(64, 64, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h); speck(g, w, h, 200, 'rgba(255,255,255,.1)', 'rgba(0,0,0,.06)'); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, h - 5, w, 5); });
const INTWALL = ['#e8dcc8', '#cfe0e8', '#e8cfd4', '#d9e8cf'].map(c => lamM(wallTex(c)));
const FLOORMAT = [
  mkTex(64, 64, (g, w, h) => { for (let r = 0; r < 4; r++) { g.fillStyle = `hsl(30,${rr(35, 45)}%,${rr(38, 50)}%)`; g.fillRect(0, r * 16, w, 16); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, r * 16, w, 1); g.fillRect((r % 2) * 32 + 20, r * 16, 1, 16); } }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#d3d6d9'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 31, 31); g.strokeRect(32.5, 32.5, 31, 31); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(33, 1, 30, 30); g.fillRect(1, 33, 30, 30); }),
].map(lamM);
const CEILMAT = lamM(mkTex(32, 32, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.08)'; g.strokeRect(0, 0, w, h); }));
const FRAMEMAT = new THREE.MeshLambertMaterial({ color: 0x4a3320 });
const nightMats = [...INTWALL, ...FLOORMAT, CEILMAT];
const BLOCKS = [['planks', 'wood'], ['stone', 'stone'], ['brick', 'stone'], ['glass', 'sand'], ['concrete', 'stone'], ['roof', 'wood']];
const BIDX = Object.fromEntries(BLOCKS.map((b, i) => [b[0], i]));
const BTEX = [
  mkTex(64, 64, (g, w, h) => { for (let r = 0; r < 4; r++) { g.fillStyle = `hsl(32,${rr(38, 50)}%,${rr(42, 54)}%)`; g.fillRect(0, r * 16, w, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, r * 16, w, 1.5); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(80,45,15,.25)'; g.fillRect(rr(0, w), r * 16 + rr(2, 14), rr(8, 26), 1); } g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect((r % 2) * 32 + 14, r * 16 + 7, 2, 2); } }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#8c9094'; g.fillRect(0, 0, w, h); speck(g, w, h, 700, 'rgba(255,255,255,.18)', 'rgba(0,0,0,.25)'); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); let x = rr(0, w), y = rr(0, h); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rr(-9, 9); y += rr(-9, 9); g.lineTo(x, y); } g.stroke(); } }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#d2cbbf'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const x = c * 32 + (r % 2) * 16; g.fillStyle = `hsl(${rr(8, 14)},${rr(45, 55)}%,${rr(32, 42)}%)`; g.fillRect(x + 1, r * 16 + 1, 30, 14); } speck(g, w, h, 300, 'rgba(255,255,255,.1)', 'rgba(0,0,0,.15)'); }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = 'rgba(170,220,235,.45)'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(8, 6); g.lineTo(26, 6); g.lineTo(6, 28); g.lineTo(6, 14); g.fill(); g.strokeStyle = '#d6f2f8'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#d6f2f8'; g.fillRect(w / 2 - 1, 0, 2, h); g.fillRect(0, h / 2 - 1, w, 2); }),
  mkTex(64, 64, (g, w, h) => { g.fillStyle = '#b9bbbd'; g.fillRect(0, 0, w, h); speck(g, w, h, 900, 'rgba(255,255,255,.2)', 'rgba(0,0,0,.12)'); g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0.5, 0.5, w - 1, h - 1); g.fillStyle = 'rgba(0,0,0,.25)'; for (const [x, y] of [[6, 6], [56, 6], [6, 56], [56, 56]]) g.fillRect(x, y, 2, 2); }),
  mkTex(64, 64, (g, w, h) => { for (let r = 0; r < 4; r++) { for (let c = -1; c < 4; c++) { const x = c * 20 + (r % 2) * 10; g.fillStyle = `hsl(${rr(10, 16)},${rr(50, 60)}%,${rr(34, 44)}%)`; g.fillRect(x, r * 16, 19, 15); } g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, r * 16 + 15, w, 1.5); } }),
];
BTEX.forEach(t => { t.magFilter = THREE.NearestFilter; });
const bmats = BTEX.map((t, i) => new THREE.MeshLambertMaterial(i === 3 ? { map: t, transparent: true, opacity: 0.7, depthWrite: false } : { map: t }));

