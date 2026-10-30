import { unprojectDelta } from "./projection";

// Keyboard movement is screen-relative (W = up the screen), like most
// isometric games. The screen direction is pushed through the inverse
// projection so speed is uniform in metres whichever way you walk.

export const KEY_DIRS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export const WALK_SPEED = 5.5; // m/s
export const ACCEL = 12;       // velocity smoothing rate (1/s)

export function isMovementKey(code) {
  return Object.prototype.hasOwnProperty.call(KEY_DIRS, code);
}

export function moveVector(keys) {
  let dx = 0;
  let dy = 0;
  for (const code of keys) {
    const dir = KEY_DIRS[code];
    if (dir) {
      dx += dir[0];
      dy += dir[1];
    }
  }
  if (dx === 0 && dy === 0) return { u: 0, v: 0 };
  const w = unprojectDelta(dx, dy);
  const len = Math.hypot(w.u, w.v);
  return { u: w.u / len, v: w.v / len };
}

export function smoothVelocity(vel, target, dt) {
  const k = 1 - Math.exp(-dt * ACCEL);
  vel.u += (target.u - vel.u) * k;
  vel.v += (target.v - vel.v) * k;
  return vel;
}
