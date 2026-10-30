# Isometric Court Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top-down drag-to-serve hub with an isometric WASD-and-aim tennis court whose target hits open the section pages through a reversible broadcast-style zoom-and-wipe transition.

**Architecture:** A hand-written Canvas 2D renderer (`website/src/iso/render.js`) draws a plain state object that a scene controller (`website/src/iso/scene.js`) advances on `gsap.ticker`. Pure modules (projection, court geometry, ballistics, controls, rig) hold all the math and are unit-tested; the React layer (`IsoCourt.jsx`, `BroadcastTransition.jsx`, `CourtStage.jsx`) mounts the canvas, listens to input, and runs one GSAP timeline per section visit that tweens the camera object and the DOM overlays, playing it forward on entry and in reverse on exit.

**Tech Stack:** React 18, Vite 6, Tailwind 3, GSAP 3.15 (`gsap.ticker` as the game loop), Canvas 2D. **No new dependencies.**

**Spec:** `plan/2026-10-30-isometric-court-prototype-design.md`

## Global Constraints

- No new npm dependencies. Added bundle cost must be 0 KB of third-party code (spec: "Engine choice").
- All simulation in metres; `u` along the court (negative = server's half), `v` across (negative = left as the server faces the net), `z` up.
- Projection: `sx = (u + v)·K`, `sy = −(u − v)·K/2 − z·K`, with `K = 28` px per metre at zoom 1.
- `SECTIONS` in `website/src/data/sections.js` stays the single source of truth for section ids, labels, broadcast labels and routes. Only geometry moves to `src/iso/court.js`.
- Palette: `grass` `#2f8f4e` / `#276e3c`, `wimbledon` `#4c2c69` / dark `#3a2151`, `cream` `#f4f1e9`, `charcoal` `#181b18`, `ball` `#d6f84c`. Never violet/indigo/slate.
- `font-display` (Syne) for headings and the slam caption; `font-mono` for eyebrows/tickers/hints.
- `prefers-reduced-motion` → every scripted motion is instant (`progress(1)`/`progress(0)`, zero-duration serve, teleporting ball).
- A target hit stays silent. The crowd groan (`src/assets/crowd-aww.mp3`, volume 0.08) plays on `out` and `beyond` only.
- All npm commands run from `website/`. `npm run lint`, `npm run test`, `npm run build` must pass at the end of every task.
- Commit after every task. Commit messages: imperative subject, plain body, no AI attribution of any kind.
- Keep the existing image-to-slot mapping from `Player.jsx`: the file `right-arm.png` is drawn in the **left** arm slot and `left-arm.png` is the swinging racket arm.

## Review Focus

Inputs the spec implies but a hasty implementation breaks; each has a test in the owning task:

1. **Serving before any pointer movement** (no aim yet): the serve must be ignored, not throw or launch at `(0,0)`. → Task 7 test "serve without an aim is ignored".
2. **Landing exactly on a target edge or the net line** (`u = 0`): the service boxes start at `u = 0`; a point with `u = 0` counts as inside (`>=`), and `u = -0.001` is `out`. → Task 1 test "edges are inclusive".
3. **Window resize while zoomed into a section**: the camera must not snap back to the fit view underneath the content. → Task 7 test "resize does not refit while the camera is locked".
4. **Navigating back during the forward animation** (Back link mid-zoom): the timeline reverses from its current progress; no stuck half-covered screen. → Task 9 behaviour "exit during entry reverses in place"; covered by the controller logic calling `reverse()` on whatever progress the timeline has (verified in the browser, noted in the task).
5. **Deep link on first load / jsdom** (`/projects/this-site` opened directly, or rendered in tests): the content must be visible immediately with no animation and no canvas. → Task 9 test in `routes.test.jsx` (existing assertions must keep passing with `IsoCourt` mocked).

---

## File map

New files (all under `website/src/`):

| File | Responsibility |
|---|---|
| `iso/projection.js` | `K`, project/unproject, depth key, camera fit, screen↔world helpers, iso ellipse radii |
| `iso/court.js` | court dimensions, line segments, `TARGETS`, bounds, spawn, aim range, classification, clamps |
| `iso/ballistics.js` | launch velocity for an exact landing, kinematic step with bounces and settle |
| `iso/controls.js` | key set → screen-relative world move vector, velocity smoothing |
| `iso/rig.js` | player rig state, procedural idle/walk, start/stop tweens, serve timeline, hand point |
| `iso/render.js` | all Canvas 2D drawing |
| `iso/scene.js` | the simulation/controller: ticker, state, camera, input, ball lifecycle, callbacks |
| `components/iso/IsoCourt.jsx` | React wrapper: canvas, image preload, listeners, hint, exposes the scene |
| `components/iso/BroadcastTransition.jsx` | overlay DOM + `buildTransition()` GSAP timeline factory |

Modified: `pages/CourtStage.jsx`, `pages/Layout.jsx`, `test/routes.test.jsx`, `../AGENTS.md`.
Deleted: `components/court/Ball.jsx`, `components/court/Player.jsx`.

Task dependency graph (tasks on the same line are independent and may run in parallel):

```
Wave A: Task 1 (projection + court)   Task 2 (ballistics)   Task 3 (rig)   Task 4 (transition overlay)
Wave B: Task 5 (controls)             Task 6 (render)             ← need Task 1
Wave C: Task 7 (scene)                                            ← needs 1,2,3,5,6
Wave D: Task 8 (IsoCourt wrapper)                                 ← needs 7
Wave E: Task 9 (CourtStage integration, Layout, tests, deletions) ← needs 4,8
Wave F: Task 10 (AGENTS.md, final verification)
```

---

### Task 1: Projection and court geometry

**Files:**
- Create: `website/src/iso/projection.js`
- Create: `website/src/iso/court.js`
- Test: `website/src/iso/projection.test.js`
- Test: `website/src/iso/court.test.js`

**Interfaces:**
- Consumes: `SECTIONS` from `website/src/data/sections.js`.
- Produces (`projection.js`): `K`, `project(u, v, z=0) → {x, y}`, `unproject(x, y) → {u, v}`, `unprojectDelta(dx, dy) → {u, v}`, `depthKey(u, v) → number`, `isoRadii(r, zoom) → {rx, ry}`, `projectBounds(points) → {minX, minY, maxX, maxY}`, `fitCamera(viewport, bounds, margin=0.06) → {x, y, zoom}`, `worldToScreen(p, cam, viewport) → {x, y}`, `screenToGround(sx, sy, cam, viewport) → {u, v}`. `viewport` is always `{ width, height }` in CSS px. `cam` is always `{ x, y, zoom }`.
- Produces (`court.js`): `COURT_M`, `LINES` (array of `[u1, v1, u2, v2]`), `TARGETS` (keyed by section id), `PLAYER_BOUNDS`, `SPAWN`, `AIM_RANGE`, `SCENE`, `sceneCorners() → [{u, v, z:0}]`, `targetContains(target, p) → boolean`, `targetCenter(id) → {u, v}`, `inCourt(p) → boolean`, `classifyLanding(p) → {type:'hit', sectionId} | {type:'out'} | {type:'beyond'}`, `clampAim(player, aim) → {u, v, clamped}`, `clampPlayer(p) → {u, v}`.

- [ ] **Step 1: Write the failing projection tests**

`website/src/iso/projection.test.js`:

```js
import { describe, it, expect } from "vitest";
import {
  K, project, unproject, unprojectDelta, depthKey, isoRadii,
  projectBounds, fitCamera, worldToScreen, screenToGround,
} from "./projection";

describe("projection", () => {
  it("puts the near baseline bottom-left and the far baseline top-right", () => {
    const near = project(-11.885, 0);
    const far = project(11.885, 0);
    expect(near.x).toBeLessThan(far.x);
    expect(near.y).toBeGreaterThan(far.y); // larger y = lower on screen
  });

  it("is a 2:1 dimetric projection", () => {
    const o = project(0, 0);
    const alongU = project(1, 0);
    expect(alongU.x - o.x).toBeCloseTo(K);
    expect(alongU.y - o.y).toBeCloseTo(-K / 2);
    const alongV = project(0, 1);
    expect(alongV.x - o.x).toBeCloseTo(K);
    expect(alongV.y - o.y).toBeCloseTo(K / 2);
  });

  it("lifts z straight up the screen by K per metre", () => {
    const ground = project(3, -2, 0);
    const up = project(3, -2, 2);
    expect(up.x).toBeCloseTo(ground.x);
    expect(up.y).toBeCloseTo(ground.y - 2 * K);
  });

  it("round-trips ground points through unproject", () => {
    for (const [u, v] of [[0, 0], [-12.5, -1.5], [6.4, 4.115], [14.8, -3.4]]) {
      const p = project(u, v);
      const back = unproject(p.x, p.y);
      expect(back.u).toBeCloseTo(u);
      expect(back.v).toBeCloseTo(v);
    }
  });

  it("unprojectDelta maps screen-up to the far-left diagonal", () => {
    const d = unprojectDelta(0, -1);
    expect(d.u).toBeGreaterThan(0);
    expect(d.v).toBeLessThan(0);
    expect(Math.abs(d.u)).toBeCloseTo(Math.abs(d.v));
  });

  it("depthKey grows as points come nearer (lower on screen)", () => {
    expect(depthKey(-12, 0)).toBeGreaterThan(depthKey(0, 0));
    expect(depthKey(0, 0)).toBeGreaterThan(depthKey(12, 0));
  });

  it("isoRadii gives a 2:1 ellipse scaled by zoom", () => {
    const r = isoRadii(1, 2);
    expect(r.rx).toBeCloseTo(K * 2 * Math.SQRT2);
    expect(r.ry).toBeCloseTo((K * 2) / Math.SQRT2);
  });

  it("fitCamera centres the bounds and fits the limiting axis with a margin", () => {
    const bounds = { minX: -100, minY: -50, maxX: 100, maxY: 50 };
    const cam = fitCamera({ width: 1000, height: 1000 }, bounds, 0.1);
    expect(cam.x).toBeCloseTo(0);
    expect(cam.y).toBeCloseTo(0);
    expect(cam.zoom).toBeCloseTo((1000 * 0.9) / 200); // width-limited
    const tall = fitCamera({ width: 1000, height: 200 }, bounds, 0);
    expect(tall.zoom).toBeCloseTo(200 / 100); // height-limited
  });

  it("worldToScreen and screenToGround invert each other through the camera", () => {
    const cam = { x: 40, y: -20, zoom: 1.7 };
    const viewport = { width: 1280, height: 720 };
    const p = project(5, -3);
    const s = worldToScreen(p, cam, viewport);
    const g = screenToGround(s.x, s.y, cam, viewport);
    expect(g.u).toBeCloseTo(5);
    expect(g.v).toBeCloseTo(-3);
    const centre = worldToScreen({ x: 40, y: -20 }, cam, viewport);
    expect(centre).toEqual({ x: 640, y: 360 });
  });

  it("projectBounds spans all projected points", () => {
    const b = projectBounds([{ u: 0, v: 0, z: 0 }, { u: 10, v: 0, z: 0 }, { u: 0, v: 0, z: 3 }]);
    expect(b.minX).toBeCloseTo(0);
    expect(b.maxX).toBeCloseTo(10 * K);
    expect(b.minY).toBeCloseTo(-5 * K);
    expect(b.maxY).toBeCloseTo(0);
  });
});
```

- [ ] **Step 2: Run the projection tests to verify they fail**

Run (from `website/`): `npx vitest run src/iso/projection.test.js`
Expected: FAIL — "Failed to resolve import ./projection".

- [ ] **Step 3: Write `projection.js`**

```js
// 2:1 dimetric projection of the tennis court. World units are metres:
// u along the court (negative = the server's half), v across it (negative =
// left as the server faces the net), z up. Screen units are CSS pixels at
// zoom 1; the camera scales them.

export const K = 28; // px per metre at zoom 1

export function project(u, v, z = 0) {
  return { x: (u + v) * K, y: (-(u - v) * K) / 2 - z * K };
}

// Inverse of project() on the ground plane (z = 0). Linear, so it also works
// for deltas.
export function unproject(x, y) {
  const a = x / K;
  const b = (2 * y) / K;
  return { u: (a - b) / 2, v: (a + b) / 2 };
}

export const unprojectDelta = unproject;

// Ground-plane screen y: larger = nearer the viewer = drawn later.
export function depthKey(u, v) {
  return (-(u - v) * K) / 2;
}

// Semi-axes of the ellipse a ground circle of radius r (metres) projects to.
export function isoRadii(r, zoom) {
  const s = r * K * zoom;
  return { rx: s * Math.SQRT2, ry: s / Math.SQRT2 };
}

export function projectBounds(points) {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of points) {
    const s = project(p.u, p.v, p.z ?? 0);
    if (s.x < b.minX) b.minX = s.x;
    if (s.x > b.maxX) b.maxX = s.x;
    if (s.y < b.minY) b.minY = s.y;
    if (s.y > b.maxY) b.maxY = s.y;
  }
  return b;
}

// Camera that frames `bounds` (projected space) inside `viewport` with a
// fractional margin on the limiting axis. cam.x/cam.y is the projected-space
// point shown at the viewport centre; zoom multiplies K.
export function fitCamera(viewport, bounds, margin = 0.06) {
  const bw = Math.max(1e-6, bounds.maxX - bounds.minX);
  const bh = Math.max(1e-6, bounds.maxY - bounds.minY);
  const zoom = Math.min(viewport.width / bw, viewport.height / bh) * (1 - margin);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    zoom,
  };
}

export function worldToScreen(p, cam, viewport) {
  return {
    x: (p.x - cam.x) * cam.zoom + viewport.width / 2,
    y: (p.y - cam.y) * cam.zoom + viewport.height / 2,
  };
}

export function screenToGround(sx, sy, cam, viewport) {
  const px = (sx - viewport.width / 2) / cam.zoom + cam.x;
  const py = (sy - viewport.height / 2) / cam.zoom + cam.y;
  return unproject(px, py);
}
```

- [ ] **Step 4: Run the projection tests to verify they pass**

Run: `npx vitest run src/iso/projection.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Write the failing court tests**

`website/src/iso/court.test.js`:

```js
import { describe, it, expect } from "vitest";
import { SECTIONS } from "../data/sections";
import {
  COURT_M, LINES, TARGETS, PLAYER_BOUNDS, SPAWN, AIM_RANGE, SCENE,
  sceneCorners, targetContains, targetCenter, inCourt, classifyLanding,
  clampAim, clampPlayer,
} from "./court";

describe("court geometry", () => {
  it("has a target for every section and no extras", () => {
    expect(Object.keys(TARGETS).sort()).toEqual(SECTIONS.map((s) => s.id).sort());
  });

  it("uses real court dimensions", () => {
    expect(COURT_M.halfLength).toBeCloseTo(11.885);
    expect(COURT_M.halfWidth).toBeCloseTo(5.485);
    expect(COURT_M.singlesHalfWidth).toBeCloseTo(4.115);
    expect(COURT_M.serviceLine).toBeCloseTo(6.4);
  });

  it("draws the doubles rectangle, singles sidelines, service lines, centre line and centre marks", () => {
    // 4 sides + 2 singles + 2 service + 1 centre service + 2 centre marks
    expect(LINES).toHaveLength(11);
    for (const seg of LINES) expect(seg).toHaveLength(4);
  });

  it("targetCenter returns the middle of a box and the centre of a ring", () => {
    expect(targetCenter("experience")).toEqual({ u: 3.2, v: -2.0575 });
    expect(targetCenter("about")).toEqual({ u: 14.8, v: -3.4 });
  });

  it("classifies hits, outs and beyonds", () => {
    expect(classifyLanding({ u: 3, v: -2 })).toEqual({ type: "hit", sectionId: "experience" });
    expect(classifyLanding({ u: 3, v: 2 })).toEqual({ type: "hit", sectionId: "projects" });
    expect(classifyLanding({ u: 14.8, v: -3.4 })).toEqual({ type: "hit", sectionId: "about" });
    expect(classifyLanding({ u: 15.5, v: 4.0 })).toEqual({ type: "hit", sectionId: "contact" });
    expect(classifyLanding({ u: 9, v: 0 })).toEqual({ type: "out" });   // far court, no box
    expect(classifyLanding({ u: -5, v: 0 })).toEqual({ type: "out" });  // server's half
    expect(classifyLanding({ u: 3, v: 5 })).toEqual({ type: "out" });   // doubles alley
    expect(classifyLanding({ u: 20, v: 0 })).toEqual({ type: "beyond" });
    expect(classifyLanding({ u: 0, v: 9 })).toEqual({ type: "beyond" });
  });

  it("edges are inclusive: the net line and the centre line belong to the boxes", () => {
    expect(classifyLanding({ u: 0, v: -2 })).toEqual({ type: "hit", sectionId: "experience" });
    expect(classifyLanding({ u: -0.001, v: -2 })).toEqual({ type: "out" });
    expect(classifyLanding({ u: 3, v: 0 }).type).toBe("hit"); // on the centre line, first match wins
    expect(classifyLanding({ u: 6.4, v: -1 })).toEqual({ type: "hit", sectionId: "experience" });
    expect(classifyLanding({ u: 6.401, v: -1 })).toEqual({ type: "out" });
  });

  it("targetContains works for rings by distance", () => {
    const about = TARGETS.about;
    expect(targetContains(about, { u: 14.8 + 1.69, v: -3.4 })).toBe(true);
    expect(targetContains(about, { u: 14.8 + 1.71, v: -3.4 })).toBe(false);
  });

  it("inCourt is the doubles rectangle", () => {
    expect(inCourt({ u: 11.885, v: 5.485 })).toBe(true);
    expect(inCourt({ u: 11.9, v: 0 })).toBe(false);
  });

  it("clampAim keeps the aim within AIM_RANGE of the player and flags it", () => {
    const player = { u: -12, v: 0 };
    const near = clampAim(player, { u: -2, v: 0 });
    expect(near).toEqual({ u: -2, v: 0, clamped: false });
    const far = clampAim(player, { u: 30, v: 0 });
    expect(far.clamped).toBe(true);
    expect(Math.hypot(far.u - player.u, far.v - player.v)).toBeCloseTo(AIM_RANGE);
    expect(far.v).toBeCloseTo(0);
  });

  it("the far service boxes are reachable from the spawn and the rings from the net", () => {
    expect(Math.hypot(3.2 - SPAWN.u, -2.0575 - SPAWN.v)).toBeLessThan(AIM_RANGE);
    expect(Math.hypot(14.8 - PLAYER_BOUNDS.uMax, 3.4)).toBeLessThan(AIM_RANGE);
    expect(Math.hypot(14.8 - SPAWN.u, 3.4 - SPAWN.v)).toBeGreaterThan(AIM_RANGE); // must walk
  });

  it("clampPlayer never lets the player cross the net", () => {
    expect(clampPlayer({ u: 5, v: 0 })).toEqual({ u: PLAYER_BOUNDS.uMax, v: 0 });
    expect(clampPlayer({ u: -40, v: -40 })).toEqual({ u: PLAYER_BOUNDS.uMin, v: PLAYER_BOUNDS.vMin });
    expect(clampPlayer({ u: -10, v: 3 })).toEqual({ u: -10, v: 3 });
  });

  it("sceneCorners covers the court, the rings and the run-up", () => {
    const c = sceneCorners();
    expect(c).toHaveLength(4);
    expect(Math.min(...c.map((p) => p.u))).toBeLessThanOrEqual(PLAYER_BOUNDS.uMin);
    expect(Math.max(...c.map((p) => p.u))).toBeGreaterThanOrEqual(14.8 + 1.7);
    expect(SCENE.vMax).toBeGreaterThanOrEqual(PLAYER_BOUNDS.vMax);
  });
});
```

- [ ] **Step 6: Run the court tests to verify they fail**

Run: `npx vitest run src/iso/court.test.js`
Expected: FAIL — "Failed to resolve import ./court".

- [ ] **Step 7: Write `court.js`**

```js
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
```

- [ ] **Step 8: Run both test files to verify they pass**

Run: `npx vitest run src/iso`
Expected: PASS (all tests in both files).

- [ ] **Step 9: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/iso/projection.js website/src/iso/projection.test.js website/src/iso/court.js website/src/iso/court.test.js
git commit -m "Add isometric projection and court geometry modules"
```

---

### Task 2: Ballistics

**Files:**
- Create: `website/src/iso/ballistics.js`
- Test: `website/src/iso/ballistics.test.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `GRAVITY`, `LAUNCH_HEIGHT`, `RESTITUTION`, `FRICTION`, `MAX_BOUNCES`, `SETTLE_VZ`, `flightTime(d) → seconds`, `launchVelocity(from, to, h0=LAUNCH_HEIGHT, g=GRAVITY) → {vu, vv, vz, T}`, `createBallBody(u, v, z, vel) → body`, `stepBall(body, dt, g=GRAVITY) → events[]`. A `body` is `{ u, v, z, vu, vv, vz, bounces }` and is mutated in place. Events are `{ type: 'contact', u, v, first, speed }` and `{ type: 'settle' }`.

- [ ] **Step 1: Write the failing tests**

`website/src/iso/ballistics.test.js`:

```js
import { describe, it, expect } from "vitest";
import {
  GRAVITY, LAUNCH_HEIGHT, MAX_BOUNCES, flightTime, launchVelocity,
  createBallBody, stepBall,
} from "./ballistics";

const simulateToFirstContact = (from, to, dt) => {
  const vel = launchVelocity(from, to);
  const body = createBallBody(from.u, from.v, LAUNCH_HEIGHT, vel);
  for (let t = 0; t < 5; t += dt) {
    const events = stepBall(body, dt);
    const contact = events.find((e) => e.type === "contact");
    if (contact) return { contact, t, body };
  }
  throw new Error("never landed");
};

describe("ballistics", () => {
  it("flight time grows with distance and is clamped", () => {
    expect(flightTime(0)).toBeCloseTo(0.6);
    expect(flightTime(10)).toBeCloseTo(0.85);
    expect(flightTime(100)).toBeCloseTo(1.2);
  });

  it("launchVelocity lands the ball on the aim point at 60 fps", () => {
    const from = { u: -12.5, v: -1.5 };
    for (const to of [{ u: 3.2, v: -2.06 }, { u: 4, v: 3 }, { u: -2, v: -1.5 }]) {
      const { contact } = simulateToFirstContact(from, to, 1 / 60);
      expect(contact.first).toBe(true);
      expect(Math.hypot(contact.u - to.u, contact.v - to.v)).toBeLessThan(0.05);
    }
  });

  it("takes about the planned flight time to land", () => {
    const from = { u: -12.5, v: 0 };
    const to = { u: 3, v: 0 };
    const { T } = launchVelocity(from, to);
    const { t } = simulateToFirstContact(from, to, 1 / 120);
    expect(Math.abs(t - T)).toBeLessThan(0.03);
  });

  it("a zero-distance serve drops straight down", () => {
    const vel = launchVelocity({ u: 1, v: 1 }, { u: 1, v: 1 });
    expect(vel.vu).toBe(0);
    expect(vel.vv).toBe(0);
    expect(Number.isFinite(vel.vz)).toBe(true);
  });

  it("bounces lose height and speed, then settle after MAX_BOUNCES", () => {
    const body = createBallBody(0, 0, 0, { vu: 10, vv: 0, vz: 8 });
    const heights = [];
    let settled = false;
    let peak = 0;
    for (let t = 0; t < 10 && !settled; t += 1 / 120) {
      const events = stepBall(body, 1 / 120);
      peak = Math.max(peak, body.z);
      for (const e of events) {
        if (e.type === "contact") { heights.push(peak); peak = 0; }
        if (e.type === "settle") settled = true;
      }
    }
    expect(settled).toBe(true);
    expect(body.bounces).toBe(MAX_BOUNCES);
    expect(heights.length).toBe(MAX_BOUNCES);
    expect(heights[1]).toBeLessThan(heights[0]);
    expect(heights[2]).toBeLessThan(heights[1]);
    expect(body.vu).toBe(0);
    expect(body.vz).toBe(0);
    expect(body.z).toBe(0);
  });

  it("never reports z below the ground after a contact", () => {
    const body = createBallBody(0, 0, 2, { vu: 0, vv: 0, vz: 0 });
    for (let i = 0; i < 400; i++) {
      stepBall(body, 1 / 60);
      expect(body.z).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses cartoon gravity, snappier than Earth's", () => {
    expect(GRAVITY).toBeGreaterThan(9.81);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/iso/ballistics.test.js`
Expected: FAIL — "Failed to resolve import ./ballistics".

- [ ] **Step 3: Write `ballistics.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/iso/ballistics.test.js`
Expected: PASS (7 tests). If "lands the ball on the aim point" misses by more than 0.05 m, the kinematic update is wrong — it must be `z += vz·dt − ½·g·dt²` followed by `vz −= g·dt`, not plain Euler.

- [ ] **Step 5: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/iso/ballistics.js website/src/iso/ballistics.test.js
git commit -m "Add ball ballistics with exact landing and cartoon bounces"
```

---

### Task 3: The player rig

**Files:**
- Create: `website/src/iso/rig.js`
- Test: `website/src/iso/rig.test.js`

**Interfaces:**
- Consumes: `gsap` only.
- Produces: `FIGURE_HEIGHT` (metres), `FIGURE_UNITS` (125), `UNIT` (metres per figure unit), `PARTS`, `PIVOTS`, `RACKET`, `HAND_REST`, `TOSS_APEX`, `createRig() → rig`, `updateRig(rig, input, dt, t) → 'start' | 'stop' | null`, `handPoint(rig) → {x, y}` (figure units, left hand), `startStopTween(rig, kind) → gsap.Tween`, `serveTimeline(rig, callbacks) → gsap.Timeline`.
- `rig` shape: `{ bob, lean, squashX, squashY, armL, armR, headTilt, facing, hop, phase, moving, serving, toss }`. Angles in **radians, positive = clockwise on screen** (canvas convention). `facing` is `1` (figure's right = screen right) or `-1`. `toss` is `0..1` progress of the ball leaving the hand toward `TOSS_APEX`.
- `input` shape for `updateRig`: `{ moving: boolean, speed: number (m/s), dirX: number (screen-x sign of movement, -1..1) }`.
- `callbacks` for `serveTimeline`: `{ onStrike(), onComplete() }`.

Figure units are the viewBox units of the retired `Player.jsx`, re-origined so **(0, 0) is between the feet** and y is negative upward. The figure is 125 units tall. Source numbers: head 46×56 at (76,95); body 30×72 at (85,148); left slot 17×40 at (73,157); racket arm 17×42 at (109,155) with shoulder (116,154); feet at y = 220; figure centre x = 100.

- [ ] **Step 1: Write the failing tests**

`website/src/iso/rig.test.js`:

```js
import { describe, it, expect } from "vitest";
import {
  FIGURE_HEIGHT, FIGURE_UNITS, UNIT, PARTS, PIVOTS, createRig, updateRig, handPoint,
  HAND_REST, TOSS_APEX,
} from "./rig";

describe("rig geometry", () => {
  it("scales 125 figure units to the cartoon figure height", () => {
    expect(FIGURE_UNITS).toBe(125);
    expect(UNIT * FIGURE_UNITS).toBeCloseTo(FIGURE_HEIGHT);
  });

  it("puts the feet at the origin and the head top at -125", () => {
    expect(PARTS.body.y + PARTS.body.h).toBeCloseTo(0);
    expect(PARTS.head.y).toBeCloseTo(-125);
  });

  it("keeps the retired SVG layout: racket shoulder right of centre, left arm left of it", () => {
    expect(PIVOTS.shoulderR.x).toBeGreaterThan(0);
    expect(PIVOTS.shoulderL.x).toBeLessThan(0);
    expect(PIVOTS.neck.y).toBeLessThan(PIVOTS.shoulderR.y); // neck is above the shoulders
  });

  it("the toss apex is above the head, at the launch height", () => {
    expect(TOSS_APEX.y).toBeLessThanOrEqual(-FIGURE_UNITS);
    expect(-TOSS_APEX.y * UNIT).toBeCloseTo(2.6, 1);
    expect(HAND_REST.y).toBeGreaterThan(TOSS_APEX.y);
  });
});

describe("updateRig", () => {
  it("idles with a gentle bob and no lean", () => {
    const rig = createRig();
    updateRig(rig, { moving: false, speed: 0, dirX: 0 }, 1 / 60, 0.7);
    expect(Math.abs(rig.bob)).toBeLessThan(0.05);
    expect(rig.lean).toBeCloseTo(0, 1);
    expect(rig.phase).toBe(0);
  });

  it("reports a start on the first moving frame and a stop when movement ends", () => {
    const rig = createRig();
    expect(updateRig(rig, { moving: true, speed: 5, dirX: 1 }, 1 / 60, 0)).toBe("start");
    expect(updateRig(rig, { moving: true, speed: 5, dirX: 1 }, 1 / 60, 0.02)).toBe(null);
    expect(updateRig(rig, { moving: false, speed: 0, dirX: 0 }, 1 / 60, 0.04)).toBe("stop");
    expect(updateRig(rig, { moving: false, speed: 0, dirX: 0 }, 1 / 60, 0.06)).toBe(null);
  });

  it("walking advances the phase, bobs, leans into the movement and swings the arms", () => {
    const rig = createRig();
    let t = 0;
    for (let i = 0; i < 30; i++) {
      updateRig(rig, { moving: true, speed: 5.5, dirX: 1 }, 1 / 60, (t += 1 / 60));
    }
    expect(rig.phase).toBeGreaterThan(0);
    expect(rig.lean).toBeGreaterThan(0.05);
    expect(Math.abs(rig.armL) + Math.abs(rig.armR)).toBeGreaterThan(0.05);
    expect(rig.facing).toBe(1);
  });

  it("faces screen-left when moving left", () => {
    const rig = createRig();
    updateRig(rig, { moving: true, speed: 5, dirX: -1 }, 1 / 60, 0);
    expect(rig.facing).toBe(-1);
    expect(rig.lean).toBeLessThan(0);
  });

  it("leaves the arms alone while serving", () => {
    const rig = createRig();
    rig.serving = true;
    rig.armR = 2;
    rig.armL = -1;
    updateRig(rig, { moving: false, speed: 0, dirX: 0 }, 1 / 60, 1);
    expect(rig.armR).toBe(2);
    expect(rig.armL).toBe(-1);
  });
});

describe("handPoint", () => {
  it("hangs below the left shoulder at rest and rises when the arm rotates forward", () => {
    const rig = createRig();
    const rest = handPoint(rig);
    expect(rest.y).toBeGreaterThan(PIVOTS.shoulderL.y);
    rig.armL = -2.6;
    const up = handPoint(rig);
    expect(up.y).toBeLessThan(PIVOTS.shoulderL.y);
    expect(up.x).toBeGreaterThan(rest.x); // forward = figure's right
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/iso/rig.test.js`
Expected: FAIL — "Failed to resolve import ./rig".

- [ ] **Step 3: Write `rig.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/iso/rig.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/iso/rig.js website/src/iso/rig.test.js
git commit -m "Add the procedural player rig with serve and celebration timelines"
```

---

### Task 4: Broadcast transition overlay and timeline

**Files:**
- Create: `website/src/components/iso/BroadcastTransition.jsx`
- Test: `website/src/components/iso/BroadcastTransition.test.jsx`

**Interfaces:**
- Consumes: `gsap`; a section object `{ id, label, broadcast }` from `SECTIONS`.
- Produces: default export `BroadcastTransition` — `forwardRef` component with props `{ section }` that renders the fixed overlay DOM (`pointer-events-none`, `z-30`) and exposes `ref.current.getEls() → { vignette, slam, panels: [HTMLElement×3], ticker, flash }`. Named export `buildTransition({ els, cam, focus, zoomFactor = 3, content, card, reduced }) → gsap.core.Timeline` (paused). `cam` is the live camera object `{ x, y, zoom }` — the timeline tweens it in place; `focus` is `{ x, y }` in projected space (the target centre); `content` is the section wrapper element (starts `visibility:hidden; opacity:0`); `card` is the element inside it that slides in. `reduced` makes every duration 0.

The overlay is purely decorative: `aria-hidden="true"` on the root. Text uses the site fonts: slam caption in `font-display` (Syne) italic, eyebrow and ticker in `font-mono`.

- [ ] **Step 1: Write the failing test**

`website/src/components/iso/BroadcastTransition.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import gsap from "gsap";
import BroadcastTransition, { buildTransition } from "./BroadcastTransition";

const section = { id: "experience", label: "Experience", broadcast: "Career Record" };

const setup = () => {
  const ref = createRef();
  const utils = render(<BroadcastTransition ref={ref} section={section} />);
  const content = document.createElement("div");
  content.style.visibility = "hidden";
  content.style.opacity = "0";
  const card = document.createElement("div");
  content.appendChild(card);
  document.body.appendChild(content);
  return { ref, content, card, ...utils };
};

describe("BroadcastTransition", () => {
  it("renders the caption from the section and is hidden from assistive tech", () => {
    const { container } = setup();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(container.textContent).toMatch(/Career Record/);
    expect(container.textContent).toMatch(/Experience/);
  });

  it("exposes the overlay elements", () => {
    const { ref } = setup();
    const els = ref.current.getEls();
    expect(els.vignette).toBeInstanceOf(HTMLElement);
    expect(els.slam).toBeInstanceOf(HTMLElement);
    expect(els.panels).toHaveLength(3);
    expect(els.ticker).toBeInstanceOf(HTMLElement);
    expect(els.flash).toBeInstanceOf(HTMLElement);
  });

  it("builds a paused timeline that zooms the camera onto the focus and reveals the content", () => {
    const { ref, content, card } = setup();
    const cam = { x: 10, y: 20, zoom: 1 };
    const tl = buildTransition({
      els: ref.current.getEls(), cam, focus: { x: 100, y: -50 }, content, card, reduced: false,
    });
    expect(tl.paused()).toBe(true);
    expect(tl.duration()).toBeGreaterThan(1.5);
    tl.progress(1);
    expect(cam.x).toBeCloseTo(100);
    expect(cam.y).toBeCloseTo(-50);
    expect(cam.zoom).toBeCloseTo(3);
    expect(content.style.visibility).toBe("inherit");
    expect(Number(content.style.opacity)).toBe(1);
    // Reversing restores the camera and hides the content again.
    tl.progress(0);
    expect(cam.x).toBeCloseTo(10);
    expect(cam.zoom).toBeCloseTo(1);
    expect(content.style.visibility).toBe("hidden");
    tl.kill();
  });

  it("is instant under reduced motion", () => {
    const { ref, content, card } = setup();
    const tl = buildTransition({
      els: ref.current.getEls(), cam: { x: 0, y: 0, zoom: 1 }, focus: { x: 1, y: 1 }, content, card, reduced: true,
    });
    expect(tl.duration()).toBeLessThan(0.01);
    tl.kill();
    gsap.globalTimeline.clear();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/iso/BroadcastTransition.test.jsx`
Expected: FAIL — "Failed to resolve import ./BroadcastTransition".

- [ ] **Step 3: Write `BroadcastTransition.jsx`**

```jsx
import { forwardRef, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

// The ESPN-style hand-off between the court and a section: a slam caption, a
// vignette, three angled wipe panels with a ticker, and a flash. All DOM so
// the fonts and edges stay crisp; the camera zoom lives on the canvas and is
// tweened by buildTransition() through the shared cam object.

const PANEL_COLORS = ["#3a2151", "#d6f84c", "#f4f1e9"]; // wimbledon-dark, ball, cream

const tickerText = (section) =>
  Array(6).fill(`SMARTH KAUL · ${section.broadcast} · ${section.label}`).join("  ·  ").toUpperCase();

const BroadcastTransition = forwardRef(({ section }, ref) => {
  const vignette = useRef(null);
  const slam = useRef(null);
  const panels = useRef([]);
  const ticker = useRef(null);
  const flash = useRef(null);

  useImperativeHandle(ref, () => ({
    getEls: () => ({
      vignette: vignette.current,
      slam: slam.current,
      panels: panels.current.filter(Boolean),
      ticker: ticker.current,
      flash: flash.current,
    }),
  }));

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        ref={vignette}
        className="absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(24,27,24,0.45) 0%, rgba(24,27,24,0.92) 100%)",
        }}
      />

      <div
        ref={slam}
        className="absolute left-[8%] bottom-[16%] opacity-0"
        style={{ transform: "skewX(-8deg)" }}
      >
        <p className="font-mono text-ball text-xs sm:text-sm uppercase tracking-[0.3em] mb-2">
          {section?.broadcast}
        </p>
        <div className="relative inline-block">
          <span className="absolute inset-y-1 -inset-x-3 bg-ball" />
          <h2
            className="relative font-display font-extrabold italic uppercase text-charcoal leading-none px-1"
            style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
          >
            {section?.label}
          </h2>
        </div>
      </div>

      {PANEL_COLORS.map((color, i) => (
        <div
          key={color}
          ref={(el) => (panels.current[i] = el)}
          className="absolute top-0 bottom-0 w-[130vw] -left-[15vw] overflow-hidden"
          style={{ background: color, transform: "skewX(-14deg) translateX(-130%)" }}
        >
          {i === 1 && (
            <div
              ref={ticker}
              className="absolute top-1/2 -translate-y-1/2 left-0 whitespace-nowrap font-mono text-charcoal text-sm sm:text-base tracking-[0.35em]"
              style={{ transform: "skewX(14deg)" }}
            >
              {section ? tickerText(section) : ""}
            </div>
          )}
        </div>
      ))}

      <div ref={flash} className="absolute inset-0 bg-white opacity-0" />
    </div>
  );
});
BroadcastTransition.displayName = "BroadcastTransition";

export default BroadcastTransition;

// One reversible timeline per section visit. Forward = court → content;
// reverse() = content → court. Every value is set through tweens (fromTo /
// set) so reverse restores the exact start state.
export function buildTransition({ els, cam, focus, zoomFactor = 3, content, card, reduced }) {
  const d = (seconds) => (reduced ? 0 : seconds);
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  const { vignette, slam, panels, ticker, flash } = els;
  const from = { x: cam.x, y: cam.y, zoom: cam.zoom };

  // Slam caption.
  tl.fromTo(slam, { autoAlpha: 0, scale: 1.4, x: -40 }, { autoAlpha: 1, scale: 1, x: 0, duration: d(0.35), ease: "back.out(1.8)" }, 0);

  // Vignette + camera push.
  tl.fromTo(vignette, { autoAlpha: 0 }, { autoAlpha: 1, duration: d(0.6), ease: "power2.out" }, d(0.1));
  tl.fromTo(
    cam,
    { x: from.x, y: from.y, zoom: from.zoom },
    { x: focus.x, y: focus.y, zoom: from.zoom * zoomFactor, duration: d(0.85), ease: "power3.inOut" },
    d(0.1)
  );

  // Panels sweep in (purple leads).
  panels.forEach((panel, i) => {
    tl.fromTo(panel, { xPercent: -130, skewX: -14 }, { xPercent: 0, skewX: -14, duration: d(0.45), ease: "power4.inOut" }, d(0.7 + i * 0.07));
  });
  if (ticker) tl.fromTo(ticker, { x: 0 }, { x: -480, duration: d(0.5), ease: "power2.out" }, d(1.0));

  // Flash + swap.
  tl.fromTo(flash, { autoAlpha: 0 }, { autoAlpha: 0.7, duration: d(0.05) }, d(1.08));
  tl.to(flash, { autoAlpha: 0, duration: d(0.25), ease: "power2.out" }, d(1.13));
  tl.to(slam, { autoAlpha: 0, duration: d(0.001) }, d(1.1));
  tl.fromTo(content, { autoAlpha: 0 }, { autoAlpha: 1, duration: d(0.001) }, d(1.1));

  // Panels sweep out (cream first, purple reveals last).
  panels.forEach((panel, i) => {
    tl.to(panel, { xPercent: 130, duration: d(0.5), ease: "power4.inOut" }, d(1.2 + (panels.length - 1 - i) * 0.07));
  });

  // Content card lands.
  tl.fromTo(card, { y: 48, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: d(0.6), ease: "expo.out" }, d(1.3));

  return tl;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/iso/BroadcastTransition.test.jsx`
Expected: PASS (4 tests). GSAP sets `visibility: inherit` when `autoAlpha` reaches 1 — that is what the assertion checks. If the `reduced` test reports a duration above 0.01, a tween still has a non-zero duration or position: every `duration` and every position argument must go through `d()`.

- [ ] **Step 5: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/components/iso/BroadcastTransition.jsx website/src/components/iso/BroadcastTransition.test.jsx
git commit -m "Add the broadcast wipe overlay and its reversible GSAP timeline"
```

---

### Task 5: Controls

**Files:**
- Create: `website/src/iso/controls.js`
- Test: `website/src/iso/controls.test.js`

**Interfaces:**
- Consumes: `unprojectDelta` from `./projection` (Task 1).
- Produces: `KEY_DIRS`, `WALK_SPEED` (5.5), `ACCEL` (12), `moveVector(keys: Set<string>) → {u, v}` (unit length or zero), `smoothVelocity(vel, target, dt) → vel` (mutates and returns `{u, v}`), `isMovementKey(code) → boolean`.

- [ ] **Step 1: Write the failing tests**

`website/src/iso/controls.test.js`:

```js
import { describe, it, expect } from "vitest";
import { moveVector, smoothVelocity, isMovementKey, WALK_SPEED } from "./controls";

describe("controls", () => {
  it("returns zero with no keys", () => {
    expect(moveVector(new Set())).toEqual({ u: 0, v: 0 });
  });

  it("W (screen up) walks up-court and to the left; S is the opposite", () => {
    const w = moveVector(new Set(["KeyW"]));
    expect(w.u).toBeGreaterThan(0);
    expect(w.v).toBeLessThan(0);
    expect(Math.hypot(w.u, w.v)).toBeCloseTo(1);
    const s = moveVector(new Set(["KeyS"]));
    expect(s.u).toBeCloseTo(-w.u);
    expect(s.v).toBeCloseTo(-w.v);
  });

  it("D (screen right) walks up-court and to the right", () => {
    const dd = moveVector(new Set(["KeyD"]));
    expect(dd.u).toBeGreaterThan(0);
    expect(dd.v).toBeGreaterThan(0);
    expect(Math.hypot(dd.u, dd.v)).toBeCloseTo(1);
  });

  it("W + D together walk mostly up the court (no key combo is exactly along it)", () => {
    const wd = moveVector(new Set(["KeyW", "KeyD"]));
    expect(wd.u).toBeGreaterThan(0.9);
    expect(Math.abs(wd.v)).toBeLessThan(0.35);
    expect(wd.u).toBeGreaterThan(moveVector(new Set(["KeyW"])).u);
  });

  it("opposite keys cancel; arrows alias WASD", () => {
    expect(moveVector(new Set(["KeyW", "KeyS"]))).toEqual({ u: 0, v: 0 });
    expect(moveVector(new Set(["ArrowUp"]))).toEqual(moveVector(new Set(["KeyW"])));
  });

  it("isMovementKey recognises WASD and arrows only", () => {
    expect(isMovementKey("KeyA")).toBe(true);
    expect(isMovementKey("ArrowRight")).toBe(true);
    expect(isMovementKey("Space")).toBe(false);
  });

  it("smoothVelocity eases toward the target and reaches it", () => {
    const vel = { u: 0, v: 0 };
    const target = { u: WALK_SPEED, v: 0 };
    smoothVelocity(vel, target, 1 / 60);
    expect(vel.u).toBeGreaterThan(0);
    expect(vel.u).toBeLessThan(WALK_SPEED);
    for (let i = 0; i < 120; i++) smoothVelocity(vel, target, 1 / 60);
    expect(vel.u).toBeCloseTo(WALK_SPEED, 2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/iso/controls.test.js`
Expected: FAIL — "Failed to resolve import ./controls".

- [ ] **Step 3: Write `controls.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/iso/controls.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/iso/controls.js website/src/iso/controls.test.js
git commit -m "Add screen-relative WASD controls for the isometric court"
```

---

### Task 6: Canvas renderer

**Files:**
- Create: `website/src/iso/render.js`
- Test: `website/src/iso/render.test.js`

**Interfaces:**
- Consumes: `project`, `worldToScreen`, `isoRadii`, `K` from `./projection`; `COURT_M`, `LINES`, `TARGETS`, `SCENE`, `AIM_RANGE` from `./court`; `PARTS`, `PIVOTS`, `RACKET`, `UNIT`, `TOSS_APEX`, `handPoint` from `./rig`; `SECTIONS` from `../data/sections`.
- Produces: `BALL_RADIUS` (0.3 m), `COLORS`, `renderScene(ctx, scene, viewport, images)`, plus the helpers `toScreen(scene, viewport, u, v, z)` and `ballScreenPoint(scene, viewport)` that Task 7 reuses.
- The `scene` object it reads (owned by Task 7):

```js
scene = {
  cam: { x, y, zoom },
  fitZoom: number,                       // zoom of the fitted hub view, for fading labels
  t: number,                             // seconds since start
  player: { u, v, rig },                 // rig from createRig()
  ball: {
    phase: 'hand' | 'toss' | 'flight' | 'settling',
    u, v, z, vu, vv, vz,                 // world (flight/settling)
    scaleX, scaleY, alpha,               // squash + fade, tweened
    trail: [{ u, v, z }],                // most recent last
  },
  aim: null | { u, v, clamped, hover: sectionId | null },
  targets: { [sectionId]: { flash: 0..1, pop: number } },   // pop = ring scale, 1 at rest
  particles: [{ u, v, z, vu, vv, vz, life, maxLife, r, color }],
  ripples: [{ u, v, r, alpha }],
}
images = { head, body, leftArm, rightArm }   // HTMLImageElement (or null while loading)
```

Draw order: turf + stripes → court surface + lines → targets → shadows + reticle → ball if `u > 0` → net → player → ball if `u ≤ 0` → trail, ripples, particles → target labels. Line widths are in metres × `K` × zoom (min 1.5 px) so they thicken as the camera pushes in. Labels are screen-sized and fade out as the camera zooms past 1.5× the fit zoom.

- [ ] **Step 1: Write the failing smoke test**

jsdom has no canvas, so the test feeds a recording fake context and checks the renderer calls it without throwing and in the right order.

`website/src/iso/render.test.js`:

```js
import { describe, it, expect } from "vitest";
import { renderScene, BALL_RADIUS, toScreen } from "./render";
import { createRig } from "./rig";
import { fitCamera, projectBounds } from "./projection";
import { sceneCorners, SPAWN } from "./court";

const fakeCtx = () => {
  const calls = [];
  const noop = (name) => (...args) => { calls.push([name, ...args]); };
  const ctx = new Proxy({ calls }, {
    get(target, prop) {
      if (prop === "calls") return calls;
      if (prop === "measureText") return () => ({ width: 10 });
      if (typeof prop === "string") return noop(prop);
      return undefined;
    },
    set(target, prop, value) { calls.push(["set", prop, value]); return true; },
  });
  return ctx;
};

const makeScene = (overrides = {}) => {
  const viewport = { width: 1200, height: 700 };
  const cam = fitCamera(viewport, projectBounds(sceneCorners()));
  return {
    viewport,
    scene: {
      cam,
      fitZoom: cam.zoom,
      t: 1,
      player: { u: SPAWN.u, v: SPAWN.v, rig: createRig() },
      ball: { phase: "hand", u: SPAWN.u, v: SPAWN.v, z: 0, vu: 0, vv: 0, vz: 0, scaleX: 1, scaleY: 1, alpha: 1, trail: [] },
      aim: { u: 3, v: -2, clamped: false, hover: "experience" },
      targets: { about: { flash: 0, pop: 1 }, experience: { flash: 0.5, pop: 1.1 }, projects: { flash: 0, pop: 1 }, contact: { flash: 0, pop: 1 } },
      particles: [{ u: 0, v: 0, z: 0.5, vu: 0, vv: 0, vz: 0, life: 0.2, maxLife: 0.5, r: 0.1, color: "#f4f1e9" }],
      ripples: [{ u: 3, v: -2, r: 0.8, alpha: 0.5 }],
      ...overrides,
    },
  };
};

describe("renderScene", () => {
  it("draws a full frame without images and without throwing", () => {
    const { scene, viewport } = makeScene();
    const ctx = fakeCtx();
    expect(() => renderScene(ctx, scene, viewport, { head: null, body: null, leftArm: null, rightArm: null })).not.toThrow();
    const names = ctx.calls.map((c) => c[0]);
    expect(names).toContain("clearRect");
    expect(names).toContain("stroke");
    expect(names).toContain("ellipse");
    expect(names.filter((n) => n === "drawImage")).toHaveLength(0);
  });

  it("draws the four image parts when images are present", () => {
    const { scene, viewport } = makeScene();
    const ctx = fakeCtx();
    const img = { width: 46, height: 56 };
    renderScene(ctx, scene, viewport, { head: img, body: img, leftArm: img, rightArm: img });
    expect(ctx.calls.filter((c) => c[0] === "drawImage")).toHaveLength(4);
  });

  it("draws a flying ball behind the net when it is on the far side", () => {
    const { scene, viewport } = makeScene({
      ball: { phase: "flight", u: 4, v: 0, z: 1, vu: 10, vv: 0, vz: -3, scaleX: 1.2, scaleY: 0.9, alpha: 1, trail: [{ u: 2, v: 0, z: 2 }] },
    });
    const ctx = fakeCtx();
    renderScene(ctx, scene, viewport, {});
    expect(ctx.calls.some((c) => c[0] === "ellipse")).toBe(true);
  });

  it("toScreen agrees with the camera", () => {
    const { scene, viewport } = makeScene();
    const centre = toScreen(scene, viewport, 0, 0, 0);
    expect(Number.isFinite(centre.x)).toBe(true);
    expect(BALL_RADIUS).toBeGreaterThan(0.1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/iso/render.test.js`
Expected: FAIL — "Failed to resolve import ./render".

- [ ] **Step 3: Write `render.js`**

```js
import { K, project, worldToScreen, isoRadii } from "./projection";
import { COURT_M, LINES, TARGETS, SCENE, AIM_RANGE } from "./court";
import { PARTS, PIVOTS, RACKET, UNIT, TOSS_APEX, handPoint } from "./rig";
import { SECTIONS } from "../data/sections";

// Canvas 2D renderer. Reads the scene state, never mutates it.

export const BALL_RADIUS = 0.3; // metres — cartoon scale, like the figure

export const COLORS = {
  turf: "#2f8f4e",
  stripe: "rgba(0,0,0,0.06)",
  court: "#276e3c",
  line: "#ffffff",
  cream: "#f4f1e9",
  ball: "#d6f84c",
  ballSeam: "#276e3c",
  wimbledon: "#4c2c69",
  shadow: "rgba(0,0,0,0.3)",
  net: "rgba(244,241,233,0.28)",
  post: "#3a2151",
};

export function toScreen(scene, viewport, u, v, z = 0) {
  return worldToScreen(project(u, v, z), scene.cam, viewport);
}

const px = (metres, zoom, min = 1.5) => Math.max(min, metres * K * zoom);

function groundPoly(ctx, scene, viewport, corners) {
  ctx.beginPath();
  corners.forEach(([u, v], i) => {
    const p = toScreen(scene, viewport, u, v);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

function groundEllipse(ctx, scene, viewport, u, v, r) {
  const p = toScreen(scene, viewport, u, v);
  const { rx, ry } = isoRadii(r, scene.cam.zoom);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
}

function drawTurf(ctx, scene, viewport) {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.fillStyle = COLORS.turf;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  // Mow stripes along u, 2 m wide, in world space so they zoom with the court.
  ctx.fillStyle = COLORS.stripe;
  for (let u = Math.floor(SCENE.uMin); u < SCENE.uMax; u += 4) {
    groundPoly(ctx, scene, viewport, [[u, SCENE.vMin], [u + 2, SCENE.vMin], [u + 2, SCENE.vMax], [u, SCENE.vMax]]);
    ctx.fill();
  }
}

function drawCourt(ctx, scene, viewport) {
  const L = COURT_M.halfLength;
  const W = COURT_M.halfWidth;
  ctx.fillStyle = COLORS.court;
  groundPoly(ctx, scene, viewport, [[-L, -W], [L, -W], [L, W], [-L, W]]);
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = px(0.1, scene.cam.zoom);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const [u1, v1, u2, v2] of LINES) {
    const a = toScreen(scene, viewport, u1, v1);
    const b = toScreen(scene, viewport, u2, v2);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
}

function drawTargets(ctx, scene, viewport) {
  const zoom = scene.cam.zoom;
  for (const s of SECTIONS) {
    const t = TARGETS[s.id];
    const state = scene.targets[s.id] ?? { flash: 0, pop: 1 };
    const hover = scene.aim?.hover === s.id;
    if (t.kind === "rect") {
      groundPoly(ctx, scene, viewport, [[t.u1, t.v1], [t.u2, t.v1], [t.u2, t.v2], [t.u1, t.v2]]);
      ctx.fillStyle = `rgba(214,248,76,${0.08 + (hover ? 0.12 : 0) + state.flash * 0.5})`;
      ctx.fill();
      ctx.strokeStyle = hover || state.flash > 0 ? COLORS.ball : "rgba(255,255,255,0.45)";
      ctx.lineWidth = px(0.08, zoom);
      ctx.setLineDash(hover ? [] : [px(0.3, zoom), px(0.25, zoom)]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const r = t.r * state.pop;
      groundEllipse(ctx, scene, viewport, t.u, t.v, r);
      ctx.fillStyle = `rgba(76,44,105,${0.25 + state.flash * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = hover ? COLORS.ball : "rgba(244,241,233,0.75)";
      ctx.lineWidth = px(0.08, zoom);
      ctx.stroke();
      groundEllipse(ctx, scene, viewport, t.u, t.v, r * 0.62);
      ctx.strokeStyle = "rgba(214,248,76,0.85)";
      ctx.stroke();
      groundEllipse(ctx, scene, viewport, t.u, t.v, r * 0.28);
      ctx.fillStyle = `rgba(214,248,76,${0.45 + state.flash * 0.5})`;
      ctx.fill();
    }
  }
}

function drawShadow(ctx, scene, viewport, u, v, z, r) {
  const k = Math.max(0.6, 1 - z / 12);
  groundEllipse(ctx, scene, viewport, u, v, r * k);
  ctx.fillStyle = `rgba(0,0,0,${0.35 - Math.min(0.2, z / 25)})`;
  ctx.fill();
}

function drawReticle(ctx, scene, viewport) {
  const aim = scene.aim;
  if (!aim) return;
  const zoom = scene.cam.zoom;
  const color = aim.hover ? COLORS.ball : COLORS.cream;
  ctx.strokeStyle = color;
  ctx.lineWidth = px(0.07, zoom, 2);
  groundEllipse(ctx, scene, viewport, aim.u, aim.v, 0.9);
  ctx.stroke();
  // Four ticks.
  for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const a = toScreen(scene, viewport, aim.u + du * 1.05, aim.v + dv * 1.05);
    const b = toScreen(scene, viewport, aim.u + du * 1.45, aim.v + dv * 1.45);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  // Pulsing dot.
  const pulse = 0.12 + 0.08 * (0.5 + 0.5 * Math.sin(scene.t * 6));
  groundEllipse(ctx, scene, viewport, aim.u, aim.v, pulse);
  ctx.fillStyle = color;
  ctx.fill();
  // Range ring when the aim is pinned at max reach.
  if (aim.clamped) {
    ctx.setLineDash([px(0.4, zoom), px(0.5, zoom)]);
    ctx.strokeStyle = "rgba(244,241,233,0.35)";
    groundEllipse(ctx, scene, viewport, scene.player.u, scene.player.v, AIM_RANGE);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawNet(ctx, scene, viewport) {
  const zoom = scene.cam.zoom;
  const V = COURT_M.postV;
  const h = COURT_M.postHeight;
  const a0 = toScreen(scene, viewport, 0, -V, 0);
  const a1 = toScreen(scene, viewport, 0, -V, h);
  const b0 = toScreen(scene, viewport, 0, V, 0);
  const b1 = toScreen(scene, viewport, 0, V, h);
  const mid = toScreen(scene, viewport, 0, 0, COURT_M.netHeight);
  // Mesh.
  ctx.beginPath();
  ctx.moveTo(a0.x, a0.y);
  ctx.lineTo(b0.x, b0.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.quadraticCurveTo(mid.x, mid.y + (mid.y - (a1.y + b1.y) / 2) * 0.4, a1.x, a1.y);
  ctx.closePath();
  ctx.fillStyle = COLORS.net;
  ctx.fill();
  ctx.strokeStyle = "rgba(244,241,233,0.3)";
  ctx.lineWidth = Math.max(1, 0.03 * K * zoom);
  ctx.beginPath();
  for (let v = -V + 0.8; v < V; v += 0.8) {
    const g = toScreen(scene, viewport, 0, v, 0);
    const top = toScreen(scene, viewport, 0, v, COURT_M.netHeight + (h - COURT_M.netHeight) * Math.abs(v / V));
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(top.x, top.y);
  }
  ctx.stroke();
  // Tape.
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = px(0.08, zoom, 2);
  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.quadraticCurveTo(mid.x, mid.y + (mid.y - (a1.y + b1.y) / 2) * 0.4, b1.x, b1.y);
  ctx.stroke();
  // Posts.
  ctx.strokeStyle = COLORS.post;
  ctx.lineWidth = px(0.12, zoom, 3);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a0.x, a0.y);
  ctx.lineTo(a1.x, a1.y);
  ctx.moveTo(b0.x, b0.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.stroke();
}

function drawPart(ctx, img, part) {
  if (!img) return;
  ctx.drawImage(img, part.x, part.y, part.w, part.h);
}

function drawRacket(ctx) {
  ctx.strokeStyle = COLORS.ball;
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(RACKET.handle.x1, RACKET.handle.y1);
  ctx.lineTo(RACKET.handle.x2, RACKET.handle.y2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(RACKET.head.cx, RACKET.head.cy, RACKET.head.rx, RACKET.head.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.globalAlpha *= 0.65;
  ctx.beginPath();
  for (const dx of [-4, 0, 4]) {
    ctx.moveTo(RACKET.head.cx + dx, RACKET.head.cy - 9);
    ctx.lineTo(RACKET.head.cx + dx, RACKET.head.cy + 9);
  }
  for (const dy of [-5, 0, 5]) {
    ctx.moveTo(RACKET.head.cx - 6, RACKET.head.cy + dy);
    ctx.lineTo(RACKET.head.cx + 6, RACKET.head.cy + dy);
  }
  ctx.stroke();
}

// Figure units → screen: one unit is UNIT metres; a vertical metre is K·zoom px.
export function figureScale(scene) {
  return UNIT * K * scene.cam.zoom;
}

function drawPlayer(ctx, scene, viewport, images) {
  const { player } = scene;
  const rig = player.rig;
  const feet = toScreen(scene, viewport, player.u, player.v, rig.bob + rig.hop);
  const s = figureScale(scene);
  ctx.save();
  ctx.translate(feet.x, feet.y);
  ctx.rotate(rig.lean * rig.facing);
  ctx.scale(s * rig.facing * rig.squashX, s * rig.squashY);
  // Left arm (back), pivoting at its shoulder.
  ctx.save();
  ctx.translate(PIVOTS.shoulderL.x, PIVOTS.shoulderL.y);
  ctx.rotate(rig.armL);
  ctx.translate(-PIVOTS.shoulderL.x, -PIVOTS.shoulderL.y);
  drawPart(ctx, images.leftArm, PARTS.leftArm);
  ctx.restore();
  drawPart(ctx, images.body, PARTS.body);
  // Head tilts about the neck.
  ctx.save();
  ctx.translate(PIVOTS.neck.x, PIVOTS.neck.y);
  ctx.rotate(rig.headTilt);
  ctx.translate(-PIVOTS.neck.x, -PIVOTS.neck.y);
  drawPart(ctx, images.head, PARTS.head);
  ctx.restore();
  // Racket arm.
  ctx.save();
  ctx.translate(PIVOTS.shoulderR.x, PIVOTS.shoulderR.y);
  ctx.rotate(rig.armR);
  ctx.translate(-PIVOTS.shoulderR.x, -PIVOTS.shoulderR.y);
  drawPart(ctx, images.rightArm, PARTS.rightArm);
  drawRacket(ctx);
  ctx.restore();
  ctx.restore();
}

// Where the ball is on screen. In the hand/toss phases it rides the figure.
export function ballScreenPoint(scene, viewport) {
  const { ball, player } = scene;
  if (ball.phase === "hand" || ball.phase === "toss") {
    const rig = player.rig;
    const feet = toScreen(scene, viewport, player.u, player.v, rig.bob + rig.hop);
    const s = figureScale(scene);
    const hand = handPoint(rig);
    const fx = hand.x + (TOSS_APEX.x - hand.x) * rig.toss;
    const fy = hand.y + (TOSS_APEX.y - hand.y) * rig.toss - 6;
    return { x: feet.x + fx * s * rig.facing * rig.squashX, y: feet.y + fy * s * rig.squashY, angle: 0 };
  }
  const p = toScreen(scene, viewport, ball.u, ball.v, ball.z);
  const sv = project(ball.vu, ball.vv, ball.vz); // velocity direction on screen
  return { x: p.x, y: p.y, angle: Math.atan2(sv.y, sv.x) };
}

function drawBall(ctx, scene, viewport) {
  const { ball } = scene;
  if (ball.alpha <= 0) return;
  const p = ballScreenPoint(scene, viewport);
  const r = BALL_RADIUS * K * scene.cam.zoom;
  ctx.save();
  ctx.globalAlpha = ball.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(ball.scaleX, ball.scaleY);
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ball;
  ctx.fill();
  ctx.strokeStyle = COLORS.ballSeam;
  ctx.lineWidth = Math.max(1, r * 0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.95, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = Math.max(0.8, r * 0.12);
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, 0, r * 0.55, r * 0.85, 0, -1.1, 1.1);
  ctx.stroke();
  ctx.restore();
}

function drawBallShadow(ctx, scene, viewport) {
  const { ball, player } = scene;
  if (ball.alpha <= 0) return;
  if (ball.phase === "hand" || ball.phase === "toss") {
    drawShadow(ctx, scene, viewport, player.u, player.v, 1.3 + player.rig.toss * 1.3, BALL_RADIUS * 0.9);
    return;
  }
  drawShadow(ctx, scene, viewport, ball.u, ball.v, ball.z, BALL_RADIUS);
}

function drawTrail(ctx, scene, viewport) {
  const n = scene.ball.trail.length;
  if (!n) return;
  const r = BALL_RADIUS * K * scene.cam.zoom;
  scene.ball.trail.forEach((pt, i) => {
    if (i % 2) return; // dotted
    const k = (i + 1) / n;
    const p = toScreen(scene, viewport, pt.u, pt.v, pt.z);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * 0.45 * k, r * 0.45 * k, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(214,248,76,${0.55 * k})`;
    ctx.fill();
  });
}

function drawEffects(ctx, scene, viewport) {
  const zoom = scene.cam.zoom;
  for (const rp of scene.ripples) {
    groundEllipse(ctx, scene, viewport, rp.u, rp.v, rp.r);
    ctx.strokeStyle = `rgba(214,248,76,${rp.alpha})`;
    ctx.lineWidth = px(0.08, zoom, 2);
    ctx.stroke();
  }
  for (const pt of scene.particles) {
    const p = toScreen(scene, viewport, pt.u, pt.v, pt.z);
    const k = pt.life / pt.maxLife;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, Math.max(0.5, pt.r * K * zoom * k), Math.max(0.5, pt.r * K * zoom * k), 0, 0, Math.PI * 2);
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = 0.7 * k;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawLabels(ctx, scene, viewport) {
  const zoomRatio = scene.cam.zoom / (scene.fitZoom || scene.cam.zoom);
  const alpha = Math.max(0, Math.min(1, 1 - (zoomRatio - 1) / 0.8));
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;
  for (const s of SECTIONS) {
    const t = TARGETS[s.id];
    const c = t.kind === "rect" ? { u: (t.u1 + t.u2) / 2, v: (t.v1 + t.v2) / 2 } : { u: t.u, v: t.v };
    const p = toScreen(scene, viewport, c.u, c.v);
    ctx.font = "500 10px ui-monospace, Menlo, monospace";
    ctx.fillStyle = COLORS.ball;
    ctx.fillText(s.broadcast.toUpperCase(), p.x, p.y - 9);
    ctx.font = "800 15px Syne, system-ui, sans-serif";
    ctx.fillStyle = COLORS.cream;
    ctx.fillText(s.label, p.x, p.y + 7);
  }
  ctx.restore();
}

export function renderScene(ctx, scene, viewport, images = {}) {
  drawTurf(ctx, scene, viewport);
  drawCourt(ctx, scene, viewport);
  drawTargets(ctx, scene, viewport);
  drawShadow(ctx, scene, viewport, scene.player.u, scene.player.v, scene.player.rig.hop, 0.9);
  drawBallShadow(ctx, scene, viewport);
  drawReticle(ctx, scene, viewport);
  const ballFar = scene.ball.phase !== "hand" && scene.ball.phase !== "toss" && scene.ball.u > 0;
  if (ballFar) drawBall(ctx, scene, viewport);
  drawNet(ctx, scene, viewport);
  drawPlayer(ctx, scene, viewport, images);
  if (!ballFar) drawBall(ctx, scene, viewport);
  drawTrail(ctx, scene, viewport);
  drawEffects(ctx, scene, viewport);
  drawLabels(ctx, scene, viewport);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/iso/render.test.js`
Expected: PASS (4 tests). The Proxy-based fake context records every method call; if a test fails with "not a function", the renderer is calling something on the context that is not a method (e.g. reading a property) — guard it.

- [ ] **Step 5: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/iso/render.js website/src/iso/render.test.js
git commit -m "Add the Canvas 2D isometric court renderer"
```

---

### Task 7: Scene controller

**Files:**
- Create: `website/src/iso/scene.js`
- Test: `website/src/iso/scene.test.js`

**Interfaces:**
- Consumes: everything from Tasks 1, 2, 3, 5, 6 (`projection`, `court`, `ballistics`, `controls`, `rig`, `render`) and `SECTIONS`.
- Produces: `createScene({ canvas, images = {}, reduced = false, topInset = 0, onLand, onServe }) → scene` where `scene` is:

```js
{
  state,                      // the object renderScene reads (see Task 6) — tests may mutate it
  cam,                        // === state.cam, the live camera object the transition tweens
  start(), stop(), destroy(),
  resize(width, height, dpr), // CSS px; refits the camera unless locked
  fit(),                      // frame the hub view now
  lockCamera(locked),         // true while a section is displayed: resize must not refit
  focus(sectionId) → { x, y } // projected-space centre of that target
  setImages(images),
  setPointer({ x, y }), clearPointer(),   // CSS px relative to the canvas
  setKey(code, down), clearKeys(),
  setInputEnabled(enabled),
  serve() → boolean,          // false when ignored
  tap({ x, y }),              // touch: aim + serve, auto-walking into range first
  step(dt),                   // one simulation step (exposed for tests; the ticker calls it)
}
```

- `onLand(result, point)` fires on the ball's **first** ground contact with `result` from `classifyLanding` and `point = { u, v }`. `onServe()` fires when a serve starts.
- Movement is locked from toss start until the strike; the ball must be in hand and an aim must exist for `serve()` to do anything.

- [ ] **Step 1: Write the failing tests**

`website/src/iso/scene.test.js` (all with `reduced: true` so the serve and the flight are instant and deterministic):

```js
import { describe, it, expect, vi } from "vitest";
import { createScene } from "./scene";
import { project, worldToScreen } from "./projection";
import { SPAWN, PLAYER_BOUNDS, AIM_RANGE, targetCenter } from "./court";

const fakeCanvas = () => ({ getContext: () => null, clientWidth: 1200, clientHeight: 700 });

const make = (opts = {}) => {
  const onLand = vi.fn();
  const onServe = vi.fn();
  const scene = createScene({ canvas: fakeCanvas(), reduced: true, onLand, onServe, ...opts });
  scene.resize(1200, 700, 1);
  return { scene, onLand, onServe };
};

const screenOf = (scene, u, v) => worldToScreen(project(u, v), scene.cam, { width: 1200, height: 700 });
const run = (scene, seconds, dt = 1 / 60) => { for (let t = 0; t < seconds; t += dt) scene.step(dt); };

describe("scene", () => {
  it("starts at the spawn with the ball in hand and the camera fitted", () => {
    const { scene } = make();
    expect(scene.state.player.u).toBe(SPAWN.u);
    expect(scene.state.ball.phase).toBe("hand");
    expect(scene.cam.zoom).toBeGreaterThan(0);
    expect(scene.state.fitZoom).toBe(scene.cam.zoom);
  });

  it("serve without an aim is ignored", () => {
    const { scene, onServe } = make();
    expect(scene.serve()).toBe(false);
    expect(scene.state.ball.phase).toBe("hand");
    expect(onServe).not.toHaveBeenCalled();
  });

  it("holding D walks up-court and to the right, and never past the net", () => {
    const { scene } = make();
    scene.setKey("KeyD", true);
    run(scene, 1);
    expect(scene.state.player.u).toBeGreaterThan(SPAWN.u);
    expect(scene.state.player.v).toBeGreaterThan(SPAWN.v);
    run(scene, 12);
    expect(scene.state.player.u).toBe(PLAYER_BOUNDS.uMax);
    expect(scene.state.player.v).toBe(PLAYER_BOUNDS.vMax);
    scene.setKey("KeyD", false);
    const { u } = scene.state.player;
    run(scene, 1);
    expect(scene.state.player.u).toBeCloseTo(u, 3);
  });

  it("the pointer sets a ground aim with hover, and far aims are clamped to range", () => {
    const { scene } = make();
    const c = targetCenter("experience");
    scene.setPointer(screenOf(scene, c.u, c.v));
    scene.step(1 / 60);
    expect(scene.state.aim.u).toBeCloseTo(c.u, 1);
    expect(scene.state.aim.v).toBeCloseTo(c.v, 1);
    expect(scene.state.aim.hover).toBe("experience");
    expect(scene.state.aim.clamped).toBe(false);
    scene.setPointer(screenOf(scene, 30, 0));
    scene.step(1 / 60);
    expect(scene.state.aim.clamped).toBe(true);
    const p = scene.state.player;
    expect(Math.hypot(scene.state.aim.u - p.u, scene.state.aim.v - p.v)).toBeCloseTo(AIM_RANGE, 3);
    scene.clearPointer();
    scene.step(1 / 60);
    expect(scene.state.aim).toBe(null);
  });

  it("serving at a target reports a hit on landing and the ball returns to the hand", () => {
    const { scene, onLand, onServe } = make();
    const c = targetCenter("experience");
    scene.setPointer(screenOf(scene, c.u, c.v));
    scene.step(1 / 60);
    expect(scene.serve()).toBe(true);
    expect(onServe).toHaveBeenCalledTimes(1);
    run(scene, 3);
    expect(onLand).toHaveBeenCalledTimes(1);
    const [result, point] = onLand.mock.calls[0];
    expect(result).toEqual({ type: "hit", sectionId: "experience" });
    expect(point.u).toBeCloseTo(c.u, 1);
    expect(scene.state.ball.phase).toBe("hand");
    expect(scene.state.ball.alpha).toBe(1);
  });

  it("a serve onto the far court outside the boxes is out", () => {
    const { scene, onLand } = make();
    scene.state.player.u = -5;
    scene.setPointer(screenOf(scene, 9, 0));
    scene.step(1 / 60);
    scene.serve();
    run(scene, 3);
    expect(onLand.mock.calls[0][0]).toEqual({ type: "out" });
  });

  it("ignores a second serve while the first ball is live", () => {
    const { scene } = make({ reduced: false });
    scene.setPointer(screenOf(scene, 3, -2));
    scene.step(1 / 60);
    expect(scene.serve()).toBe(true);
    expect(scene.serve()).toBe(false);
  });

  it("disabled input ignores keys, pointer and serves", () => {
    const { scene } = make();
    scene.setInputEnabled(false);
    scene.setKey("KeyW", true);
    scene.setPointer(screenOf(scene, 3, -2));
    run(scene, 0.5);
    expect(scene.state.player.u).toBe(SPAWN.u);
    expect(scene.state.aim).toBe(null);
    expect(scene.serve()).toBe(false);
  });

  it("resize does not refit while the camera is locked", () => {
    const { scene } = make();
    scene.lockCamera(true);
    scene.cam.zoom = 5;
    scene.resize(800, 600, 2);
    expect(scene.cam.zoom).toBe(5);
    scene.lockCamera(false);
    scene.resize(800, 600, 2);
    expect(scene.cam.zoom).not.toBe(5);
  });

  it("focus returns the projected centre of a target", () => {
    const { scene } = make();
    expect(scene.focus("about")).toEqual(project(14.8, -3.4));
  });

  it("a tap beyond range auto-walks into range and then serves", () => {
    const { scene, onLand } = make();
    const c = targetCenter("about");
    scene.tap(screenOf(scene, c.u, c.v));
    expect(scene.state.ball.phase).toBe("hand");
    run(scene, 6);
    expect(onLand).toHaveBeenCalled();
    expect(onLand.mock.calls[0][0]).toEqual({ type: "hit", sectionId: "about" });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/iso/scene.test.js`
Expected: FAIL — "Failed to resolve import ./scene".

- [ ] **Step 3: Write `scene.js`**

```js
import gsap from "gsap";
import { project, projectBounds, fitCamera, screenToGround } from "./projection";
import { SPAWN, AIM_RANGE, TARGETS, sceneCorners, classifyLanding, clampAim, clampPlayer, targetCenter, targetContains } from "./court";
import { GRAVITY, LAUNCH_HEIGHT, launchVelocity, createBallBody, stepBall } from "./ballistics";
import { moveVector, smoothVelocity, WALK_SPEED } from "./controls";
import { createRig, updateRig, startStopTween, serveTimeline, celebrationTimeline } from "./rig";
import { renderScene } from "./render";
import { SECTIONS } from "../data/sections";

// The simulation: owns the state renderScene draws, advances it on
// gsap.ticker, applies input, and runs the ball's life cycle. React only
// forwards events in and receives onLand / onServe out.

const TRAIL_LENGTH = 18;
const DUST_COUNT = 7;

export function createScene({ canvas, images = {}, reduced = false, topInset = 0, onLand, onServe }) {
  const ctx = canvas.getContext ? canvas.getContext("2d") : null;
  const viewport = { width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 };
  let dpr = 1;
  let imgs = images;

  const state = {
    cam: { x: 0, y: 0, zoom: 1 },
    fitZoom: 1,
    t: 0,
    player: { u: SPAWN.u, v: SPAWN.v, rig: createRig() },
    ball: { phase: "hand", u: SPAWN.u, v: SPAWN.v, z: 0, vu: 0, vv: 0, vz: 0, scaleX: 1, scaleY: 1, alpha: 1, trail: [] },
    aim: null,
    targets: Object.fromEntries(SECTIONS.map((s) => [s.id, { flash: 0, pop: 1 }])),
    particles: [],
    ripples: [],
  };
  const vel = { u: 0, v: 0 };
  const keys = new Set();
  let pointer = null;     // { x, y } CSS px on the canvas
  let tapAim = null;      // { u, v } world aim set by a touch tap
  let autoWalk = null;    // { u, v } tap target to walk toward
  let stuckTime = 0;
  let inputEnabled = true;
  let camLocked = false;
  let running = false;
  let hidden = false;
  let body = null;        // ballistics body while the ball is in flight
  let struck = true;      // false between toss start and the strike (movement locked)
  const live = new Set(); // tweens/timelines to kill on destroy

  const track = (tween) => { live.add(tween); tween.eventCallback("onComplete", () => live.delete(tween)); return tween; };

  // --- camera ---
  const fit = () => {
    const vp = { width: viewport.width, height: Math.max(1, viewport.height - topInset) };
    const cam = fitCamera(vp, projectBounds(sceneCorners()));
    state.cam.x = cam.x;
    state.cam.y = cam.y - topInset / (2 * cam.zoom); // centre in the strip below the navbar
    state.cam.zoom = cam.zoom;
    state.fitZoom = cam.zoom;
  };

  const resize = (width, height, ratio = 1) => {
    viewport.width = Math.max(1, width);
    viewport.height = Math.max(1, height);
    dpr = ratio;
    if ("width" in canvas) {
      canvas.width = Math.round(viewport.width * dpr);
      canvas.height = Math.round(viewport.height * dpr);
    }
    if (!camLocked) fit();
  };

  const focus = (sectionId) => {
    const c = targetCenter(sectionId);
    return project(c.u, c.v);
  };

  const kickCamera = () => {
    if (reduced || camLocked) return;
    const dy = 2 / state.cam.zoom;
    const y0 = state.cam.y;
    track(gsap.fromTo(state.cam, { y: y0 + dy }, { y: y0, duration: 0.12, ease: "power2.out" }));
  };

  // --- aim ---
  const hoverAt = (p) => SECTIONS.find((s) => targetContains(TARGETS[s.id], p))?.id ?? null;
  const aimAt = (world) => {
    const c = clampAim(state.player, world);
    return { ...c, hover: hoverAt(c) };
  };
  const updateAim = () => {
    if (!inputEnabled) { state.aim = null; return; }
    if (pointer) state.aim = aimAt(screenToGround(pointer.x, pointer.y, state.cam, viewport));
    else if (tapAim) state.aim = aimAt(tapAim);
    else state.aim = null;
  };

  // --- effects ---
  const spawnRipple = (u, v) => {
    if (reduced) return;
    const r = { u, v, r: 0.1, alpha: 0.8 };
    state.ripples.push(r);
    track(gsap.to(r, { r: 1.4, alpha: 0, duration: 0.45, ease: "power2.out", onComplete: () => { state.ripples = state.ripples.filter((x) => x !== r); } }));
  };
  const spawnDust = (u, v) => {
    if (reduced) return;
    for (let i = 0; i < DUST_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 2.5;
      state.particles.push({ u, v, z: 0.05, vu: Math.cos(a) * s, vv: Math.sin(a) * s, vz: 2 + Math.random() * 3, life: 0.5, maxLife: 0.5, r: 0.08 + Math.random() * 0.08, color: "#f4f1e9" });
    }
  };
  const stepEffects = (dt) => {
    for (const p of state.particles) {
      p.life -= dt;
      p.vz -= GRAVITY * 0.6 * dt;
      p.u += p.vu * dt;
      p.v += p.vv * dt;
      p.z = Math.max(0, p.z + p.vz * dt);
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  };

  // --- ball life cycle ---
  const respawn = () => {
    const b = state.ball;
    body = null;
    b.phase = "hand";
    b.trail = [];
    b.u = state.player.u;
    b.v = state.player.v;
    b.z = 0;
    b.alpha = 1;
    if (reduced) { b.scaleX = 1; b.scaleY = 1; return; }
    track(gsap.fromTo(b, { scaleX: 0, scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 0.4, ease: "back.out(2.5)", overwrite: "auto" }));
  };
  const settle = () => {
    const b = state.ball;
    b.phase = "settling";
    body = null;
    if (reduced) { respawn(); return; }
    track(gsap.to(b, { alpha: 0, duration: 0.3, delay: 0.15, ease: "power1.in", onComplete: respawn }));
  };
  const onContact = (e) => {
    const b = state.ball;
    spawnRipple(e.u, e.v);
    spawnDust(e.u, e.v);
    if (!reduced) track(gsap.fromTo(b, { scaleX: 1.35, scaleY: 0.65 }, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "elastic.out(1, 0.4)", overwrite: "auto" }));
    if (!e.first) return;
    const point = { u: e.u, v: e.v };
    const result = classifyLanding(point);
    if (result.type === "hit") {
      const ts = state.targets[result.sectionId];
      if (!reduced) {
        track(gsap.fromTo(ts, { flash: 1 }, { flash: 0, duration: 1.2, ease: "power2.out", overwrite: "auto" }));
        track(gsap.fromTo(ts, { pop: 1.25 }, { pop: 1, duration: 0.6, ease: "back.out(3)", overwrite: "auto" }));
        track(celebrationTimeline(state.player.rig));
      }
    }
    onLand?.(result, point);
  };
  const strike = (target) => {
    const p = state.player;
    const b = state.ball;
    struck = true;
    const v = launchVelocity({ u: p.u, v: p.v }, target, LAUNCH_HEIGHT);
    body = createBallBody(p.u, p.v, LAUNCH_HEIGHT, v);
    Object.assign(b, { phase: "flight", u: body.u, v: body.v, z: body.z, vu: body.vu, vv: body.vv, vz: body.vz, trail: [], alpha: 1, scaleX: 1, scaleY: 1 });
    tapAim = null;
    kickCamera();
    if (reduced) {
      // No flight: land on the aim point now.
      body = null;
      Object.assign(b, { u: target.u, v: target.v, z: 0, vu: 0, vv: 0, vz: 0 });
      onContact({ type: "contact", u: target.u, v: target.v, first: true, speed: 0 });
      settle();
    }
  };
  const serve = () => {
    const rig = state.player.rig;
    if (!inputEnabled || !state.aim || state.ball.phase !== "hand" || rig.serving) return false;
    const target = { u: state.aim.u, v: state.aim.v };
    state.ball.phase = "toss";
    struck = false;
    onServe?.();
    if (reduced) { strike(target); return true; }
    track(serveTimeline(rig, { onStrike: () => strike(target) }));
    return true;
  };
  const stepBallState = (dt) => {
    if (!body || state.ball.phase !== "flight") return;
    const events = stepBall(body, dt);
    const b = state.ball;
    Object.assign(b, { u: body.u, v: body.v, z: body.z, vu: body.vu, vv: body.vv, vz: body.vz });
    b.trail.push({ u: b.u, v: b.v, z: b.z });
    if (b.trail.length > TRAIL_LENGTH) b.trail.shift();
    for (const e of events) {
      if (e.type === "contact") onContact(e);
      else if (e.type === "settle") settle();
    }
  };

  // --- movement ---
  const stepPlayer = (dt) => {
    const p = state.player;
    const rig = p.rig;
    const canMove = inputEnabled && struck;
    let dir = { u: 0, v: 0 };
    if (canMove) {
      if (autoWalk) {
        const du = autoWalk.u - p.u;
        const dv = autoWalk.v - p.v;
        const d = Math.hypot(du, dv);
        const speedNow = Math.hypot(vel.u, vel.v);
        if (speedNow < 0.3) stuckTime += dt; else stuckTime = 0;
        if (d <= AIM_RANGE - 0.5 || stuckTime > 0.6) {
          tapAim = autoWalk;
          autoWalk = null;
          stuckTime = 0;
          updateAim();
          serve();
        } else {
          dir = { u: du / d, v: dv / d };
        }
      } else {
        dir = moveVector(keys);
      }
    }
    smoothVelocity(vel, { u: dir.u * WALK_SPEED, v: dir.v * WALK_SPEED }, dt);
    const speed = Math.hypot(vel.u, vel.v);
    if (speed > 0.02) {
      const next = clampPlayer({ u: p.u + vel.u * dt, v: p.v + vel.v * dt });
      p.u = next.u;
      p.v = next.v;
    } else {
      vel.u = 0;
      vel.v = 0;
    }
    const intent = dir.u !== 0 || dir.v !== 0;
    const dirX = intent ? Math.sign(dir.u + dir.v) : 0; // screen-x sign of the move
    const ev = updateRig(rig, { moving: intent, speed, dirX }, dt, state.t);
    if (ev && !reduced) track(startStopTween(rig, ev));
    if (!intent && state.aim && !rig.serving) {
      rig.facing = (state.aim.u + state.aim.v) - (p.u + p.v) < 0 ? -1 : 1;
    }
    if (state.ball.phase === "hand") { state.ball.u = p.u; state.ball.v = p.v; }
  };

  const step = (dt) => {
    state.t += dt;
    updateAim();
    stepPlayer(dt);
    stepBallState(dt);
    stepEffects(dt);
  };

  const render = () => {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderScene(ctx, state, viewport, imgs);
  };

  const tick = (time, deltaMs) => {
    if (hidden) return;
    step(Math.min(1 / 30, deltaMs / 1000));
    render();
  };
  const onVisibility = () => { hidden = typeof document !== "undefined" && document.hidden; };

  const start = () => {
    if (running) return;
    running = true;
    gsap.ticker.add(tick);
    document.addEventListener("visibilitychange", onVisibility);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
    document.removeEventListener("visibilitychange", onVisibility);
  };
  const destroy = () => {
    stop();
    for (const tween of live) tween.kill();
    live.clear();
  };

  // --- input ---
  const setPointer = ({ x, y }) => { pointer = { x, y }; };
  const clearPointer = () => { pointer = null; };
  const setKey = (code, down) => {
    if (down) keys.add(code); else keys.delete(code);
    if (down) { autoWalk = null; tapAim = null; }
  };
  const clearKeys = () => keys.clear();
  const setInputEnabled = (enabled) => {
    inputEnabled = enabled;
    if (!enabled) { keys.clear(); pointer = null; tapAim = null; autoWalk = null; state.aim = null; }
  };
  const tap = ({ x, y }) => {
    if (!inputEnabled || state.ball.phase !== "hand" || state.player.rig.serving) return;
    const g = screenToGround(x, y, state.cam, viewport);
    const c = clampAim(state.player, g);
    if (c.clamped) {
      autoWalk = { u: g.u, v: g.v };
      tapAim = autoWalk;
    } else {
      tapAim = { u: g.u, v: g.v };
      updateAim();
      serve();
    }
  };

  fit();

  return {
    state,
    cam: state.cam,
    start, stop, destroy, resize, fit,
    lockCamera: (locked) => { camLocked = locked; },
    focus,
    setImages: (next) => { imgs = next; },
    setPointer, clearPointer, setKey, clearKeys, setInputEnabled,
    serve, tap, step,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/iso/scene.test.js`
Expected: PASS (11 tests). Watch for:
- "a tap beyond range auto-walks" — the player must reach within `AIM_RANGE − 0.5` of the ring; from the spawn to `(14.8, −3.4)` that is a walk of ~11 m at 5.5 m/s (~2 s), then the instant reduced-motion serve lands and reports the hit.
- "ignores a second serve while the first ball is live" runs with `reduced: false`, so the toss timeline is pending; `serve()` must return `false` because `ball.phase` is `'toss'`.

- [ ] **Step 5: Lint, run the whole suite, commit**

```bash
cd website && npm run lint && npm run test
cd .. && git add website/src/iso/scene.js website/src/iso/scene.test.js
git commit -m "Add the isometric scene controller: input, camera, ball life cycle"
```

---

### Task 8: `IsoCourt` React wrapper

**Files:**
- Create: `website/src/components/iso/IsoCourt.jsx`
- Test: `website/src/components/iso/IsoCourt.test.jsx`

**Interfaces:**
- Consumes: `createScene` from `../../iso/scene` (Task 7), `isMovementKey` from `../../iso/controls` (Task 5), `usePrefersReducedMotion`, the four player PNGs.
- Produces: default export `IsoCourt({ onReady, onLand, onServe, inputEnabled = true })`. Renders a fixed full-viewport `<canvas>` (`z-0`), the hint line, and an `sr-only` instruction. Calls `onReady(scene)` once the scene exists and `onReady(null)` on unmount.

- [ ] **Step 1: Write the failing test**

`website/src/components/iso/IsoCourt.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const fakeScene = () => ({
  start: vi.fn(), stop: vi.fn(), destroy: vi.fn(), resize: vi.fn(), fit: vi.fn(),
  lockCamera: vi.fn(), focus: vi.fn(() => ({ x: 0, y: 0 })), setImages: vi.fn(),
  setPointer: vi.fn(), clearPointer: vi.fn(), setKey: vi.fn(), clearKeys: vi.fn(),
  setInputEnabled: vi.fn(), serve: vi.fn(() => true), tap: vi.fn(), step: vi.fn(),
  cam: { x: 0, y: 0, zoom: 1 }, state: {},
});
let scene;
vi.mock("../../iso/scene", () => ({ createScene: vi.fn(() => scene) }));

import IsoCourt from "./IsoCourt";
import { createScene } from "../../iso/scene";

beforeEach(() => {
  scene = fakeScene();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

describe("IsoCourt", () => {
  it("creates and starts the scene, reports it ready, and destroys it on unmount", () => {
    const onReady = vi.fn();
    const { unmount } = render(<IsoCourt onReady={onReady} />);
    expect(createScene).toHaveBeenCalledTimes(1);
    expect(scene.start).toHaveBeenCalled();
    expect(scene.resize).toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledWith(scene);
    unmount();
    expect(scene.destroy).toHaveBeenCalled();
    expect(onReady).toHaveBeenLastCalledWith(null);
  });

  it("shows the desktop hint and the screen-reader instruction", () => {
    render(<IsoCourt />);
    expect(screen.getByText(/WASD to move/i)).toBeInTheDocument();
    expect(screen.getByText(/use the menu to jump to a section/i)).toBeInTheDocument();
  });

  it("forwards movement keys and serves on Space from the page body", () => {
    render(<IsoCourt />);
    fireEvent.keyDown(window, { code: "KeyW" });
    expect(scene.setKey).toHaveBeenCalledWith("KeyW", true);
    fireEvent.keyUp(window, { code: "KeyW" });
    expect(scene.setKey).toHaveBeenCalledWith("KeyW", false);
    fireEvent.keyDown(window, { code: "Space" });
    expect(scene.serve).toHaveBeenCalledTimes(1);
  });

  it("does not serve on Enter when a link has focus", () => {
    render(<><a href="/x">link</a><IsoCourt /></>);
    const link = screen.getByText("link");
    link.focus();
    fireEvent.keyDown(link, { code: "Enter" });
    expect(scene.serve).not.toHaveBeenCalled();
  });

  it("aims on pointer move and serves on a mouse click", () => {
    const { container } = render(<IsoCourt />);
    const canvas = container.querySelector("canvas");
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 50, pointerType: "mouse" });
    expect(scene.setPointer).toHaveBeenCalled();
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 50, pointerType: "mouse", button: 0 });
    expect(scene.serve).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 50, pointerType: "touch", button: 0 });
    expect(scene.tap).toHaveBeenCalledTimes(1);
  });

  it("passes inputEnabled through to the scene", () => {
    const { rerender } = render(<IsoCourt inputEnabled />);
    rerender(<IsoCourt inputEnabled={false} />);
    expect(scene.setInputEnabled).toHaveBeenLastCalledWith(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/iso/IsoCourt.test.jsx`
Expected: FAIL — "Failed to resolve import ./IsoCourt".

- [ ] **Step 3: Write `IsoCourt.jsx`**

```jsx
import { useEffect, useRef, useState } from "react";
import { createScene } from "../../iso/scene";
import { isMovementKey } from "../../iso/controls";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import headUrl from "../../assets/player/head.png";
import bodyUrl from "../../assets/player/body.png";
import leftArmUrl from "../../assets/player/left-arm.png";
import rightArmUrl from "../../assets/player/right-arm.png";

// The isometric court canvas. Owns nothing but the DOM and the listeners;
// the simulation lives in createScene(). Fixed and full-viewport, it sits
// behind every court route so the camera can keep zooming while a section
// is shown on top.

const TOP_INSET = 56; // the fixed Navbar (h-14)

// Slot → file. right-arm.png sits in the left slot and left-arm.png is the
// racket arm — the mapping the retired SVG Player used, which reads right.
const IMAGE_URLS = { head: headUrl, body: bodyUrl, leftArm: rightArmUrl, rightArm: leftArmUrl };

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const isTypingTarget = (el) => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

const IsoCourt = ({ onReady, onLand, onServe, inputEnabled = true }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [hintVisible, setHintVisible] = useState(true);
  const [coarse] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)")?.matches
  );

  // Latest callbacks without rebuilding the scene when they change identity.
  const callbacks = useRef({ onReady, onLand, onServe });
  callbacks.current = { onReady, onLand, onServe };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const scene = createScene({
      canvas,
      reduced,
      topInset: TOP_INSET,
      onLand: (result, point) => callbacks.current.onLand?.(result, point),
      onServe: () => {
        setHintVisible(false);
        callbacks.current.onServe?.();
      },
    });
    sceneRef.current = scene;
    const resize = () => scene.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    resize();
    scene.start();
    callbacks.current.onReady?.(scene);

    let cancelled = false;
    Promise.all(Object.entries(IMAGE_URLS).map(async ([slot, src]) => [slot, await loadImage(src)])).then(
      (entries) => { if (!cancelled) scene.setImages(Object.fromEntries(entries)); }
    );

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (isMovementKey(e.code)) {
        scene.setKey(e.code, true);
        e.preventDefault();
      } else if ((e.code === "Space" || e.code === "Enter") && document.activeElement === document.body) {
        if (scene.serve()) e.preventDefault();
      }
    };
    const onKeyUp = (e) => { if (isMovementKey(e.code)) scene.setKey(e.code, false); };
    const onBlur = () => scene.clearKeys();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      scene.destroy();
      sceneRef.current = null;
      callbacks.current.onReady?.(null);
    };
  }, [reduced]);

  useEffect(() => {
    sceneRef.current?.setInputEnabled(inputEnabled);
  }, [inputEnabled]);

  const toLocal = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onPointerMove = (e) => {
    if (e.pointerType === "touch") return;
    sceneRef.current?.setPointer(toLocal(e));
  };
  const onPointerLeave = () => sceneRef.current?.clearPointer();
  const onPointerDown = (e) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (e.pointerType === "touch") {
      scene.tap(toLocal(e));
    } else if (e.button === 0) {
      scene.setPointer(toLocal(e));
      scene.serve();
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 w-full h-full touch-none select-none cursor-crosshair"
        aria-hidden="true"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      />
      {hintVisible && inputEnabled && (
        <p className="fixed bottom-6 inset-x-0 z-10 text-center font-mono text-cream/50 text-[0.7rem] uppercase tracking-widest pointer-events-none">
          {coarse ? "Tap where you want to serve" : "WASD to move · aim with the mouse · click to serve"}
        </p>
      )}
      <p className="sr-only">
        Move with W, A, S and D, aim with the mouse and click to serve into a zone, or use the menu to jump to a section.
      </p>
    </>
  );
};

export default IsoCourt;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/iso/IsoCourt.test.jsx`
Expected: PASS (6 tests). `fireEvent.pointerDown` in jsdom carries `pointerType` only when passed in the init object, as the test does. If "does not serve on Enter when a link has focus" fails, the `document.activeElement === document.body` guard is missing.

- [ ] **Step 5: Lint and commit**

```bash
cd website && npm run lint
cd .. && git add website/src/components/iso/IsoCourt.jsx website/src/components/iso/IsoCourt.test.jsx
git commit -m "Add the IsoCourt canvas wrapper with keyboard, pointer and touch input"
```

---

### Task 9: Wire `CourtStage` to the isometric court and the broadcast transition

**Files:**
- Modify: `website/src/pages/CourtStage.jsx` (full rewrite below)
- Modify: `website/src/pages/Layout.jsx` (stop rendering `ColdOpen`)
- Modify: `website/src/components/Footer.jsx` (root element gets `relative z-10` so it paints above the fixed canvas)
- Modify: `website/src/test/routes.test.jsx` (mock `IsoCourt`)
- Delete: `website/src/components/court/Ball.jsx`, `website/src/components/court/Player.jsx`

**Interfaces:**
- Consumes: `IsoCourt` (Task 8), `BroadcastTransition` + `buildTransition` (Task 4), the scene API (Task 7), `resolveActiveSection`, `Hud`, `OutCall`, `ServeTutorial`, the four section components.
- Produces: the court routes' behaviour. No new exports.

Behaviour (from the spec's "Route and state controller"):
- `active` comes from the URL. `displayed` is what is on screen; it lags `active` so the exit animation can run after the URL already changed.
- `null → A`: mount A hidden, build its timeline, play. `A → null`: `reverse()` at `timeScale(1.3)`, unmount on reverse complete. `A → B`: reverse at `timeScale(1.6)`, then show B. Back during entry: `reverse()` from the current progress. Re-entering the same section while exiting: `play()` again.
- First load with `active` set (deep link, and every jsdom test): instant — `progress(1)`, no animation, Hud shown.
- The `Hud` mounts only once the forward timeline completes and unmounts when an exit starts.
- Input to the court is disabled while a section is displayed or the tutorial is open.

- [ ] **Step 1: Update `routes.test.jsx` so it runs without a canvas**

Add directly under the existing `vi.mock('../lib/reviewsApi', ...)` block:

```jsx
// jsdom has no canvas or WebGL. The isometric court is a visual surface with
// its own unit tests (src/iso/*.test.js); here it is a stub so the route table
// renders real section content.
vi.mock('../components/iso/IsoCourt', () => ({
  default: () => <canvas data-testid="iso-court" aria-hidden="true" />,
}))
```

Run: `npx vitest run src/test/routes.test.jsx`
Expected: FAIL — "Failed to resolve import ../components/iso/IsoCourt" is **not** expected (Task 8 created it); the failures are in `CourtStage` still rendering the old drag court. Note which assertions fail; they must all pass after Step 3.

- [ ] **Step 2: Stop rendering the cold-open and lift the footer**

`website/src/pages/Layout.jsx`:

```jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

// ColdOpen (components/court/ColdOpen.jsx) is deliberately not rendered on the
// isometric prototype: it draws the top-down court and walks the player to a
// baseline position that no longer exists. Re-cut it for the isometric court
// before mounting it again.
const Layout = () => (
  <>
    <Navbar />
    <main className="court-turf min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

export default Layout;
```

In `website/src/components/Footer.jsx`, add `relative z-10` to the root element's `className` (the canvas is `fixed z-0`; an unpositioned footer would paint underneath it).

- [ ] **Step 3: Rewrite `CourtStage.jsx`**

```jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { resolveActiveSection } from "../data/sections";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import IsoCourt from "../components/iso/IsoCourt";
import BroadcastTransition, { buildTransition } from "../components/iso/BroadcastTransition";
import Hud from "../components/court/Hud";
import ServeTutorial from "../components/court/ServeTutorial";
import OutCall from "../components/court/OutCall";
import crowdAwwUrl from "../assets/crowd-aww.mp3";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";

// Crowd SFX playback level (0–1). Kept low so the reaction reads as ambience
// behind the shot rather than a jump-scare on a quiet page.
const SFX_VOLUME = 0.08;

const SECTION_COMPONENTS = {
  about: About,
  experience: Experience,
  projects: Projects,
  contact: Contact,
};

const focusHeading = (node) => {
  const heading = node?.querySelector("h2, h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
};

// The court routes. `active` is what the URL says; `displayed` is what is on
// screen — it lags behind so the broadcast transition can play out in reverse
// after the URL has already gone back to "/".
const CourtStage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const active = resolveActiveSection(location.pathname);

  const [displayed, setDisplayed] = useState(active);
  const [phase, setPhase] = useState(active ? "shown" : "idle"); // idle | entering | shown | exiting
  const [scene, setScene] = useState(null);
  const [outCall, setOutCall] = useState(false);
  const [tutorial, setTutorial] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const instantRef = useRef(!!active); // the next build renders at progress(1)
  const pendingRef = useRef(null);     // section to show once the current exit finishes
  const tlRef = useRef(null);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const cardRef = useRef(null);
  const liveRef = useRef(null);
  const missAudioRef = useRef(null);

  const playMiss = () => {
    let a = missAudioRef.current;
    if (!a) {
      a = new Audio(crowdAwwUrl);
      a.volume = SFX_VOLUME;
      missAudioRef.current = a;
    }
    a.currentTime = 0;
    a.play().catch(() => {});
  };

  const onLand = (result) => {
    if (result.type === "hit") {
      navigate(`/${result.sectionId}`);
    } else if (result.type === "out") {
      playMiss();
      setOutCall(true);
      setTimeout(() => setOutCall(false), 900);
    } else {
      playMiss();
      setTutorial(true);
    }
  };

  // URL → displayed. Decides whether to enter, exit, swap or resume.
  useEffect(() => {
    const tl = tlRef.current;
    if (active && !displayed) {
      instantRef.current = false;
      setDisplayed(active);
    } else if (!active && displayed) {
      if (tl) {
        setPhase("exiting");
        tl.timeScale(1.3).reverse();
      } else {
        setDisplayed(null);
        setPhase("idle");
      }
    } else if (active && displayed && active.id !== displayed.id) {
      pendingRef.current = active;
      if (tl) {
        setPhase("exiting");
        tl.timeScale(1.6).reverse();
      } else {
        instantRef.current = false;
        setDisplayed(active);
      }
    } else if (active && displayed && tl && tl.reversed()) {
      // Came back to the same section while it was leaving.
      pendingRef.current = null;
      setPhase("entering");
      tl.timeScale(1).play();
    }
  }, [active, displayed]);

  // displayed → timeline. Built once the hidden content is in the DOM.
  useLayoutEffect(() => {
    if (!displayed) return undefined;
    const els = overlayRef.current?.getEls();
    const content = contentRef.current;
    const card = cardRef.current;
    if (!els || !content || !card) return undefined;

    const cam = scene?.cam ?? { x: 0, y: 0, zoom: 1 };
    const focus = scene ? scene.focus(displayed.id) : { x: 0, y: 0 };
    scene?.lockCamera(true);
    const tl = buildTransition({ els, cam, focus, content, card, reduced });
    tl.eventCallback("onComplete", () => {
      setPhase("shown");
      focusHeading(content);
    });
    tl.eventCallback("onReverseComplete", () => {
      scene?.lockCamera(false);
      scene?.fit();
      const next = pendingRef.current;
      pendingRef.current = null;
      if (next) {
        instantRef.current = false;
        setDisplayed(next);
      } else {
        setDisplayed(null);
        setPhase("idle");
      }
    });
    tlRef.current = tl;

    const instant = instantRef.current || reduced || phaseRef.current === "shown";
    instantRef.current = false;
    if (instant) {
      tl.progress(1);
      setPhase("shown");
    } else {
      setPhase("entering");
      tl.play();
    }
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [displayed, scene, reduced]);

  useEffect(() => {
    if (displayed && liveRef.current) liveRef.current.textContent = `${displayed.label} section`;
  }, [displayed]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const goTo = (id) => navigate(id ? `/${id}` : "/");
  const Displayed = displayed ? SECTION_COMPONENTS[displayed.id] : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />

      <IsoCourt onReady={setScene} onLand={onLand} inputEnabled={!displayed && !tutorial} />

      <div className="fixed inset-0 z-30 pointer-events-none">
        <OutCall show={outCall} />
      </div>

      <BroadcastTransition ref={overlayRef} section={displayed} />

      {Displayed && (
        <div ref={contentRef} className="relative z-20" style={{ visibility: "hidden", opacity: 0 }}>
          <div ref={cardRef} className="py-24">
            <Displayed />
            <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 mt-6">
              <Link
                to="/"
                className="font-mono text-xs uppercase tracking-widest text-cream hover:text-ball transition-colors"
              >
                &larr; Back to court
              </Link>
            </div>
          </div>
        </div>
      )}

      {displayed && phase === "shown" && <Hud active={displayed} onNavigate={goTo} />}
      <ServeTutorial open={tutorial} onClose={() => setTutorial(false)} />
    </div>
  );
};

export default CourtStage;
```

- [ ] **Step 4: Delete the retired SVG ball and player**

```bash
cd website && grep -rn "court/Ball\|court/Player\|from \"./Ball\"\|from \"./Player\"" src || echo "no remaining imports"
git rm src/components/court/Ball.jsx src/components/court/Player.jsx
```

Expected: `grep` prints "no remaining imports" (only `CourtStage.jsx` imported them and it no longer does). `ColdOpen.jsx` keeps its own copies of the player parts and is untouched.

- [ ] **Step 5: Run the suite, lint and build**

Run (from `website/`): `npm run test && npm run lint && npm run build`
Expected: every test passes, including all of `routes.test.jsx` unchanged apart from the new mock; lint clean; the build prints chunk sizes and **no new third-party chunk** (there is no `pixi`, `three` or similar in `dist/assets`).

- [ ] **Step 6: Verify in the browser**

Run `npm run dev` and open `http://localhost:5173/`:
1. The isometric court fills the viewport under the navbar; the player stands bottom-left with the ball in hand; four labelled targets up-right.
2. WASD walks with a bob, lean and arm swing; starting squashes, stopping stretches; the player never crosses the net.
3. The reticle follows the mouse, sticks at max range with a dashed range ring, and turns yellow over a target.
4. Click: toss, wind-up, strike with a small camera kick; ball arcs with a dotted trail, bounces with squash, dust and ripple.
5. Landing in a target: slam caption → zoom → wipe + ticker → flash → content slides in → Hud appears. "Back to court" plays it all in reverse and the ball pops back into the hand.
6. Landing on the court outside a box: "OUT" + groan; off the court entirely: the tutorial modal + groan.
7. Clicking a different section in the Hud: reverse, then forward into the new target.
8. Click "Back to court" mid-zoom: it reverses from where it is.
9. Open `http://localhost:5173/experience` directly: content visible immediately, camera already zoomed, no animation.
Note anything that looks off in the commit message body; do not block the commit on taste — the owner tunes feel after.

- [ ] **Step 7: Commit**

```bash
cd .. && git add -A website/src
git commit -m "Mount the isometric court and the reversible broadcast transition

Replaces the top-down drag-to-serve hub with the Canvas 2D isometric court,
runs one GSAP timeline per section visit (forward on entry, reverse on exit),
stops rendering the cold-open on this prototype branch, and removes the
retired SVG Ball and Player."
```

---

### Task 10: Document the prototype and verify the branch

**Files:**
- Modify: `AGENTS.md` (repo root)

- [ ] **Step 1: Add the prototype banner and the new layout entries to `AGENTS.md`**

Directly under the existing `> **Tennis-broadcast redesign — Phases 0–4 shipped.**` blockquote, add:

```markdown
> **Isometric court prototype — branch `isometric-court-prototype`.** On this branch the hub is an **isometric, game-like court** drawn on a Canvas 2D element (`src/components/iso/IsoCourt.jsx` + `src/iso/*`), not the top-down SVG drag court described below. You walk the player with WASD (screen-relative), aim with the mouse (a ground reticle, clamped to a 17 m range so the beyond-baseline rings need a walk to the net), and click / Space to serve; the ball flies a solved arc, bounces with squash-and-stretch, and its first contact is classified by `src/iso/court.js`. A hit navigates and plays a **reversible broadcast transition** (`src/components/iso/BroadcastTransition.jsx`): slam caption → camera zoom onto the target → three angled wipe panels with a ticker → flash → the section card slides in; leaving the section runs the same GSAP timeline in reverse. The engine decision (no library — PixiJS 8.22 measured 177 KB gz, LittleJS 1.28 120 KB gz; GSAP already shipped) and every tuning number live in [`plan/2026-10-30-isometric-court-prototype-design.md`](plan/2026-10-30-isometric-court-prototype-design.md) and its plan. On this branch `ColdOpen` is not rendered (it draws the old court) and the SVG `Ball.jsx` / `Player.jsx` were removed; `Court.jsx` remains because the `Hud` docks it. The sections below that describe the drag-to-serve hub are the `main` behaviour.
```

In the **Repository layout** tree, add under `src/`:

```
        ├── iso/                   # isometric court: projection, court geometry (TARGETS), ballistics, controls, rig, render, scene — pure modules with Vitest tests
        ├── components/iso/        # IsoCourt (canvas wrapper), BroadcastTransition (overlay + reversible GSAP timeline)
```

In the **Commands**/**Guardrails** test description, add `src/iso/*.test.js`, `BroadcastTransition.test.jsx` and `IsoCourt.test.jsx` to the list of what `npm run test` covers, and note that `routes.test.jsx` mocks `IsoCourt` because jsdom has no canvas.

- [ ] **Step 2: Final verification**

```bash
cd website && npm run lint && npm run test && npm run build
git status --short   # only AGENTS.md should be modified
```

Expected: all green; `dist/` is not tracked.

- [ ] **Step 3: Commit**

```bash
cd .. && git add AGENTS.md
git commit -m "Document the isometric court prototype branch"
```
