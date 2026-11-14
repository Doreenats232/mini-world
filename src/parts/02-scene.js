// ---------- scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 260);
const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 320);
cam.rotation.order = 'YXZ';
const ren = new THREE.WebGLRenderer({ antialias: !isTouch });
ren.setSize(innerWidth, innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(ren.domElement);
const hemi = new THREE.HemisphereLight(0xffffff, 0x556655, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(60, 100, 30);
scene.add(sun);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); ren.setSize(innerWidth, innerHeight); });

