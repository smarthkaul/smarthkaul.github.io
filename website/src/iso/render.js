import { K, project, worldToScreen, isoRadii } from "./projection";
import { COURT_M, LINES, TARGETS, SCENE, AIM_RANGE } from "./court";
import { PARTS, PIVOTS, RACKET, UNIT, TOSS_APEX, handPoint } from "./rig";
import { SECTIONS } from "../data/sections";

// Canvas 2D renderer. Reads the scene state, never mutates it.

export const BALL_RADIUS = 0.3; // metres — cartoon scale, like the figure

export const COLORS = {
  turf: "#2f8f4e",
  stripe: "rgba(0,0,0,0.06)",
  court: "#276e3c",
  line: "#ffffff",
  cream: "#f4f1e9",
  ball: "#d6f84c",
  ballSeam: "#276e3c",
  wimbledon: "#4c2c69",
  shadow: "rgba(0,0,0,0.3)",
  net: "rgba(244,241,233,0.28)",
  post: "#3a2151",
};

export function toScreen(scene, viewport, u, v, z = 0) {
  return worldToScreen(project(u, v, z), scene.cam, viewport);
}

const px = (metres, zoom, min = 1.5) => Math.max(min, metres * K * zoom);

function groundPoly(ctx, scene, viewport, corners) {
  ctx.beginPath();
  corners.forEach(([u, v], i) => {
    const p = toScreen(scene, viewport, u, v);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

function groundEllipse(ctx, scene, viewport, u, v, r) {
  const p = toScreen(scene, viewport, u, v);
  const { rx, ry } = isoRadii(r, scene.cam.zoom);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
}

function drawTurf(ctx, scene, viewport) {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.fillStyle = COLORS.turf;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  // Mow stripes along u, 2 m wide, in world space so they zoom with the court.
  ctx.fillStyle = COLORS.stripe;
  for (let u = Math.floor(SCENE.uMin); u < SCENE.uMax; u += 4) {
    groundPoly(ctx, scene, viewport, [[u, SCENE.vMin], [u + 2, SCENE.vMin], [u + 2, SCENE.vMax], [u, SCENE.vMax]]);
    ctx.fill();
  }
}

function drawCourt(ctx, scene, viewport) {
  const L = COURT_M.halfLength;
  const W = COURT_M.halfWidth;
  ctx.fillStyle = COLORS.court;
  groundPoly(ctx, scene, viewport, [[-L, -W], [L, -W], [L, W], [-L, W]]);
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = px(0.1, scene.cam.zoom);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const [u1, v1, u2, v2] of LINES) {
    const a = toScreen(scene, viewport, u1, v1);
    const b = toScreen(scene, viewport, u2, v2);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
}

function drawTargets(ctx, scene, viewport) {
  const zoom = scene.cam.zoom;
  for (const s of SECTIONS) {
    const t = TARGETS[s.id];
    const state = scene.targets[s.id] ?? { flash: 0, pop: 1 };
    const hover = scene.aim?.hover === s.id;
    if (t.kind === "rect") {
      groundPoly(ctx, scene, viewport, [[t.u1, t.v1], [t.u2, t.v1], [t.u2, t.v2], [t.u1, t.v2]]);
      ctx.fillStyle = `rgba(214,248,76,${0.08 + (hover ? 0.12 : 0) + state.flash * 0.5})`;
      ctx.fill();
      ctx.strokeStyle = hover || state.flash > 0 ? COLORS.ball : "rgba(255,255,255,0.45)";
      ctx.lineWidth = px(0.08, zoom);
      ctx.setLineDash(hover ? [] : [px(0.3, zoom), px(0.25, zoom)]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const r = t.r * state.pop;
      groundEllipse(ctx, scene, viewport, t.u, t.v, r);
      ctx.fillStyle = `rgba(76,44,105,${0.25 + state.flash * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = hover ? COLORS.ball : "rgba(244,241,233,0.75)";
      ctx.lineWidth = px(0.08, zoom);
      ctx.stroke();
      groundEllipse(ctx, scene, viewport, t.u, t.v, r * 0.62);
      ctx.strokeStyle = "rgba(214,248,76,0.85)";
      ctx.stroke();
      groundEllipse(ctx, scene, viewport, t.u, t.v, r * 0.28);
      ctx.fillStyle = `rgba(214,248,76,${0.45 + state.flash * 0.5})`;
      ctx.fill();
    }
  }
}

function drawShadow(ctx, scene, viewport, u, v, z, r) {
  const k = Math.max(0.6, 1 - z / 12);
  groundEllipse(ctx, scene, viewport, u, v, r * k);
  ctx.fillStyle = `rgba(0,0,0,${0.35 - Math.min(0.2, z / 25)})`;
  ctx.fill();
}

function drawReticle(ctx, scene, viewport) {
  const aim = scene.aim;
  if (!aim) return;
  const zoom = scene.cam.zoom;
  const color = aim.hover ? COLORS.ball : COLORS.cream;
  ctx.strokeStyle = color;
  ctx.lineWidth = px(0.07, zoom, 2);
  groundEllipse(ctx, scene, viewport, aim.u, aim.v, 0.9);
  ctx.stroke();
  // Four ticks.
  for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const a = toScreen(scene, viewport, aim.u + du * 1.05, aim.v + dv * 1.05);
    const b = toScreen(scene, viewport, aim.u + du * 1.45, aim.v + dv * 1.45);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  // Pulsing dot.
  const pulse = 0.12 + 0.08 * (0.5 + 0.5 * Math.sin(scene.t * 6));
  groundEllipse(ctx, scene, viewport, aim.u, aim.v, pulse);
  ctx.fillStyle = color;
  ctx.fill();
  // Range ring when the aim is pinned at max reach.
  if (aim.clamped) {
    ctx.setLineDash([px(0.4, zoom), px(0.5, zoom)]);
    ctx.strokeStyle = "rgba(244,241,233,0.35)";
    groundEllipse(ctx, scene, viewport, scene.player.u, scene.player.v, AIM_RANGE);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawNet(ctx, scene, viewport) {
  const zoom = scene.cam.zoom;
  const V = COURT_M.postV;
  const h = COURT_M.postHeight;
  const a0 = toScreen(scene, viewport, 0, -V, 0);
  const a1 = toScreen(scene, viewport, 0, -V, h);
  const b0 = toScreen(scene, viewport, 0, V, 0);
  const b1 = toScreen(scene, viewport, 0, V, h);
  const mid = toScreen(scene, viewport, 0, 0, COURT_M.netHeight);
  // Mesh.
  ctx.beginPath();
  ctx.moveTo(a0.x, a0.y);
  ctx.lineTo(b0.x, b0.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.quadraticCurveTo(mid.x, mid.y + (mid.y - (a1.y + b1.y) / 2) * 0.4, a1.x, a1.y);
  ctx.closePath();
  ctx.fillStyle = COLORS.net;
  ctx.fill();
  ctx.strokeStyle = "rgba(244,241,233,0.3)";
  ctx.lineWidth = Math.max(1, 0.03 * K * zoom);
  ctx.beginPath();
  for (let v = -V + 0.8; v < V; v += 0.8) {
    const g = toScreen(scene, viewport, 0, v, 0);
    const top = toScreen(scene, viewport, 0, v, COURT_M.netHeight + (h - COURT_M.netHeight) * Math.abs(v / V));
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(top.x, top.y);
  }
  ctx.stroke();
  // Tape.
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = px(0.08, zoom, 2);
  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.quadraticCurveTo(mid.x, mid.y + (mid.y - (a1.y + b1.y) / 2) * 0.4, b1.x, b1.y);
  ctx.stroke();
  // Posts.
  ctx.strokeStyle = COLORS.post;
  ctx.lineWidth = px(0.12, zoom, 3);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a0.x, a0.y);
  ctx.lineTo(a1.x, a1.y);
  ctx.moveTo(b0.x, b0.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.stroke();
}

function drawPart(ctx, img, part) {
  if (!img) return;
  ctx.drawImage(img, part.x, part.y, part.w, part.h);
}

function drawRacket(ctx) {
  ctx.strokeStyle = COLORS.ball;
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(RACKET.handle.x1, RACKET.handle.y1);
  ctx.lineTo(RACKET.handle.x2, RACKET.handle.y2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(RACKET.head.cx, RACKET.head.cy, RACKET.head.rx, RACKET.head.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.globalAlpha *= 0.65;
  ctx.beginPath();
  for (const dx of [-4, 0, 4]) {
    ctx.moveTo(RACKET.head.cx + dx, RACKET.head.cy - 9);
    ctx.lineTo(RACKET.head.cx + dx, RACKET.head.cy + 9);
  }
  for (const dy of [-5, 0, 5]) {
    ctx.moveTo(RACKET.head.cx - 6, RACKET.head.cy + dy);
    ctx.lineTo(RACKET.head.cx + 6, RACKET.head.cy + dy);
  }
  ctx.stroke();
}

// Figure units → screen: one unit is UNIT metres; a vertical metre is K·zoom px.
export function figureScale(scene) {
  return UNIT * K * scene.cam.zoom;
}

function drawPlayer(ctx, scene, viewport, images) {
  const { player } = scene;
  const rig = player.rig;
  const feet = toScreen(scene, viewport, player.u, player.v, rig.bob + rig.hop);
  const s = figureScale(scene);
  ctx.save();
  ctx.translate(feet.x, feet.y);
  ctx.rotate(rig.lean * rig.facing);
  ctx.scale(s * rig.facing * rig.squashX, s * rig.squashY);
  // Left arm (back), pivoting at its shoulder.
  ctx.save();
  ctx.translate(PIVOTS.shoulderL.x, PIVOTS.shoulderL.y);
  ctx.rotate(rig.armL);
  ctx.translate(-PIVOTS.shoulderL.x, -PIVOTS.shoulderL.y);
  drawPart(ctx, images.leftArm, PARTS.leftArm);
  ctx.restore();
  drawPart(ctx, images.body, PARTS.body);
  // Head tilts about the neck.
  ctx.save();
  ctx.translate(PIVOTS.neck.x, PIVOTS.neck.y);
  ctx.rotate(rig.headTilt);
  ctx.translate(-PIVOTS.neck.x, -PIVOTS.neck.y);
  drawPart(ctx, images.head, PARTS.head);
  ctx.restore();
  // Racket arm.
  ctx.save();
  ctx.translate(PIVOTS.shoulderR.x, PIVOTS.shoulderR.y);
  ctx.rotate(rig.armR);
  ctx.translate(-PIVOTS.shoulderR.x, -PIVOTS.shoulderR.y);
  drawPart(ctx, images.rightArm, PARTS.rightArm);
  drawRacket(ctx);
  ctx.restore();
  ctx.restore();
}

// Where the ball is on screen. In the hand/toss phases it rides the figure.
export function ballScreenPoint(scene, viewport) {
  const { ball, player } = scene;
  if (ball.phase === "hand" || ball.phase === "toss") {
    const rig = player.rig;
    const feet = toScreen(scene, viewport, player.u, player.v, rig.bob + rig.hop);
    const s = figureScale(scene);
    const hand = handPoint(rig);
    const fx = hand.x + (TOSS_APEX.x - hand.x) * rig.toss;
    const fy = hand.y + (TOSS_APEX.y - hand.y) * rig.toss - 6;
    return { x: feet.x + fx * s * rig.facing * rig.squashX, y: feet.y + fy * s * rig.squashY, angle: 0 };
  }
  const p = toScreen(scene, viewport, ball.u, ball.v, ball.z);
  const sv = project(ball.vu, ball.vv, ball.vz); // velocity direction on screen
  return { x: p.x, y: p.y, angle: Math.atan2(sv.y, sv.x) };
}

function drawBall(ctx, scene, viewport) {
  const { ball } = scene;
  if (ball.alpha <= 0) return;
  const p = ballScreenPoint(scene, viewport);
  const r = BALL_RADIUS * K * scene.cam.zoom;
  ctx.save();
  ctx.globalAlpha = ball.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(ball.scaleX, ball.scaleY);
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ball;
  ctx.fill();
  ctx.strokeStyle = COLORS.ballSeam;
  ctx.lineWidth = Math.max(1, r * 0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.95, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = Math.max(0.8, r * 0.12);
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, 0, r * 0.55, r * 0.85, 0, -1.1, 1.1);
  ctx.stroke();
  ctx.restore();
}

function drawBallShadow(ctx, scene, viewport) {
  const { ball, player } = scene;
  if (ball.alpha <= 0) return;
  if (ball.phase === "hand" || ball.phase === "toss") {
    drawShadow(ctx, scene, viewport, player.u, player.v, 1.3 + player.rig.toss * 1.3, BALL_RADIUS * 0.9);
    return;
  }
  drawShadow(ctx, scene, viewport, ball.u, ball.v, ball.z, BALL_RADIUS);
}

function drawTrail(ctx, scene, viewport) {
  const n = scene.ball.trail.length;
  if (!n) return;
  const r = BALL_RADIUS * K * scene.cam.zoom;
  scene.ball.trail.forEach((pt, i) => {
    if (i % 2) return; // dotted
    const k = (i + 1) / n;
    const p = toScreen(scene, viewport, pt.u, pt.v, pt.z);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * 0.45 * k, r * 0.45 * k, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(214,248,76,${0.55 * k})`;
    ctx.fill();
  });
}

function drawEffects(ctx, scene, viewport) {
  const zoom = scene.cam.zoom;
  for (const rp of scene.ripples) {
    groundEllipse(ctx, scene, viewport, rp.u, rp.v, rp.r);
    ctx.strokeStyle = `rgba(214,248,76,${rp.alpha})`;
    ctx.lineWidth = px(0.08, zoom, 2);
    ctx.stroke();
  }
  for (const pt of scene.particles) {
    const p = toScreen(scene, viewport, pt.u, pt.v, pt.z);
    const k = pt.life / pt.maxLife;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, Math.max(0.5, pt.r * K * zoom * k), Math.max(0.5, pt.r * K * zoom * k), 0, 0, Math.PI * 2);
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = 0.7 * k;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawLabels(ctx, scene, viewport) {
  const zoomRatio = scene.cam.zoom / (scene.fitZoom || scene.cam.zoom);
  const alpha = Math.max(0, Math.min(1, 1 - (zoomRatio - 1) / 0.8));
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;
  for (const s of SECTIONS) {
    const t = TARGETS[s.id];
    const c = t.kind === "rect" ? { u: (t.u1 + t.u2) / 2, v: (t.v1 + t.v2) / 2 } : { u: t.u, v: t.v };
    const p = toScreen(scene, viewport, c.u, c.v);
    ctx.font = "500 10px ui-monospace, Menlo, monospace";
    ctx.fillStyle = COLORS.ball;
    ctx.fillText(s.broadcast.toUpperCase(), p.x, p.y - 9);
    ctx.font = "800 15px Syne, system-ui, sans-serif";
    ctx.fillStyle = COLORS.cream;
    ctx.fillText(s.label, p.x, p.y + 7);
  }
  ctx.restore();
}

export function renderScene(ctx, scene, viewport, images = {}) {
  drawTurf(ctx, scene, viewport);
  drawCourt(ctx, scene, viewport);
  drawTargets(ctx, scene, viewport);
  drawShadow(ctx, scene, viewport, scene.player.u, scene.player.v, scene.player.rig.hop, 0.9);
  drawBallShadow(ctx, scene, viewport);
  drawReticle(ctx, scene, viewport);
  const ballFar = scene.ball.phase !== "hand" && scene.ball.phase !== "toss" && scene.ball.u > 0;
  if (ballFar) drawBall(ctx, scene, viewport);
  drawNet(ctx, scene, viewport);
  drawPlayer(ctx, scene, viewport, images);
  if (!ballFar) drawBall(ctx, scene, viewport);
  drawTrail(ctx, scene, viewport);
  drawEffects(ctx, scene, viewport);
  drawLabels(ctx, scene, viewport);
}
