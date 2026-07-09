# AGENTS.md

Guidance for AI agents (and humans) working in this repository. Read this before making changes.

> **Tennis-broadcast redesign — Phases 0–2 shipped.** The site has been reskinned to a Wimbledon-broadcast palette, rebuilt around court navigation, and given a GSAP-driven aim-and-launch serve, per [`plan/2026-07-08-tennis-court-redesign-design.md`](plan/2026-07-08-tennis-court-redesign-design.md). The design sections below describe that shipped system. On the hub, you drag the ball back to aim (mirrored, slingshot-style) and set power, then release to launch it along a bézier arc (Hawk-Eye dotted trail, impact ripple); where it lands decides the outcome — landing in a service box navigates into that section, landing in-bounds but outside every box draws an `OUT` call and the ball returns, and a shot that clears the court entirely opens a serve-tutorial modal easter egg. Phases 3–4 (an SVG player mascot the ball would serve from, and a cinematic cold-open intro) are designed but **not built yet** — there is still no player, just a ball originating from a fixed baseline point. Don't describe Phase 3+ features as present, and don't "correct" broadcast-themed work back toward the old violet/slate-950 system.

## What this is

A single-page personal portfolio for **Smarth Kaul**, deployed at `smarthkaul.github.io`. It's a React SPA built with Vite and styled with Tailwind CSS. There is no backend, database, or CMS — all content is hard-coded in the components as JavaScript data arrays.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 (functional components + hooks) |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 (utility-first, no CSS modules) |
| Routing | React Router DOM 7 |
| Animation | `framer-motion` (section erupt/dock) + `gsap` / `@gsap/react` (ball serve trajectory) |
| Linting | ESLint 9 (flat config) |
| Hosting | GitHub Pages via GitHub Actions |
| Fonts | Syne (display) + Inter (body), loaded from Google Fonts |

## Repository layout

> **Important:** The app lives in the `website/` subdirectory, **not** the repo root. All npm commands must run from `website/`.

```
.
├── .github/workflows/deploy.yml   # CI/CD → GitHub Pages
├── AGENTS.md                      # this file
├── plan/2026-07-08-tennis-court-redesign-design.md   # redesign spec (Phases 3-4 not built yet)
└── website/
    ├── index.html                 # Vite entry HTML; <title> + meta description
    ├── vite.config.js             # react plugin + Vitest config (jsdom env, src/test/setup.js)
    ├── tailwind.config.js         # broadcast palette (grass/wimbledon/cream/charcoal/ball) + fonts
    ├── postcss.config.js          # tailwind + autoprefixer
    ├── eslint.config.js           # flat ESLint config
    ├── package.json
    ├── public/
    │   ├── favicon.svg            # SK monogram
    │   └── 404.html               # GitHub Pages SPA-routing redirect shim
    └── src/
        ├── main.jsx               # React root, StrictMode
        ├── App.jsx                # Router: "/" + one route per section id, all → CourtStage
        ├── index.css              # font import, Tailwind directives, .court-turf, keyframes
        ├── pages/
        │   ├── Layout.jsx         # Navbar + <Outlet/> + Footer shell
        │   ├── CourtStage.jsx     # court-navigation state machine (see Rendering architecture)
        │   └── Pagenotfound.jsx   # 404 route
        ├── components/            # one file per page section, plus two chrome subfolders
        │   ├── broadcast/         # StatCard, Badge, Ticker — shared broadcast UI kit
        │   └── court/             # Court (SVG), Ball (GSAP aim + flight), Hud, Hub, SectionMenu, OutCall, ServeTutorial — navigation chrome
        ├── data/
        │   └── sections.js        # SECTIONS / COURT / BOXES / COURT_BOUNDS / resolveActiveSection / flight math (SERVE_ORIGIN, serveControl, servePathD, bezierPoint) / aim & landing (landingFromPull, pointInRect, classifyLanding)
        ├── hooks/
        │   ├── useReveal.js               # IntersectionObserver scroll-reveal hook
        │   └── usePrefersReducedMotion.js # reduced-motion gate for all animation
        └── test/                  # Vitest setup + smoke test
```

## Rendering architecture

```
main.jsx
└── App.jsx  (BrowserRouter)
    └── "/" → Layout.jsx
              ├── Navbar        (fixed; "SK" home link + SectionMenu dropdown)
              ├── <Outlet/>
              │   ├── "/", "/about", "/experience", "/projects", "/contact" → CourtStage
              │   └── "*"      → Pagenotfound.jsx
              └── Footer
```

