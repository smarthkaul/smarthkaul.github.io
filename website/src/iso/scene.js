import gsap from "gsap";
import {
  project, projectBounds, fitCamera, screenToGround, dampCamera,
  FOLLOW_ZOOM, BALL_ZOOM, LOOK_AHEAD, BALL_HOLD, FOLLOW_LIFT,
} from "./projection";
import { SPAWN, AIM_RANGE, TARGETS, sceneCorners, classifyLanding, clampAim, clampPlayer, targetCenter, targetContains } from "./court";
import { GRAVITY, LAUNCH_HEIGHT, launchVelocity, createBallBody, stepBall } from "./ballistics";
import { moveVector, smoothVelocity, WALK_SPEED } from "./controls";
import {
  createRig, updateRig, startStopTween, serveTimeline, celebrationTimeline,
  jumpTakeoffTimeline, jumpLandTween, JUMP_GRAVITY, JUMP_VELOCITY,
} from "./rig";
import { renderScene } from "./render";
import { SECTIONS } from "../data/sections";

// The simulation: owns the state renderScene draws, advances it on
// gsap.ticker, applies input, and runs the ball's life cycle. React only
// forwards events in and receives onLand / onServe out.

const TRAIL_LENGTH = 18;
const DUST_COUNT = 7;
const ARRIVE_RADIUS = 0.15; // metres — walkTo() counts this as arrived

// Cold-open (scene.intro). The court draws itself in over REVEAL_DURATION
// seconds on the static whole-scene camera, then the player walks in from
// INTRO_ENTRY — off the left edge of the frame, behind the near baseline so he
// skirts the court — to SPAWN while the follow camera cranes in onto him.
export const REVEAL_DURATION = 2.6;
export const INTRO_ENTRY = { u: SPAWN.u - 4, v: SPAWN.v - 16 };
export const INTRO_WALK_SPEED = 0.6; // × WALK_SPEED

export { FOLLOW_ZOOM, BALL_ZOOM, PAN_RATE, ZOOM_RATE, LOOK_AHEAD, BALL_HOLD } from "./projection";
export const CAMERA_MODES = ["follow", "ball", "fit"];

