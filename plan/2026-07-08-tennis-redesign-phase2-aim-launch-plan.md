# Phase 2 (reworked) — Aim & Launch Serve — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Supersedes** `plan/2026-07-08-tennis-redesign-phase2-ball-plan.md` (the auto-serve mechanic). This reworks the ball interaction from "click a box → ball auto-flies there" to a **drag-to-aim, pull-for-power launch** where you place the shot yourself.

**Goal:** The ball sits at the baseline. You **drag** it — pull direction sets aim (mirrored, slingshot-style), pull distance sets power — with an on-screen **aim line + power gauge** (no landing preview). Release to launch the ball on an arc. **Where it lands decides everything:** in a service box → navigate to that section; in-bounds but no box → `OUT` call + ball returns; beyond the court → a **serve-tutorial easter-egg modal** (video placeholder for now). The accessible menu remains the keyboard/mobile fallback.

**Architecture:** Built on the already-merged-to-branch Phase 2 infra (GSAP, `Ball` rendering, bézier arc, `Court`/geometry). The **decision logic is pure and unit-tested**: `landingFromPull()` maps a drag vector to a landing point; `classifyLanding()` returns `hit`/`out`/`beyond`. `CourtStage` runs an aim state machine (`idle → aiming → flying → resolving`) driven by pointer events; `Ball` renders the aim line + power gauge and flies the bézier to the computed landing point, calling back on impact. `usePrefersReducedMotion` + the menu keep it accessible.

**Tech Stack:** React 18, Vite 6, Tailwind 3, React Router 7, framer-motion 11, gsap 3 + @gsap/react, Vitest. (No new deps.)

**⚠️ Hands-on-feel work.** This is a drag-with-power mechanic — the *pure logic* (pull→landing math, hit/out/beyond classifier) is unit-tested and correct without a browser, but the **feel** (power scale, pull sensitivity, aim-line/gauge look, arc height, timing) is authored with defaults and MUST be tuned live (`npm run dev`). Do not merge on structure alone.

**Branch:** continue on `feat/phase2-ball` (reuses the GSAP/Ball/geometry commits already there); the auto-serve wiring is replaced. PR #7 evolves; it stays unmerged until the human feel-pass.

## Global Constraints

- All npm commands run from `website/`. Node 20.
- Verification: lint + build + `npm run test` (Vitest for the pull/landing logic) + manual `npm run dev`.
- Palette grass/wimbledon/cream/charcoal/ball; the ball, aim line, gauge, and trail are `ball` yellow (`#d6f84c`); `ball` accent-only, never body text.
- **Accessibility:** the drag-aim mechanic is pointer-only; the `SectionMenu` (in the navbar) is the keyboard/screen-reader/mobile-precision fallback and must reach every section. Reduced motion: the ball *flight* is instant; the aim/launch logic still works, but the menu is the primary reduced-motion path. The court's decorative SVG stays `aria-hidden`.
- Section `id`s / per-section URLs unchanged. Commits atomic, **no AI co-author / "Generated with" trailer**; dist not committed; base "/".

## File Structure

| File | Responsibility |
|---|---|
| `src/data/sections.js` (modify) | Add `COURT_BOUNDS`, `landingFromPull()`, `pointInRect()`, `classifyLanding()` — the pure aim/landing logic. |
| `src/data/sections.test.js` (modify) | Tests for the new logic. |
| `src/components/court/Ball.jsx` (modify) | Replace the `target`-box API with an `aim` (drag state → aim line + power gauge) + `shot` (landing point → bézier flight → `onLand`) API. Keep trail/ripple/idle-bob (reduced-motion-gated). |
| `src/components/court/ServeTutorial.jsx` (new) | The "beyond the court" easter-egg modal: a placeholder for the serve video + a dismiss. |
| `src/components/court/OutCall.jsx` (new) | A small broadcast `OUT` badge shown on an in-bounds miss. |
| `src/pages/CourtStage.jsx` (modify) | Replace the auto-serve state machine with the aim state machine + pointer handlers; classify landings → navigate / OUT / tutorial. Zones become non-navigating targets. |
| `AGENTS.md` (modify) | Describe the aim-launch mechanic. |

