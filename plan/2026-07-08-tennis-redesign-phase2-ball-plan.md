# Phase 2 — The Ball — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn zone navigation into a serve. Clicking a court zone on the hub launches a neon ball from the near baseline; it arcs to the zone (GSAP), lands with a Hawk-Eye dotted trail and an impact ripple, and *then* the section erupts from that point. Reduced-motion skips the flight and navigates instantly. No player yet (the ball originates from a baseline point — the player mascot is Phase 3).

**Architecture:** The ball's trajectory is a **unit-tested quadratic bézier** (pure functions in `sections.js`), so the motion is deterministic and verifiable without a browser. `Ball.jsx` animates a scalar `t: 0→1` with GSAP and computes the ball's `(cx, cy)` from the bézier each frame (no MotionPathPlugin — avoids SVG-coordinate quirks). `CourtStage` gains a small serve state machine: a hub zone click sets a serve target (instead of navigating), the `Ball` plays, and `onComplete` navigates — which triggers the existing Phase 1 erupt. `usePrefersReducedMotion` bypasses the ball entirely.

**Tech Stack:** React 18, Vite 6, Tailwind 3, React Router 7, framer-motion 11 (Phase 1), **gsap 3 + @gsap/react** (new), Vitest.

**⚠️ Visual-tuning note:** Animation parameters here (arc apex `150`, durations, easings, ball/ripple sizes, dash pattern) are sensible defaults, not final. They are marked "tune visually." The *structure* (bézier math, serve state machine, reduced-motion bypass, navigate-on-impact) is testable/reviewable; the *feel* needs a live `npm run dev`. Do not merge without a human visual pass.

**Plan for Phase 2 of the roadmap.** Builds on Phases 0–1 (merged). Phase 3 = the player mascot (idle/serve animation replacing the baseline ball origin); Phase 4 = the cinematic cold-open.

## Global Constraints

- All npm commands run from `website/`. Node 20.
- Verification: lint + build + `npm run test` (Vitest for the bézier/geometry logic) + manual `npm run dev`.
- Palette from Phase 0 (`grass`/`wimbledon`/`cream`/`charcoal`/`ball`). The ball is `ball` yellow (`#d6f84c`) with a thin `grass-dark` outline. Neon `ball` yellow accent-only, never body text.
- Reduced motion: `usePrefersReducedMotion()` must fully bypass the serve (instant navigate, Phase 1 behavior). GSAP animations only run when NOT reduced.
- Section `id`s and per-section URLs unchanged. External-link rules unchanged.
- Do not commit `website/dist/`. Commits atomic, **no AI co-author / "Generated with" trailer**. Branch `feat/phase2-ball`; PR at the end; never push to `main` directly.

## File Structure

| File | Responsibility |
|---|---|
| `src/data/sections.js` (modify) | Add `SERVE_ORIGIN`, `serveControl()`, `servePathD()`, `bezierPoint()` — the pure trajectory math. |
| `src/data/sections.test.js` (modify) | Tests for the new trajectory functions. |
| `src/components/court/Ball.jsx` (new) | SVG overlay: idle-bobbing ball, GSAP serve (bézier arc), Hawk-Eye trail, impact ripple; `onComplete` callback. |
| `src/components/court/Court.jsx` (modify) | Add `fill` (overlay-friendly layout) and `disabled` (block zone clicks mid-serve) props. |
| `src/pages/CourtStage.jsx` (modify) | Serve state machine: hub zone click → serve (or instant nav under reduced motion) → navigate on impact; wrap hub `Court` + `Ball` in a shared aspect-ratio frame. |
| `AGENTS.md` (modify) | Note the ball serve now ships (player still Phase 3). |
| `package.json` (modify) | Add `gsap` + `@gsap/react`. |

---

## Before you begin

```bash
cd /Users/smarthkaul/Developer/smarthkaul.github.io
git checkout main && git pull origin main
git checkout -b feat/phase2-ball
cd website && npm install
npm run lint && npm run test && npm run build   # confirm Phase 1 baseline is green
```

---

## Task 1: Add GSAP

**Files:** Modify `website/package.json`.

- [ ] **Step 1: Install**

Run (from `website/`):
```bash
npm install gsap@^3 @gsap/react@^2
```
Expected: both land in `dependencies`. (GSAP is fully free incl. plugins as of 2025.)

- [ ] **Step 2: Verify baseline still builds**

Run: `cd website && npm run lint && npm run test && npm run build`
Expected: clean lint, 10 tests pass, build succeeds. (Nothing imports gsap yet.)

- [ ] **Step 3: Commit**

