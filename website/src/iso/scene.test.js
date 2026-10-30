import { describe, it, expect, vi } from "vitest";
import gsap from "gsap";
import { createScene, FOLLOW_ZOOM, BALL_ZOOM, INTRO_ENTRY, REVEAL_DURATION } from "./scene";
import { project, worldToScreen } from "./projection";
import { SPAWN, PLAYER_BOUNDS, AIM_RANGE, targetCenter } from "./court";
import { JUMP_HEIGHT } from "./rig";

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
  it("starts at the spawn with the ball in hand and the camera on the player", () => {
    const { scene } = make();
    expect(scene.state.player.u).toBe(SPAWN.u);
    expect(scene.state.ball.phase).toBe("hand");
    expect(scene.cam).toBe(scene.state.cam);
    expect(scene.state.fitZoom).toBeGreaterThan(0);
    expect(scene.state.camMode).toBe("follow");
    expect(scene.cam.zoom).toBeCloseTo(scene.state.fitZoom * FOLLOW_ZOOM);
  });

  it("fit() frames the whole scene and holds until another mode is set", () => {
    const { scene } = make({ reduced: false });
    scene.fit();
    expect(scene.state.camMode).toBe("fit");
    expect(scene.cam.zoom).toBe(scene.state.fitZoom);
    const { x } = scene.cam;
    scene.state.player.u = -3;
    run(scene, 1);
    expect(scene.cam.x).toBeCloseTo(x);
    scene.setCameraMode("follow");
    run(scene, 3);
    expect(scene.cam.zoom).toBeCloseTo(scene.state.fitZoom * FOLLOW_ZOOM, 2);
  });

  it("the follow camera eases toward the player without snapping, and does nothing while locked", () => {
    const { scene } = make({ reduced: false });
    const startX = scene.cam.x;
    scene.state.player.u = -3; // teleport up-court: the camera has to catch up
    scene.state.player.v = 4;
    const goal = project(-3, 4).x;
    scene.step(1 / 60);
    const afterOne = scene.cam.x;
    expect(afterOne).toBeGreaterThan(startX);
    expect(afterOne - startX).toBeLessThan((goal - startX) * 0.15); // damped, not a cut
    run(scene, 0.5);
    expect(scene.cam.x).toBeGreaterThan(afterOne);
    expect(scene.cam.x).toBeLessThan(goal);
    run(scene, 3);
    expect(scene.cam.x).toBeCloseTo(goal, 0);
    scene.lockCamera(true);
    scene.state.player.u = -12;
    const locked = { ...scene.cam };
    run(scene, 1);
    expect(scene.cam).toEqual(locked);
    scene.lockCamera(false);
    run(scene, 0.5);
    expect(scene.cam.x).not.toBeCloseTo(locked.x, 0);
  });

  it("the follow camera leads toward the aim", () => {
    const { scene } = make({ reduced: false });
    scene.setPointer(screenOf(scene, 3, -2));
    run(scene, 3);
    const p = scene.state.player;
    expect(scene.cam.x).toBeGreaterThan(project(p.u, p.v).x);
  });

  it("follows the ball after the strike, holds after the bounce, then returns to the player", () => {
    const { scene } = make({ reduced: false });
    scene.state.player.u = -5;
    scene.setPointer(screenOf(scene, 9, 0)); // out on the far court: no transition
    scene.step(1 / 60);
    expect(scene.serve()).toBe(true);
    const t0 = gsap.ticker.time;
    let i = 0;
    const tick = () => { i += 1; gsap.updateRoot(t0 + i / 60); scene.step(1 / 60); };
    while (scene.state.camMode !== "ball" && i < 120) tick();
    expect(scene.state.camMode).toBe("ball");
    for (let k = 0; k < 20; k++) tick();
    expect(scene.cam.zoom).toBeLessThan(scene.state.fitZoom * FOLLOW_ZOOM);
    expect(scene.cam.zoom).toBeGreaterThan(scene.state.fitZoom * BALL_ZOOM);
    for (let k = 0; k < 360 && scene.state.camMode === "ball"; k++) tick();
    expect(scene.state.camMode).toBe("follow");
    scene.destroy();
  });

  it("jump lifts the player to about the apex height and lands", () => {
    const { scene } = make();
    const rig = scene.state.player.rig;
    expect(scene.jump()).toBe(true);
    expect(scene.jump()).toBe(false); // already airborne
    let apex = 0;
    for (let t = 0; t < 2; t += 1 / 120) { scene.step(1 / 120); apex = Math.max(apex, rig.z); }
    expect(apex).toBeGreaterThan(JUMP_HEIGHT * 0.95);
    expect(apex).toBeLessThan(JUMP_HEIGHT * 1.05);
    expect(rig.z).toBe(0);
    expect(rig.airborne).toBe(false);
    expect(scene.jump()).toBe(true);
  });

  it("you can walk while jumping, and the ball in hand comes along", () => {
    const { scene } = make();
    scene.jump();
    scene.setKey("KeyD", true);
    run(scene, 0.3);
    expect(scene.state.player.rig.z).toBeGreaterThan(0);
    expect(scene.state.player.u).toBeGreaterThan(SPAWN.u);
    expect(scene.state.ball.u).toBe(scene.state.player.u);
  });

  it("landing a jump with full motion leaves dust and a ripple", () => {
    const { scene } = make({ reduced: false });
    scene.jump();
    const t0 = gsap.ticker.time;
    let landed = false;
    for (let i = 1; i <= 90 && !landed; i++) {
      gsap.updateRoot(t0 + i / 60);
      scene.step(1 / 60);
      landed = !scene.state.player.rig.airborne;
    }
    expect(landed).toBe(true);
    expect(scene.state.particles.length).toBeGreaterThan(0);
    expect(scene.state.ripples.length).toBeGreaterThan(0);
    scene.destroy();
  });

  it("jump is ignored while serving and while input is disabled", () => {
    const { scene } = make({ reduced: false });
    scene.setPointer(screenOf(scene, 3, -2));
    scene.step(1 / 60);
    expect(scene.serve()).toBe(true);
    expect(scene.jump()).toBe(false);
    expect(scene.state.player.rig.airborne).toBe(false);
    scene.destroy();
    const other = make().scene;
    other.setInputEnabled(false);
    expect(other.jump()).toBe(false);
  });

  it("walkTo walks there without serving, even with input disabled, then calls onArrive", () => {
    const { scene, onServe } = make();
    const onArrive = vi.fn();
    scene.setInputEnabled(false);
    scene.walkTo({ u: -8, v: 2 }, onArrive);
    run(scene, 4);
    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(scene.state.player.u).toBeCloseTo(-8, 0);
    expect(scene.state.player.v).toBeCloseTo(2, 0);
    expect(onServe).not.toHaveBeenCalled();
  });

  it("placePlayer and walkTo can start outside the player bounds", () => {
    const { scene } = make();
    const onArrive = vi.fn();
    scene.placePlayer({ u: -12, v: -20 });
    expect(scene.state.ball.v).toBe(-20);
    scene.walkTo({ u: -12, v: -1.5 }, onArrive);
    run(scene, 0.5);
    expect(scene.state.player.v).toBeLessThan(PLAYER_BOUNDS.vMin);
    run(scene, 5);
    expect(onArrive).toHaveBeenCalled();
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

  it("resize does not move the camera while it is locked", () => {
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

  describe("intro", () => {
    const expectFinal = (scene) => {
      expect(scene.state.reveal).toBe(1);
      expect(scene.state.player.visible).toBe(true);
      expect(scene.state.player.u).toBeCloseTo(SPAWN.u, 0);
      expect(scene.state.player.v).toBeCloseTo(SPAWN.v, 0);
      expect(scene.state.camMode).toBe("follow");
    };

    it("intro: true starts unrevealed, player hidden, on the fit camera, input off", () => {
      const { scene } = make({ intro: true });
      expect(scene.state.reveal).toBe(0);
      expect(scene.state.player.visible).toBe(false);
      expect(scene.state.camMode).toBe("fit");
      expect(scene.cam.zoom).toBeCloseTo(scene.state.fitZoom);
      expect(scene.jump()).toBe(false);
      scene.setPointer(screenOf(scene, 3, -2));
      scene.step(1 / 60);
      expect(scene.serve()).toBe(false);
    });

    it("without the option the court is fully revealed and the player visible", () => {
      const { scene } = make();
      expect(scene.state.reveal).toBe(1);
      expect(scene.state.player.visible).toBe(true);
    });

    it("intro() under reduced motion lands on the final state and calls onDone", () => {
      const { scene } = make({ intro: true, reduced: true });
      const onDone = vi.fn();
      scene.intro({ onDone });
      expectFinal(scene);
      expect(scene.cam.zoom).toBeCloseTo(scene.state.fitZoom * FOLLOW_ZOOM);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it("intro() with full motion reveals the court, then walks the player in from off-court and calls onDone", () => {
      const { scene } = make({ intro: true, reduced: false });
      const onDone = vi.fn();
      scene.intro({ onDone });
      // Drive the reveal tween by hand: it runs on GSAP's clock, not step().
      gsap.getTweensOf(scene.state)[0].progress(0.5);
      expect(scene.state.reveal).toBeCloseTo(0.5);
      expect(scene.state.player.visible).toBe(false);
      gsap.getTweensOf(scene.state)[0].progress(1);
      expect(scene.state.player.visible).toBe(true);
      expect(scene.state.player.u).toBeCloseTo(INTRO_ENTRY.u);
      expect(scene.state.camMode).toBe("follow");
      expect(onDone).not.toHaveBeenCalled();
      run(scene, 10);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(scene.state.player.u).toBeCloseTo(SPAWN.u, 0);
      expect(REVEAL_DURATION).toBeGreaterThan(1);
      scene.destroy();
    });

    it("skipIntro() mid-intro restores the final state and never calls onDone", () => {
      const { scene } = make({ intro: true, reduced: false });
      const onDone = vi.fn();
      scene.intro({ onDone });
      gsap.getTweensOf(scene.state)[0].progress(1);
      run(scene, 0.5);
      scene.skipIntro();
      expectFinal(scene);
      expect(scene.cam.zoom).toBeCloseTo(scene.state.fitZoom * FOLLOW_ZOOM);
      run(scene, 10);
      expect(onDone).not.toHaveBeenCalled();
      scene.destroy();
    });

    it("skipIntro() before intro() also lands on the final state; afterwards it is a no-op", () => {
      const { scene } = make({ intro: true });
      scene.skipIntro();
      expectFinal(scene);
      scene.placePlayer({ u: -8, v: 2 });
      scene.skipIntro();
      expect(scene.state.player.u).toBe(-8);
    });

    it("finishing the intro does not enable input by itself", () => {
      const { scene, onServe } = make({ intro: true });
      const onDone = vi.fn();
      scene.intro({ onDone });
      expect(onDone).toHaveBeenCalled();
      expect(scene.jump()).toBe(false);
      scene.setPointer(screenOf(scene, 3, -2));
      scene.step(1 / 60);
      expect(scene.state.aim).toBeNull();
      expect(scene.serve()).toBe(false);
      expect(onServe).not.toHaveBeenCalled();
      scene.setInputEnabled(true);
      scene.step(1 / 60);
      expect(scene.serve()).toBe(true);
    });

    it("walkTo arrival enables nothing by itself", () => {
      const { scene } = make();
      scene.setInputEnabled(false);
      const onArrive = vi.fn();
      scene.walkTo({ u: -10, v: 0 }, onArrive);
      run(scene, 4);
      expect(onArrive).toHaveBeenCalled();
      expect(scene.jump()).toBe(false);
    });
  });
});
