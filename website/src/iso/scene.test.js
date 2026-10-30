import { describe, it, expect, vi } from "vitest";
import gsap from "gsap";
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
  it("with full motion, the ball comes back to the hand and the serve can repeat", () => {
    // Drives GSAP's root clock by hand so the toss timeline, the settle fade
    // and the respawn tween all run; catches tweens losing their own onComplete.
    const { scene, onLand } = make({ reduced: false });
    const c = targetCenter("experience");
    scene.setPointer(screenOf(scene, c.u, c.v));
    scene.step(1 / 60);
    expect(scene.serve()).toBe(true);
    const t0 = gsap.ticker.time;
    for (let i = 1; i <= 300; i++) { gsap.updateRoot(t0 + i / 60); scene.step(1 / 60); }
    expect(onLand).toHaveBeenCalledTimes(1);
    expect(onLand.mock.calls[0][0]).toEqual({ type: "hit", sectionId: "experience" });
    expect(scene.state.ball.phase).toBe("hand");
    expect(scene.state.ball.alpha).toBe(1);
    expect(scene.state.player.rig.serving).toBe(false);
    expect(scene.state.ripples).toHaveLength(0);
    expect(scene.serve()).toBe(true);
    scene.destroy();
  });
});