```bash
git add website/package.json website/package-lock.json
git commit -m "Add gsap and @gsap/react"
```

---

## Task 2: Serve trajectory math (TDD)

**Files:**
- Modify: `website/src/data/sections.js`
- Modify: `website/src/data/sections.test.js`

**Interfaces:**
- Produces:
  - `SERVE_ORIGIN = { x: 180, y: 520 }` — near-baseline centre in court units.
  - `serveControl(origin, target)` → `{ x, y }` bézier control point (apex above the higher of the two points).
  - `servePathD(origin, control, target)` → SVG quadratic path `d` string (the Hawk-Eye trail).
  - `bezierPoint(origin, control, target, t)` → `{ x, y }` point on the quadratic curve at `t∈[0,1]`.
- Consumed by `Ball.jsx` (Task 4).

- [ ] **Step 1: Write the failing tests**

Add to `website/src/data/sections.test.js` (append these `describe` blocks; keep the existing imports and add the new names to the import from `./sections`):
```js
import {
  SECTIONS, COURT, BOXES, resolveActiveSection,
  SERVE_ORIGIN, serveControl, servePathD, bezierPoint,
} from './sections'

describe('serve trajectory', () => {
  const O = SERVE_ORIGIN
  const T = { x: 120, y: 202.5 } // far-left box centre

  it('SERVE_ORIGIN is the near-baseline centre within the court', () => {
    expect(SERVE_ORIGIN).toEqual({ x: 180, y: 520 })
    expect(SERVE_ORIGIN.x).toBeLessThanOrEqual(COURT.width)
    expect(SERVE_ORIGIN.y).toBeLessThanOrEqual(COURT.height)
  })

  it('serveControl apex sits above the higher of origin/target', () => {
    const c = serveControl(O, T)
    expect(c.x).toBeCloseTo((O.x + T.x) / 2)
    expect(c.y).toBeLessThan(Math.min(O.y, T.y)) // smaller y = higher on screen
  })

  it('bezierPoint returns the endpoints at t=0 and t=1', () => {
    const c = serveControl(O, T)
    expect(bezierPoint(O, c, T, 0)).toEqual(O)
    const end = bezierPoint(O, c, T, 1)
    expect(end.x).toBeCloseTo(T.x)
    expect(end.y).toBeCloseTo(T.y)
  })

  it('bezierPoint midpoint is pulled toward the control point (arcs upward)', () => {
    const c = serveControl(O, T)
    const mid = bezierPoint(O, c, T, 0.5)
    const straightMidY = (O.y + T.y) / 2
    expect(mid.y).toBeLessThan(straightMidY) // the arc rises above the straight line
  })

  it('servePathD emits a quadratic path string through the control point', () => {
    const c = serveControl(O, T)
    expect(servePathD(O, c, T)).toBe(`M ${O.x} ${O.y} Q ${c.x} ${c.y} ${T.x} ${T.y}`)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd website && npm run test -- sections`
Expected: FAIL (new exports undefined).

- [ ] **Step 3: Implement in `sections.js`**

Append to `website/src/data/sections.js` (after the existing `resolveActiveSection`):
```js
// --- Serve trajectory (Phase 2) ---

// Near-baseline centre — where the ball launches from (no player yet).
export const SERVE_ORIGIN = { x: 180, y: 520 };

// Control point for a lobbed quadratic arc: horizontally between the two
// points, vertically above the higher of them (smaller y = higher on screen).
export function serveControl(origin, target) {
  return {
    x: (origin.x + target.x) / 2,
    y: Math.min(origin.y, target.y) - 150,
  };
}

// SVG quadratic path string — used to draw the Hawk-Eye trail.
export function servePathD(origin, control, target) {
  return `M ${origin.x} ${origin.y} Q ${control.x} ${control.y} ${target.x} ${target.y}`;
}

// Point on the quadratic bézier at t in [0,1]. The ball follows this per frame.
export function bezierPoint(origin, control, target, t) {
  const u = 1 - t;
  return {
    x: u * u * origin.x + 2 * u * t * control.x + t * t * target.x,
    y: u * u * origin.y + 2 * u * t * control.y + t * t * target.y,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd website && npm run test -- sections`
Expected: all pass (existing + new).

- [ ] **Step 5: Commit**

```bash
git add website/src/data/sections.js website/src/data/sections.test.js
git commit -m "Add serve trajectory math (quadratic bezier)"
```

---

## Task 3: Court `fill` + `disabled` props

**Files:** Modify `website/src/components/court/Court.jsx`.

