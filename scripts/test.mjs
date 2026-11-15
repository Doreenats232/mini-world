// Fast logic tests (no browser needed). Run: npm test
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process'; import { pathToFileURL } from 'url';
const dir = 'src/parts';
const src = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
// 1. syntax of the joined bundle
fs.writeFileSync('scripts/.bundle.mjs', src);
try { execSync('node --check scripts/.bundle.mjs', { stdio: 'pipe' }); ok(true, 'syntax of joined bundle'); } catch (e) { ok(false, 'syntax: ' + String(e.stderr).split('\n').slice(0, 4).join(' | ')); }
fs.unlinkSync('scripts/.bundle.mjs');
// 2. pure logic, extracted from the source by function name
const grab = n => { const i = src.indexOf('function ' + n); if (i < 0) throw new Error('missing function ' + n); const eol = src.indexOf('\n', i), line = src.slice(i, eol); if (line.endsWith('}') && line.split('{').length === line.split('}').length) return line + '\n'; return src.slice(i, src.indexOf('\n}\n', i) + 3); };
const grabConst = n => { const i = src.indexOf('const ' + n + ' ='); if (i < 0) throw new Error('missing const ' + n); return src.slice(i, src.indexOf(';\n', i) + 2); };
const mod = `import * as THREE from 'three'; import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const V3 = THREE.Vector3; const CITMAT = new THREE.MeshLambertMaterial({ vertexColors: true }); const mb = () => new THREE.MeshBasicMaterial(); const CARBODY = mb(), CARGLASS = mb(), CARHEAD = mb(), CARTAIL = mb(), CARBEAM = mb(), CARSHADOW = mb(); const BLOCKS = [['planks','wood'],['stone','stone'],['brick','stone'],['glass','sand'],['concrete','stone'],['roof','wood']]; const BIDX = Object.fromEntries(BLOCKS.map((b, i) => [b[0], i]));
let FERRARI = null; const mkFerrariModel = () => null; const CT = 0.8, CG = 4, CDW = 2.4, CDH = 3.0; const m0 = () => new THREE.MeshBasicMaterial(); const FACMAT = [m0(), m0(), m0(), m0()], roofTop = m0(), INTWALL = FACMAT, FLOORMAT = FACMAT, CEILMAT = m0(), FRAMEMAT = m0();
${src.slice(src.indexOf('const FURN ='), src.indexOf(';\n', src.indexOf('const FURN =')) + 2)}
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
${grab('expandPlan')}${grab('rotCells')}${grab('genPlan')}${grab('buildShell')}${grab('cbox')}${grab('mkCitizenModel')}${grabConst('nextI')}${grabConst('CAR_TYPES')}CAR_TYPES.taxi = CAR_TYPES.sedan;${grab('cgeo')}${grab('taper')}${grab('mkCarModel')}
export { mkCarModel, CAR_TYPES, expandPlan, rotCells, genPlan, buildShell, FURN, V3, THREE, BLOCKS, mkCitizenModel, nextI };`;
fs.writeFileSync('scripts/.logic.mjs', mod);
const L = await import(pathToFileURL(path.resolve('scripts/.logic.mjs')).href); fs.unlinkSync('scripts/.logic.mjs');
const { expandPlan, rotCells, genPlan, buildShell, FURN, V3, THREE, mkCitizenModel, nextI } = L, CT = 0.8;
ok(expandPlan('garbage').length === 0 && expandPlan([{ op: 'box', w: 99, h: 99, d: 99, block: 'zzz' }]).length === 700, 'expandPlan survives garbage and caps at 700 cells');
const c1 = expandPlan([{ op: 'box', x: 0, y: 0, z: 0, w: 6, h: 3, d: 6, block: 'brick', hollow: true }, { op: 'furniture', type: 'door', x: 2, y: 0, z: 0, rot: 0 }, { op: 'furniture', type: 'sofa', x: 3, y: 0, z: 3 }]);
ok(c1.filter(k => k.f).length === 1 && !c1.some(k => k.x === 2 && k.y === 0 && k.z === 0 && k.t !== undefined), 'door replaces wall cell; unknown furniture ignored');
const rc = rotCells(c1, 1); ok(rc.cells.length === c1.length && rc.cells.find(k => k.f === 'door').rot === 1, 'rotCells keeps cells and turns furniture');
for (const kind of ['plaza', 'house', 'cottage', 'shop', 'inn', 'tower']) {
  let bad = '';
  for (let t = 0; t < 40 && !bad; t++) {
    const ops = genPlan(kind), cells = expandPlan(ops), base = new Set(expandPlan(ops.filter(o => o.op !== 'furniture')).map(c => c.x + ',' + c.y + ',' + c.z));
    const furn = cells.filter(c => c.f), seen = new Set();
    if (cells.length < 10 || cells.length > 300) bad = 'cell count ' + cells.length;
    if (cells.some(c => c.x > 23 || c.z > 23 || c.y > 16)) bad = 'out of bounds';
    if (kind !== 'plaza' && furn.filter(f => f.f === 'door').length !== 1) bad = 'needs exactly one door';
    for (const f of furn) { const k = f.x + ',' + f.y + ',' + f.z; if (seen.has(k)) bad = 'two furniture pieces in one cell ' + k; seen.add(k); if (f.f !== 'door' && base.has(k)) bad = f.f + ' placed inside a wall/roof at ' + k; if (!FURN[f.f]) bad = 'unknown furniture ' + f.f; }
  }
  ok(!bad, `genPlan(${kind}) x40 is valid ${bad}`);
}
for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const b = { id: 1, x: 100, z: 50, w: 12, d: 10, h: 20, v: 1, iv: 1, fv: 0, ry }, { mesh, boxes } = buildShell(b);
  const ew = ry === 0 || ry === Math.PI, half = ew ? b.d / 2 : b.w / 2, nx = Math.round(Math.sin(ry)), nz = Math.round(Math.cos(ry)), tx = Math.round(Math.cos(ry)), tz = -Math.round(Math.sin(ry));
  const dx = b.x + nx * (half - CT / 2), dz = b.z + nz * (half - CT / 2), box = (x, z) => new THREE.Box3(new V3(x - 0.35, 0.1, z - 0.35), new V3(x + 0.35, 1.7, z + 0.35)), hit = bb => boxes.some(q => q.intersectsBox(bb));
  ok(mesh.material.length === 6 && !hit(box(dx, dz)) && hit(box(dx + tx * 2.5, dz + tz * 2.5)) && !hit(box(b.x, b.z)), `building shell ry=${ry.toFixed(2)}: door open, wall solid, room clear, 6 draw calls`);
}
{ let bad = '';
  for (let t = 0; t < 300 && !bad; t++) { const p = (Math.random() - 0.5) * 800, d = Math.random() < 0.5 ? 1 : -1, r = nextI(p, d); if ((((r - 25) % 50) + 50) % 50 !== 0 || (d > 0 ? r <= p : r >= p) || Math.abs(r - p) > 50) bad = `nextI(${p},${d})=${r}`; }
  ok(!bad, 'citizen road navigation nextI always lands on an intersection ahead ' + bad); }
for (const o of [{ skin: 1, hair: 2, shirt: 3, pants: 4 }, { skin: 1, hair: 2, shirt: 3, pants: 4, hat: 5, glasses: 1, pack: 6, vest: 7, apron: 1, guitar: 1, bag: 8, tool: 1 }]) { const M = mkCitizenModel(o); let meshes = 0; M.g.traverse(m => { if (m.isMesh) meshes++; }); ok(meshes === 5 && M.aL && M.aR && M.lL && M.lR, `citizen model is 5 draw calls (${Object.keys(o).length} options)`); }
for (const t of Object.keys(L.CAR_TYPES)) for (const dv of [false, true]) { const M = L.mkCarModel(t, 0xd62828, dv); let meshes = 0; M.g.traverse(m => { if (m.isMesh) meshes++; }); ok(M.wheels.length === 4 && M.wheels.filter(w => w.front).length === 2 && meshes <= 12, `car model ${t}${dv ? ' + driver' : ''}: 4 wheels, ${meshes} draw calls`); }
console.log(fails ? `\n${fails} TEST(S) FAILED` : '\nALL TESTS PASSED'); process.exit(fails ? 1 : 0);
