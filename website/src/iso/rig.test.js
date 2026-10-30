import { describe, it, expect } from "vitest";
import {
  FIGURE_HEIGHT, FIGURE_UNITS, UNIT, PARTS, PIVOTS, createRig, updateRig, handPoint,
  HAND_REST, TOSS_APEX, READY_PERIOD, READY_LIFT, readyBounce,
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

describe("ready bounce", () => {
  const idle = (rig, from, seconds, extra = {}) => {
    const samples = [];
    for (let t = from; t < from + seconds; t += 1 / 120) {
      updateRig(rig, { moving: false, speed: 0, dirX: 0, ...extra }, 1 / 120, t);
      samples.push({ bob: rig.bob, flexY: rig.flexY, flexX: rig.flexX });
    }
    return samples;
  };

  it("bounces twice per period, lifting about READY_LIFT, never below the ground", () => {
    expect(READY_PERIOD).toBeCloseTo(1.1, 1);
    const samples = readyBounceSamples();
    const lifts = samples.map((s) => s.lift);
    expect(Math.max(...lifts)).toBeCloseTo(READY_LIFT, 3);
    expect(Math.min(...lifts)).toBeGreaterThanOrEqual(0);
    // Two separate humps: count rising-through-half crossings.
    let humps = 0;
    for (let i = 1; i < lifts.length; i++) if (lifts[i - 1] < READY_LIFT * 0.3 && lifts[i] >= READY_LIFT * 0.3) humps++;
    expect(humps).toBe(2);
  });

  it("squashes at contact and stretches while rising", () => {
    expect(readyBounce(0).flexY).toBeLessThan(0.96);          // contact
    expect(readyBounce(READY_PERIOD * 0.125).flexY).toBeGreaterThan(1.01); // rising
  });

  it("drives the rig: visible lift and squash/stretch with roughly kept volume", () => {
    const rig = createRig();
    const samples = idle(rig, 0, 2.2);
    const settled = samples.slice(samples.length / 2);
    const bobs = settled.map((s) => s.bob);
    expect(Math.max(...bobs)).toBeGreaterThan(0.06);
    expect(Math.max(...bobs)).toBeLessThan(0.1); // idle, not a jump
    expect(Math.min(...settled.map((s) => s.flexY))).toBeLessThan(0.98);
    expect(Math.max(...settled.map((s) => s.flexY))).toBeGreaterThan(1.01);
    for (const s of settled) expect((s.flexX - 1) * (s.flexY - 1)).toBeLessThanOrEqual(1e-9);
  });

  it("stops while serving and while airborne", () => {
    for (const extra of [{}, { airborne: true }]) {
      const rig = createRig();
      if (!extra.airborne) rig.serving = true;
      const settled = idle(rig, 0, 2.2, extra).slice(130);
      expect(Math.max(...settled.map((s) => Math.abs(s.bob)))).toBeLessThan(0.002);
      expect(Math.max(...settled.map((s) => Math.abs(s.flexY - 1)))).toBeLessThan(0.002);
    }
  });

  it("walking squashes on each footfall", () => {
    const rig = createRig();
    let min = 1;
    for (let i = 0; i < 120; i++) {
      updateRig(rig, { moving: true, speed: 5.5, dirX: 1 }, 1 / 60, i / 60);
      min = Math.min(min, rig.flexY);
    }
    expect(min).toBeLessThan(0.97);
  });
});

function readyBounceSamples() {
  const out = [];
  for (let t = 0; t < READY_PERIOD; t += READY_PERIOD / 400) out.push(readyBounce(t));
  return out;
}

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
