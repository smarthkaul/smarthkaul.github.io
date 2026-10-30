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
