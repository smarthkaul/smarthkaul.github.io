# AGENTS.md

Guidance for AI agents (and humans) working in this repository. Read this before making changes.

> **Tennis-broadcast redesign — Phases 0–1 shipped.** The site has been reskinned to a Wimbledon-broadcast palette and rebuilt around court navigation, per [`plan/2026-07-08-tennis-court-redesign-design.md`](plan/2026-07-08-tennis-court-redesign-design.md). The design sections below describe that shipped system. Phases 2–4 (a GSAP-driven flying ball, an SVG player mascot, and a cinematic cold-open intro) are designed but **not built yet** — navigation today is ball-less: clicking a court zone navigates and the section card erupts, full stop. Don't describe Phase 2+ features as present, and don't "correct" broadcast-themed work back toward the old violet/slate-950 system.

## What this is

A single-page personal portfolio for **Smarth Kaul**, deployed at `smarthkaul.github.io`. It's a React SPA built with Vite and styled with Tailwind CSS. There is no backend, database, or CMS — all content is hard-coded in the components as JavaScript data arrays.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 (functional components + hooks) |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 (utility-first, no CSS modules) |
| Routing | React Router DOM 7 |
| Linting | ESLint 9 (flat config) |
| Hosting | GitHub Pages via GitHub Actions |
| Fonts | Syne (display) + Inter (body), loaded from Google Fonts |

## Repository layout

> **Important:** The app lives in the `website/` subdirectory, **not** the repo root. All npm commands must run from `website/`.

```
.
├── .github/workflows/deploy.yml   # CI/CD → GitHub Pages
├── AGENTS.md                      # this file
├── plan/2026-07-08-tennis-court-redesign-design.md   # redesign spec (Phases 2-4 not built yet)
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
        │   └── court/             # Court (SVG), Hud, Hub, SectionMenu — navigation chrome
        ├── data/
        │   └── sections.js        # SECTIONS / COURT / BOXES / resolveActiveSection
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

There is no more scrolling stack of sections. `CourtStage.jsx` is a state machine over the URL: it resolves the active section from `location.pathname` via `resolveActiveSection()` (`src/data/sections.js`), then renders one of two states:

- **No active section (`/`):** the `Hub` (name, animated typewriter tagline, social links, skills `Ticker`) above a full-size `Court` — an SVG tennis court whose four service-box zones (positions defined by `SECTIONS`/`BOXES` in `src/data/sections.js`) are clickable buttons.
- **Active section (`/about`, `/experience`, `/projects`, `/contact`):** the matching component mounts inside a `framer-motion` overlay that scales in ("erupts") from the clicked zone's centre — `transformOrigin` is computed from that zone's `BOXES` entry — while the `Court` shrinks and docks into a `Hud` fixed in a corner, so another zone is reachable without returning to `/`.

Clicking a zone just calls `navigate("/" + id)`; each section is a real, bookmarkable route, not an anchor scroll. `usePrefersReducedMotion()` gates the erupt/dock transitions down to instant opacity swaps. GitHub Pages doesn't natively support this kind of deep link, so `public/404.html` plus the redirect shim in `index.html` round-trip a deep link through the SPA (the [rafgraph technique](https://github.com/rafgraph/spa-github-pages)).

**There is no flying ball and no player mascot yet.** Those are Phase 2 and Phase 3 of the redesign (see the plan doc) — navigation today is just "click zone → section erupts."

### The sections

- **Hub** (`components/court/Hub.jsx`) — landing content shown at `/`: name + animated typewriter tagline (self-contained `setTimeout`/`useEffect` typing logic), social links, and a skills `Ticker`.
- **Court** (`components/court/Court.jsx`) — the SVG tennis court: decorative lines/net plus four zone `<button>`s positioned from `BOXES`. The same component renders full-size on `/` and docked (compact, label-less, via the `docked` prop) inside the `Hud`.
- **Hud** (`components/court/Hud.jsx`) — fixed corner panel shown once a section is active; wraps the docked `Court` and the active section's label.
- **SectionMenu** (`components/court/SectionMenu.jsx`) — accessible dropdown in the Navbar; lists `/` plus every entry in `SECTIONS` as plain links, for discovery beyond the court zones.
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

The site runs on the tennis-broadcast system shipped in Phases 0–1 (palette + court navigation, see the banner above). Keep it that way:

- **Accent color is `ball`** (neon yellow) — highlights, active/hover states, and CTAs only, never body text on `cream` panels. Chrome (Navbar, Footer, Hud, `StatCard` headers, `Ticker`) is `wimbledon` purple; content panels are `cream` with `charcoal` text; the page background is `grass`/`.court-turf`. Do not reintroduce `violet`, `indigo`, or `slate-950` — that was the pre-redesign palette.
- **Headings use `font-display`** (Syne). This applies to route-level chrome too, not just section content (see `Pagenotfound.jsx`).
- The favicon at `public/favicon.svg` (`SK` monogram) is a **pre-redesign holdover** — it still has a `slate-950` background and violet lettering and has not been rebranded to the shipped palette. Don't treat that mismatch as intentional guidance; if you touch branding assets, bring the favicon in line with `grass`/`wimbledon`/`cream`/`ball` instead.
- There is no blog. A `Blog.jsx` component previously existed as an orphaned placeholder and was removed. If you add one, follow the current conventions (broadcast palette, `StatCard`/`Badge`, `font-display` headings, `useReveal` for scroll-in) rather than reviving the old placeholder patterns.

## Guardrails for agents

- Keep changes scoped to `website/` (plus `plan/` only if you're updating the design spec itself). There is no app source outside `website/`.
- When adding content (a job, project, link), edit the relevant data array — don't restructure the component. When adding, removing, or renaming a section, edit `SECTIONS`/`BOXES` in `src/data/sections.js` — don't hand-edit routes or nav links in multiple files.
- Match the shipped Tailwind palette and typography rather than introducing new colors/fonts, and don't "correct" broadcast-themed work back toward the old violet/slate-950 system.
- Run `npm run lint`, `npm run test`, and `npm run build` from `website/` before finishing; a broken build blocks deploys.
- `npm run test` (Vitest) covers logic units — `src/data/sections.js`, the route resolver, `usePrefersReducedMotion` — plus a smoke test; it does not cover layout or interaction. Verify those visually with `npm run dev` when changing things like the typewriter, accordion, court-zone navigation, erupt/dock transitions, or the mobile menu.
