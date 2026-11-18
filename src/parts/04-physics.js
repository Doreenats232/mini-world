// ---------- entities / physics ----------
const mkEnt = (x, y, z, R, H) => ({ pos: new V3(x, y, z), vel: new V3(), R, H, ground: false });
function hit(e, b) { return e.pos.x + e.R > b.min.x && e.pos.x - e.R < b.max.x && e.pos.z + e.R > b.min.z && e.pos.z - e.R < b.max.z && e.pos.y + e.H > b.min.y && e.pos.y < b.max.y; }
function move(e, axis, d) {
  e.pos[axis] += d;
  for (const b of solids.values()) {
    if (!hit(e, b)) continue;
    if (axis === 'y') { if (d <= 0) { e.pos.y = b.max.y; e.vel.y = 0; e.ground = true; } else { e.pos.y = b.min.y - e.H; e.vel.y = 0; } }
    else e.pos[axis] = d > 0 ? b.min[axis] - e.R : b.max[axis] + e.R;
  }
}
let GRAV = 28;
function phys(e, mx, mz, dt) { e.vel.y -= GRAV * dt; move(e, 'x', mx * dt); move(e, 'z', mz * dt); e.ground = false; move(e, 'y', e.vel.y * dt); if (e.pos.y <= 0) { e.pos.y = 0; e.vel.y = 0; e.ground = true; } }
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

