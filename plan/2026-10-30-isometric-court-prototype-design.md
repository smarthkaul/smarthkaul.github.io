# Isometric court prototype — design

**Status:** prototype, on branch `isometric-court-prototype`. Not merged. Written 2026-10-30.

## Intent

Replace the top-down drag-to-serve hub with an **isometric, game-like court**: the player
walks with WASD, aims with the mouse, and serves a ball that flies, bounces and lands.
Landing in a target still opens that target's section, but the hand-off becomes a
broadcast-style sequence: the camera zooms onto the landing area, an ESPN-style wipe
sweeps the screen, and the section content slides in. Leaving the section plays the
whole sequence in reverse.

Everything should feel **fluid, elastic and cartoony**: squash-and-stretch on the ball
and the player, anticipation before the serve, overshoot on stops, spring-backs.

What the request fixed (verbatim intent) vs. decisions made here:

| From the request | Decision here |
|---|---|
| "most recent web engine with game-like behaviour, minimal bundle size" | **No engine library.** See "Engine choice" — measured sizes rule the candidates out; GSAP (already shipped) + a hand-written Canvas 2D renderer. |
| isometric view, WASD + aim | 2:1 dimetric projection, screen-relative WASD, mouse reticle on the ground plane, click/Space to serve. |
| walking, serve, bouncing all fluid/elastic/cartoony | procedural rig with squash/stretch, anticipation, elastic eases; simulated bounces with contact squash. |
| hit the service boxes / targets → open page | same four targets, same four routes, same `SECTIONS` source of truth. |
| zoom onto the area, then a sports-network transition into the content | camera zoom (canvas) → angled three-panel wipe + ticker (DOM) → content card slide-in. |
| reverse on exit | one GSAP timeline per visit; `reverse()` on leaving. |
| spin up a dev server at the end | `npm run dev` from `website/`. |

## Engine choice

Measured on 2026-10-30 with esbuild `--bundle --minify`, gzip -9, named imports only:

| Candidate | Version | Gzipped | Verdict |
|---|---|---|---|
| PixiJS | 8.22.0 (2026-10-01) | **177 KB** | Most recent major 2D engine, excellent scene graph, but more than doubles the site's JS for a six-object scene. |
| LittleJS | 1.28.0 | **120 KB** | Marketed as tiny; still 120 KB after bundling. Owns the page: appends its own canvases to a root element, sizes from `innerWidth`, rewrites the root's inline style, has no `destroy`. Poor fit for React route mounting and StrictMode. |
| Excalibur / Phaser / Three | 0.32 / 3.x / 0.187 | 300 KB+ | Far heavier; not considered further. |
| GSAP (already in the bundle) | 3.15 | 28 KB, already paid | Provides the ticker (game loop), the elastic/back/expo eases, and reversible timelines. |

**Decision:** Canvas 2D rendering written in-repo, with `gsap.ticker` as the game loop and
GSAP timelines for every scripted motion. Added bundle cost: **0 KB of dependencies**.
The scene is small enough that a scene graph and GPU batching buy nothing; Canvas 2D is
anti-aliased, handles `drawImage` with per-part transforms, gradients, alpha and shadows.
The renderer lives in one module (`src/iso/render.js`) and reads a plain state object, so
swapping to a WebGL renderer later is contained.

## World model

All simulation is in **metres on a real tennis court**, independent of the screen.

