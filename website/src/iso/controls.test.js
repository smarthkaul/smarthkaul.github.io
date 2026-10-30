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
