# Phase 1 — Court Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scrolling page with a persistent top-down SVG tennis court whose four **service boxes** are the navigation. Clicking a labelled zone routes to that section (per-section URL), the section's cream card animates in from the zone, and the court shrinks into a corner HUD. No ball or player yet (those are Phase 2/3) — this is the ball-*less* court-navigation shell, fully accessible and reduced-motion-aware, deployable on GitHub Pages.

**Architecture:** A `CourtStage` shell derives the active section from the URL (React Router) and renders a always-present `Court` plus an `AnimatePresence` overlay for the active section's existing reskinned component. Navigation is a state machine over the URL, not a scroll document. `framer-motion` drives the section "erupt" and the court hub↔dock transform; a single `usePrefersReducedMotion()` gate collapses every animation to an instant swap. GitHub Pages SPA routing is handled with the standard `404.html` redirect trick.

**Tech Stack:** React 18, Vite 6, Tailwind 3, React Router DOM 7, **framer-motion 11** (new), **Vitest + Testing Library** (new, for logic units).

**Plan 2 of 2 for the MVP.** Builds directly on the Phase 0 components already merged to `main` (`StatCard`, `Badge`, `Ticker`, and the reskinned `About`/`Experience`/`Projects`/`Contact`). Phases 2 (ball physics), 3 (player mascot), and 4 (cold-open) come later.

## Global Constraints

- **All npm commands run from `website/`.** Node 20.
- **Verification method — lint + build + Vitest + manual.** Phase 1 introduces genuine logic (URL→section resolution, reduced-motion detection, zone geometry), so those units get real Vitest tests (TDD: failing test first). Purely-visual work (SVG court, animation choreography) is verified with `npm run lint`, `npm run build`, `npm run test`, and a specific manual dev-server checklist.
- **Component conventions:** functional arrow components, `export default` at the bottom, one responsibility per file, content/config in `UPPER_CASE` data. Tailwind utilities inline; global CSS only in `src/index.css`.
- **Palette (from Phase 0, already in `tailwind.config.js`):** `grass`, `wimbledon`, `cream`, `charcoal`, `ball`. Body text charcoal on cream; **neon `ball` yellow is accent-only, never body text.** The page background is `.court-turf`.
- **Accessibility is a requirement, not polish:** every zone is a real `<button>` with an `aria-label`; the SVG court art is `aria-hidden`; a text menu lists all sections as links (keyboard fallback); on navigation, focus moves to the section heading and a live region announces it.
- **Reduced motion:** `usePrefersReducedMotion()` gates ALL court/erupt/dock/zone animation to instant. The Phase 0 CSS `@media (prefers-reduced-motion: reduce)` block already stills the ticker/pulse/reveal — extend it for new decorative classes.
- **GitHub Pages:** `base` stays `"/"` (user site at domain root). Client routes must survive direct load/refresh via `public/404.html` + an `index.html` decode snippet.
- **External links:** `target="_blank" rel="noopener noreferrer"` + `aria-label` on icon-only links.
- **Do not commit `website/dist/`.** Commits are atomic, **no AI co-author / "Generated with" trailer**. Work on branch `feat/phase1-court-nav`; open a PR at the end; never push to `main` directly.

## File Structure

| File | Responsibility |
|---|---|
| `src/data/sections.js` (new) | Single source of truth: `SECTIONS`, court dims `COURT`, service-box geometry `BOXES`, `resolveActiveSection(pathname)`. Consumed by routing, court, HUD, menu. |
| `src/hooks/usePrefersReducedMotion.js` (new) | `matchMedia` hook returning a boolean, live-updating. |
| `src/components/court/Court.jsx` (new) | The SVG court + four positioned zone `<button>`s; hub (full) and docked (mini) states. |
| `src/components/court/Hud.jsx` (new) | The docked-state score-bug label + "return to court" control. |
| `src/components/court/Hub.jsx` (new) | Landing overlay shown when no section is active: name, typewriter tagline, social links, "pick a zone" prompt. Absorbs the retired Hero. |
| `src/components/court/SectionMenu.jsx` (new) | Accessible text list of the four sections as `<Link>`s (keyboard/no-court fallback). |
| `src/pages/CourtStage.jsx` (new) | The shell: resolves active section from URL, composes Court + Hub + `AnimatePresence` section overlay + menu; focus/announce management; reduced-motion gate. |
| `src/pages/Layout.jsx` (modify) | Keep the turf `<main>` + `Footer`; replace the old Navbar with a minimal top bar (SK→hub + menu button). |
| `src/App.jsx` (modify) | Routes: index + one per section (generated from `SECTIONS`) → `CourtStage`; `*` → `Pagenotfound`. |
| `src/components/Hero.jsx` (delete) | Retired — the Hub replaces it. |
| `src/pages/Home.jsx` (delete) | Retired — `CourtStage` replaces the scroll composition. |
| `src/components/Navbar.jsx` (modify or delete) | Anchor-scroll nav no longer applies; replaced by the Layout top bar + `SectionMenu`. |
| `public/404.html` (new) | GitHub Pages SPA redirect. |
| `index.html` (modify) | Add the SPA-restore decode `<script>` in `<head>`. |
| `vite.config.js` (modify) | Add Vitest config. |
| `src/test/setup.js` (new) | Testing Library jest-dom setup. |
| `src/index.css` (modify) | Add `.zone-pulse` keyframes + reduced-motion coverage. |
| `package.json` (modify) | Add `framer-motion` dep; Vitest/RTL/jsdom dev deps; `test` script. |

