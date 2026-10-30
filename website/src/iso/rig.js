import gsap from "gsap";

// The player: four Figma-cut image parts on a procedural rig. Geometry is in
// "figure units" — the viewBox units of the retired SVG Player, re-origined
// so (0,0) is between the feet and y is negative upward. 125 units = the
// figure's height. Every number here is eyeball-tuned; tweak, don't rebuild.

export const FIGURE_UNITS = 125;
export const FIGURE_HEIGHT = 2.6; // metres — larger than life, on purpose
export const UNIT = FIGURE_HEIGHT / FIGURE_UNITS;

// Image slots. `leftArm` is drawn from right-arm.png and `rightArm` (the
// racket arm) from left-arm.png — that is how the Figma cuts read correctly.
export const PARTS = {
  leftArm: { x: -27, y: -63, w: 17, h: 40 },
  body: { x: -15, y: -72, w: 30, h: 72 },
  head: { x: -24, y: -125, w: 46, h: 56 },
  rightArm: { x: 9, y: -65, w: 17, h: 42 },
};

export const PIVOTS = {
  shoulderL: { x: -18.5, y: -63 },
  shoulderR: { x: 16, y: -66 },
  neck: { x: -1, y: -69 },
};

// Racket in the racket hand, in the arm's local frame (before rotation).
export const RACKET = {
  handle: { x1: 17.5, y1: -29, x2: 24.5, y2: -12 },
  head: { cx: 28.5, cy: -19, rx: 8, ry: 11 },
};

export const HAND_REST = { x: -18.5, y: -23 };   // left hand hanging at rest
export const TOSS_APEX = { x: 4, y: -125 };      // 2.6 m above the feet

export const WALK_CYCLE_RATE = 2.4;  // phase radians per metre walked
export const LEAN_MAX = 0.14;        // radians
export const ARM_SWING = 0.6;        // radians

// Idle "ready bounce": two beats per period, the second softer, like a
// returner bouncing on the balls of the feet. Squash at each contact,
// stretch while rising.
export const READY_PERIOD = 1.1;     // seconds per two-beat cycle
export const READY_LIFT = 0.08;      // metres at the first beat's apex
export const READY_BEATS = [1, 0.7]; // relative height of beat one and two
export const READY_SQUASH = 0.07;    // scaleY lost at contact
export const READY_STRETCH = 0.05;   // scaleY gained while rising
export const READY_ARMS = 0.07;      // radians of loose arm sway
export const WALK_SQUASH = 0.08;     // scaleY lost on each footfall

// Spacebar jump: cartoon gravity so it pops rather than floats.
export const JUMP_HEIGHT = 1.4;      // metres at the apex
export const JUMP_GRAVITY = 24;      // m/s²
export const JUMP_VELOCITY = Math.sqrt(2 * JUMP_GRAVITY * JUMP_HEIGHT);

export function createRig() {
  return {
    bob: 0,          // metres, vertical offset of the whole figure
    lean: 0,         // radians, whole-figure tilt into the movement
    squashX: 1,
    squashY: 1,
    armL: 0,         // radians about shoulderL, clockwise positive
    armR: 0,         // radians about shoulderR, clockwise positive
    headTilt: 0,     // radians about the neck
    facing: 1,       // 1 = figure's right is screen right
    hop: 0,          // metres, celebration hop (tweened)
    z: 0,            // metres, jump height (integrated by the scene)
    vz: 0,           // m/s, jump vertical velocity
    airborne: false,
    flexX: 1,        // procedural squash from the ready bounce / footfalls,
    flexY: 1,        // multiplied onto squashX/Y (which the tweens own)
    phase: 0,        // walk cycle
    moving: false,
    serving: false,
    toss: 0,         // 0..1, ball travelling from the hand to TOSS_APEX
  };
}

const lerp = (a, b, k) => a + (b - a) * k;
const damp = (dt, rate) => 1 - Math.exp(-dt * rate);

// The idle ready bounce at time t: { lift (m), flexY, arm (rad) }.
export function readyBounce(t) {
  const p = (((t % READY_PERIOD) + READY_PERIOD) % READY_PERIOD) / READY_PERIOD;
  const beat = p < 0.5 ? 0 : 1;
  const q = (p - beat * 0.5) * 2; // 0..1 within the beat; 0 and 1 are contact
  const amp = READY_BEATS[beat];
  const s = Math.sin(Math.PI * q);
  const contact = (1 - s) ** 4;
  const rising = q < 0.5 ? Math.sin(2 * Math.PI * q) : 0;
  return {
    lift: READY_LIFT * amp * s,
    flexY: 1 - READY_SQUASH * amp * contact + READY_STRETCH * amp * rising,
    arm: READY_ARMS * amp * Math.sin(2 * Math.PI * q - 0.9), // lags the body
  };
}

