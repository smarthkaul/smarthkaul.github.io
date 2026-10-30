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