---

## Before you begin

```bash
cd /Users/smarthkaul/Developer/smarthkaul.github.io
git checkout main && git pull origin main
git checkout -b feat/phase1-court-nav
cd website && npm install
npm run lint && npm run build   # confirm the Phase 0 baseline is green
```

---

## Task 1: Tooling — framer-motion + Vitest harness

**Files:**
- Modify: `website/package.json`
- Modify: `website/vite.config.js`
- Create: `website/src/test/setup.js`
- Create: `website/src/test/smoke.test.jsx`

**Interfaces:**
- Produces: `npm run test` (Vitest, jsdom, RTL matchers). `framer-motion` importable. Later tasks rely on both.

- [ ] **Step 1: Install dependencies**

Run (from `website/`):
```bash
npm install framer-motion@^11
npm install -D vitest@^2 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
```
Expected: installs succeed, `package.json` gains `framer-motion` under `dependencies` and the others under `devDependencies`.

- [ ] **Step 2: Add the `test` script to `package.json`**

In `website/package.json`, add to `"scripts"` (alongside the existing ones):
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Configure Vitest in `vite.config.js`**

Replace `website/vite.config.js` entirely with:
```js
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Create the test setup file**

Create `website/src/test/setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Write a smoke test (RED→GREEN proves the harness works)**

Create `website/src/test/smoke.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test harness', () => {
  it('renders and queries DOM with jest-dom matchers', () => {
    render(<h1>Broadcast</h1>)
    expect(screen.getByRole('heading', { name: 'Broadcast' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test**

Run: `cd website && npm run test`
Expected: 1 passed. If jest-dom matchers are missing, re-check Step 4.

- [ ] **Step 7: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 8: Commit**

```bash
git add website/package.json website/package-lock.json website/vite.config.js website/src/test/setup.js website/src/test/smoke.test.jsx
git commit -m "Add framer-motion and Vitest test harness"
```

---

## Task 2: Sections data + court geometry (TDD)

**Files:**
- Create: `website/src/data/sections.js`
- Create: `website/src/data/sections.test.js`

**Interfaces:**
- Produces:
  - `SECTIONS` — array of `{ id, label, broadcast, box }` in nav order: about, experience, projects, contact.
  - `COURT` — `{ width: 360, height: 540 }` (SVG viewBox).
  - `BOXES` — map of box name → `{ x, y, w, h, cx, cy }` in court units.
  - `resolveActiveSection(pathname)` — returns the matching `SECTIONS` entry or `null`.
- Consumed by App routing (Task 5), Court (Task 6), CourtStage (Task 5+), Hud/Menu.

- [ ] **Step 1: Write the failing tests**

Create `website/src/data/sections.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { SECTIONS, COURT, BOXES, resolveActiveSection } from './sections'

describe('SECTIONS', () => {
  it('has the four sections in nav order with required fields', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['about', 'experience', 'projects', 'contact'])
    for (const s of SECTIONS) {
      expect(s).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          label: expect.any(String),
          broadcast: expect.any(String),
          box: expect.any(String),
        })
      )
      expect(BOXES[s.box]).toBeDefined()
    }
  })

  it('maps each section to a distinct service box', () => {
    const boxes = SECTIONS.map((s) => s.box)
    expect(new Set(boxes).size).toBe(4)
  })
})

describe('BOXES geometry', () => {
  it('every box lies within the court bounds', () => {
    for (const b of Object.values(BOXES)) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(COURT.width)
      expect(b.y + b.h).toBeLessThanOrEqual(COURT.height)
      expect(b.cx).toBeCloseTo(b.x + b.w / 2)
      expect(b.cy).toBeCloseTo(b.y + b.h / 2)
    }
  })
})

