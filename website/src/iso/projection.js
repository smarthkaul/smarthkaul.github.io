// 2:1 dimetric projection of the tennis court. World units are metres:
// u along the court (negative = the server's half), v across it (negative =
// left as the server faces the net), z up. Screen units are CSS pixels at
// zoom 1; the camera scales them.

export const K = 28; // px per metre at zoom 1

export function project(u, v, z = 0) {
  return { x: (u + v) * K, y: (-(u - v) * K) / 2 - z * K };
}

// Inverse of project() on the ground plane (z = 0). Linear, so it also works
// for deltas.
export function unproject(x, y) {
  const a = x / K;
  const b = (2 * y) / K;
  return { u: (a - b) / 2, v: (a + b) / 2 };
}

export const unprojectDelta = unproject;

// Ground-plane screen y: larger = nearer the viewer = drawn later.
export function depthKey(u, v) {
  return (-(u - v) * K) / 2;
}

// Semi-axes of the ellipse a ground circle of radius r (metres) projects to.
export function isoRadii(r, zoom) {
  const s = r * K * zoom;
  return { rx: s * Math.SQRT2, ry: s / Math.SQRT2 };
}

export function projectBounds(points) {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of points) {
    const s = project(p.u, p.v, p.z ?? 0);
    if (s.x < b.minX) b.minX = s.x;
    if (s.x > b.maxX) b.maxX = s.x;
    if (s.y < b.minY) b.minY = s.y;
    if (s.y > b.maxY) b.maxY = s.y;
  }
  return b;
}

// Camera that frames `bounds` (projected space) inside `viewport` with a
// fractional margin on the limiting axis. cam.x/cam.y is the projected-space
// point shown at the viewport centre; zoom multiplies K.
export function fitCamera(viewport, bounds, margin = 0.06) {
  const bw = Math.max(1e-6, bounds.maxX - bounds.minX);
  const bh = Math.max(1e-6, bounds.maxY - bounds.minY);
  const zoom = Math.min(viewport.width / bw, viewport.height / bh) * (1 - margin);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    zoom,
  };
}

export function worldToScreen(p, cam, viewport) {
  return {
    x: (p.x - cam.x) * cam.zoom + viewport.width / 2,
    y: (p.y - cam.y) * cam.zoom + viewport.height / 2,
  };
}

export function screenToGround(sx, sy, cam, viewport) {
  const px = (sx - viewport.width / 2) / cam.zoom + cam.x;
  const py = (sy - viewport.height / 2) / cam.zoom + cam.y;
  return unproject(px, py);
}
