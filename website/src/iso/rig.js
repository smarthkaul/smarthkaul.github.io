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
    hop: 0,          // metres, celebration hop
    phase: 0,        // walk cycle
    moving: false,
    serving: false,
    toss: 0,         // 0..1, ball travelling from the hand to TOSS_APEX
  };
}

const lerp = (a, b, k) => a + (b - a) * k;
const damp = (dt, rate) => 1 - Math.exp(-dt * rate);

// Procedural idle/walk. Mutates `rig`; returns 'start' | 'stop' | null so the
// caller can fire the squash-and-stretch tweens.
export function updateRig(rig, input, dt, t) {
  let event = null;
  if (input.moving && !rig.moving) event = "start";
  if (!input.moving && rig.moving) event = "stop";
  rig.moving = input.moving;

  if (input.moving) {
    rig.phase += input.speed * dt * WALK_CYCLE_RATE;
    rig.bob = Math.abs(Math.sin(rig.phase)) * 0.12;
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
    rig.bob = Math.sin(t * 2.2) * 0.03;
    rig.lean = lerp(rig.lean, 0, damp(dt, 8));
    if (!rig.serving) {
      rig.armL = lerp(rig.armL, 0, damp(dt, 10));
      rig.armR = lerp(rig.armR, 0, damp(dt, 10));
    }
    rig.headTilt = lerp(rig.headTilt, 0, damp(dt, 6));
  }
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

// Small hop with both arms up when a serve lands in a target.
export function celebrationTimeline(rig) {
  const tl = gsap.timeline();
  tl.to(rig, { hop: 0.4, duration: 0.22, ease: "power2.out" }, 0);
  tl.to(rig, { hop: 0, duration: 0.3, ease: "bounce.out" }, 0.22);
  tl.to(rig, { squashY: 0.9, squashX: 1.08, duration: 0.1, ease: "power2.in" }, 0.5);
  tl.to(rig, { squashY: 1, squashX: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, 0.6);
  return tl;
}