---

## Before you begin

```bash
cd /Users/smarthkaul/Developer/smarthkaul.github.io
git checkout feat/phase2-ball   # the branch already has GSAP + Ball + geometry
git pull --ff-only origin feat/phase2-ball 2>/dev/null || true
cd website && npm install
npm run lint && npm run test && npm run build   # confirm the branch baseline is green
```

---

## Task 1: Aim/landing logic (TDD)

**Files:** Modify `website/src/data/sections.js`, `website/src/data/sections.test.js`.

**Interfaces:**
- `COURT_BOUNDS = { x: 20, y: 20, w: 320, h: 500 }` — the doubles boundary rect (matches `Court.jsx`'s SVG boundary).
- `landingFromPull(origin, pull, opts?)` → `{ x, y }`: mirrors the drag `pull` (pointer − origin), scales by `opts.power` (default 2.2), clamps magnitude to `opts.maxReach` (default 560). `origin + mirroredScaledPull`.
- `pointInRect(p, r)` → bool.
- `classifyLanding(point)` → `{ type: "hit", sectionId }` if in a service box, else `{ type: "out" }` if within `COURT_BOUNDS`, else `{ type: "beyond" }`.

- [ ] **Step 1: Write the failing tests**

Append to `website/src/data/sections.test.js` (and add the four new names to the existing `import { ... } from './sections'`):
```js
describe('aim & landing', () => {
  it('landingFromPull mirrors and scales the pull vector', () => {
    // pulling DOWN (positive y) should send the ball UP the court (smaller y)
    const p = landingFromPull(SERVE_ORIGIN, { x: 0, y: 40 }, { power: 2, maxReach: 1000 })
    expect(p.x).toBeCloseTo(SERVE_ORIGIN.x)          // no horizontal pull → straight
    expect(p.y).toBeCloseTo(SERVE_ORIGIN.y - 80)     // -pull.y * power = -80
  })

  it('landingFromPull clamps to maxReach', () => {
    const p = landingFromPull(SERVE_ORIGIN, { x: 0, y: 1000 }, { power: 2, maxReach: 100 })
    expect(SERVE_ORIGIN.y - p.y).toBeCloseTo(100)    // clamped to 100, upward
  })

  it('pointInRect is inclusive of edges', () => {
    expect(pointInRect({ x: 60, y: 135 }, BOXES['far-left'])).toBe(true)
    expect(pointInRect({ x: 0, y: 0 }, BOXES['far-left'])).toBe(false)
  })

  it('classifyLanding: hit when inside a service box', () => {
    const far = BOXES['far-left']
    expect(classifyLanding({ x: far.cx, y: far.cy })).toEqual({ type: 'hit', sectionId: 'projects' })
  })

  it('classifyLanding: out when in-bounds but not in a box', () => {
    // near baseline, inside court, below all service boxes (y between 405 and 520)
    expect(classifyLanding({ x: 180, y: 460 })).toEqual({ type: 'out' })
  })

  it('classifyLanding: beyond when outside the court bounds', () => {
    expect(classifyLanding({ x: 180, y: -40 })).toEqual({ type: 'beyond' })  // past far baseline
    expect(classifyLanding({ x: 500, y: 200 })).toEqual({ type: 'beyond' })  // past sideline
  })
})
```
(Note: `far-left` box maps to the `projects` section per `SECTIONS` — verify that mapping when asserting `sectionId`.)

- [ ] **Step 2: Run to verify failure**

Run: `cd website && npm run test -- sections`
Expected: FAIL (new exports undefined).

- [ ] **Step 3: Implement in `sections.js`**

Append to `website/src/data/sections.js`:
```js
// --- Aim & landing (Phase 2 rework) ---

// Doubles boundary rectangle in court units (matches Court.jsx's SVG boundary).
export const COURT_BOUNDS = { x: 20, y: 20, w: 320, h: 500 };

// Landing point from a drag "pull" vector (pointer - origin). Mirrored like a
// slingshot (pull down → launch up the court) and scaled by power, clamped so a
// huge pull can't send the ball infinitely far.
export function landingFromPull(origin, pull, opts = {}) {
  const power = opts.power ?? 2.2;
  const maxReach = opts.maxReach ?? 560;
  let vx = -pull.x * power;
  let vy = -pull.y * power;
  const mag = Math.hypot(vx, vy);
  if (mag > maxReach && mag > 0) {
    vx = (vx / mag) * maxReach;
    vy = (vy / mag) * maxReach;
  }
  return { x: origin.x + vx, y: origin.y + vy };
}

export function pointInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

// Classify a landing point: a service box (navigate), in-bounds miss (OUT), or
// off the court entirely (the serve-tutorial easter egg).
export function classifyLanding(point) {
  for (const s of SECTIONS) {
    if (pointInRect(point, BOXES[s.box])) return { type: "hit", sectionId: s.id };
  }
  if (pointInRect(point, COURT_BOUNDS)) return { type: "out" };
  return { type: "beyond" };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd website && npm run test -- sections`
Expected: all pass. Also run `npm run lint`.

- [ ] **Step 5: Commit**

```bash
git add website/src/data/sections.js website/src/data/sections.test.js
git commit -m "Add aim-to-landing math and hit/out/beyond classifier"
```

---

## Task 2: Ball — aim line, power gauge, launch-to-point

**Files:** Modify `website/src/components/court/Ball.jsx`.

**Interfaces:**
- New props: `aim` (`{ pull: {x,y}, power: 0..1 } | null` — while dragging) and `shot` (`{ x, y } | null` — the landing point to fly to) and `onLand` (called at impact with no args). Keeps the reduced-motion-gated idle bob when `aim` and `shot` are both null. Remove the old `target` prop.
- While `aim` is set: draw an **aim line** from the ball in the launch direction (opposite the pull), plus a **power gauge** (a short bar whose fill ∝ `aim.power`). No landing marker (power-meter-only).
- While `shot` is set: fly the ball along the bézier from `SERVE_ORIGIN` to `shot` (reuse `serveControl`/`servePathD`/`bezierPoint`), draw the trail, ripple at landing, then `onLand()`. Under reduced motion, jump instantly and call `onLand()` immediately.

- [ ] **Step 1: Rewrite `Ball.jsx`**

Replace `website/src/components/court/Ball.jsx` with:
```jsx
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { COURT, SERVE_ORIGIN, serveControl, servePathD, bezierPoint } from "../../data/sections";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const Ball = ({ aim, shot, onLand }) => {
  const reduced = usePrefersReducedMotion();
  const scope = useRef(null);
  const ballRef = useRef(null);
  const trailRef = useRef(null);
  const rippleRef = useRef(null);

  // Idle bob at the baseline when neither aiming nor mid-flight.
  useGSAP(
    () => {
      if (aim || shot) return;
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });
      if (reduced) return;
      gsap.to(ballRef.current, {
        attr: { cy: SERVE_ORIGIN.y - 8 },
        duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1,
      });
    },
    { scope, dependencies: [aim, shot, reduced] }
  );

  // Flight to the landing point, then onLand.
  useGSAP(
    () => {
      if (!shot) return;
      const control = serveControl(SERVE_ORIGIN, shot);
      const d = servePathD(SERVE_ORIGIN, control, shot);
      gsap.set(trailRef.current, { attr: { d }, opacity: 0 });
      gsap.set(rippleRef.current, { attr: { cx: shot.x, cy: shot.y, r: 2 }, opacity: 0 });
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });

      if (reduced) {
        gsap.set(ballRef.current, { attr: { cx: shot.x, cy: shot.y } });
        onLand?.();
        return;
      }

      const progress = { t: 0 };
      const tl = gsap.timeline({ onComplete: () => onLand?.() });
      tl.to(trailRef.current, { opacity: 0.7, duration: 0.12 }, 0);
      tl.to(progress, {
        t: 1, duration: 0.7, ease: "power1.in",
        onUpdate: () => {
          const p = bezierPoint(SERVE_ORIGIN, control, shot, progress.t);
          gsap.set(ballRef.current, { attr: { cx: p.x, cy: p.y } });
        },
      }, 0);
      tl.to(rippleRef.current, { attr: { r: 40 }, opacity: 0.6, duration: 0.05 }, ">-0.02");
      tl.to(rippleRef.current, { opacity: 0, duration: 0.35, ease: "power2.out" });
      tl.to(trailRef.current, { opacity: 0, duration: 0.35 }, "<");
    },
    { scope, dependencies: [shot, reduced] }
  );

  // Aim line + power gauge (computed inline from the pull vector).
  const aimLine = aim
    ? { x2: SERVE_ORIGIN.x - aim.pull.x, y2: SERVE_ORIGIN.y - aim.pull.y }
    : null;

  return (
    <svg
      ref={scope}
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {aimLine && (
        <>
          <line
            x1={SERVE_ORIGIN.x} y1={SERVE_ORIGIN.y}
            x2={aimLine.x2} y2={aimLine.y2}
            stroke="#d6f84c" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" opacity="0.8"
          />
          {/* Power gauge: a short bar near the baseline, fill ∝ power */}
          <rect x={SERVE_ORIGIN.x - 40} y={SERVE_ORIGIN.y + 6} width="80" height="6" rx="3" fill="#276e3c" opacity="0.5" />
          <rect x={SERVE_ORIGIN.x - 40} y={SERVE_ORIGIN.y + 6} width={80 * Math.min(1, aim.power)} height="6" rx="3" fill="#d6f84c" />
        </>
      )}
      <path ref={trailRef} fill="none" stroke="#d6f84c" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" opacity="0" />
      <circle ref={rippleRef} fill="none" stroke="#d6f84c" strokeWidth="3" opacity="0" />
      <circle ref={ballRef} cx={SERVE_ORIGIN.x} cy={SERVE_ORIGIN.y} r="8" fill="#d6f84c" stroke="#276e3c" strokeWidth="1.5" />
    </svg>
  );
};

export default Ball;
```
**⚠️ tune-visually:** `power` scale, dash patterns, gauge size/position, arc timing.

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: green. (Ball's new API isn't consumed until Task 5 — this confirms it compiles. The old `target` prop is gone; Task 5 updates the caller in the same phase, so a transient "Ball is imported but its props changed" is fine as long as CourtStage still compiles — if the current CourtStage passes `target`, that's a stale prop that lints clean but does nothing; Task 5 replaces it. If the build breaks because CourtStage references something removed, note it and coordinate — but `target` removal only makes that prop ignored, not a compile error.)

- [ ] **Step 3: Commit**

```bash
git add website/src/components/court/Ball.jsx
git commit -m "Rework Ball for aim line, power gauge, and launch-to-point"
```

---

## Task 3: `ServeTutorial` + `OutCall` components

**Files:** Create `website/src/components/court/ServeTutorial.jsx`, `website/src/components/court/OutCall.jsx`.

**Interfaces:**
- `ServeTutorial` — props `{ open, onClose }`. A modal overlay: broadcast-styled card, headline "This is a tutorial on how to serve", a **video placeholder** (a `16:9` cream/charcoal box reading "Serve tutorial — coming soon"; a real `<video>`/embed drops in later), and a `Got it` button + backdrop click to close. `role="dialog"`, `aria-modal`, focus the close button on open, Esc to close.
- `OutCall` — props `{ show }`. A centered broadcast `OUT` badge (auto-hides via the parent clearing `show`). Purely visual.

- [ ] **Step 1: Create `ServeTutorial.jsx`**
```jsx
import { useEffect, useRef } from "react";

const ServeTutorial = ({ open, onClose }) => {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Serve tutorial"
        className="bg-cream text-charcoal rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-wimbledon px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-ball text-xs uppercase tracking-widest">Whoa &mdash; way out</span>
          <span className="font-mono text-cream/70 text-[0.65rem] uppercase tracking-widest">Replay</span>
        </div>
        <div className="px-6 py-6">
          <h2 className="font-display font-extrabold text-charcoal text-2xl mb-2">
            This is a tutorial on how to serve.
          </h2>
          <p className="text-charcoal/70 text-sm mb-5">
            That one sailed past the baseline. Here&apos;s how it&apos;s done &mdash;
          </p>
          {/* Video placeholder — a real serve clip drops in here later. */}
          <div className="w-full rounded-xl border border-charcoal/15 bg-charcoal/5 flex items-center justify-center" style={{ aspectRatio: "16 / 9" }}>
            <span className="font-mono text-xs uppercase tracking-widest text-charcoal/40">Serve tutorial &mdash; coming soon</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex items-center gap-2 bg-wimbledon hover:bg-grass text-white font-display font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Got it &mdash; back to the baseline
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServeTutorial;
```

- [ ] **Step 2: Create `OutCall.jsx`**
```jsx
const OutCall = ({ show }) => {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24 z-30" aria-hidden="true">
      <span className="font-display font-extrabold text-white bg-wimbledon/90 px-5 py-2 rounded-lg text-2xl tracking-widest shadow-xl">
        OUT
      </span>
    </div>
  );
};

export default OutCall;
```

- [ ] **Step 3: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: green. (Not consumed yet — wired in Task 4/5.)

- [ ] **Step 4: Commit**

```bash
git add website/src/components/court/ServeTutorial.jsx website/src/components/court/OutCall.jsx
git commit -m "Add ServeTutorial easter-egg modal and OUT call components"
```

---

## Task 4: Aim state machine + pointer handling in CourtStage

**Files:** Modify `website/src/pages/CourtStage.jsx`.

**Interfaces / behavior:**
- Replace the old auto-serve (`serveTarget`/`startServe`/`handleServeComplete`) with an aim state machine. State: `aim` (`{ pull, power } | null` while dragging), `shot` (`{x,y} | null` while flying), `outCall` (bool), `tutorial` (bool).
- Pointer flow on the hub court frame: `pointerdown` on the ball/court → begin aiming (record origin in court coords). `pointermove` → update `pull = pointerCourtCoords − SERVE_ORIGIN`, `power = min(1, |pull| / MAX_PULL)`. `pointerup` → compute `landing = landingFromPull(SERVE_ORIGIN, pull)`, set `shot = landing`, clear `aim`.
- On `Ball.onLand`: `const r = classifyLanding(shot)`; if `hit` → `navigate("/" + r.sectionId)`; if `out` → show `OutCall` briefly then clear `shot`; if `beyond` → open `ServeTutorial`, clear `shot`. Clearing `shot` returns the ball to idle at the baseline.
- **Coordinate mapping:** pointer events give client px; convert to the court's `viewBox` (360×540) using the frame's `getBoundingClientRect()`. Provide a helper `toCourtCoords(e, frameEl)`.
- Zones no longer navigate on click (they are targets). Keep them rendered for the visual court, but pass a no-op or remove `onNavigate` wiring so a click doesn't jump. The `SectionMenu` is the direct-nav path.

**⚠️ tune-visually:** `MAX_PULL`, pointer feel, whether pointerdown must start on the ball vs anywhere on the court.

- [ ] **Step 1: Edit `CourtStage.jsx`** — apply the following (surgical, preserving the AnimatePresence overlay / Hud / live region / focus logic):

(a) Imports — ensure `useRef`, `useState`, `useEffect` from react; add to the sections import: `COURT, SERVE_ORIGIN, landingFromPull, classifyLanding`; add:
```jsx
import Ball from "../components/court/Ball";
import ServeTutorial from "../components/court/ServeTutorial";
import OutCall from "../components/court/OutCall";
```

(b) Inside the component, after `const reduced = usePrefersReducedMotion();`, add:
```jsx
  const MAX_PULL = 150; // tune: pull distance (court units) for full power

  const [aim, setAim] = useState(null);
  const [shot, setShot] = useState(null);
  const [outCall, setOutCall] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const frameRef = useRef(null);

  const toCourtCoords = (e) => {
    const rect = frameRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * COURT.width,
      y: ((e.clientY - rect.top) / rect.height) * COURT.height,
    };
  };

  const onPointerDown = (e) => {
    if (shot) return; // ignore while a ball is in flight
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setAim({ pull: { x: 0, y: 0 }, power: 0 });
  };
  const onPointerMove = (e) => {
    if (!aim) return;
    const p = toCourtCoords(e);
    const pull = { x: p.x - SERVE_ORIGIN.x, y: p.y - SERVE_ORIGIN.y };
    setAim({ pull, power: Math.min(1, Math.hypot(pull.x, pull.y) / MAX_PULL) });
  };
  const onPointerUp = () => {
    if (!aim) return;
    const pull = aim.pull;
    setAim(null);
    if (Math.hypot(pull.x, pull.y) < 6) return; // a tap, not a drag — no launch
    setShot(landingFromPull(SERVE_ORIGIN, pull, { power: 2.2, maxReach: MAX_PULL * 3.6 }));
  };

  const onLand = () => {
    const result = classifyLanding(shot);
    setShot(null);
    if (result.type === "hit") {
      navigate(`/${result.sectionId}`);
    } else if (result.type === "out") {
      setOutCall(true);
      setTimeout(() => setOutCall(false), 900);
    } else {
      setTutorial(true);
    }
  };
```

(c) Replace the hub's court block (whatever currently renders `<Court .../>` and/or the old `<Ball .../>`) with:
```jsx
          <div
            ref={frameRef}
            className="relative mx-auto w-full touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ maxWidth: 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <Court active={null} onNavigate={() => {}} fill disabled />
            <Ball aim={aim} shot={shot} onLand={onLand} />
            <OutCall show={outCall} />
          </div>
```
(`disabled` on `Court` keeps zone buttons from stealing the pointer/navigating — they render as targets only. Direct navigation is via the menu.)

(d) Before the outer closing `</div>` of the component, add the modal:
```jsx
      <ServeTutorial open={tutorial} onClose={() => setTutorial(false)} />
```

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: green; watch for unused imports (the old `serveTarget`/`goTo`-for-serve wiring should be fully removed; `goTo` may still be used by the Hud — keep it if so).

- [ ] **Step 3: Manual check (REQUIRED — feel gate)**

Run `npm run dev` at `/`. Drag from the ball: an aim line + power gauge appear; release launches the ball on an arc. Landing in a box opens that section; a soft miss shows `OUT` and the ball returns; a big overshoot opens the serve-tutorial modal. The menu still navigates directly. Enable reduced motion: flight is instant, menu works.
**Tune `MAX_PULL` / `power` / `maxReach` / timings so the four boxes are all reachable and the launch feels good — this is expected iteration.**

- [ ] **Step 4: Commit**

```bash
git add website/src/pages/CourtStage.jsx
git commit -m "Replace auto-serve with drag-to-aim launch and landing outcomes"
```

---

## Task 5: Reduced-motion + accessibility pass

**Files:** Modify `website/src/pages/CourtStage.jsx` (small), verify others.

- [ ] **Step 1: Ensure the menu covers non-pointer users, and aim doesn't trap focus**

Verify (and adjust if needed):
- The `SectionMenu` in the navbar reaches all four sections (it does from Phase 1) — this is the keyboard/screen-reader/mobile path; the drag-aim is an enhancement, not the only route.
- The court frame's pointer handlers don't interfere with keyboard: it has no `tabindex`, and the decorative `Court`/`Ball` SVGs are `aria-hidden`. The `ServeTutorial` dialog manages its own focus (Task 3).
- Under reduced motion, `Ball` already jumps instantly and calls `onLand` (Task 2), so hit/out/beyond still resolve; confirm a reduced-motion drag still navigates on a box hit.
- Add a short visually-hidden hint for the hub, e.g. inside the frame or near it: `<p className="sr-only">Drag the ball to aim and launch it into a zone, or use the menu to jump to a section.</p>` (helps discoverability without cluttering the visual).

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: green.

- [ ] **Step 3: Manual check** — keyboard: Tab reaches the menu and it navigates; reduced-motion: box-hit drag still navigates instantly; the tutorial modal traps focus and Esc closes it.

- [ ] **Step 4: Commit**

```bash
git add website/src/pages/CourtStage.jsx
git commit -m "Accessibility: menu fallback, sr hint, reduced-motion launch"
```

---

## Task 6: Update AGENTS.md

**Files:** Modify `AGENTS.md`.

- [ ] **Step 1** Describe the aim-launch: dragging the ball sets aim (mirrored pull) + power (an aim line + power gauge, no landing preview); release launches a bézier arc; `classifyLanding` routes the landing to navigate (box) / `OUT` return (in-bounds miss) / serve-tutorial modal (`ServeTutorial`, video placeholder) for a shot beyond the court. Zones are targets, not buttons; the `SectionMenu` is the accessible/keyboard/mobile fallback. Reduced motion makes the flight instant. Player mascot still Phase 3. Mention `landingFromPull`/`classifyLanding`/`COURT_BOUNDS` in `sections.js` and the new components. Remove any "click a zone to serve" description.

- [ ] **Step 2: Commit**
```bash
git add AGENTS.md
git commit -m "Update AGENTS.md for the aim-and-launch serve mechanic"
```

---

## Task 7: Full verification + update PR

**Files:** none.

- [ ] **Step 1** `cd website && npm run lint && npm run test && npm run build` — all green; `dist/404.html` present; `grep -rnE "slate-|violet|indigo" website/src` → nothing.
- [ ] **Step 2** `npm run preview` and walk the Task 4 + Task 5 checklists against the production build.
- [ ] **Step 3** Push; the existing PR #7 updates. Rewrite the PR body to describe the aim-launch mechanic (drag aim + power gauge; hit → navigate, out → OUT return, beyond → serve-tutorial easter egg with a video placeholder; menu fallback; reduced-motion instant flight). Note the video is a placeholder to be filled later, and that the animation/pointer FEEL needs a human pass before merge.
- [ ] **Step 4** Do NOT auto-merge — hand off for the human feel-pass and tuning.

---

## Self-Review (against the mechanic)

**Coverage:** drag→aim/power (Task 2 visuals + Task 4 pointer) ✅; launch→bézier flight (Task 2) ✅; land-in-box→navigate, in-bounds-miss→OUT, beyond→tutorial (Task 1 classifier + Task 4 resolution + Task 3 modal/badge) ✅; power-meter-only, no landing preview (Task 2 renders aim line + gauge only) ✅; menu fallback + reduced-motion (Task 5) ✅; video placeholder mechanism for the easter egg (Task 3, real video later) ✅.

**Placeholder scan:** the serve video is an intentional placeholder (the user will add the clip); everything else is concrete. Pointer/feel constants are real defaults flagged tune-visually. ✅

**Type/name consistency:** `landingFromPull`/`classifyLanding`/`pointInRect`/`COURT_BOUNDS` (Task 1) used in Task 4. `Ball` props `{aim,shot,onLand}` (Task 2) match the CourtStage caller (Task 4). `ServeTutorial {open,onClose}` / `OutCall {show}` (Task 3) match Task 4. ✅

**Known feel/tuning items (for the human pass):** `MAX_PULL`, `power`, `maxReach` (must make all four boxes reachable and misses/overshoots feel fair), arc timing, aim-line/gauge styling, whether pointerdown should require starting on the ball. Also decide (from the prior review) whether the section should erupt at impact vs. after the ripple fade.

**Deferred:** the real serve video; player mascot (Phase 3); LazyMotion/bundle trim; favicon rebrand.
```
