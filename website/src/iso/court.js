// Court geometry in metres. SECTIONS (data/sections.js) still owns ids,
// labels and routes; this file only owns where each target sits on the
// isometric court.
import { SECTIONS } from "../data/sections";

export const COURT_M = {
  halfLength: 11.885,
  halfWidth: 5.485,        // doubles
  singlesHalfWidth: 4.115,
  serviceLine: 6.4,
  netHeight: 0.914,
  postHeight: 1.07,
  postV: 6.4,
  centreMark: 0.15,
};

const L = COURT_M.halfLength;
const W = COURT_M.halfWidth;
const S = COURT_M.singlesHalfWidth;
const SL = COURT_M.serviceLine;
const CM = COURT_M.centreMark;

// [u1, v1, u2, v2] segments, all painted white.
export const LINES = [
  [-L, -W, L, -W], [-L, W, L, W],      // doubles sidelines
  [-L, -W, -L, W], [L, -W, L, W],      // baselines
  [-L, -S, L, -S], [-L, S, L, S],      // singles sidelines
  [-SL, -S, -SL, S], [SL, -S, SL, S],  // service lines
  [-SL, 0, SL, 0],                     // centre service line
  [-L, 0, -L + CM, 0], [L - CM, 0, L, 0], // centre marks
];

// Navigation targets keyed by section id. Boxes are the two far service
// boxes; rings are archery targets on the grass beyond the far baseline.
export const TARGETS = {
  experience: { kind: "rect", u1: 0, v1: -S, u2: SL, v2: 0 },
  projects: { kind: "rect", u1: 0, v1: 0, u2: SL, v2: S },
  about: { kind: "circle", u: 14.8, v: -3.4, r: 1.7 },
  contact: { kind: "circle", u: 14.8, v: 3.4, r: 1.7 },
};

export const PLAYER_BOUNDS = { uMin: -15.5, uMax: -0.8, vMin: -7.5, vMax: 7.5 };
export const SPAWN = { u: -12.5, v: -1.5 };
export const AIM_RANGE = 17;

// World rectangle the camera frames on the hub.
export const SCENE = { uMin: -16.5, uMax: 17.5, vMin: -8.5, vMax: 8.5 };

export function sceneCorners() {
  return [
    { u: SCENE.uMin, v: SCENE.vMin, z: 0 },
    { u: SCENE.uMax, v: SCENE.vMin, z: 0 },
    { u: SCENE.uMax, v: SCENE.vMax, z: 0 },
    { u: SCENE.uMin, v: SCENE.vMax, z: 0 },
  ];
}

export function targetContains(t, p) {
  if (t.kind === "rect") return p.u >= t.u1 && p.u <= t.u2 && p.v >= t.v1 && p.v <= t.v2;
  return Math.hypot(p.u - t.u, p.v - t.v) <= t.r;
}

export function targetCenter(id) {
  const t = TARGETS[id];
  if (t.kind === "rect") return { u: (t.u1 + t.u2) / 2, v: (t.v1 + t.v2) / 2 };
  return { u: t.u, v: t.v };
}

export function inCourt(p) {
  return Math.abs(p.u) <= L && Math.abs(p.v) <= W;
}

// First ground contact → what happens. Targets are checked in SECTIONS order
// so a point on the shared centre line resolves deterministically.
export function classifyLanding(p) {
  for (const s of SECTIONS) {
    if (targetContains(TARGETS[s.id], p)) return { type: "hit", sectionId: s.id };
  }
  if (inCourt(p)) return { type: "out" };
  return { type: "beyond" };
}

// Pull the aim point back onto the circle of radius AIM_RANGE around the
// player when it is further than that.
export function clampAim(player, aim) {
  const du = aim.u - player.u;
  const dv = aim.v - player.v;
  const d = Math.hypot(du, dv);
  if (d <= AIM_RANGE) return { u: aim.u, v: aim.v, clamped: false };
  const k = AIM_RANGE / d;
  return { u: player.u + du * k, v: player.v + dv * k, clamped: true };
}

export function clampPlayer(p) {
  const b = PLAYER_BOUNDS;
  return {
    u: Math.min(b.uMax, Math.max(b.uMin, p.u)),
    v: Math.min(b.vMax, Math.max(b.vMin, p.v)),
  };
}