**Interfaces:**
- Adds two optional props to `Court`:
  - `fill` (bool, default false): when true, the court container is `absolute inset-0 w-full h-full` (no own `maxWidth`/`aspectRatio`) so a parent frame can size it and overlay the `Ball`. When false, behavior is unchanged (its own sized container — used by the docked `Hud`).
  - `disabled` (bool, default false): when true, zone `<button>`s get the `disabled` attribute and `pointer-events-none` (blocks clicks mid-serve).

- [ ] **Step 1: Edit `Court.jsx`**

Change the component signature and the container/button rendering. Replace the outer container opening and the `<button>` element as follows.

Signature — change:
```jsx
const Court = ({ active, onNavigate, docked = false }) => {
```
to:
```jsx
const Court = ({ active, onNavigate, docked = false, fill = false, disabled = false }) => {
```

Container `<div>` — change:
```jsx
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: docked ? 220 : 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
    >
```
to:
```jsx
    <div
      className={fill ? "absolute inset-0 w-full h-full" : "relative mx-auto w-full"}
      style={fill ? undefined : { maxWidth: docked ? 220 : 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
    >
```

Zone `<button>` — add `disabled` and a disabled style. Change the opening tag:
```jsx
          <button
            key={s.id}
            type="button"
            onClick={() => onNavigate(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive ? "page" : undefined}
```
to:
```jsx
          <button
            key={s.id}
            type="button"
            onClick={() => onNavigate(s.id)}
            disabled={disabled}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive ? "page" : undefined}
```
and in that button's `className` template, append `${disabled ? "pointer-events-none" : ""}` to the existing class list (add it inside the template string, e.g. right after the `${docked ? "" : "zone-pulse"}` segment).

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green. (Court still renders identically everywhere — `fill`/`disabled` default false, so the docked Hud usage is unchanged.)

- [ ] **Step 3: Commit**

```bash
git add website/src/components/court/Court.jsx
git commit -m "Add fill and disabled props to Court for ball overlay"
```

---

## Task 4: The Ball component

**Files:** Create `website/src/components/court/Ball.jsx`.

**Interfaces:**
- `Ball` — props `{ target, onComplete }`. `target` is a `BOXES` entry `{cx, cy, ...}` when serving, else `null`. Renders an `absolute inset-0`, `pointer-events-none`, `aria-hidden` SVG (viewBox = COURT) containing the Hawk-Eye trail `<path>`, the impact `<circle>` ripple, and the ball `<circle>`. When `target` is null the ball bobs gently at `SERVE_ORIGIN`; when `target` is set it serves along the bézier and calls `onComplete` at impact.
- Consumed by `CourtStage` (Task 5).

**⚠️ All numeric animation values below are tune-visually defaults.**

- [ ] **Step 1: Create `Ball.jsx`**

