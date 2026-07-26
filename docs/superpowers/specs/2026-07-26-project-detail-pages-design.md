# Project detail pages — design

**Date:** 2026-07-26
**Status:** Approved, ready for planning
**Branch:** `project-detail-pages`

## Problem

The site's interaction design outclasses its content. The cold-open, the aim-and-launch
serve, and the player mascot promise something substantial; `Projects` then delivers two
paragraphs with `github: null` on both entries and nothing to click.

For a visitor who has just spent thirty seconds learning to serve a ball into a service
box, that gap is worse than a plain site would be — the interaction raises an expectation
the payload does not meet.

The site's job is to **start conversations**. Most visitors arrive warm: they have already
spoken to Smarth, or been referred, or are opening the link before an interview. They will
happily spend a minute exploring. What they need is something concrete to bring up
afterwards — "I read how you built the serve mechanic", "why XGBoost over a plain logit?"

Right now there is nothing to bring up.

## Goal

Give each flagship project a real writeup at its own route, and add the site itself as a
third project — so the Projects section rewards the exploration the court invites.

## Scope

**In:**

- Per-project detail routes at `/projects/:slug`
- Three flagship projects with full writeups: March Madness, energy forecasting, and this site
- A `ChartFrame` component for embedding analysis screenshots without breaking the palette
- Extracting `PROJECTS` into `src/data/projects.js`
- Prefix-matching in `resolveActiveSection` so nested routes keep the court docked
- Tests for the new routing behaviour and project data

**Out:**

- Short cards for other projects. Considered, deliberately deferred. The three flagships
  ship first; more entries are a later content pass.
- Interactive/playable models (an in-browser matchup picker driven by exported
  predictions). Considered as the more ambitious option and deferred — revisit once these
  writeups exist.
- Inline SVG charts rendered from exported data. Considered; screenshots chosen instead.
  `ChartFrame` is designed so the same slot accepts an SVG later without touching
  `ProjectDetail`.
- A standalone `/colophon` route. The site-as-a-project card replaces it.
- Changes to `ServeTutorial`, `onLand`, or the beyond-shot easter egg. All unchanged.
- Any backend. The site stays static, per the existing non-goals.

## Architecture

### Routing

`resolveActiveSection` currently exact-matches the whole path, so `/projects/march-madness`
resolves to `null` and the app falls back to rendering the hub court.

Fix — match the first path segment only:

```js
export function resolveActiveSection(pathname) {
  const [id] = (pathname || "").replace(/^\/+|\/+$/g, "").split("/");
  return SECTIONS.find((s) => s.id === id) ?? null;
}
```

Consequences, all desirable:

- The `Hud` stays docked showing "Projects" on a detail page.
- The erupt overlay keeps its `transformOrigin` at the `far-bottom` box centre.
- `window.scrollTo(0, 0)` already keys on `location.pathname`, so navigating between
  detail pages resets scroll with no change.
- `CourtStage.jsx` needs **no modification at all**.

Edge cases preserved: `''` and `'/'` still resolve to `null`; `/about/` still resolves to
`about`.

`App.jsx` gains one route inside the `Layout` route:

```jsx
<Route path="projects/:slug" element={<CourtStage />} />
```

React Router 7 ranks static and param segments above the `*` catch-all, so `Pagenotfound`
is not reached for these paths. Order in the JSX does not matter.

### Data

`PROJECTS` moves from `src/components/Projects.jsx` to **`src/data/projects.js`**, matching
the existing `src/data/sections.js` convention. Two components consume it (the list and the
detail page), which is precisely why it belongs in `data/`.

```js
export const PROJECTS = [
  {
    slug: "march-madness",              // URL segment; must be unique
    title: "NCAA March Madness Prediction Model",
    hero: "0.1230",                     // list-card hero stat
    heroLabel: "Brier score",
    description: "...",                 // list-card blurb (existing copy)
    tech: ["Python", "XGBoost", "Logistic Regression", "Scikit-learn"],
    github: null,                       // null renders no link
    detail: {
      broadcast: "Match Report",        // StatCard eyebrow
      sections: [                       // ordered narrative; each is prose OR a list
        { heading: "The problem", body: "..." },
        { heading: "Approach", items: ["...", "..."] },
      ],
      results: [{ k: "Brier score", v: "0.1230" }],  // OPTIONAL stat <dl>
      resultsNote: "...",               // OPTIONAL prose under the stat line
      chart: {                          // OPTIONAL — omit entirely to render no figure
        src: chartUrl,                  // imported asset
        alt: "...",                     // required when chart is present
        caption: "...",                 // mono caption bar text
        width: 1600,
        height: 900,
      },
    },
  },
];

export function getProject(slug) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}
```

