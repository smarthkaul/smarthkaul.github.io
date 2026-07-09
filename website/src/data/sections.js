// Single source of truth for navigation, court zones, and routing.

export const SECTIONS = [
  { id: "about", label: "About", broadcast: "The Player", box: "near-left" },
  { id: "experience", label: "Experience", broadcast: "Career Record", box: "near-right" },
  { id: "projects", label: "Projects", broadcast: "Highlight Reel", box: "far-left" },
  { id: "contact", label: "Contact", broadcast: "Match Point", box: "far-right" },
];

// SVG viewBox for the top-down court (portrait: a court is longer than wide).
export const COURT = { width: 360, height: 540 };

// Service-box rectangles in court units. Net is at y=270; near boxes below it,
// far boxes above. cx/cy are the box centres (used as the section "erupt" origin).
export const BOXES = {
  "near-left": { x: 60, y: 270, w: 120, h: 135, cx: 120, cy: 337.5 },
  "near-right": { x: 180, y: 270, w: 120, h: 135, cx: 240, cy: 337.5 },
  "far-left": { x: 60, y: 135, w: 120, h: 135, cx: 120, cy: 202.5 },
  "far-right": { x: 180, y: 135, w: 120, h: 135, cx: 240, cy: 202.5 },
};

export function resolveActiveSection(pathname) {
  const id = (pathname || "").replace(/^\/+|\/+$/g, "");
  return SECTIONS.find((s) => s.id === id) ?? null;
}
