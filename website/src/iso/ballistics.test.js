import { describe, it, expect } from "vitest";
import {
  GRAVITY, LAUNCH_HEIGHT, MAX_BOUNCES, flightTime, launchVelocity,
  createBallBody, stepBall,
} from "./ballistics";

const simulateToFirstContact = (from, to, dt) => {
  const vel = launchVelocity(from, to);
  const body = createBallBody(from.u, from.v, LAUNCH_HEIGHT, vel);
  for (let t = 0; t < 5; t += dt) {
    const events = stepBall(body, dt);
    const contact = events.find((e) => e.type === "contact");
    if (contact) return { contact, t, body };
  }
  throw new Error("never landed");
};

describe("ballistics", () => {
  it("flight time grows with distance and is clamped", () => {
    expect(flightTime(0)).toBeCloseTo(0.6);
    expect(flightTime(10)).toBeCloseTo(0.85);
    expect(flightTime(100)).toBeCloseTo(1.2);
  });

  it("launchVelocity lands the ball on the aim point at 60 fps", () => {
    const from = { u: -12.5, v: -1.5 };
    for (const to of [{ u: 3.2, v: -2.06 }, { u: 4, v: 3 }, { u: -2, v: -1.5 }]) {
      const { contact } = simulateToFirstContact(from, to, 1 / 60);
      expect(contact.first).toBe(true);
      expect(Math.hypot(contact.u - to.u, contact.v - to.v)).toBeLessThan(0.05);
    }
  });

  it("takes about the planned flight time to land", () => {
    const from = { u: -12.5, v: 0 };
    const to = { u: 3, v: 0 };
    const { T } = launchVelocity(from, to);
    const { t } = simulateToFirstContact(from, to, 1 / 120);
    expect(Math.abs(t - T)).toBeLessThan(0.03);
  });

  it("a zero-distance serve drops straight down", () => {
    const vel = launchVelocity({ u: 1, v: 1 }, { u: 1, v: 1 });
    expect(vel.vu).toBe(0);
    expect(vel.vv).toBe(0);
    expect(Number.isFinite(vel.vz)).toBe(true);
  });

  it("bounces lose height and speed, then settle after MAX_BOUNCES", () => {
    const body = createBallBody(0, 0, 0, { vu: 10, vv: 0, vz: 8 });
    const heights = [];
    let settled = false;
    let peak = 0;
    for (let t = 0; t < 10 && !settled; t += 1 / 120) {
      const events = stepBall(body, 1 / 120);
      peak = Math.max(peak, body.z);
      for (const e of events) {
        if (e.type === "contact") { heights.push(peak); peak = 0; }
        if (e.type === "settle") settled = true;
      }
    }
    expect(settled).toBe(true);
    expect(body.bounces).toBe(MAX_BOUNCES);
    expect(heights.length).toBe(MAX_BOUNCES);
    expect(heights[1]).toBeLessThan(heights[0]);
    expect(heights[2]).toBeLessThan(heights[1]);
    expect(body.vu).toBe(0);
    expect(body.vz).toBe(0);
    expect(body.z).toBe(0);
  });

  it("never reports z below the ground after a contact", () => {
    const body = createBallBody(0, 0, 2, { vu: 0, vv: 0, vz: 0 });
    for (let i = 0; i < 400; i++) {
      stepBall(body, 1 / 60);
      expect(body.z).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses cartoon gravity, snappier than Earth's", () => {
    expect(GRAVITY).toBeGreaterThan(9.81);
  });
});
