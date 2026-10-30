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
