import { describe, it, expect } from "vitest";
import { SECTIONS } from "../data/sections";
import {
  COURT_M, LINES, TARGETS, PLAYER_BOUNDS, SPAWN, AIM_RANGE, SCENE,
  sceneCorners, targetContains, targetCenter, inCourt, classifyLanding,
  clampAim, clampPlayer,
} from "./court";

describe("court geometry", () => {
  it("has a target for every section and no extras", () => {
    expect(Object.keys(TARGETS).sort()).toEqual(SECTIONS.map((s) => s.id).sort());
  });

  it("uses real court dimensions", () => {
    expect(COURT_M.halfLength).toBeCloseTo(11.885);
    expect(COURT_M.halfWidth).toBeCloseTo(5.485);
    expect(COURT_M.singlesHalfWidth).toBeCloseTo(4.115);
    expect(COURT_M.serviceLine).toBeCloseTo(6.4);
  });

  it("draws the doubles rectangle, singles sidelines, service lines, centre line and centre marks", () => {
    // 4 sides + 2 singles + 2 service + 1 centre service + 2 centre marks
    expect(LINES).toHaveLength(11);
    for (const seg of LINES) expect(seg).toHaveLength(4);
  });

  it("targetCenter returns the middle of a box and the centre of a ring", () => {
    expect(targetCenter("experience")).toEqual({ u: 3.2, v: -2.0575 });
    expect(targetCenter("about")).toEqual({ u: 14.8, v: -3.4 });
  });

  it("classifies hits, outs and beyonds", () => {
    expect(classifyLanding({ u: 3, v: -2 })).toEqual({ type: "hit", sectionId: "experience" });
    expect(classifyLanding({ u: 3, v: 2 })).toEqual({ type: "hit", sectionId: "projects" });
    expect(classifyLanding({ u: 14.8, v: -3.4 })).toEqual({ type: "hit", sectionId: "about" });
    expect(classifyLanding({ u: 15.5, v: 4.0 })).toEqual({ type: "hit", sectionId: "contact" });
    expect(classifyLanding({ u: 9, v: 0 })).toEqual({ type: "out" });   // far court, no box
    expect(classifyLanding({ u: -5, v: 0 })).toEqual({ type: "out" });  // server's half
    expect(classifyLanding({ u: 3, v: 5 })).toEqual({ type: "out" });   // doubles alley
    expect(classifyLanding({ u: 20, v: 0 })).toEqual({ type: "beyond" });
    expect(classifyLanding({ u: 0, v: 9 })).toEqual({ type: "beyond" });
  });

  it("edges are inclusive: the net line and the centre line belong to the boxes", () => {
    expect(classifyLanding({ u: 0, v: -2 })).toEqual({ type: "hit", sectionId: "experience" });
    expect(classifyLanding({ u: -0.001, v: -2 })).toEqual({ type: "out" });
    expect(classifyLanding({ u: 3, v: 0 }).type).toBe("hit"); // on the centre line, first match wins
    expect(classifyLanding({ u: 6.4, v: -1 })).toEqual({ type: "hit", sectionId: "experience" });
    expect(classifyLanding({ u: 6.401, v: -1 })).toEqual({ type: "out" });
  });

  it("targetContains works for rings by distance", () => {
    const about = TARGETS.about;
    expect(targetContains(about, { u: 14.8 + 1.69, v: -3.4 })).toBe(true);
    expect(targetContains(about, { u: 14.8 + 1.71, v: -3.4 })).toBe(false);
  });

  it("inCourt is the doubles rectangle", () => {
    expect(inCourt({ u: 11.885, v: 5.485 })).toBe(true);
    expect(inCourt({ u: 11.9, v: 0 })).toBe(false);
  });

  it("clampAim keeps the aim within AIM_RANGE of the player and flags it", () => {
    const player = { u: -12, v: 0 };
    const near = clampAim(player, { u: -2, v: 0 });
    expect(near).toEqual({ u: -2, v: 0, clamped: false });
    const far = clampAim(player, { u: 30, v: 0 });
    expect(far.clamped).toBe(true);
    expect(Math.hypot(far.u - player.u, far.v - player.v)).toBeCloseTo(AIM_RANGE);
    expect(far.v).toBeCloseTo(0);
  });

  it("the far service boxes are reachable from the spawn and the rings from the net", () => {
    expect(Math.hypot(3.2 - SPAWN.u, -2.0575 - SPAWN.v)).toBeLessThan(AIM_RANGE);
    expect(Math.hypot(14.8 - PLAYER_BOUNDS.uMax, 3.4)).toBeLessThan(AIM_RANGE);
    expect(Math.hypot(14.8 - SPAWN.u, 3.4 - SPAWN.v)).toBeGreaterThan(AIM_RANGE); // must walk
  });

  it("clampPlayer never lets the player cross the net", () => {
    expect(clampPlayer({ u: 5, v: 0 })).toEqual({ u: PLAYER_BOUNDS.uMax, v: 0 });
    expect(clampPlayer({ u: -40, v: -40 })).toEqual({ u: PLAYER_BOUNDS.uMin, v: PLAYER_BOUNDS.vMin });
    expect(clampPlayer({ u: -10, v: 3 })).toEqual({ u: -10, v: 3 });
  });

  it("sceneCorners covers the court, the rings and the run-up", () => {
    const c = sceneCorners();
    expect(c).toHaveLength(4);
    expect(Math.min(...c.map((p) => p.u))).toBeLessThanOrEqual(PLAYER_BOUNDS.uMin);
    expect(Math.max(...c.map((p) => p.u))).toBeGreaterThanOrEqual(14.8 + 1.7);
    expect(SCENE.vMax).toBeGreaterThanOrEqual(PLAYER_BOUNDS.vMax);
  });
});
