// Ball flight in metres. Gravity is 1.6× Earth's so arcs read snappy and
// cartoony; the launch solves for an exact landing on the aim point.

export const GRAVITY = 15.7;
export const LAUNCH_HEIGHT = 2.6;  // apex of the toss, where the racket meets the ball
export const RESTITUTION = 0.55;   // vertical speed kept per bounce
export const FRICTION = 0.72;      // horizontal speed kept per bounce
export const MAX_BOUNCES = 3;
export const SETTLE_VZ = 1;        // below this bounce speed the ball settles

export function flightTime(d) {
  return Math.min(1.2, Math.max(0.6, 0.55 + 0.03 * d));
}

// Velocity so a ball released at height h0 above `from` first touches the
// ground exactly at `to` after flightTime(distance) seconds.
export function launchVelocity(from, to, h0 = LAUNCH_HEIGHT, g = GRAVITY) {
  const du = to.u - from.u;
  const dv = to.v - from.v;
  const d = Math.hypot(du, dv);
  const T = flightTime(d);
  const vz = (g * T) / 2 - h0 / T;
  if (d === 0) return { vu: 0, vv: 0, vz, T };
  const s = d / T;
  return { vu: (du / d) * s, vv: (dv / d) * s, vz, T };
}

export function createBallBody(u, v, z, vel) {
  return { u, v, z, vu: vel.vu, vv: vel.vv, vz: vel.vz, bounces: 0 };
}

// Advance one frame. Exact for constant acceleration; a ground crossing is
// interpolated back to the contact point so the landing is where launchVelocity
// promised. Mutates `body`; returns the events that happened this frame.
export function stepBall(body, dt, g = GRAVITY) {
  const events = [];
  const prevU = body.u;
  const prevV = body.v;
  const prevZ = body.z;
  const vz0 = body.vz;

  body.u += body.vu * dt;
  body.v += body.vv * dt;
  body.z = prevZ + vz0 * dt - 0.5 * g * dt * dt;
  body.vz = vz0 - g * dt;

  if (body.z <= 0 && (vz0 < 0 || body.vz < 0)) {
    // Fraction of the frame at which the ground was crossed.
    const f = prevZ > 0 ? Math.min(1, Math.max(0, prevZ / (prevZ - body.z))) : 0;
    body.u = prevU + body.vu * dt * f;
    body.v = prevV + body.vv * dt * f;
    body.z = 0;
    const speed = Math.hypot(body.vu, body.vv, body.vz);
    body.bounces += 1;
    events.push({ type: "contact", u: body.u, v: body.v, first: body.bounces === 1, speed });
    body.vz = -body.vz * RESTITUTION;
    body.vu *= FRICTION;
    body.vv *= FRICTION;
    if (body.bounces >= MAX_BOUNCES || body.vz < SETTLE_VZ) {
      body.vu = 0;
      body.vv = 0;
      body.vz = 0;
      events.push({ type: "settle" });
    }
  }
  return events;
}