export function createScene({ canvas, images = {}, reduced = false, topInset = 0, intro = false, onLand, onServe }) {
  const ctx = canvas.getContext ? canvas.getContext("2d") : null;
  const viewport = { width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 };
  let dpr = 1;
  let imgs = images;

  const state = {
    cam: { x: 0, y: 0, zoom: 1 },
    camMode: intro ? "fit" : "follow", // 'follow' (player) | 'ball' (served ball) | 'fit' (whole scene, static)
    fitZoom: 1,
    t: 0,
    reveal: intro ? 0 : 1, // court build-in progress, 0..1 (render.js)
    player: { u: SPAWN.u, v: SPAWN.v, visible: !intro, rig: createRig() },
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
  let autoWalk = null;    // { u, v } tap target to walk toward, then serve
  let script = null;      // { u, v, onArrive, speed } walkTo() target — no serve, no clamp
  let stuckTime = 0;
  let inputEnabled = !intro;
  let introPhase = intro ? "pending" : "done"; // pending | running | done
  let introTween = null;
  let camLocked = false;
  let running = false;
  let hidden = false;
  let body = null;        // ballistics body while the ball is in flight
  let struck = true;      // false between toss start and the strike (movement locked)
  let ballHold = 0;       // seconds left holding on the ball before returning to follow
  let fitCam = { x: 0, y: 0, zoom: 1 };
  const bump = { y: 0 };  // camera kick, layered on top of the damped camera
  let bumpApplied = 0;
  const live = new Set(); // tweens/timelines to kill on destroy

  // Wraps (never replaces) the tween's own onComplete — serveTimeline,
  // settle → respawn and the ripple cleanup all rely on theirs.
  const track = (tween) => {
    live.add(tween);
    const own = tween.eventCallback("onComplete");
    tween.eventCallback("onComplete", function (...args) {
      live.delete(tween);
      return own?.apply(this, args);
    });
    return tween;
  };

  // --- camera ---
  // Recomputes the whole-scene framing (and fitZoom) for the current viewport.
  const computeFit = () => {
    const vp = { width: viewport.width, height: Math.max(1, viewport.height - topInset) };
    const cam = fitCamera(vp, projectBounds(sceneCorners()));
    fitCam = { x: cam.x, y: cam.y - topInset / (2 * cam.zoom), zoom: cam.zoom }; // centre below the navbar
    state.fitZoom = cam.zoom;
  };

  // Where the camera wants to be in the current mode.
  const cameraTarget = () => {
    const mode = state.camMode;
    if (mode === "fit") return fitCam;
    let zoom;
    let pt;
    if (mode === "ball") {
      const b = state.ball;
      zoom = state.fitZoom * BALL_ZOOM;
      pt = project(b.u, b.v, b.z * 0.5);
    } else {
      const p = state.player;
      zoom = state.fitZoom * FOLLOW_ZOOM;
      const a = state.aim;
      const u = a ? p.u + (a.u - p.u) * LOOK_AHEAD : p.u;
      const v = a ? p.v + (a.v - p.v) * LOOK_AHEAD : p.v;
      pt = project(u, v, FOLLOW_LIFT);
    }
    return { x: pt.x, y: pt.y - topInset / (2 * zoom), zoom };
  };

  const snapCamera = () => {
    if (camLocked) return;
    Object.assign(state.cam, cameraTarget());
    bumpApplied = 0;
  };

  const stepCamera = (dt) => {
    if (camLocked) return;
    const cam = state.cam;
    cam.y -= bumpApplied;
    if (state.camMode === "ball" && ballHold > 0) {
      ballHold -= dt;
      if (ballHold <= 0) state.camMode = "follow";
    }
    if (reduced) Object.assign(cam, cameraTarget());
    else dampCamera(cam, cameraTarget(), dt);
    bumpApplied = bump.y;
    cam.y += bumpApplied;
  };

  const setCameraMode = (mode) => {
    if (!CAMERA_MODES.includes(mode)) return;
    state.camMode = mode;
    ballHold = 0;
  };

  // Deep-link / fallback camera: frame the whole scene and hold there until
  // setCameraMode() asks for something else.
  const fit = () => {
    computeFit();
    setCameraMode("fit");
    Object.assign(state.cam, fitCam);
    bumpApplied = 0;
  };

  const resize = (width, height, ratio = 1) => {
    viewport.width = Math.max(1, width);
    viewport.height = Math.max(1, height);
    dpr = ratio;
    if ("width" in canvas) {
      canvas.width = Math.round(viewport.width * dpr);
      canvas.height = Math.round(viewport.height * dpr);
    }
    computeFit();
    snapCamera(); // a viewport change is a cut, not a pan
  };

  const focus = (sectionId) => {
    const c = targetCenter(sectionId);
    return project(c.u, c.v);
  };

  const kickCamera = () => {
    if (reduced || camLocked) return;
    track(gsap.fromTo(bump, { y: 2 / state.cam.zoom }, { y: 0, duration: 0.12, ease: "power2.out", overwrite: "auto" }));
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
    if (state.camMode === "ball") ballHold = BALL_HOLD;
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
    if (!reduced) setCameraMode("ball");
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
    if (!inputEnabled || !state.aim || state.ball.phase !== "hand" || rig.serving || rig.airborne) return false;
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

  // --- jump ---
  const jump = () => {
    const rig = state.player.rig;
    if (!inputEnabled || rig.serving || !struck || rig.airborne) return false;
    rig.airborne = true;
    rig.vz = JUMP_VELOCITY;
    if (!reduced) track(jumpTakeoffTimeline(rig));
    return true;
  };
  const land = () => {
    const p = state.player;
    spawnDust(p.u, p.v);
    spawnRipple(p.u, p.v);
    kickCamera();
    if (!reduced) track(jumpLandTween(p.rig));
  };
  const stepJump = (dt) => {
    const rig = state.player.rig;
    if (!rig.airborne) return;
    rig.vz -= JUMP_GRAVITY * dt;
    rig.z += rig.vz * dt;
    if (rig.z <= 0) {
      rig.z = 0;
      rig.vz = 0;
      rig.airborne = false;
      land();
    }
  };

  // --- movement ---
  const stepPlayer = (dt) => {
    const p = state.player;
    const rig = p.rig;
    const canMove = inputEnabled && struck;
    let dir = { u: 0, v: 0 };
    let speedScale = 1;
    if (script && struck) {
      const du = script.u - p.u;
      const dv = script.v - p.v;
      const d = Math.hypot(du, dv);
      if (d <= ARRIVE_RADIUS) {
        const { onArrive } = script;
        script = null;
        onArrive?.();
      } else {
        dir = { u: du / d, v: dv / d };
        speedScale = script.speed;
      }
    } else if (canMove) {
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
    smoothVelocity(vel, { u: dir.u * WALK_SPEED * speedScale, v: dir.v * WALK_SPEED * speedScale }, dt);
    const speed = Math.hypot(vel.u, vel.v);
    if (speed > 0.02) {
      const raw = { u: p.u + vel.u * dt, v: p.v + vel.v * dt };
      const next = script ? raw : clampPlayer(raw);
      p.u = next.u;
      p.v = next.v;
    } else {
      vel.u = 0;
      vel.v = 0;
    }
    const intent = dir.u !== 0 || dir.v !== 0;
    const dirX = intent ? Math.sign(dir.u + dir.v) : 0; // screen-x sign of the move
    const ev = updateRig(rig, { moving: intent, speed, dirX, airborne: rig.airborne }, dt, state.t);
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
    stepJump(dt);
    stepBallState(dt);
    stepEffects(dt);
    stepCamera(dt);
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
    if (down && inputEnabled) { autoWalk = null; tapAim = null; script = null; }
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

  // Scripted walk (the cold-open walk-in): walks the player to `point` at
  // `speed` × WALK_SPEED, ignoring inputEnabled and the player bounds, then
  // calls onArrive. No serve. A movement key (with input enabled) cancels it.
  const walkTo = (point, onArrive, { speed = 1 } = {}) => {
    autoWalk = null;
    script = { u: point.u, v: point.v, onArrive, speed };
  };
  // Puts the player somewhere directly (may be outside the bounds); the ball
  // in hand comes along.
  const placePlayer = ({ u, v }) => {
    const p = state.player;
    p.u = u;
    p.v = v;
    vel.u = 0;
    vel.v = 0;
    if (state.ball.phase === "hand") { state.ball.u = u; state.ball.v = v; }
  };

  // --- cold-open ---
  // Final state of the intro: court fully drawn, player at the spawn, the
  // follow camera on him. Input stays as it is — CourtStage owns that.
  const settleIntro = () => {
    introPhase = "done";
    introTween?.kill();
    introTween = null;
    script = null;
    state.reveal = 1;
    state.player.visible = true;
    placePlayer(SPAWN);
    setCameraMode("follow");
    snapCamera();
  };

  // Court build-in, then the walk-in. onDone fires once he reaches SPAWN.
  // Under reduced motion it lands on the final state at once.
  const playIntro = ({ onDone } = {}) => {
    if (introPhase !== "pending") {
      if (introPhase === "done") onDone?.();
      return;
    }
    if (reduced) {
      settleIntro();
      onDone?.();
      return;
    }
    introPhase = "running";
    const walkIn = () => {
      introTween = null;
      placePlayer(INTRO_ENTRY);
      state.player.visible = true;
      setCameraMode("follow");
      walkTo(SPAWN, () => {
        introPhase = "done";
        onDone?.();
      }, { speed: INTRO_WALK_SPEED });
    };
    introTween = track(gsap.to(state, { reveal: 1, duration: REVEAL_DURATION, ease: "none", onComplete: walkIn }));
  };

  // Skip: jump straight to the final state. A no-op once the intro is done,
  // so it is always safe to call. Never calls intro()'s onDone.
  const skipIntro = () => {
    if (introPhase === "done") return;
    settleIntro();
  };

  computeFit();
  snapCamera();

  return {
    state,
    cam: state.cam,
    start, stop, destroy, resize, fit,
    setCameraMode, snapCamera,
    lockCamera: (locked) => { camLocked = locked; bumpApplied = 0; },
    focus,
    setImages: (next) => { imgs = next; },
    setPointer, clearPointer, setKey, clearKeys, setInputEnabled,
    serve, tap, step, jump, walkTo, placePlayer,
    intro: playIntro, skipIntro,
  };
}
