import * as THREE from 'three';
import Peer from 'peerjs';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const VER = __V__;
const REPO = 'Doreenats232/mini-world';
const isTouch = matchMedia('(pointer:coarse)').matches;
const native = navigator.userAgent.includes('Electron');
if (isTouch) document.body.classList.add('touch');
const $ = id => document.getElementById(id);
$('ver').textContent = 'v' + VER;
if (isTouch) $('help').style.display = 'none';
const V3 = THREE.Vector3;
const net = { on: false, host: false, client: false, peer: null, conns: [], hostConn: null, myId: null, code: '', remotes: new Map(), applying: false, noSave: false, names: [], name: 'Player' + Math.floor(Math.random() * 900 + 100) };
try { const n = localStorage.getItem('mw_name'); if (n) net.name = n; } catch (e) {}


// city bounds (roads lines 50k+25). Old downtown = blocks -7..6; new ring out to blocks -12..11
const WB = { lo: -625, hi: 575, lim0: -630, lim1: 580 };
const inSlum = (x, z) => x < 0 && (x < -360 || z < -360 || z > 330), inRich = (x, z) => x > 0 && (x > 330 || z < -360 || z > 330);

const PL = { on: 0, jv: 11, id: '', launch: null, ret: null, o2: 100 };
const PERF = { fr: 16, js: 0, t: 0, n: 0, sj: 0, sf: 0, mx: 0 };
const AGE = { pen: 0 };
