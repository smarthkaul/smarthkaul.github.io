// Single source of truth for navigation, court zones, and routing.

export const SECTIONS = [
  { id: "about", label: "About", broadcast: "The Player", box: "near-top" },
  { id: "experience", label: "Experience", broadcast: "Career Record", box: "near-bottom" },
  { id: "projects", label: "Projects", broadcast: "Highlight Reel", box: "far-top" },
  { id: "contact", label: "Contact", broadcast: "Match Point", box: "far-bottom" },
];

// SVG viewBox for the top-down court (landscape: a court is wider than it is tall).
export const COURT = { width: 540, height: 360 };

// Service-box rectangles in court units. The net is vertical at x=270; the near
// boxes sit left of it (the server's side), the far boxes right of it. cx/cy are
// the box centres (used as the section "erupt" origin).
export const BOXES = {
  "near-top": { x: 135, y: 60, w: 135, h: 120, cx: 202.5, cy: 120 },
  "near-bottom": { x: 135, y: 180, w: 135, h: 120, cx: 202.5, cy: 240 },
  "far-top": { x: 270, y: 60, w: 135, h: 120, cx: 337.5, cy: 120 },
  "far-bottom": { x: 270, y: 180, w: 135, h: 120, cx: 337.5, cy: 240 },
};

export function resolveActiveSection(pathname) {
  const id = (pathname || "").replace(/^\/+|\/+$/g, "");
  return SECTIONS.find((s) => s.id === id) ?? null;
}

// --- Serve trajectory (Phase 2) ---

// Left-baseline centre — where the ball launches from (no player yet).
export const SERVE_ORIGIN = { x: 35, y: 180 };

// Control point for a lobbed quadratic arc: horizontally between the two
// points, vertically above the higher of them (smaller y = higher on screen).
export function serveControl(origin, target) {
  return {
    x: (origin.x + target.x) / 2,
    y: Math.min(origin.y, target.y) - 80,
  };
}

// SVG quadratic path string — used to draw the Hawk-Eye trail.
export function servePathD(origin, control, target) {
  return `M ${origin.x} ${origin.y} Q ${control.x} ${control.y} ${target.x} ${target.y}`;
}

// Point on the quadratic bézier at t in [0,1]. The ball follows this per frame.
export function bezierPoint(origin, control, target, t) {
  const u = 1 - t;
  return {
    x: u * u * origin.x + 2 * u * t * control.x + t * t * target.x,
    y: u * u * origin.y + 2 * u * t * control.y + t * t * target.y,
  };
}

// --- Aim & landing (Phase 2 rework) ---

// Doubles boundary rectangle in court units (matches Court.jsx's SVG boundary).
export const COURT_BOUNDS = { x: 20, y: 20, w: 500, h: 320 };

// Landing point from a drag "pull" vector (pointer - origin). Mirrored like a
// slingshot (pull back → launch across the court) and scaled by power, clamped
// so a huge pull can't send the ball infinitely far.
export function landingFromPull(origin, pull, opts = {}) {
  const power = opts.power ?? 2.2;
  const maxReach = opts.maxReach ?? 560;
  let vx = -pull.x * power;
  let vy = -pull.y * power;
  const mag = Math.hypot(vx, vy);
  if (mag > maxReach && mag > 0) {
    vx = (vx / mag) * maxReach;
    vy = (vy / mag) * maxReach;
  }
  return { x: origin.x + vx, y: origin.y + vy };
}

export function pointInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

// Classify a landing point: a service box (navigate), in-bounds miss (OUT), or
// off the court entirely (the serve-tutorial easter egg).
export function classifyLanding(point) {
  for (const s of SECTIONS) {
    if (pointInRect(point, BOXES[s.box])) return { type: "hit", sectionId: s.id };
  }
  if (pointInRect(point, COURT_BOUNDS)) return { type: "out" };
  return { type: "beyond" };
}