// Procedural idle/walk. Mutates `rig`; returns 'start' | 'stop' | null so the
// caller can fire the squash-and-stretch tweens. `input.airborne` (a jump)
// hands height and squash to the scene's jump tweens.
export function updateRig(rig, input, dt, t) {
  let event = null;
  if (input.moving && !rig.moving) event = "start";
  if (!input.moving && rig.moving) event = "stop";
  rig.moving = input.moving;
  let flexY = 1;

  if (input.moving) {
    rig.phase += input.speed * dt * WALK_CYCLE_RATE;
    const stride = Math.abs(Math.sin(rig.phase));
    rig.bob = input.airborne ? lerp(rig.bob, 0, damp(dt, 20)) : stride * 0.12;
    if (!input.airborne) flexY = 1 - WALK_SQUASH * (1 - stride) ** 4; // footfall
    if (input.dirX !== 0) rig.facing = input.dirX < 0 ? -1 : 1;
    const targetLean = LEAN_MAX * Math.sign(input.dirX || rig.facing) * Math.min(1, input.speed / 5.5);
    rig.lean = lerp(rig.lean, targetLean, damp(dt, 10));
    if (!rig.serving) {
      rig.armL = Math.sin(rig.phase) * ARM_SWING;
      rig.armR = -Math.sin(rig.phase) * ARM_SWING;
    }
    rig.headTilt = lerp(rig.headTilt, -rig.lean * 0.5, damp(dt, 6));
  } else {
    rig.phase = 0;
    const still = rig.serving || input.airborne;
    const ready = still ? { lift: 0, flexY: 1, arm: 0 } : readyBounce(t);
    rig.bob = lerp(rig.bob, ready.lift, damp(dt, 20));
    flexY = ready.flexY;
    rig.lean = lerp(rig.lean, 0, damp(dt, 8));
    if (!rig.serving) {
      rig.armL = lerp(rig.armL, ready.arm, damp(dt, 10));
      rig.armR = lerp(rig.armR, -ready.arm, damp(dt, 10));
    }
    rig.headTilt = lerp(rig.headTilt, 0, damp(dt, 6));
  }
  rig.flexY = lerp(rig.flexY, flexY, damp(dt, 25));
  rig.flexX = 1 + (1 - rig.flexY) * 0.8; // keep the volume roughly constant
  return event;
}

// Where the left hand is, in figure units, for the given arm rotation.
export function handPoint(rig) {
  const len = PARTS.leftArm.h;
  const p = PIVOTS.shoulderL;
  return { x: p.x - len * Math.sin(rig.armL), y: p.y + len * Math.cos(rig.armL) };
}

// Squash on start, stretch on stop, both springing back.
export function startStopTween(rig, kind) {
  const from = kind === "start" ? { squashX: 1.08, squashY: 0.88 } : { squashX: 0.94, squashY: 1.1 };
  return gsap.fromTo(rig, from, {
    squashX: 1,
    squashY: 1,
    duration: 0.45,
    ease: "elastic.out(1, 0.45)",
    overwrite: "auto",
  });
}

// Toss (anticipation) → strike → recovery. Owns armL, armR, squash and toss
// while it runs; updateRig leaves the arms alone while rig.serving is true.
export function serveTimeline(rig, { onStrike, onComplete } = {}) {
  rig.serving = true;
  rig.toss = 0;
  const tl = gsap.timeline({
    onComplete: () => {
      rig.serving = false;
      rig.armR = 0;
      onComplete?.();
    },
  });
  // Toss: left arm rises, ball leaves the hand (toss 0→1), racket arm winds back.
  tl.to(rig, { armL: -2.6, duration: 0.3, ease: "power2.out" }, 0);
  tl.to(rig, { toss: 1, duration: 0.45, ease: "power2.out" }, 0.05);
  tl.to(rig, { armR: 2.4, duration: 0.45, ease: "power2.inOut" }, 0);
  tl.to(rig, { squashY: 1.06, squashX: 0.97, duration: 0.45, ease: "power2.out" }, 0);
  // Strike: whip over the top; contact squash.
  tl.to(rig, { armR: 3.7, duration: 0.1, ease: "power4.in" }, 0.45);
  tl.to(rig, { squashY: 0.92, squashX: 1.05, duration: 0.08, ease: "power2.in" }, 0.47);
  tl.add(() => onStrike?.(), 0.55);
  // Recovery: arms settle, body springs back.
  tl.to(rig, { armR: Math.PI * 2, duration: 0.45, ease: "elastic.out(1, 0.5)" }, 0.55);
  tl.to(rig, { armL: 0, duration: 0.4, ease: "power2.inOut" }, 0.55);
  tl.to(rig, { squashY: 1, squashX: 1, duration: 0.45, ease: "back.out(2)" }, 0.55);
  tl.set(rig, { toss: 0 }, 0.56);
  return tl;
}

// Jump take-off: squash, stretch into the air, spring back. The height is
// integrated by the scene; this only owns squashX/Y.
export function jumpTakeoffTimeline(rig) {
  gsap.killTweensOf(rig, "squashX,squashY"); // a start/stop spring mid-flight
  const tl = gsap.timeline();
  tl.set(rig, { squashX: 1.15, squashY: 0.8 }, 0);
  tl.to(rig, { squashX: 0.92, squashY: 1.12, duration: 0.12, ease: "power2.out" }, 0.04);
  tl.to(rig, { squashX: 1, squashY: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }, 0.16);
  return tl;
}

// Landing squash, springing back.
export function jumpLandTween(rig) {
  return gsap.fromTo(rig, { squashX: 1.2, squashY: 0.78 }, {
    squashX: 1,
    squashY: 1,
    duration: 0.45,
    ease: "elastic.out(1, 0.4)",
    overwrite: "auto",
  });
}

// Small hop with both arms up when a serve lands in a target.
export function celebrationTimeline(rig) {
  const tl = gsap.timeline();
  tl.to(rig, { hop: 0.4, duration: 0.22, ease: "power2.out" }, 0);
  tl.to(rig, { hop: 0, duration: 0.3, ease: "bounce.out" }, 0.22);
  tl.to(rig, { squashY: 0.9, squashX: 1.08, duration: 0.1, ease: "power2.in" }, 0.5);
  tl.to(rig, { squashY: 1, squashX: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, 0.6);
  return tl;
}
