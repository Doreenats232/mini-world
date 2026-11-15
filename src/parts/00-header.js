import * as THREE from 'three';
import Peer from 'peerjs';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

