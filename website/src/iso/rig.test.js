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
