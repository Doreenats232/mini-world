// ---- institutions: buildings with a purpose (schools, universities, companies, NASA centre) ----
const institutions = [];
(function assignInstitutions() {
  const dtn = buildings.filter(b => !b.rich && !b.slum), area = b => b.w * b.d, used = new Set();
  const take = (list, purpose, n, gap, names) => {
    let k = 0;
    for (const b of list) {
      if (k >= n) break;
      if (used.has(b.id) || institutions.some(o => o.purpose === purpose && Math.hypot(o.x - b.x, o.z - b.z) < gap)) continue;
      used.add(b.id); b.purpose = purpose; b.pname = names[k % names.length]; institutions.push(b); k++;
    }
  };
  take([...dtn].sort((a, b) => area(b) - area(a)), 'university', 2, 200, ['MLD UNIVERSITY', 'CITY COLLEGE']);
  take(dtn.filter(b => b.h <= 14 && area(b) >= 100).sort((a, b) => (a.id * 7919 % 101) - (b.id * 7919 % 101)), 'school', 5, 120, ['GREENFIELD PRIMARY', 'SUNRISE SCHOOL', 'HILLTOP ACADEMY', 'ST. MARY SCHOOL', 'RIVERSIDE SCHOOL']);
  take(dtn.filter(b => b.h >= 30).sort((a, b) => b.h - a.h), 'company', 8, 60, ['MLD TECH CORP', 'OMEGA BANK HQ', 'NOVA ENERGY', 'ATLAS LOGISTICS', 'PIXEL STUDIOS', 'BLUE SKY AIRWAYS', 'TITAN MOTORS', 'HELIX PHARMA']);
  take(buildings.filter(b => b.rich).sort((a, b) => area(b) - area(a)), 'nasa', 1, 0, ['NASA SPACE CENTRE']);
})();
const INST_LOOK = { school: ['#e67e22', '#fff', 'SCHOOL'], university: ['#8e44ad', '#fff', 'UNIVERSITY'], company: ['#1f3a5f', '#e8f1ff', 'COMPANY'], nasa: ['#0b1a3a', '#ffffff', 'SPACE RESEARCH'] };
function signTex(text, sub, bg, fg) {
  return mkTex(512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 42px sans-serif'; g.fillText(text, w / 2, h / 2 - 14, w - 40);
    g.font = '24px sans-serif'; g.fillText(sub, w / 2, h / 2 + 32, w - 40);
  });
}
for (const b of institutions) {
  const [bg, fg, sub] = INST_LOOK[b.purpose], half = (b.ry === 0 || b.ry === Math.PI) ? b.d / 2 : b.w / 2, ox = Math.sin(b.ry), oz = Math.cos(b.ry);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: signTex(b.pname, sub, bg, fg) }));
  sg.position.set(b.x + ox * (half + 0.08), CDH + 1.5, b.z + oz * (half + 0.08)); sg.rotation.y = b.ry; scene.add(sg);
  if (b.purpose === 'nasa') {
    const rk = new THREE.Group(), wm = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), rm = new THREE.MeshLambertMaterial({ color: 0xd62828 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 11, 14), wm); body.position.y = 5.5;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.5, 14), rm); nose.position.y = 12.75;
    rk.add(body, nose); for (let a = 0; a < 3; a++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 1.6), rm); const an = a * 2.094; f.position.set(Math.cos(an) * 1.7, 1.3, Math.sin(an) * 1.7); f.rotation.y = -an; rk.add(f); }
    rk.position.set(b.x, b.h, b.z); scene.add(rk);
  }
}