describe('resolveActiveSection', () => {
  it('resolves a known section path', () => {
    expect(resolveActiveSection('/about')).toBe(SECTIONS[0])
    expect(resolveActiveSection('/contact')).toBe(SECTIONS[3])
  })
  it('returns null for the root and unknown paths', () => {
    expect(resolveActiveSection('/')).toBeNull()
    expect(resolveActiveSection('/nonsense')).toBeNull()
    expect(resolveActiveSection('')).toBeNull()
  })
  it('tolerates trailing slashes', () => {
    expect(resolveActiveSection('/about/')).toBe(SECTIONS[0])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd website && npm run test -- sections`
Expected: FAIL (`sections.js` does not exist / exports undefined).

- [ ] **Step 3: Implement `sections.js`**

Create `website/src/data/sections.js`:
```js
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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd website && npm run test -- sections`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add website/src/data/sections.js website/src/data/sections.test.js
git commit -m "Add sections data, court geometry, and route resolver"
```

---

## Task 3: `usePrefersReducedMotion` hook (TDD)

**Files:**
- Create: `website/src/hooks/usePrefersReducedMotion.js`
- Create: `website/src/hooks/usePrefersReducedMotion.test.jsx`

**Interfaces:**
- Produces: `usePrefersReducedMotion()` → boolean, updates on media-query change. Consumed by CourtStage and Court.

- [ ] **Step 1: Write the failing test**

Create `website/src/hooks/usePrefersReducedMotion.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns true when the user prefers reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false otherwise', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('subscribes and unsubscribes to media-query changes', () => {
    const add = vi.fn()
    const remove = vi.fn()
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: add,
      removeEventListener: remove,
    }))
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    expect(add).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd website && npm run test -- usePrefersReducedMotion`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the hook**

Create `website/src/hooks/usePrefersReducedMotion.js`:
```js
import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(QUERY).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd website && npm run test -- usePrefersReducedMotion`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add website/src/hooks/usePrefersReducedMotion.js website/src/hooks/usePrefersReducedMotion.test.jsx
git commit -m "Add usePrefersReducedMotion hook"
```

---

## Task 4: GitHub Pages SPA routing fallback

**Files:**
- Create: `website/public/404.html`
- Modify: `website/index.html`

**Interfaces:**
- Produces: direct-load/refresh of `/about` etc. works on GitHub Pages. `pathSegmentsToKeep = 0` because this is a user site served at the domain root.

- [ ] **Step 1: Create `public/404.html`**

Create `website/public/404.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smarth Kaul</title>
    <script type="text/javascript">
      // Single-Page Apps for GitHub Pages — MIT licensed (rafgraph).
      // Redirects a deep path into index.html so React Router can handle it.
      var pathSegmentsToKeep = 0;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
```

- [ ] **Step 2: Add the restore snippet to `index.html`**

In `website/index.html`, add this `<script>` inside `<head>`, immediately BEFORE the closing `</head>` (it must run before the app script):
```html
    <script type="text/javascript">
      // Single-Page Apps for GitHub Pages — restores the path 404.html encoded.
      (function (l) {
        if (l.search[1] === '/') {
          var decoded = l.search.slice(1).split('&').map(function (s) {
            return s.replace(/~and~/g, '&');
          }).join('?');
          window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
        }
      })(window.location);
    </script>
```

- [ ] **Step 3: Build and confirm 404.html ships**

Run: `cd website && npm run build`
Expected: build succeeds and `website/dist/404.html` exists (Vite copies `public/` to `dist/`). Verify:
```bash
test -f website/dist/404.html && echo "404.html present ✓"
```

- [ ] **Step 4: Commit**

```bash
git add website/public/404.html website/index.html
git commit -m "Add GitHub Pages SPA routing fallback"
```

---

## Task 5: Routing + minimal CourtStage (sections render per URL)

**Files:**
- Create: `website/src/pages/CourtStage.jsx`
- Modify: `website/src/App.jsx`

**Interfaces:**
- Consumes: `SECTIONS`, `resolveActiveSection` (Task 2); the existing reskinned section components.
- Produces: `CourtStage` renders the section matching the URL (no court visuals yet — those come in Task 6). This task delivers a working routed site: `/about` shows About, `/` shows a placeholder hub. `App.jsx` routes are generated from `SECTIONS`.

- [ ] **Step 1: Create a minimal `CourtStage.jsx`**

Create `website/src/pages/CourtStage.jsx`:
```jsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { SECTIONS, resolveActiveSection } from "../data/sections";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";

const SECTION_COMPONENTS = {
  about: About,
  experience: Experience,
  projects: Projects,
  contact: Contact,
};

const CourtStage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = resolveActiveSection(location.pathname);
  const goTo = (id) => navigate(id ? `/${id}` : "/");

  const ActiveSection = active ? SECTION_COMPONENTS[active.id] : null;

  return (
    <div className="relative min-h-screen court-turf overflow-hidden">
      {!active && (
        <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 py-24">
          <h1
            className="font-display font-extrabold text-cream leading-none tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
          >
            Smarth Kaul
          </h1>
          <p className="font-mono text-cream/70 text-xs uppercase tracking-widest mb-8">
            Pick a section
          </p>
          <ul className="flex flex-wrap gap-3 list-none p-0 m-0">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(s.id)}
                  className="font-mono text-xs uppercase tracking-widest bg-cream text-charcoal px-4 py-2 rounded-full hover:bg-ball transition-colors"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ActiveSection && (
        <div className="py-24">
          <ActiveSection />
          <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 mt-6">
            <Link
              to="/"
              className="font-mono text-xs uppercase tracking-widest text-cream hover:text-ball transition-colors"
            >
              &larr; Back to court
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtStage;
```

- [ ] **Step 2: Rewrite `App.jsx` routing**

Replace `website/src/App.jsx` entirely with:
```jsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout";
import CourtStage from "./pages/CourtStage";
import Pagenotfound from "./pages/Pagenotfound";
import { SECTIONS } from "./data/sections";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CourtStage />} />
          {SECTIONS.map((s) => (
            <Route key={s.id} path={s.id} element={<CourtStage />} />
          ))}
          <Route path="*" element={<Pagenotfound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
```

- [ ] **Step 3: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build. (`Home.jsx` and `Hero.jsx` are still present but no longer routed — they are deleted in Task 9. Do not delete them yet; nothing imports `Home` after this task, which is fine.)

- [ ] **Step 4: Manual check**

Run `npm run dev`. Visit `/` (see the placeholder hub with four buttons), click each button (URL changes to `/about` etc. and the matching section card renders), use the browser Back button (returns to `/`), and hard-refresh on `/projects` (dev server serves the app; the section renders).
Expected: routing works; each section renders as its cream card on turf.

- [ ] **Step 5: Commit**

```bash
git add website/src/pages/CourtStage.jsx website/src/App.jsx
git commit -m "Route sections through a minimal CourtStage shell"
```

---

## Task 6: The SVG court + zone buttons (hub state)

**Files:**
- Create: `website/src/components/court/Court.jsx`
- Modify: `website/src/index.css` (add `.zone-pulse` + reduced-motion coverage)
- Modify: `website/src/pages/CourtStage.jsx` (render `Court` in the hub)

**Interfaces:**
- Consumes: `SECTIONS`, `COURT`, `BOXES` (Task 2).
- Produces: `Court` — props `{ active, onNavigate, docked }`. Renders an aspect-ratio court container: an `aria-hidden` `<svg>` of the court lines + four absolutely-positioned `<button>` zones (one per section). `active` highlights the current zone; `onNavigate(id)` fires on click; `docked` is styling-only here (used in Task 8). This task uses only the non-docked (hub) layout.

- [ ] **Step 1: Add `.zone-pulse` to `src/index.css`**

In `website/src/index.css`, add after the `.animate-ticker` block:
```css
/* Court zone breathing pulse */
@keyframes zonePulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; box-shadow: 0 0 0 4px rgba(214, 248, 76, 0.25); }
}
.zone-pulse {
  animation: zonePulse 2.4s ease-in-out infinite;
}
```
And add `.zone-pulse` to the existing `@media (prefers-reduced-motion: reduce)` block:
```css
  .zone-pulse { animation: none; }
```

- [ ] **Step 2: Create `Court.jsx`**

Create `website/src/components/court/Court.jsx`:
```jsx
import { SECTIONS, COURT, BOXES } from "../../data/sections";

const pct = (value, total) => `${(value / total) * 100}%`;

const Court = ({ active, onNavigate, docked = false }) => {
  return (
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: docked ? 220 : 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
    >
      {/* Court lines (decorative) */}
      <svg
        viewBox={`0 0 ${COURT.width} ${COURT.height}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* playing surface */}
        <rect x="20" y="20" width="320" height="500" rx="6" fill="#276e3c" />
        {/* boundary + singles lines + service boxes + net */}
        <g fill="none" stroke="#ffffff" strokeWidth="3">
          <rect x="20" y="20" width="320" height="500" />
          <line x1="60" y1="20" x2="60" y2="520" />
          <line x1="300" y1="20" x2="300" y2="520" />
          <line x1="60" y1="135" x2="300" y2="135" />
          <line x1="60" y1="405" x2="300" y2="405" />
          <line x1="180" y1="135" x2="180" y2="405" />
        </g>
        {/* net */}
        <line x1="20" y1="270" x2="340" y2="270" stroke="#f4f1e9" strokeWidth="4" strokeDasharray="4 4" />
      </svg>

      {/* Zone buttons */}
      {SECTIONS.map((s) => {
        const b = BOXES[s.box];
        const isActive = active?.id === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onNavigate(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive ? "page" : undefined}
            className={`absolute flex flex-col items-center justify-center rounded-md border-2 transition-colors
              ${isActive
                ? "border-ball bg-ball/20 text-cream"
                : "border-white/40 bg-white/5 text-cream/90 hover:bg-ball/15 hover:border-ball"}
              ${docked ? "" : "zone-pulse"}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ball`}
            style={{
              left: pct(b.x, COURT.width),
              top: pct(b.y, COURT.height),
              width: pct(b.w, COURT.width),
              height: pct(b.h, COURT.height),
            }}
          >
            {!docked && (
              <>
                <span className="font-mono text-[0.55rem] sm:text-[0.65rem] uppercase tracking-widest text-ball">
                  {s.broadcast}
                </span>
                <span className="font-display font-bold text-sm sm:text-lg leading-tight">
                  {s.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Court;
```

- [ ] **Step 3: Render `Court` in the CourtStage hub**

In `website/src/pages/CourtStage.jsx`, import Court and replace the hub's `<ul>...</ul>` button list with the court. Add the import at the top:
```jsx
import Court from "../components/court/Court";
```
Replace the hub block's `<p>Pick a section</p>` + `<ul>...</ul>` with:
```jsx
          <p className="font-mono text-cream/70 text-xs uppercase tracking-widest mb-8">
            Serve to explore — pick a zone
          </p>
          <Court active={null} onNavigate={goTo} />
```
(Leave the `<h1>Smarth Kaul</h1>` above it for now; the full Hub comes in Task 9.)

- [ ] **Step 4: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green (existing tests still pass; no new tests needed for the visual court).

- [ ] **Step 5: Manual check**

Run `npm run dev` at `/`.
Expected: a green top-down court with white lines and a dashed net; four labelled zones (About / Experience / Projects / Contact) breathing gently; hovering a zone highlights it neon; clicking navigates to that section; Tab moves between zones and Enter activates; the active section's zone (when you go back) shows the neon active state.

- [ ] **Step 6: Commit**

```bash
git add website/src/components/court/Court.jsx website/src/index.css website/src/pages/CourtStage.jsx
git commit -m "Add SVG court with labelled zone navigation"
```

---

## Task 7: Section "erupt" overlay (Framer Motion)

**Files:**
- Modify: `website/src/pages/CourtStage.jsx`

**Interfaces:**
- Consumes: `framer-motion` (Task 1), `usePrefersReducedMotion` (Task 3), `BOXES` (Task 2).
- Produces: when a section is active, its card mounts inside `<AnimatePresence>` and scales/fades in from the active zone's centre; exits by fading out. Under reduced motion, it appears/disappears instantly.

- [ ] **Step 1: Rewrite `CourtStage.jsx` to animate the section overlay**

Replace `website/src/pages/CourtStage.jsx` entirely with:
```jsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BOXES, resolveActiveSection } from "../data/sections";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import Court from "../components/court/Court";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";

const SECTION_COMPONENTS = {
  about: About,
  experience: Experience,
  projects: Projects,
  contact: Contact,
};

const CourtStage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const active = resolveActiveSection(location.pathname);
  const goTo = (id) => navigate(id ? `/${id}` : "/");

  const ActiveSection = active ? SECTION_COMPONENTS[active.id] : null;
  // Transform-origin for the erupt: the active zone's centre, as % of the court.
  const origin = active
    ? `${(BOXES[active.box].cx / 360) * 100}% ${(BOXES[active.box].cy / 540) * 100}%`
    : "50% 50%";

  return (
    <div className="relative min-h-screen court-turf overflow-hidden">
      {!active && (
        <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 py-24">
          <h1
            className="font-display font-extrabold text-cream leading-none tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
          >
            Smarth Kaul
          </h1>
          <p className="font-mono text-cream/70 text-xs uppercase tracking-widest mb-8">
            Serve to explore — pick a zone
          </p>
          <Court active={null} onNavigate={goTo} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {ActiveSection && (
          <motion.div
            key={active.id}
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: origin }}
            className="py-24"
          >
            <ActiveSection />
            <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 mt-6">
              <Link
                to="/"
                className="font-mono text-xs uppercase tracking-widest text-cream hover:text-ball transition-colors"
              >
                &larr; Back to court
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourtStage;
```

- [ ] **Step 2: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green.

- [ ] **Step 3: Manual check (including reduced motion)**

Run `npm run dev`. Click a zone — the section card scales up from roughly that zone's position and fades in; navigating back fades it out. Then enable OS "Reduce motion" and repeat: the card should appear/disappear instantly with no scale.
Expected: eruption animation on; instant swap under reduced motion.

- [ ] **Step 4: Commit**

```bash
git add website/src/pages/CourtStage.jsx
git commit -m "Animate section overlay erupting from its court zone"
```

---

## Task 8: Court docks to a corner HUD

**Files:**
- Create: `website/src/components/court/Hud.jsx`
- Modify: `website/src/pages/CourtStage.jsx`

**Interfaces:**
- Consumes: `Court` (Task 6), `framer-motion`, `usePrefersReducedMotion`.
- Produces: `Hud` — props `{ active, onNavigate }`. A fixed top-right panel containing the mini (docked) `Court` plus a score-bug label showing the active section, rendered whenever a section is active. Its zones remain clickable to navigate section→section. Under reduced motion it simply appears (no slide).

- [ ] **Step 1: Create `Hud.jsx`**

Create `website/src/components/court/Hud.jsx`:
```jsx
import { motion } from "framer-motion";
import Court from "./Court";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const Hud = ({ active, onNavigate }) => {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.aside
      initial={reduced ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
      className="fixed top-20 right-4 z-40 w-44 sm:w-52 bg-wimbledon/90 backdrop-blur-md rounded-xl border border-wimbledon-dark p-3 shadow-xl"
      aria-label="Court navigation"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-ball text-[0.6rem] uppercase tracking-widest">On court</span>
        <span className="font-display font-bold text-cream text-sm">{active.label}</span>
      </div>
      <Court active={active} onNavigate={onNavigate} docked />
    </motion.aside>
  );
};

export default Hud;
```

- [ ] **Step 2: Render `Hud` from CourtStage when a section is active**

In `website/src/pages/CourtStage.jsx`, import Hud:
```jsx
import Hud from "../components/court/Hud";
```
Then, immediately after the closing `</AnimatePresence>` and before the outer `</div>`, add:
```jsx
      {active && <Hud active={active} onNavigate={goTo} />}
```

- [ ] **Step 3: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green.

- [ ] **Step 4: Manual check**

Run `npm run dev`. Open a section: a compact court HUD appears top-right showing the current section; clicking a different zone in the mini-court navigates to that section (the card swaps, HUD updates); `← Back to court` returns to the full hub (HUD disappears). Narrow to mobile width and confirm the HUD doesn't overlap the card unreadably (if it does, note it — Task 10 tunes mobile).
Expected: section→section navigation works from the docked mini-court.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/court/Hud.jsx website/src/pages/CourtStage.jsx
git commit -m "Dock the court into a corner HUD when a section is open"
```

---

## Task 9: Hub intro, retire Hero/Home, simplify chrome

**Files:**
- Create: `website/src/components/court/Hub.jsx`
- Create: `website/src/components/court/SectionMenu.jsx`
- Modify: `website/src/pages/CourtStage.jsx`
- Modify: `website/src/pages/Layout.jsx`
- Modify: `website/src/components/Navbar.jsx`
- Delete: `website/src/components/Hero.jsx`, `website/src/pages/Home.jsx`

**Interfaces:**
- Produces: `Hub` (landing overlay: name + typewriter tagline + social links, shown with the court when no section is active — absorbs the retired Hero's content and its typewriter logic verbatim). `SectionMenu` (a text list of sections as `<Link>`s — the accessible/no-court fallback), used in the Layout top bar.

- [ ] **Step 1: Create `Hub.jsx` (moving the Hero typewriter here)**

Create `website/src/components/court/Hub.jsx`:
```jsx
import { useState, useEffect } from "react";
import Ticker from "../broadcast/Ticker";

const PHRASES = ["statistics student.", "machine learning engineer.", "data scientist."];
const TYPE_SPEED = 65;
const DELETE_SPEED = 35;
const PAUSE_MS = 1800;
const TECH = [
  "Python", "R", "SQL", "TensorFlow", "Scikit-learn",
  "XGBoost", "Time Series", "Machine Learning", "Data Viz", "Statistics",
];

const Hub = () => {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    let timeout;
    if (!deleting && display === phrase) {
      timeout = setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && display === "") {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    } else if (!deleting) {
      timeout = setTimeout(() => setDisplay(phrase.slice(0, display.length + 1)), TYPE_SPEED);
    } else {
      timeout = setTimeout(() => setDisplay(display.slice(0, -1)), DELETE_SPEED);
    }
    return () => clearTimeout(timeout);
  }, [display, deleting, phraseIdx]);

  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-ball animate-pulse" />
        <span className="font-mono text-cream text-xs uppercase tracking-widest">Live &middot; Toronto, ON</span>
      </div>
      <h1
        className="font-display font-extrabold text-cream leading-none tracking-tight mb-6"
        style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
      >
        Smarth Kaul
      </h1>
      <div className="flex items-center gap-1" style={{ minHeight: "2rem" }}>
        <span className="text-cream/90 text-lg sm:text-xl font-light">{display}</span>
        <span className="cursor-blink text-ball text-xl font-light select-none">|</span>
      </div>
      <Ticker items={TECH} className="rounded-lg mt-8" />
    </div>
  );
};

export default Hub;
```

- [ ] **Step 2: Create `SectionMenu.jsx`**

Create `website/src/components/court/SectionMenu.jsx`:
```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { SECTIONS } from "../../data/sections";

const SectionMenu = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="font-mono text-cream/80 hover:text-ball text-xs uppercase tracking-widest"
      >
        Menu
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 bg-wimbledon border border-wimbledon-dark rounded-lg py-2 list-none m-0 min-w-40 z-50">
          <li>
            <Link to="/" onClick={() => setOpen(false)} className="block px-4 py-2 text-cream hover:text-ball text-sm">
              Court
            </Link>
          </li>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                to={`/${s.id}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-cream hover:text-ball text-sm"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SectionMenu;
```

- [ ] **Step 3: Use `Hub` in CourtStage**

In `website/src/pages/CourtStage.jsx`: import `Hub` (`import Hub from "../components/court/Hub";`), and in the `!active` hub block replace the `<h1>Smarth Kaul</h1>` + the `<p>Serve to explore…</p>` with:
```jsx
          <Hub />
          <p className="font-mono text-cream/70 text-xs uppercase tracking-widest mb-8">
            Serve to explore — pick a zone
          </p>
          <Court active={null} onNavigate={goTo} />
```

- [ ] **Step 4: Simplify `Navbar.jsx` to SK + SectionMenu**

Replace `website/src/components/Navbar.jsx` entirely with:
```jsx
import { Link } from "react-router-dom";
import SectionMenu from "./court/SectionMenu";

const Navbar = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-wimbledon/80 backdrop-blur-md border-b border-wimbledon-dark">
    <nav className="flex items-center justify-between h-16 px-6 sm:px-12 lg:px-24">
      <Link
        to="/"
        className="font-display font-bold text-cream text-lg tracking-tight hover:text-ball transition-colors"
      >
        SK
      </Link>
      <SectionMenu />
    </nav>
  </header>
);

export default Navbar;
```

- [ ] **Step 5: Confirm `Layout.jsx` still fits**

`website/src/pages/Layout.jsx` already renders `<Navbar/>`, `<main className="court-turf min-h-screen"><Outlet/></main>`, `<Footer/>`. Leave it as-is — the new Navbar and CourtStage slot straight in. (No edit needed unless lint flags an unused import.)

- [ ] **Step 6: Delete the retired files**

```bash
git rm website/src/components/Hero.jsx website/src/pages/Home.jsx
```
Confirm nothing still imports them:
```bash
grep -rn "components/Hero\|pages/Home" website/src && echo "STILL REFERENCED — fix before continuing" || echo "no references ✓"
```
Expected: `no references ✓`.

- [ ] **Step 7: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green (no unused-import or missing-module errors).

- [ ] **Step 8: Manual check**

Run `npm run dev`. The hub shows the name + typewriter tagline over the court; the top bar shows `SK` (→ court) and a `Menu` that lists Court + the four sections as links; deep-linking via the menu works.
Expected: Hero content lives in the hub; menu fallback works; no dead Hero/Home code.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add hub intro and section menu; retire Hero and Home"
```

---

## Task 10: Accessibility + reduced-motion pass

**Files:**
- Modify: `website/src/pages/CourtStage.jsx`

**Interfaces:**
- Produces: on navigation into a section, focus moves to that section's heading and a visually-hidden live region announces the section; verified reduced-motion coverage across court/erupt/dock/zone-pulse.

- [ ] **Step 1: Add focus management + a live region to CourtStage**

In `website/src/pages/CourtStage.jsx`:

(a) Add imports at the top:
```jsx
import { useEffect, useRef } from "react";
```
(b) Inside the component, after computing `active`, add:
```jsx
  const liveRef = useRef(null);
  useEffect(() => {
    if (active && liveRef.current) {
      liveRef.current.textContent = `${active.label} section`;
    }
    // Move focus to the section heading on section change.
    if (active) {
      const heading = document.querySelector("main [id] h2, main [id] h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }, [active]);
```
(c) Add the live region as the first child inside the outer `<div className="relative min-h-screen court-turf overflow-hidden">`:
```jsx
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />
```

- [ ] **Step 2: Verify reduced-motion coverage in `index.css`**

Confirm the `@media (prefers-reduced-motion: reduce)` block in `website/src/index.css` disables: `.animate-ticker`, `.cursor-blink`, `.reveal`, `.animate-pulse`, `.animate-bounce`, and `.zone-pulse`. (framer-motion animations are already gated in JS by `usePrefersReducedMotion`.) If `.zone-pulse` is missing from the block, add `.zone-pulse { animation: none; }`.

- [ ] **Step 3: Lint + build + test**

Run: `cd website && npm run lint && npm run build && npm run test`
Expected: all green.

- [ ] **Step 4: Manual check (keyboard + reduced motion)**

Run `npm run dev`.
  - **Keyboard:** Tab reaches the four zones (visible focus ring); Enter navigates; after landing, focus is on the section heading; Tab continues into the card; the `Menu` opens with keyboard and its links work.
  - **Reduced motion (OS setting on):** no erupt scale, no HUD slide, no zone pulse, no ticker scroll, no caret blink — sections swap instantly.
Expected: fully keyboard-operable; motion fully suppressed under the OS setting.

- [ ] **Step 5: Commit**

```bash
git add website/src/pages/CourtStage.jsx website/src/index.css
git commit -m "Add focus management, live-region announce, and reduced-motion coverage"
```

---

## Task 11: Rewrite AGENTS.md design guide for the shipped system

**Files:**
- Modify: `AGENTS.md` (repo root)

**Interfaces:**
- Produces: `AGENTS.md` describes the CURRENT shipped design system (Phase 0 palette + Phase 1 court navigation) and removes the temporary "redesign in progress" banner's now-stale framing. This is the deferred rewrite promised in the spec (§11) and the banner.

- [ ] **Step 1: Update the banner and design sections**

In `AGENTS.md`:
- Replace the `> **⚠️ Redesign in progress …**` banner with a short note that the tennis-broadcast redesign has shipped Phases 0–1 (palette + court navigation) and that Phases 2–4 (ball physics, player mascot, cold-open) are still planned per `plan/2026-07-08-tennis-court-redesign-design.md`.
- Update the **Design consistency** and palette/typography sections to describe the shipped system: `grass`/`wimbledon`/`cream`/`charcoal`/`ball` tokens (replace the old `slate-950`/`violet` guidance and the "accent is violet" rule); cream `StatCard`s for content on the `court-turf` background; Syne/Inter/mono roles unchanged.
- Update **Rendering architecture** / **The sections** to describe the court-navigation model: `CourtStage` state machine over per-section URLs, `SECTIONS`/`BOXES` in `src/data/sections.js`, the SVG `Court` with service-box zones, `Hud`, `Hub`, `SectionMenu`, `usePrefersReducedMotion`. Note that navigation is ball-*less* today (ball/player are Phase 2/3).
- Update **Conventions**/**Commands** to mention `npm run test` (Vitest) now exists for logic units, while visual work is still verified with `npm run dev`.

Keep the file's structure and tone; change only what is now inaccurate. Do not describe unbuilt Phase 2+ features as present.

- [ ] **Step 2: Sanity-check references**

```bash
grep -n "violet\|slate-950" AGENTS.md || echo "no stale palette refs ✓"
```
Expected: no stale references remain in the design guidance (a historical mention in a changelog-style line is acceptable, but the *guidance* should not tell agents to use violet).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "Rewrite AGENTS.md design guide for the shipped broadcast + court system"
```

---

## Task 12: Full verification + open PR

**Files:** none (verification + release).

- [ ] **Step 1: Full check**

Run: `cd website && npm run lint && npm run test && npm run build`
Expected: lint clean; all Vitest tests pass; build succeeds and emits `dist/404.html`.

- [ ] **Step 2: Preview walkthrough**

Run: `cd website && npm run preview`. Verify:
  - `/` shows the hub (name + typewriter) with the interactive court; four zones navigate.
  - Each section erupts in, court docks to the HUD, HUD navigates section→section, `← Back to court` returns.
  - Direct-load/refresh of `/projects` works (the `404.html` fallback path — best tested after deploy, but the built `dist/404.html` must exist).
  - Browser Back/Forward moves through sections; the `Menu` fallback lists all sections.
  - Reduced motion (OS setting) suppresses all animation; keyboard reaches and activates every zone and menu item.
  - No `slate-`/`violet`/`indigo` classes: `grep -rnE "slate-|violet|indigo" website/src || echo NONE`.

- [ ] **Step 3: Push + open PR**

```bash
git push -u origin feat/phase1-court-nav
gh pr create --title "Phase 1: court navigation" --body "Implements Phase 1 of the tennis-broadcast redesign (plan/2026-07-08-tennis-redesign-phase1-court-nav-plan.md).

- Persistent top-down SVG court; four service-box zones navigate to sections
- CourtStage state machine over per-section URLs (React Router); GitHub Pages 404.html SPA fallback
- Section cards erupt from their zone (framer-motion); court docks to a corner HUD
- Hub landing (name + typewriter, absorbs the retired Hero); accessible SectionMenu fallback
- usePrefersReducedMotion gate + focus management + live-region announce
- Vitest harness with tests for sections data, route resolver, and the reduced-motion hook
- AGENTS.md design guide rewritten for the shipped system

No ball physics or player yet (Phases 2/3)."
```

- [ ] **Step 4: Review + merge**

Review the PR, confirm CI is green, squash-merge, delete the branch, and sync local `main`:
```bash
gh pr merge --squash --delete-branch
git checkout main && git pull origin main
```

---

## Self-Review (against the spec)

**1. Spec coverage (spec §4 court & nav model, §8 performance/a11y):**
- §4.1 zone map (four service boxes) → `SECTIONS`/`BOXES` (Task 2) + `Court` (Task 6). ✅
- §4.2 serve interaction — the *ball flight* is Phase 2; Phase 1 delivers the click→route→erupt without the ball, as scoped. Zones navigate; the section erupts from the zone centre (Task 7). ✅ (ball deferred by design)
- §4.3 court's two states (hub full ↔ docked mini) → Task 6 (`docked` prop) + Task 8 (`Hud`). ✅
- §4.4 fallbacks/discovery — accessible zone buttons + `SectionMenu` fallback (Task 9); focus/announce (Task 10). Auto-demo serve & coach-mark are Phase 2/3 (need the ball/player). ✅ (scoped)
- §8.2 reduced-motion gate + a11y contract → `usePrefersReducedMotion` (Task 3), CSS coverage (Tasks 6/10), focus + live region (Task 10). ✅
- §8.3 GitHub Pages SPA routing (`404.html` + `base "/"`) → Task 4; per-section URLs → Task 5. ✅
- Roadmap Phase 1 line ("static SVG court, zone buttons, section cards mount/unmount via Framer Motion, court shrinks to HUD, URL sync, reduced-motion gate") → Tasks 5–10. ✅

**2. Placeholder scan:** No TBD/TODO/"handle edge cases". Every code step contains complete file contents or an exact insertion with surrounding anchor text. ✅

**3. Type/name consistency:** `SECTIONS` item shape `{id,label,broadcast,box}` (Task 2) is used identically in Court/CourtStage/Hud/SectionMenu. `BOXES[box]` fields `{x,y,w,h,cx,cy}` used in Court (positions) and CourtStage (origin). `resolveActiveSection` (Task 2) used in Task 5/7. `usePrefersReducedMotion` (Task 3) used in Tasks 7/8. `Court` props `{active,onNavigate,docked}` consistent across Tasks 6/8. `SECTION_COMPONENTS` keys match `SECTIONS` ids. ✅

**Deferred to later phases (recorded):** ball physics + serve flight + Hawk-Eye trail (Phase 2); player mascot + idle/auto-demo serve + coach-mark (Phase 3); cinematic cold-open + matchup card (Phase 4); the skills radar chart and richer per-section broadcast treatments (polish). The `Ticker` from Phase 0 is placed in the `Hub` (Task 9), so the skills strip stays visible on the landing under the name/tagline.
```