Array order is display order in the list. `this-site` goes third, after the two ML
projects — a data-science visitor should meet the modelling work first.

Chart assets are imported at the top of `data/projects.js` and referenced by binding, so
Vite fingerprints them normally.

### Components

**`src/components/Projects.jsx`** — the section, now route-aware:

```jsx
const { slug } = useParams();
if (slug) return <ProjectDetail slug={slug} />;
// otherwise render the existing list
```

Each list card gains a "Match report →" link to `/projects/${slug}`, alongside the existing
optional GitHub link.

**`src/components/ProjectDetail.jsx`** — new file. Its own file rather than a sub-component
inside `Projects.jsx` because the writeups are prose-heavy and would push that file past
the point where it does one clear thing.

Contract:

- Props: `{ slug }`
- Unknown slug → `<Navigate to="/projects" replace />`. The court frame is already mounted,
  so falling through to `Pagenotfound` would tear down the whole stage for a typo.
- Renders one `StatCard` with `broadcast={detail.broadcast}` and `title={project.title}`.
  The `title` matters for accessibility: `StatCard` renders it as the `<h2>` that
  `CourtStage`'s `focusSectionHeading` moves focus to on mount.
- Body order: `detail.sections` in order, with `ChartFrame` inserted after the first
  section (a figure above all prose reads as decoration; after the opening it reads as
  evidence) → results `<dl>` → `resultsNote` → tech `Badge`s → "← All projects" and the
  GitHub link.
- A uniform `sections` array rather than named `problem`/`approach` fields: the site
  writeup is six peer sections with no problem statement, and special-casing it in the
  renderer would buy nothing. Headings carry the semantics instead.
- Uses `useReveal()` for scroll-in, consistent with every other section.

The `CourtStage` overlay already renders its own "← Back to court" link below the section,
so a detail page offers both "up one level" and "back to the court".

**`src/components/broadcast/ChartFrame.jsx`** — new file, joining `StatCard` and `Badge` in
the broadcast kit.

A screenshot exported from a notebook will not match the broadcast palette or typography.
Rather than pretend otherwise, `ChartFrame` frames the image as an artifact: a bordered
panel with a mono caption bar above it, so it reads as *analysis output* rather than
mismatched decoration.

Contract:

- Props: `{ src, alt, caption, width, height }`
- `alt` is required; a chart with no alt text is an accessibility failure, not a style one
- `width`/`height` set explicitly to reserve space and avoid layout shift
- `loading="lazy"` — detail pages are below the fold by definition
- Panel: `border border-charcoal/15 rounded-xl overflow-hidden`, caption bar
  `font-mono text-xs uppercase tracking-widest text-charcoal/50`, image `w-full h-auto`

Because the component owns the frame and not the picture, swapping a screenshot for an
inline SVG later is a change to the data, not to `ProjectDetail`.

## Content

### March Madness (`march-madness`)

Existing description becomes the list blurb. The detail page expands it:

- **Problem** — predicting single-elimination tournament outcomes where seed alone is a
  weak signal and upsets carry most of the information.
- **Approach** — feature engineering (seed differences, 14-day rolling win rates, adjusted
  season stats), then an ensemble of XGBoost and logistic regression.
- **Results** — Brier score 0.1230 against a 0.1041 benchmark.
- **Chart** — calibration curve or Brier comparison. *Supplied by Smarth.*

Note the benchmark is **better** than the model's score (lower Brier is better). The
current copy states both numbers without addressing this. The writeup should say plainly
what the benchmark was and what beating it would have required — an honest read is more
persuasive to a technical interviewer than an ambiguous one.

### Energy forecasting (`energy-forecasting`)

- **Problem** — quantifying cross-border dependency between Canadian and US electricity
  demand over 13+ years.
- **Approach** — SARIMA and VAR models; seasonal differencing, stationarity testing,
  Granger causality analysis.
- **Results** — cross-source dependency findings. *Specific figures supplied by Smarth.*
- **Chart** — forecast with confidence bands. *Supplied by Smarth.*

### This site (`this-site`)

Fully writable from `AGENTS.md`; nothing outstanding.

- **Hero stat** — `83%` / "asset weight cut"
- **GitHub** — `https://github.com/smarthkaul/smarthkaul.github.io` (already public, so this
  card has a working link on day one while the other two await published repos)