```jsx
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { COURT, SERVE_ORIGIN, serveControl, servePathD, bezierPoint } from "../../data/sections";

const Ball = ({ target, onComplete }) => {
  const scope = useRef(null);
  const ballRef = useRef(null);
  const trailRef = useRef(null);
  const rippleRef = useRef(null);

  // Idle bob at the baseline when not serving.
  useGSAP(
    () => {
      if (target) return;
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });
      gsap.to(ballRef.current, {
        attr: { cy: SERVE_ORIGIN.y - 8 },
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope, dependencies: [target] }
  );

  // Serve: follow the bézier from origin to the target zone, then onComplete.
  useGSAP(
    () => {
      if (!target) return;
      const targetPt = { x: target.cx, y: target.cy };
      const control = serveControl(SERVE_ORIGIN, targetPt);
      const d = servePathD(SERVE_ORIGIN, control, targetPt);

      gsap.set(trailRef.current, { attr: { d }, opacity: 0 });
      gsap.set(rippleRef.current, { attr: { cx: targetPt.x, cy: targetPt.y, r: 2 }, opacity: 0 });
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });

      const progress = { t: 0 };
      const tl = gsap.timeline({ onComplete });
      tl.to(trailRef.current, { opacity: 0.7, duration: 0.12 }, 0);
      tl.to(
        progress,
        {
          t: 1,
          duration: 0.75,
          ease: "power1.in",
          onUpdate: () => {
            const p = bezierPoint(SERVE_ORIGIN, control, targetPt, progress.t);
            gsap.set(ballRef.current, { attr: { cx: p.x, cy: p.y } });
          },
        },
        0
      );
      // Impact ripple at landing.
      tl.to(rippleRef.current, { attr: { r: 42 }, opacity: 0.6, duration: 0.05 }, ">-0.03");
      tl.to(rippleRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" });
      tl.to(trailRef.current, { opacity: 0, duration: 0.4 }, "<");
    },
    { scope, dependencies: [target] }
  );

  return (
    <svg
      ref={scope}
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <path
        ref={trailRef}
        fill="none"
        stroke="#d6f84c"
        strokeWidth="3"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0"
      />
      <circle ref={rippleRef} fill="none" stroke="#d6f84c" strokeWidth="3" opacity="0" />
      <circle ref={ballRef} cx={SERVE_ORIGIN.x} cy={SERVE_ORIGIN.y} r="8" fill="#d6f84c" stroke="#276e3c" strokeWidth="1.5" />
    </svg>
  );
};

export default Ball;
```

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green. (Ball isn't rendered yet — wired in Task 5. Confirms it compiles and imports resolve.)

- [ ] **Step 3: Commit**

```bash
git add website/src/components/court/Ball.jsx
git commit -m "Add Ball component with bezier serve, trail, and ripple"
```

---

## Task 5: Wire the serve into CourtStage

**Files:** Modify `website/src/pages/CourtStage.jsx`.

**Interfaces:**
- Consumes: `Ball` (Task 4), `Court` `fill`/`disabled` (Task 3), `BOXES`/`COURT` (Task 2), `usePrefersReducedMotion` (Phase 1).
- Behavior: on the hub, clicking a zone calls `startServe(id)`. Under reduced motion `startServe` navigates immediately. Otherwise it sets `serveTarget`, the `Ball` plays, and `handleServeComplete` navigates (Phase 1 erupt follows). Zones are `disabled` while serving. The hub wraps `Court` (with `fill`) and `Ball` in one aspect-ratio frame so their coordinate spaces align.

- [ ] **Step 1: Edit `CourtStage.jsx`**

(a) Update imports:
```jsx
import { useEffect, useRef, useState } from "react";
```
and add to the sections import (keep the existing names):
```jsx
import { BOXES, COURT, resolveActiveSection } from "../data/sections";
```
and add:
```jsx
import Ball from "../components/court/Ball";
```

(b) Inside the component, after `const reduced = usePrefersReducedMotion();`, add the serve state + handlers:
```jsx
  const [serveTarget, setServeTarget] = useState(null);

  const startServe = (id) => {
    const section = resolveActiveSection(`/${id}`);
    if (!section) return;
    if (reduced) {
      navigate(`/${id}`);
      return;
    }
    setServeTarget(section);
  };

  const handleServeComplete = () => {
    if (serveTarget) {
      const id = serveTarget.id;
      setServeTarget(null);
      navigate(`/${id}`);
    }
  };
```

(c) Replace the hub's `<Court active={null} onNavigate={goTo} />` with the shared frame:
```jsx
          <div
            className="relative mx-auto w-full"
            style={{ maxWidth: 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
          >
            <Court active={null} onNavigate={startServe} fill disabled={!!serveTarget} />
            <Ball target={serveTarget ? BOXES[serveTarget.box] : null} onComplete={handleServeComplete} />
          </div>
```

Note: `serveTarget` is a SECTION object (from `resolveActiveSection`), which has `.id`/`.box` but not `.cx`/`.cy`. `Ball` needs the box geometry, so pass `BOXES[serveTarget.box]` (which has `cx`/`cy`); `handleServeComplete` reads the id from `serveTarget.id`. That is why `BOXES` is imported in step (a).

Leave the `AnimatePresence` section overlay, the `Hud`, the live region, and the reduced-motion focus logic unchanged.

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green.

- [ ] **Step 3: Manual check (REQUIRED — this is the visual gate)**

Run `npm run dev` at `/`.
Expected:
  - A neon ball rests at the bottom-centre of the court, bobbing gently.
  - Clicking a zone launches the ball on an arc to that zone with a dotted trail; it lands with an expanding ripple; then the section card erupts and the court docks.
  - You cannot trigger a second serve mid-flight (zones disabled).
  - Enable OS "Reduce motion": clicking a zone navigates instantly with no ball.
  - Keyboard: Tab to a zone, Enter — the serve plays (or instant under reduced motion) and focus lands on the section heading.
**If the arc/timing/ripple feel off, tune the values in `Ball.jsx` (durations, `power1.in`, apex `-150` in `serveControl`, radii) and re-check — this is expected.**

- [ ] **Step 4: Commit**

```bash
git add website/src/pages/CourtStage.jsx
git commit -m "Wire ball serve into hub navigation with reduced-motion bypass"
```

---

## Task 6: Update AGENTS.md

**Files:** Modify `AGENTS.md`.

- [ ] **Step 1: Reflect the shipped ball**

Update the phase note and the rendering-architecture section: the ball serve now ships (clicking a hub zone launches a GSAP-animated ball that arcs to the zone, lands with a ripple/Hawk-Eye trail, then the section erupts; reduced motion bypasses it). GSAP (`gsap` + `@gsap/react`) is now a dependency. The **player mascot is still Phase 3** (the ball currently originates from a baseline point, not a player), and the docked-HUD mini-court still navigates instantly (main-court serve only). Do not describe the player as present.

- [ ] **Step 2: Sanity check + commit**

Run: `grep -n "no flying ball\|no player" AGENTS.md` — update any line that now contradicts the shipped ball (the "no flying ball" caveat should become "no player mascot yet"). Then:
```bash
git add AGENTS.md
git commit -m "Update AGENTS.md: ball serve shipped (player still Phase 3)"
```

---

## Task 7: Full verification + open PR

**Files:** none.

- [ ] **Step 1: Full check**

Run: `cd website && npm run lint && npm run test && npm run build`
Expected: lint clean; Vitest green (incl. new trajectory tests); build succeeds; `dist/404.html` still present.

- [ ] **Step 2: Preview walkthrough**

Run `npm run preview`. Re-verify the Task 5 manual checklist against the production build. Confirm `grep -rnE "slate-|violet|indigo" website/src` → nothing.

- [ ] **Step 3: Push + open PR**

```bash
git push -u origin feat/phase2-ball
gh pr create --title "Phase 2: the ball serve" --body "Implements Phase 2 of the tennis-broadcast redesign (plan/2026-07-08-tennis-redesign-phase2-ball-plan.md).

- Clicking a hub zone launches a neon ball on a quadratic-bezier arc (GSAP) to that zone, with a Hawk-Eye dotted trail and an impact ripple; the section then erupts from the landing point.
- Trajectory is a unit-tested pure bezier (deterministic); serve state machine navigates on impact.
- Reduced motion fully bypasses the serve (instant navigation). Keyboard-operable.
- Idle ball bobs at the baseline. No player mascot yet (Phase 3); HUD mini-court still navigates instantly.

Animation feel (timings/easings/arc height) is first-pass and meant to be tuned in-browser."
```

- [ ] **Step 4: Review + merge**

Because this is animation work, do a real `npm run dev` visual pass before merging. Then squash-merge, delete the branch, sync `main`.

---

## Self-Review (against the spec)

**Spec coverage (spec §4.2 serve interaction, §8.2 reduced motion):**
- §4.2 beats 3–6 (trigger → flight → impact → erupt): flight = `Ball` bézier (Task 4), impact ripple (Task 4), erupt = existing Phase 1 (navigate on complete, Task 5). The wind-up/toss (beats "player winds up") is Phase 3 (needs the player). ✅ (player beat deferred)
- §4.2 "flight is the loading buffer": the ~0.75s serve delays navigation; SPA components are already loaded so there's nothing to preload, but the buffer exists for the erupt. ✅
- Hawk-Eye dotted trail: `trailRef` path (Task 4). ✅
- §8.2 reduced-motion: `startServe` bypasses the ball under `usePrefersReducedMotion` (Task 5). ✅

**Placeholder scan:** No TBD/TODO. Animation constants are concrete values explicitly flagged as tune-visually (a real number the engineer runs, not a blank). ✅

**Type/name consistency:** `SERVE_ORIGIN`/`serveControl`/`servePathD`/`bezierPoint` defined in Task 2, used in Task 4. `Ball` props `{target,onComplete}` (Task 4) match CourtStage usage (Task 5). `Court` `fill`/`disabled` (Task 3) used in Task 5. `serveTarget` is a `SECTIONS`/`BOXES`-shaped object (has `.box`, `.id`, and via `BOXES[target.box]`… note: Ball receives the SECTION object and reads `target.cx/target.cy` — see caveat). ✅ — **caveat resolved below.**

**Caveat (already fixed inline in Task 5):** `serveTarget` is a SECTION (from `resolveActiveSection` — has `.id`/`.box`, not `.cx/.cy`), but `Ball` reads `target.cx/target.cy`. Task 5 Step 1(c) therefore passes `target={serveTarget ? BOXES[serveTarget.box] : null}` (box geometry, which has `cx/cy`) and `handleServeComplete` reads `serveTarget.id`. No further action needed — this is already reflected in the Task 5 code.

**Deferred to later phases:** player mascot + wind-up/toss/swing + the ball originating from a racket (Phase 3); serve-from-the-docked-HUD (currently instant); cinematic cold-open (Phase 4); `LazyMotion`/bundle trimming and favicon rebrand (polish).
```