- Axes: `u` runs along the court (negative = server's half, positive = far half), `v`
  across it (negative = left as the server faces the net), `z` up.
- Court: doubles rectangle `u ∈ [-11.885, 11.885]`, `v ∈ [-5.485, 5.485]`. Singles
  sidelines at `v = ±4.115`. Service lines at `u = ±6.40`. Centre service line at `v = 0`
  for `|u| ≤ 6.40`. Centre marks at the baselines. Net at `u = 0`, 0.914 m high, posts at
  `v = ±6.4`.
- Targets (keyed by `SECTIONS[].id`; `SECTIONS` in `src/data/sections.js` stays the single
  source of truth for ids/labels/routes — only the geometry moves):
  - `experience`: far service box `u ∈ [0, 6.40]`, `v ∈ [-4.115, 0]`
  - `projects`: far service box `u ∈ [0, 6.40]`, `v ∈ [0, 4.115]`
  - `about`: circular archery target, centre `(14.8, -3.4)`, radius 1.7
  - `contact`: circular archery target, centre `(14.8, 3.4)`, radius 1.7
- Player spawn `(−12.5, −1.5)`. Player bounds `u ∈ [−15.5, −0.8]`, `v ∈ [−7.5, 7.5]`
  (can roam the grass, never crosses the net).
- Aim range `R = 17 m` from the player's feet. From the spawn the far service boxes are
  reachable; the beyond-baseline targets need a walk up to the net. That is what makes
  WASD matter.
- Landing classification uses the **first ground contact**: inside a target → `hit`;
  inside the doubles rectangle → `out`; anywhere else → `beyond` (reuses the existing
  `OutCall` banner and `ServeTutorial` modal).

## Projection and camera

2:1 dimetric projection, scale `K` px per metre at zoom 1:

```
sx =  (u + v) · K
sy = −(u − v) · K / 2 − z · K
```

Near baseline lands bottom-left, far targets top-right. Inverse on the ground plane
(`z = 0`): `u = (sx/K − 2·sy/K) / 2`, `v = (sx/K + 2·sy/K) / 2`. Depth key for draw order
is the ground-plane `sy` (larger = nearer = drawn later).

Camera is a plain object `{ x, y, zoom }` (projected-space point at the viewport centre,
and a multiplier on `K`). `fitCamera(viewport)` frames the court plus targets with a 6%
margin; `focus(sectionId)` returns the target's projected centre. GSAP tweens the camera
object directly; the renderer reads it each frame. Device pixel ratio is handled by
sizing the backing store, never by the camera.

## Game loop and input

- `gsap.ticker.add(tick)`; `dt = min(delta, 1/30)`. Removed on unmount. Pauses with
  `document.hidden`.
- **Movement:** WASD / arrow keys are **screen-relative** (W = up the screen), converted
  to a world direction through the inverse projection and normalised so speed is uniform
  in metres (5.5 m/s). Velocity eases toward the target with an exponential smoother so
  starts and stops are soft; position is clamped to the player bounds.
- **Aim:** pointer position → canvas pixels → inverse camera → ground point, clamped to
  within `R` of the player (the reticle visibly sticks at max range). The reticle is an
  iso ellipse ring with four ticks and a pulsing dot; it turns ball-yellow and the
  hovered target brightens when it is over a target. The player faces the reticle.
- **Serve:** left click, Space or Enter. Ignored while a ball is live or during the
  toss/strike window. Touch: a tap aims and serves; if the tap is beyond `R` the player
  auto-walks toward it and serves on arrival. There is no keyboard-only aim; the Navbar
  `SectionMenu` stays the accessible fallback, as before.
- A hint line under the canvas (`font-mono`, cream at 50%) reads "WASD to move · aim with
  the mouse · click to serve" (touch: "Tap where you want to serve") and fades after the
  first serve.

## The player rig

The four Figma-cut PNGs in `src/assets/player/` are drawn with `drawImage`, each with its
own pivot, driven by a plain rig state object:

```
rig = { bob, lean, squashX, squashY, armL, armR, headTilt, facing, hop }
```

Part placement is translated from the current `Player.jsx` `PARTS` map (head 46×56 at
(76,95), body 30×72 at (85,148), arms 17×40 at (73,157) and (109,155), shoulder pivot at
(116,154), feet at y≈220), expressed relative to the feet and scaled to a 1.9 m figure.
Keep the existing image-to-slot mapping (the file named `right-arm.png` sits in the left
slot and `left-arm.png` is the swinging racket arm) so the figure reads the same as today.
The racket is still vector-drawn (frame ellipse, string grid, handle) in ball-yellow.
Placement constants are hand-tuned numbers, as before — tweak, don't restructure.

Procedural animation, all in `updateRig(rig, input, dt, t)`:

- **Idle:** slow bob (±0.03 m, 2.2 rad/s) and 1.5% breathing scale.
- **Walk:** phase advances with ground speed; bob `|sin(phase)| × 0.12 m`; lean 8° into
  the movement direction; arms counter-swing ±35°; head counter-tilts 4° with a lerp lag
  so it overshoots. Facing mirrors when the aim or movement points screen-left.
- **Start / stop:** on start, squash `y 0.88` and spring back with `elastic.out(1, 0.45)`;
  on stop, stretch `y 1.10` and spring back; the lean returns with `back.out(2)`.
- **Serve** (GSAP timeline on the rig, ~1.0 s): *toss* 0–0.45 s — left arm rises to
  −150°, the ball follows the hand then continues to its apex 2.6 m above the feet, the
  body stretches to `y 1.06`, the racket arm winds back to −140° (anticipation);
  *strike* 0.45–0.55 s — racket arm whips to +40° with `power4.in`, body squashes to
  `y 0.92`, the ball launches at the apex; *recovery* 0.55–1.0 s — arm returns with
  `elastic.out(1, 0.5)`, body with `back.out(2)`. The camera kicks 2 px for 0.12 s on the
  strike. Movement is locked during toss + strike only.
- **Hit celebration** (polish): a small hop (0.4 m, `power2.out`/`in`) with both arms up
  when the ball lands in a target.

## The ball

State `{ u, v, z, vu, vv, vz, phase: 'hand' | 'toss' | 'flight' | 'settling', bounces }`.

- **Launch:** given horizontal distance `d` to the aim point and launch height `h0 = 2.4`,
  choose flight time `T = clamp(0.55 + 0.03·d, 0.6, 1.2)` and gravity `g = 15.7` (1.6×
  real, snappier). `vz0 = g·T/2 − h0/T`, horizontal speed `d/T`. The first contact lands
  exactly on the aim point; classification happens on that contact.
- **Bounces:** on contact `vz = −vz × 0.55`, horizontal × 0.72; after the third contact or
  when `|vz| < 1`, the ball settles, fades over 0.3 s, and respawns in the hand with a
  `back.out(2.5)` scale pop.
- **Squash and stretch:** in flight, stretch along the screen velocity by
  `1 + 0.25·min(1, speed/20)`; on each contact a GSAP tween squashes `(1.35, 0.65)` and
  springs back with `elastic.out(1, 0.4)` over 0.35 s.
- **Shadow:** ground ellipse at `(u, v, 0)` that shrinks (1 → 0.6) and fades (0.35 → 0.15)
  with height.
- **Trail:** ring buffer of the last 18 screen positions, drawn as fading ball-yellow dots
  (the Hawk-Eye look). Cleared on settle.
- **Impact:** an expanding iso ripple ring (0 → 1.4 m, alpha 0.8 → 0, 0.45 s) plus 6–8
  cream dust particles with gravity, fading over 0.5 s. On a target hit the target fills
  ball-yellow (alpha pulse 0 → 0.55 → 0.25) and its rings pop with `back.out`.
- Crowd groan (existing `crowd-aww.mp3`, volume 0.08) on `out` / `beyond`. A hit stays
  silent, per the repo rule.

## Rendering

`renderScene(ctx, scene, viewport)` each tick, in this order:

1. Clear to turf green; mow-stripe gradient bands in world space (iso-aligned).
2. Court surface, lines (3 px at zoom 1, white), service boxes, the two archery targets
   (concentric cream/ball rings on the ground), target hover/hit fills.
3. Shadows (player, ball) and the reticle.
4. Ball if `u > 0` (behind the net).
5. Net: posts, a white tape, and a semi-transparent string mesh drawn as a vertical quad
   from `u = 0, z = 0..0.914` along `v ∈ [−6.4, 6.4]`.
6. Player, then ball if `u ≤ 0`, sorted by ground depth.
7. Trail dots, ripple, particles.

Lines scale with zoom so they stay crisp when the camera pushes in.

## The broadcast transition

A single GSAP timeline per section visit, built by `buildTransition({ els, cam, target,
viewport })` in `src/components/iso/BroadcastTransition.jsx`, plays forward on entry and
`reverse()`s on exit. Everything but the camera lives in the DOM (fonts, text, crisp
edges). Forward timing (≈1.9 s):

| t (s) | Element | Motion |
|---|---|---|
| 0.00 | Slam caption (broadcast label + section label, Syne 800, italic, skew −8°, ball-yellow bar) | scale 1.4 → 1, `back.out(1.8)`, 0.35 s |
| 0.10 | Vignette (radial, charcoal) | 0 → 0.55, 0.6 s |
| 0.10 | Camera | zoom ×3.0 and centre on the target, `power3.inOut`, 0.85 s |
| 0.70 | Three wipe panels (wimbledon-dark, ball, cream; skewX −14°, 130 vw wide), stagger 0.07 s | `translateX −130% → 0`, `power4.inOut`, 0.45 s |
| 1.05 | Ticker strip on the ball panel ("SMARTH KAUL · CAREER RECORD · EXPERIENCE …") | slides 40 vw, 0.4 s |
| 1.10 | White flash | 0.7 → 0, 0.25 s |
| 1.10 | Swap (GSAP `set`, so it reverses): slam caption hidden, content wrapper `autoAlpha` 1 | instant |
| 1.20 | Panels sweep out, cream first | `translateX 0 → 130%`, `power4.inOut`, 0.5 s, stagger 0.07 s |
| 1.30 | Content card | `y 48 → 0`, `scale 0.96 → 1`, `opacity 0 → 1`, `expo.out`, 0.6 s |
| 1.35 | Hud | `y −20 → 0`, `back.out(1.7)`, 0.4 s |

Reverse runs at `timeScale(1.3)`. `prefers-reduced-motion` sets `progress(1)` / `progress(0)`
with no tweening. The canvas stays mounted (dimmed by the vignette) behind the content on
every court route, so zooming back out continues from the same scene.

## Route and state controller (`CourtStage.jsx`)

`active` comes from the URL (`resolveActiveSection`), as today. A separate `displayed`
state holds what is on screen so the exit animation can play after the URL has already
changed back to `/`.

- `null → A` (ball landed, or menu link): mount A's content hidden, build the timeline for
  A, play. The ball landing calls `navigate` immediately on classification; the zoom
  starts while the ball is still bouncing.
- `A → null`: `reverse()`; on reverse complete unmount A, respawn the ball in hand,
  re-enable input.
- `A → B` (via Hud or menu): reverse A at `timeScale(1.6)`, then build and play B.
- Deep link on first load with `active` set: `progress(1)` instantly; camera pre-zoomed.
- Focus management and the `aria-live` announcement are kept from the current stage.
- Layering: canvas `fixed inset-0 z-0`; content wrapper `relative z-20` in document flow
  so long sections scroll; transition overlays `fixed z-30`; Hud `z-40`; Navbar `z-50`.

The existing `Hud` (docked top-down SVG court, click-to-navigate) is kept unchanged for
this prototype. The `ColdOpen` intro is **not rendered** on this branch: it draws the
top-down court and walks the player into a position that no longer exists; re-cutting it
for the isometric court is follow-up work if the prototype is adopted.

## Files

New:

- `website/src/iso/projection.js` — `K`, `project`, `unproject`, `depthKey`, `fitCamera`.
- `website/src/iso/court.js` — dimensions, line segments, `TARGETS`, `PLAYER_BOUNDS`,
  `SPAWN`, `AIM_RANGE`, `classifyLanding`, `clampAim`, `targetCenter`, `sceneBounds`.
- `website/src/iso/ballistics.js` — `launchVelocity`, `stepBall` (returns contact /
  settle events), constants.
- `website/src/iso/controls.js` — key set → world move vector (screen-relative).
- `website/src/iso/rig.js` — rig state, `updateRig`, `serveTimeline`, `startStopTweens`.
- `website/src/iso/render.js` — all Canvas 2D drawing.
- `website/src/iso/scene.js` — `createScene({ canvas, images, callbacks })`: owns the
  ticker, state, camera, input application; exposes `cam`, `focus`, `setAim`, `serve`,
  `setKeys`, `resize`, `destroy`.
- `website/src/components/iso/IsoCourt.jsx` — React wrapper: canvas, image preload,
  pointer/keyboard/touch listeners, hint text, reduced-motion flag, exposes the scene
  through a ref.
- `website/src/components/iso/BroadcastTransition.jsx` — overlay DOM + `buildTransition`.
- Tests: `projection.test.js`, `court.test.js`, `ballistics.test.js`, `controls.test.js`
  (pure logic; the renderer is verified visually).

Changed:

- `website/src/pages/CourtStage.jsx` — rewired as above.
- `website/src/pages/Layout.jsx` — `ColdOpen` not rendered (comment says why).
- `website/src/test/routes.test.jsx` — mocks `IsoCourt` (jsdom has no canvas).
- `AGENTS.md` — a banner describing the prototype branch and the new `src/iso/` layout.

Removed: `components/court/Ball.jsx`, `components/court/Player.jsx` (SVG versions, no
longer mounted). `Court.jsx` stays because the `Hud` docks it. The flight helpers in
`sections.js` stay (tested, harmless).

## Out of scope

- Re-cutting the cold-open for the isometric court.
- An isometric mini-court in the Hud.
- Keyboard-only aiming.
- Sound for the serve or the wipe.
- Prerendering / per-route social cards (unchanged non-goal).

## Verification

`npm run lint`, `npm run test`, `npm run build` from `website/` must pass. Everything
visual — walk feel, serve beat, bounce squash, zoom, wipe, reverse — is checked in the
browser at `http://localhost:5173/`.