- **Chart** — none. The reader is standing on the artifact.

Body sections:

1. **The stack** — React 18, Vite, Tailwind, GSAP, framer-motion, static on GitHub Pages.
2. **The serve** — the drag is a mirrored slingshot: pull vector from `SERVE_ORIGIN`,
   scaled and inverted by `landingFromPull`, clamped to a maximum reach. The ball flies a
   quadratic bézier (`serveControl` / `bezierPoint`) and the landing point is classified
   hit / out / beyond.
3. **The player** — four PNG parts cut in Figma, with the right arm on its own `<g>`
   pivoting at `SHOULDER` via GSAP `svgOrigin`, winding up proportionally to pull power.
4. **The cold-open** — the intro's audio and GSAP timeline are deliberately owned by a
   single `useEffect`, with the timeline built paused and released only once `audio.play()`
   settles. Split across two effects, StrictMode's double-mount lands the async `play()`
   rejection after cleanup and orphans an audio element that plays over the animation and
   never stops.
5. **The asset cut** — Figma exported each player part as an SVG that embedded the *entire*
   286×513 source PNG behind a mask, shipping one photograph four times: ~568 KB for four
   small crops. Flat transparent PNGs brought it to ~95 KB, an 83% cut.
6. **Accessibility** — `prefers-reduced-motion` makes the flight instant and reduces
   erupt/dock to opacity swaps; `SectionMenu` is the keyboard and screen-reader path to
   every section, since the hub's court targets are draggable rather than clickable; deep
   links survive GitHub Pages via the `404.html` redirect shim.

Sections 4 through 6 carry the most weight in a technical conversation. The serve mechanic
demonstrates that Smarth can build something enjoyable; the StrictMode audio bug and the
83% asset cut demonstrate judgment, which is the harder thing to evidence.

## Testing

Vitest covers logic, not layout — consistent with the existing suite.

**`src/test/setup.js`** needs an `IntersectionObserver` stub first. jsdom does not implement
it, and `useReveal` constructs one on mount, so *any* test rendering a real section
currently throws — which is why the existing smoke test renders a bare `<h1>` rather than a
component. The stub reports the element as intersecting immediately so revealed content is
queryable. This unblocks component tests for the whole codebase, not just this feature.

**`src/data/sections.test.js`** (extend `resolveActiveSection`):

- `/projects/march-madness` → the `projects` section
- `/projects/` → the `projects` section
- `/colophon` → `null` (unknown first segment)
- existing root/empty/trailing-slash cases still pass

**`src/data/projects.test.js`** (new):

- every entry has `slug`, `title`, `tech`, and a `detail` block
- slugs are unique and URL-safe (`/^[a-z0-9-]+$/`)
- `getProject` returns the right entry, and `null` for an unknown slug
- when `detail.chart` is present it has non-empty `alt`

**`src/components/ProjectDetail.test.jsx`** and **`src/components/Projects.test.jsx`** (new)
— render through `MemoryRouter` and assert that `/projects` shows the card list, that
`/projects/:slug` shows the detail page instead, and that an unknown slug redirects. Route
coverage lives beside the components rather than in `smoke.test.jsx`, which stays a harness
check. `this-site` is the fixture, since its content is complete and not pending assets.

Visual verification stays manual via `npm run dev`, per the existing convention: the erupt
animation from the projects box, the docked `Hud`, and chart rendering at mobile widths.

## Risks

- **Charts are unsupplied.** Two of three detail pages depend on screenshots that do not
  exist yet. Mitigation: `detail.chart` is optional and `ProjectDetail` renders the figure
  only when present, so the pages ship and read correctly without them.
- **Image weight.** The player assets were just cut 83%; two careless chart PNGs would hand
  most of that back. Budget: ≤150 KB and ≤1600px wide per chart, checked before commit.
- **Palette clash.** Accepted knowingly. `ChartFrame` contains it rather than solving it.
- **Placeholder drift.** `ServeTutorial`'s video placeholder stays a placeholder under this
  design. Out of scope here, recorded so it does not become permanent by default.

## Open items for Smarth

1. Chart screenshots for March Madness and energy forecasting
2. GitHub URLs for both ML repos once published
3. Specific result figures for the energy forecasting model
4. Confirmation of how to frame the Brier score against its benchmark

None of these block implementation. All three pages render without them, with the missing
pieces marked clearly in `data/projects.js`.
