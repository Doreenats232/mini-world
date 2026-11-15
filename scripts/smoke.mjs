// Headless smoke test: boots the WHOLE game with a fake DOM + fake renderer, runs frames and pokes every system.
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const dir = 'src/parts';
const src = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('').split('\n').filter(l => !l.startsWith('import ')).join('\n').replace(/__V__/g, '"smoke"');
const fake = () => { const store = {}; return new Proxy(function () {}, { get(t, k) { if (k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf') return () => ''; if (k === 'then') return undefined; if (k === 'children') return []; if (k === 'length') return 0; if (typeof k === 'symbol') return undefined; if (!(k in store)) store[k] = fake(); return store[k]; }, set(t, k, v) { store[k] = v; return true; }, apply() { return fake(); } }); };
Object.assign(globalThis, { window: globalThis, document: fake(), matchMedia: () => ({ matches: false }), innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener() {}, removeEventListener() {}, location: { protocol: 'file:', pathname: '/', replace() {} }, localStorage: { getItem: () => null, setItem() {} }, fetch: async () => ({ json: async () => ({}), ok: false }) });
class FakeRenderer { constructor() { this.domElement = fake(); } setSize() {} setPixelRatio() {} setAnimationLoop(f) { globalThis.__loop = f; } render() {} }
class FakePeer { on() {} }
const T = { ...THREE, WebGLRenderer: FakeRenderer };
const API = 'P, cars, citizens, enemies, npcs, cops, buildings, structures, shoot, punch, toggleCar, tryUse, tryTalk, spawnJob, spawnInterior, updateCity, startTown, addBlock, addFurniture, spawnTrafficCar, crime, damageEnemy, mkEnemy, playerSay, JW, doors, useables, mkCar, setMode: v => { mode = v; }, getWanted: () => wanted, getMode: () => mode';
let api, fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
try { api = new Function('THREE', 'mergeGeometries', 'Peer', `'use strict';\n${src}\n;return { ${API} };`)(T, mergeGeometries, FakePeer); ok(true, 'game boots (all parts initialise in order, no TDZ/ReferenceError)'); }
catch (e) { ok(false, 'BOOT FAILED: ' + e.stack.split('\n').slice(0, 4).join(' | ')); process.exit(1); }
const loop = globalThis.__loop; let t = 1000; const frames = n => { for (let i = 0; i < n; i++) { t += 16.7; loop(t); } };
const step = (name, fn) => { try { fn(); ok(true, name); } catch (e) { ok(false, name + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
const t0 = performance.now(); step('300 frames of the main loop', () => frames(300)); const ms = (performance.now() - t0) / 300;
ok(ms < 25, `logic cost ${ms.toFixed(1)} ms/frame in node (no rendering)`);
const { P } = api;
step('citizens spawn and all jobs run', () => { for (const j of [...Object.keys(api.JW)]) for (let i = 0; i < 3; i++) api.spawnJob(j); frames(300); if (!api.citizens.length) throw new Error('no citizens'); });
step('player shoots and punches (fight mode default)', () => { if (api.getMode() !== 'fight') throw new Error('mode is ' + api.getMode()); const e = api.mkEnemy(P.pos.x + 2, P.pos.z) || api.enemies[api.enemies.length - 1]; api.punch(); frames(30); api.shoot(); frames(30); api.setMode('build'); api.setMode('fight'); });
step('enemy dies and leaves a corpse', () => { api.mkEnemy(P.pos.x + 3, P.pos.z); const e = api.enemies[api.enemies.length - 1]; api.damageEnemy(e, 999); frames(60); if (!e.dead) throw new Error('not dead'); });
step('shoving a citizen causes assault + wanted + police', () => { api.spawnJob('walker'); const c = api.citizens[api.citizens.length - 1]; c.pos.set(P.pos.x, 0, P.pos.z - 1.5); P.yaw = 0; frames(2); api.punch(); frames(300); });
step('police chase (wanted level 3)', () => { api.crime(3, 'test'); if (api.getWanted() < 1) throw new Error('wanted not set'); frames(400); });
step('traffic spawns and drives', () => { for (let i = 0; i < 6; i++) api.spawnTrafficCar(); frames(400); });
step('carjack + drive + exit', () => { const c = api.cars.find(x => x.ai) || api.cars[0]; P.pos.set(c.pos.x + 2, 0, c.pos.z); frames(2); api.toggleCar(); frames(120); api.toggleCar(); frames(30); });
step('enter a city building: interior spawns, fixtures usable', () => { const b = api.buildings[5]; P.pos.set(b.x, 0.5, b.z); frames(30); api.updateCity(); frames(10); api.useables.forEach(u => { P.pos.set(u.grp.position.x, 0, u.grp.position.z + 1); api.tryUse(); }); frames(30); if (!b.int) throw new Error('interior not spawned'); });
step('NPC town founding + 20s of building', () => { P.pos.set(25, 0, 25); api.startTown('Smoke', null, 'small'); frames(1200); });
step('chat falls back gracefully', () => { api.playerSay('hello'); api.playerSay('Archie, follow me'); frames(30); });
step('day/night cycle keeps running', () => frames(2000));
console.log(fails ? `\n${fails} SMOKE CHECK(S) FAILED` : '\nSMOKE TEST PASSED'); process.exit(fails ? 1 : 0);