There is no more scrolling stack of sections. `CourtStage.jsx` is a state machine over the URL plus the `aim`/`shot`/`outCall`/`tutorial` state that drives the ball: it resolves the active section from `location.pathname` via `resolveActiveSection()` (`src/data/sections.js`), then renders one of two states:

- **No active section (`/`):** the `Hub` (name, animated typewriter tagline, social links, skills `Ticker`) above a full-size `Court` — an SVG tennis court whose four service-box zones (positions defined by `SECTIONS`/`BOXES` in `src/data/sections.js`) are landing-zone **targets, not click-to-navigate buttons**: `Court` is rendered with its zone `<button>`s `disabled` on the hub, since navigation there happens by aiming and launching the ball, not by clicking a zone.
- **Active section (`/about`, `/experience`, `/projects`, `/contact`):** the matching component mounts inside a `framer-motion` overlay that scales in ("erupts") from the landed zone's centre — `transformOrigin` is computed from that zone's `BOXES` entry — while the `Court` shrinks and docks into a `Hud` fixed in a corner, so another zone is reachable without returning to `/`.

Navigating from the hub is an aim-and-launch drag, driven by a pointer state machine in `CourtStage.jsx` (`aim` / `shot` / `outCall` / `tutorial` state, plus `onPointerDown` / `onPointerMove` / `onPointerUp` and a `toCourtCoords()` helper that maps pointer pixels to the court's SVG coordinate space). Pointer-down on the court frame starts an `aim`; pointer-move computes a "pull" vector (pointer position minus the fixed baseline point `SERVE_ORIGIN`) and a `power` (pull distance, clamped to `[0,1]`), which the always-mounted `Ball` (`components/court/Ball.jsx`) renders live as an aim line and a power gauge — mirrored, slingshot-style (pulling down-and-back aims the launch up-court), with **no landing preview**. Pointer-up on a real drag (a bare tap is ignored) computes the landing point via `landingFromPull(SERVE_ORIGIN, pull, opts)` in `src/data/sections.js` and sets `shot`, which `Ball` flies to along a GSAP quadratic-bézier timeline (`serveControl`/`servePathD`/`bezierPoint`, also in `sections.js`) from `SERVE_ORIGIN` to that landing point, drawing a dotted Hawk-Eye trail and an impact ripple, then calling `onLand`. `onLand` (in `CourtStage`) classifies the landing point with `classifyLanding(shot)`: a point inside a service box (`pointInRect` against `BOXES[s.box]`) is a **hit** and calls `navigate("/" + sectionId)`, at which point the section erupts as before; a point inside the court's outer boundary (`COURT_BOUNDS`) but outside every box is an **out** — `OutCall` flashes an "OUT" banner for ~900ms and the ball simply returns, no navigation; a point beyond `COURT_BOUNDS` entirely is **beyond** and opens the `ServeTutorial` modal, an easter egg with a video placeholder (a real serve clip is a later addition) that closes via its button, Escape, or the backdrop. Each section is still a real, bookmarkable route, not an anchor scroll — the serve is a visual prelude to the same navigation, not a replacement for it. Because zones aren't clickable on the hub, the `SectionMenu` dropdown in the Navbar (plain `Link`s, always active) is the accessible/keyboard/screen-reader/mobile fallback for reaching a section without dragging. `usePrefersReducedMotion()` doesn't disable aiming, but it makes the flight instant — `Ball` skips the bézier tween, jumps straight to the landing point, and calls `onLand` immediately — and it gates the erupt/dock transitions down to instant opacity swaps. The docked `Court` inside the `Hud` is not `disabled` and still navigates on click, instantly, with no aim mechanic — the drag-to-launch flow only exists over the full-size main court. GitHub Pages doesn't natively support this kind of deep link, so `public/404.html` plus the redirect shim in `index.html` round-trip a deep link through the SPA (the [rafgraph technique](https://github.com/rafgraph/spa-github-pages)).

**There is still no player mascot.** That's Phase 3 of the redesign (see the plan doc) — the ball serves from a fixed baseline point (`SERVE_ORIGIN`), not from a player or racket. Don't describe a player as present.

### The sections

- **Hub** (`components/court/Hub.jsx`) — landing content shown at `/`: name + animated typewriter tagline (self-contained `setTimeout`/`useEffect` typing logic), social links, and a skills `Ticker`.
- **Court** (`components/court/Court.jsx`) — the SVG tennis court: decorative lines/net plus four zone `<button>`s positioned from `BOXES`. The same component renders full-size on `/` (zone buttons `disabled` — targets for the aim-and-launch drag, not clickable) and docked (compact, label-less, via the `docked` prop, still clickable) inside the `Hud`.
- **Ball** (`components/court/Ball.jsx`) — the GSAP-driven aim + flight: idle-bobs at `SERVE_ORIGIN` when neither aiming nor mid-flight; while `CourtStage` has an `aim` (pull vector + power), renders a live aim line and power gauge with no landing preview; once `CourtStage` sets a `shot` (a landing point), flies a bézier arc (ball + dotted trail + impact ripple) to it and calls `onLand`. Only mounted over the full-size main court, not the docked `Hud` court.
- **OutCall** (`components/court/OutCall.jsx`) — a brief "OUT" banner overlaid on the court when a launch lands in-bounds but outside every service box; `CourtStage` shows it for ~900ms, then the ball is back at the baseline with no navigation.
- **ServeTutorial** (`components/court/ServeTutorial.jsx`) — a modal easter egg opened when a launch clears the court entirely; `role="dialog"`, closable via its button, Escape, or the backdrop, currently holding a video placeholder (a real serve clip is a later addition).
- **Hud** (`components/court/Hud.jsx`) — fixed corner panel shown once a section is active; wraps the docked `Court` (instant click-to-navigate, no aim mechanic) and the active section's label.
- **SectionMenu** (`components/court/SectionMenu.jsx`) — accessible dropdown in the Navbar; lists `/` plus every entry in `SECTIONS` as plain links. This is the keyboard/screen-reader/mobile fallback for navigation, since the hub's court zones aren't clickable — only draggable.
- **About** — `StatCard` ("The Player"): bio prose, a stat `<dl>`, and skill `Badge`s.
- **Experience** — `StatCard` ("Career Record"): accordion list of jobs; data in the `EXPERIENCE` array; each row expands to show summary + tech `Badge`s.
- **Projects** — one `StatCard` per project ("Highlight Reel"); data in the `PROJECTS` array; optional GitHub link.
- **Contact** — `StatCard` ("Match Point"): blurb + `mailto:` CTA.
- **Navbar / Footer** — chrome rendered by `Layout`, shared across routes.

## Conventions — follow these when editing

**Components**
- Functional components, arrow-function style, `export default` at the bottom.
- One section per file. Keep a component's content, sub-components (e.g. `MatchRow`, `ProjectCard`), and data in the same file.
- Content is **data-driven**: declare an `UPPER_CASE` const array/object at the top of the file (`EXPERIENCE`, `PROJECTS`, `SECTIONS`, `PHRASES`) and `.map()` over it. To add a job or project, edit the array — don't hand-write JSX rows.

**Styling**
- Tailwind utility classes inline. No separate CSS files per component; global custom CSS lives only in `src/index.css` (`.court-turf` background, ticker/pulse/blink keyframes, reduced-motion overrides).
- Use inline `style={{ fontSize: "clamp(...)" }}` for fluid/responsive font sizes — this is the established pattern for large display headings.
- **Palette (`website/tailwind.config.js`):** `grass` (court green — page background via `.court-turf`), `wimbledon` (purple — chrome: Navbar, Footer, Hud, `StatCard` headers, `Ticker`), `cream` (`StatCard`/content-panel background), `charcoal` (body text on cream panels), `ball` (neon yellow — accent only: highlights, active states, CTAs; never body text).
- **Typography:** `font-display` (Syne) for headings, `font-mono` for eyebrow/broadcast labels and metadata, default sans (Inter) for body text on cream panels.
- **Broadcast eyebrow pattern:** `font-mono text-ball text-xs uppercase tracking-widest`, set inside a `StatCard`'s purple header (the "broadcast" label, e.g. "The Player", "Career Record").
- **Content shell pattern:** section content lives inside a `StatCard` (cream card, purple header) rather than a bare `<section>` on a dark background. The page background comes from the outer `.court-turf` wrapper, not per-section classes; sections still wrap their `StatCard` in `<section id="..." className="px-6 sm:px-12 lg:px-24 py-16">` with an inner `max-w-3xl` container.

**Section IDs & navigation**
- Sections are **routes**, not in-page anchors: each lives at `/<id>` (`/about`, `/experience`, `/projects`, `/contact`), matched by `resolveActiveSection()` against the `SECTIONS` array. `SECTIONS` (in `src/data/sections.js`) is the single source of truth for the route table (`App.jsx`), the court zone labels (`Court.jsx`), the `Hud`, and `SectionMenu` — edit it there, don't hand-edit routes or nav links in multiple files. Each `SECTIONS` entry also needs a matching `box` rectangle in the `BOXES` map (its position/size on the court, in SVG user units).

**Scroll reveal**
- To animate a block in on scroll, use the `useReveal()` hook: `const [ref, visible] = useReveal();` then apply `ref` and `` className={`reveal ${visible ? "visible" : ""}`} ``. The `.reveal` / `.visible` CSS lives in `index.css`. Stagger multiple items with `style={{ transitionDelay: \`${idx * 80}ms\` }}`.

**External links**
- Always `target="_blank" rel="noopener noreferrer"` and an `aria-label` on icon-only links.

## Commands

Run all of these from the `website/` directory:

```bash
npm install       # install deps
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build → website/dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm run test       # Vitest, single run (logic units: sections data, route resolver, reduced-motion hook)
npm run test:watch # Vitest in watch mode
```

## Build & deploy

- **Automatic.** `.github/workflows/deploy.yml` runs on every push to `main` (and via manual `workflow_dispatch`).
- The workflow: checkout → setup Node 20 → `npm ci` → `npm run build` (in `website/`) → upload `website/dist` → deploy to GitHub Pages.
- Deploys are serialized with a `pages` concurrency group; in-progress runs are cancelled by newer pushes.
- **Do not commit `website/dist/`** — it's gitignored and built in CI.
- This is a **user site** (`smarthkaul.github.io`), served from the domain root, so Vite's `base` stays `"/"`. Do not add a repo sub-path base.

## Design consistency

The site runs on the tennis-broadcast system shipped in Phases 0–2 (palette + court navigation + ball serve, see the banner above). Keep it that way:

- **Accent color is `ball`** (neon yellow) — highlights, active/hover states, and CTAs only, never body text on `cream` panels. Chrome (Navbar, Footer, Hud, `StatCard` headers, `Ticker`) is `wimbledon` purple; content panels are `cream` with `charcoal` text; the page background is `grass`/`.court-turf`. Do not reintroduce `violet`, `indigo`, or `slate-950` — that was the pre-redesign palette.
- **Headings use `font-display`** (Syne). This applies to route-level chrome too, not just section content (see `Pagenotfound.jsx`).
- The favicon at `public/favicon.svg` (`SK` monogram) is a **pre-redesign holdover** — it still has a `slate-950` background and violet lettering and has not been rebranded to the shipped palette. Don't treat that mismatch as intentional guidance; if you touch branding assets, bring the favicon in line with `grass`/`wimbledon`/`cream`/`ball` instead.
- There is no blog. A `Blog.jsx` component previously existed as an orphaned placeholder and was removed. If you add one, follow the current conventions (broadcast palette, `StatCard`/`Badge`, `font-display` headings, `useReveal` for scroll-in) rather than reviving the old placeholder patterns.

## Guardrails for agents

- Keep changes scoped to `website/` (plus `plan/` only if you're updating the design spec itself). There is no app source outside `website/`.
- When adding content (a job, project, link), edit the relevant data array — don't restructure the component. When adding, removing, or renaming a section, edit `SECTIONS`/`BOXES` in `src/data/sections.js` — don't hand-edit routes or nav links in multiple files.
- Match the shipped Tailwind palette and typography rather than introducing new colors/fonts, and don't "correct" broadcast-themed work back toward the old violet/slate-950 system.
- Run `npm run lint`, `npm run test`, and `npm run build` from `website/` before finishing; a broken build blocks deploys.
- `npm run test` (Vitest) covers logic units — `src/data/sections.js`, the route resolver, `usePrefersReducedMotion` — plus a smoke test; it does not cover layout or interaction. Verify those visually with `npm run dev` when changing things like the typewriter, accordion, court-zone navigation, the ball serve, erupt/dock transitions, or the mobile menu.
