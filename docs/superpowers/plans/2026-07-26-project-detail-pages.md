# Project Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each flagship project a full writeup at its own route (`/projects/:slug`), and add the site itself as a third project.

**Architecture:** `resolveActiveSection` switches from whole-path matching to first-segment matching, so `/projects/march-madness` keeps the court docked and `CourtStage.jsx` needs no changes at all. `PROJECTS` moves to `src/data/projects.js` and gains a `detail` block; `Projects.jsx` becomes route-aware via `useParams()` and delegates to a new `ProjectDetail` component when a slug is present.

**Tech Stack:** React 18, Vite 6, React Router DOM 7, Tailwind CSS 3, Vitest 2 + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-26-project-detail-pages-design.md`

## Global Constraints

- All npm commands run from `website/`, never the repo root.
- Palette is `grass` / `wimbledon` / `cream` / `charcoal` / `ball` only. Never introduce `violet`, `indigo`, or `slate-*` — that was the pre-redesign system.
- `ball` (neon yellow) is accent only: highlights, active states, CTAs. Never body text on `cream`.
- Headings use `font-display` (Syne). Eyebrow/broadcast labels and metadata use `font-mono`. Body text is default sans (Inter).
- Content is data-driven: declare an `UPPER_CASE` const at the top of the file and `.map()` over it. Never hand-write repeated JSX rows.
- External links always carry `target="_blank" rel="noopener noreferrer"`.
- Tailwind utilities inline. No new CSS files; global custom CSS lives only in `src/index.css`.
- Do not modify `CourtStage.jsx`, `ServeTutorial.jsx`, or the `beyond`-shot behaviour. They are explicitly out of scope.
- Run `npm run lint`, `npm run test`, and `npm run build` from `website/` before finishing. A broken build blocks deploys.
- Commit messages must NOT include an AI co-author trailer.

---

### Task 1: First-segment routing in `resolveActiveSection`

Nested routes currently resolve to `null`, which would drop a visitor on `/projects/march-madness` back to the hub court. Matching only the first path segment fixes it and leaves every existing behaviour intact.

**Files:**
- Modify: `website/src/data/sections.js:26-29`
- Test: `website/src/data/sections.test.js:43-56`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `resolveActiveSection(pathname: string) => Section | null`, where a path whose **first segment** matches a `SECTIONS` id returns that section. Task 5 relies on this so `/projects/:slug` keeps the `Hud` docked.

- [ ] **Step 1: Write the failing tests**

In `website/src/data/sections.test.js`, add these two tests inside the existing `describe('resolveActiveSection', ...)` block, after the `tolerates trailing slashes` test:

```js
  it('resolves a nested project route to the projects section', () => {
    const projects = SECTIONS.find((s) => s.id === 'projects')
    expect(resolveActiveSection('/projects/march-madness')).toBe(projects)
    expect(resolveActiveSection('/projects/')).toBe(projects)
    expect(resolveActiveSection('/projects/this-site/')).toBe(projects)
  })

  it('returns null when the first segment is unknown', () => {
    expect(resolveActiveSection('/colophon')).toBeNull()
    expect(resolveActiveSection('/nope/projects')).toBeNull()
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd website && npm run test -- src/data/sections.test.js
```

Expected: FAIL. `resolves a nested project route` fails because `resolveActiveSection('/projects/march-madness')` returns `null` — the current implementation compares the entire stripped path (`"projects/march-madness"`) against section ids.

Note: `returns null when the first segment is unknown` will already PASS. That is correct and intentional — it is a regression guard proving the change does not make matching too loose.

- [ ] **Step 3: Implement first-segment matching**

Replace `website/src/data/sections.js:26-29` with:

```js
export function resolveActiveSection(pathname) {
  const [id] = (pathname || "").replace(/^\/+|\/+$/g, "").split("/");
  return SECTIONS.find((s) => s.id === id) ?? null;
}
```

- [ ] **Step 4: Run the full test file to verify all cases pass**

```bash
cd website && npm run test -- src/data/sections.test.js
```

Expected: PASS, all tests in the file. The pre-existing cases matter as much as the new ones: `''` and `'/'` still return `null` (empty first segment matches no id), and `'/about/'` still returns the about section.

- [ ] **Step 5: Commit**

```bash
git add website/src/data/sections.js website/src/data/sections.test.js
git commit -m "Resolve nested routes to their parent section"
```

---

### Task 2: Extract and author `src/data/projects.js`

`PROJECTS` currently lives inside `Projects.jsx`. Two components will consume it, so it moves to `data/` alongside `sections.js`. This task also authors the full `detail` content for all three projects, because every later task needs real data to render and test against.

**Files:**
- Create: `website/src/data/projects.js`
- Create: `website/src/data/projects.test.js`
- Modify: `website/src/components/Projects.jsx:5-24` (delete the local `PROJECTS`, import it instead)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `PROJECTS: Project[]` — array order is display order.
  - `getProject(slug: string) => Project | null`
  - `Project` = `{ slug, title, hero, heroLabel, description, tech: string[], team?: string, github: string|null, detail }`
  - `team` is present only on collaborative projects. Both course projects have co-authors and must say so; `this-site` omits the field.
  - `detail` = `{ broadcast: string, sections: Section[], results?: {k,v}[], resultsNote?: string, chart?: Chart }`
  - `Section` = `{ heading: string, body?: string, items?: string[] }` — exactly one of `body` or `items`.
  - `Chart` = `{ src, alt, caption, width, height }`
  - Tasks 4 and 5 depend on all of these names exactly as written.

- [ ] **Step 1: Write the failing test**

Create `website/src/data/projects.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { PROJECTS, getProject } from './projects'

describe('PROJECTS', () => {
  it('lists the three flagship projects in display order', () => {
    expect(PROJECTS.map((p) => p.slug)).toEqual([
      'march-madness',
      'energy-forecasting',
      'this-site',
    ])
  })

  it('gives every project the fields the list card and detail page need', () => {
    for (const p of PROJECTS) {
      expect(p).toEqual(
        expect.objectContaining({
          slug: expect.any(String),
          title: expect.any(String),
          hero: expect.any(String),
          heroLabel: expect.any(String),
          description: expect.any(String),
          tech: expect.any(Array),
          detail: expect.any(Object),
        })
      )
      expect(p.tech.length).toBeGreaterThan(0)
      expect(p.detail.broadcast).toEqual(expect.any(String))
      expect(p.detail.sections.length).toBeGreaterThan(0)
    }
  })

  it('uses unique, URL-safe slugs', () => {
    const slugs = PROJECTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
  })

  it('gives every detail section exactly one of body or items', () => {
    for (const p of PROJECTS) {
      for (const s of p.detail.sections) {
        expect(s.heading).toEqual(expect.any(String))
        expect(Boolean(s.body) !== Boolean(s.items)).toBe(true)
      }
    }
  })

  it('requires alt text whenever a chart is present', () => {
    for (const p of PROJECTS) {
      if (!p.detail.chart) continue
      expect(p.detail.chart.alt).toEqual(expect.any(String))
      expect(p.detail.chart.alt.length).toBeGreaterThan(0)
    }
  })

  it('types github as a URL or null, never undefined', () => {
    for (const p of PROJECTS) {
      expect(p.github === null || typeof p.github === 'string').toBe(true)
    }
  })

  it('credits the team on the collaborative projects', () => {
    // Both course projects have co-authors; the site is solo.
    expect(getProject('march-madness').team).toEqual(expect.any(String))
    expect(getProject('energy-forecasting').team).toEqual(expect.any(String))
    expect(getProject('this-site').team).toBeUndefined()
  })
})

describe('getProject', () => {
  it('finds a project by slug', () => {
    expect(getProject('this-site')).toBe(PROJECTS[2])
  })

  it('returns null for an unknown slug', () => {
    expect(getProject('nope')).toBeNull()
    expect(getProject('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd website && npm run test -- src/data/projects.test.js
```

Expected: FAIL with `Failed to resolve import "./projects"` — the module does not exist yet.

- [ ] **Step 3: Create the data module**

Create `website/src/data/projects.js`:

```js
// Single source of truth for the Projects section. Both the list cards and the
// per-project detail pages at /projects/:slug read from here. Array order is
// display order — the modelling work comes before the site itself.

export const PROJECTS = [
  {
    slug: "march-madness",
    title: "NCAA March Madness Prediction Model",
    hero: "0.1250",
    heroLabel: "Brier score",
    description:
      "Predicting NCAA tournament matchups for the Kaggle competition. Opponent-adjusted season statistics, seed differences, and 14-day form, scored on calibration rather than accuracy.",
    tech: ["Python", "XGBoost", "Logistic Regression", "Scikit-learn", "GridSearchCV"],
    team: "Three-person course project (STAD68)",
    // Set to the repo or shared notebook URL once it is public. null renders no link.
    github: null,
    detail: {
      broadcast: "Match Report",
      sections: [
        {
          heading: "The problem",
          body:
            "Predict the outcome of every NCAA tournament matchup from historical game data, scored by Brier score rather than accuracy. That scoring choice drives everything downstream: a model that is confidently wrong is punished far harder than one that hedges, so the goal is a calibrated probability rather than a pick. The underlying data is discrete — wins, losses, box-score lines — and it points fairly consistently at possession as the thing that decides games.",
        },
        {
          heading: "Feature engineering",
          items: [
            "Season statistics per team: average points, rebounds, assists, and shooting efficiency.",
            "The same statistics computed for every opponent each team faced, so strength of schedule is priced in rather than assumed away.",
            "Seed difference between the two teams, as a proxy for relative ranking and tournament expectation.",
            "A 14-day win rate, to capture form going into the tournament rather than the season average alone.",
          ],
        },
        {
          heading: "Selection and tuning",
          items: [
            "For XGBoost, features were ranked by importance and cut at the median.",
            "For logistic regression, an L1 (lasso) penalty did the selection, which doubles as overfitting control.",
            "Both models were tuned with grid search under cross-validation — the regularization strength C for the logit, and n_estimators, max_depth, subsample, and colsample_bytree for XGBoost.",
            "The optimization target throughout was Brier score, not accuracy. Seed difference, seed placement, and per-game point difference came out as the strongest signals.",
          ],
        },
        {
          heading: "What actually won",
          body:
            "The ensemble scored 0.1250. Logistic regression alone scored 0.1252 — a gap of 0.0002, which is to say no gap at all. XGBoost, the model with all the capacity, finished last at 0.1269. That ordering is the most useful thing the project produced. With a limited number of tournament games to learn from and features whose effects are largely linear, there is not much non-linear structure left for a boosted tree to find, and the regularized linear model generalizes better precisely because it cannot chase it. Ensembling the two bought essentially nothing over the simpler model, and would not have been worth its complexity in production.",
        },
      ],
      results: [
        { k: "Ensemble", v: "0.1250" },
        { k: "Logistic regression", v: "0.1252" },
        { k: "XGBoost", v: "0.1269" },
        { k: "Top Kaggle score", v: "0.09588" },
      ],
      resultsNote:
        "Brier score is lower-is-better, so the leaderboard's 0.09588 is the number to beat and none of these reach it. The gap to the top of a public Kaggle leaderboard is a fair thing to lose; the ordering underneath it is the part worth explaining.",
      // No chart yet. Add { src, alt, caption, width, height } once exported.
    },
  },
  {
    slug: "energy-forecasting",
    title: "Forecasting North American Electricity Supply",
    hero: "13 yrs",
    heroLabel: "of monthly data",
    description:
      "SARIMA and VAR models across six series of Canadian and US electricity supply, asking whether generation sources actually predict one another once seasonality is removed.",
    tech: ["R", "SARIMA", "VAR", "Granger Causality", "STL"],
    team: "Group course project (STAD57)",
    github: null,
    detail: {
      broadcast: "Match Report",
      sections: [
        {
          heading: "The problem",
          body:
            "Canada and the United States share a climate, a calendar, and a border, but not an energy mix — Canada leans heavily on hydro while US supply is dominated by combustible fuels. That makes them a useful pair to compare. The project asked three things: what trends and seasonal patterns exist in monthly supply by source, whether those series can be forecast two to three years out, and whether any source or country actually helps predict another.",
        },
        {
          heading: "The data",
          body:
            "Monthly net electricity supply in GWh from the International Energy Agency, accessed through Borealis, covering January 2010 to April 2023. Two countries by three sources — combustible fuels, hydro, and nuclear — gives six series. All six proved variance-stationary except Canadian nuclear, and no outliers needed removing.",
        },
        {
          heading: "Making it stationary",
          body:
            "Every series showed strong annual seasonality: ACF correlations decaying slowly with clear spikes at lags 12, 24, and 36, and a PACF cut-off at lag 12 consistent with a seasonal AR(1). That supports seasonal differencing at S=12, D=1. Canadian nuclear was the stubborn one — a log transform did not resolve its non-stationarity and an augmented Dickey-Fuller test could not reject a unit root, so it needed regular differencing on top. Rather than difference by hand, auto.arima selected both differencing orders under AIC, which avoids the over- and under-differencing that manual choices invite.",
        },
        {
          heading: "SARIMA versus VAR",
          body:
            "The final twelve months, May 2022 through April 2023, were held out for validation. SARIMA won on both RMSE and MAE for nearly every series; the single exception was US combustible fuels, where VAR edged it, and that series alone kept a VAR as its final model. Residual diagnostics flagged leftover autocorrelation on three series. Adding a seasonal MA term fixed Canadian nuclear and US hydro and lowered their AIC; on Canadian hydro it made things worse, so that model was left as it was rather than tuned into looking better.",
        },
        {
          heading: "Do the sources move together?",
          body:
            "Testing this on raw series would mostly measure the shared calendar, so the dependence analysis ran on STL-adjusted data instead. STL removes the deterministic seasonal component without touching short-run dynamics; seasonal differencing would have mechanically transformed the data and could manufacture autocorrelation that has nothing to do with real co-movement. Once seasonality was out, most apparent dependence went with it. Within the US, combustible fuels Granger-cause both nuclear and hydro. Across the border, exactly one directional link survived: Canadian nuclear Granger-causes US nuclear, and not the reverse. Impulse responses confirmed how short-lived these effects are — a Canadian hydro shock depresses US hydro for a few periods before fading, with no lasting change to the mix.",
        },
        {
          heading: "What it adds up to",
          body:
            "A negative result, and a useful one. North American electricity supply is driven overwhelmingly by its own strong seasonal cycles, and each source is best forecast by a model of itself. The multivariate machinery earned its keep on exactly one of six series and produced only a handful of significant causal links. Reporting that plainly is more valuable than finding a way to make VAR look necessary — the practical recommendation is source-specific seasonal models, and the cross-border coordination story the data might have told simply is not there.",
        },
      ],
      results: [
        { k: "Coverage", v: "Jan 2010 – Apr 2023" },
        { k: "Series", v: "6 (2 countries × 3 sources)" },
        { k: "Validation", v: "12-month holdout" },
        { k: "Best model", v: "SARIMA, 5 of 6 series" },
      ],
    },
  },
  {
    slug: "this-site",
    title: "This Site: A Tennis Broadcast in the Browser",
    hero: "83%",
    heroLabel: "asset weight cut",
    description:
      "The site you are reading. Navigation is a serve: drag the ball back to aim, release, and where it lands decides where you go. GSAP timelines, a rigged mascot, and a cold open.",
    tech: ["React", "Vite", "GSAP", "Tailwind", "SVG"],
    github: "https://github.com/smarthkaul/smarthkaul.github.io",
    detail: {
      broadcast: "Behind the Broadcast",
      sections: [
        {
          heading: "The stack",
          body:
            "React and Vite, styled with Tailwind, animated with GSAP for anything on a timeline and framer-motion for the section transitions. It builds to static files and deploys to GitHub Pages from a GitHub Actions workflow. No backend, no CMS, no database — every piece of content on this site is a JavaScript array.",
        },
        {
          heading: "The serve",
          body:
            "Dragging the ball is a slingshot, not a steering wheel. Pointer position minus a fixed baseline origin gives a pull vector; the launch mirrors and scales it, clamped so an enormous drag cannot send the ball into orbit. The ball then flies a quadratic bézier, its control point set midway across and lifted above the higher endpoint. Where it lands is classified three ways: inside a target navigates, inside the court draws an OUT call, and anything else means you have cleared the stadium entirely — which has its own reward.",
        },
        {
          heading: "The player",
          body:
            "The character is four PNG parts cut in Figma and positioned in court coordinates. His racket arm is a separate SVG group pivoting at the shoulder via GSAP's svgOrigin: it winds up in proportion to how far you have pulled the ball back, then snaps through a swing when you release. The racket itself is drawn in vectors — an ellipse, a string grid, a handle — because a photograph of a racket would have cost more than the geometry did.",
        },
        {
          heading: "The cold open",
          body:
            "The intro's music and its animation are owned by a single effect, and the timeline is built paused and released only once audio.play() settles. That is not a style choice. Split across two effects, React StrictMode's development double-mount lands the async play() rejection after cleanup has already run, orphaning an audio element that nothing holds a reference to — so the theme plays over the animation, out of sync, until you close the tab. One effect means exactly one audio element, and it cannot outlive its timeline.",
        },
        {
          heading: "Cutting 83% of the player",
          body:
            "Figma exported the four player parts as SVGs, which sounded ideal until I opened one. Each file embedded the entire 286×513 source photograph as base64 and used a mask to reveal a single limb — the same image, four times, roughly 568 KB to display four small crops. Re-cutting them as flat transparent PNGs brought the set to about 95 KB. They were raster either way; the SVG wrapper bought nothing but weight.",
        },
        {
          heading: "Accessibility",
          body:
            "An interface built on dragging needs a second door. prefers-reduced-motion makes the ball's flight instant and reduces the section transitions to opacity swaps; the navbar menu reaches every section by keyboard and screen reader, since the court targets are draggable rather than clickable; and deep links survive GitHub Pages — which does not natively serve client-side routes — via a 404 page that round-trips the path back through the app.",
        },
      ],
      results: [
        { k: "Player assets", v: "568 KB → 95 KB" },
        { k: "Backend", v: "None" },
      ],
    },
  },
];

export function getProject(slug) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd website && npm run test -- src/data/projects.test.js
```

Expected: PASS, all 8 tests.

- [ ] **Step 5: Point `Projects.jsx` at the new module**

In `website/src/components/Projects.jsx`, delete the local `const PROJECTS = [...]` block (lines 5-24) and add the import below the existing ones:

```js
import { PROJECTS } from "../data/projects";
```

The rest of the file is unchanged. This is a pure move — the list must render exactly as before.

- [ ] **Step 6: Verify nothing broke**

```bash
cd website && npm run lint && npm run test && npm run build
```

Expected: lint clean, all tests PASS, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add website/src/data/projects.js website/src/data/projects.test.js website/src/components/Projects.jsx
git commit -m "Move project data into src/data and add detail content"
```

---

### Task 3: `ChartFrame` broadcast component

A screenshot exported from a notebook will not match the broadcast palette or typography. `ChartFrame` frames it as an artifact — a bordered panel with a mono caption bar — so it reads as analysis output rather than mismatched decoration.

**Files:**
- Create: `website/src/components/broadcast/ChartFrame.jsx`
- Create: `website/src/components/broadcast/ChartFrame.test.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `<ChartFrame src alt caption width height />`. Task 4 spreads a `detail.chart` object straight into it, so the prop names must match the `Chart` shape from Task 2 exactly.

- [ ] **Step 1: Write the failing test**

Create `website/src/components/broadcast/ChartFrame.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChartFrame from './ChartFrame'

const props = {
  src: '/charts/calibration.png',
  alt: 'Calibration curve showing predicted vs observed win rates',
  caption: 'Fig 1 — Calibration',
  width: 1600,
  height: 900,
}

describe('ChartFrame', () => {
  it('renders the image by its alt text', () => {
    render(<ChartFrame {...props} />)
    expect(screen.getByRole('img', { name: props.alt })).toBeInTheDocument()
  })

  it('renders the caption', () => {
    render(<ChartFrame {...props} />)
    expect(screen.getByText('Fig 1 — Calibration')).toBeInTheDocument()
  })

  it('reserves layout space and defers loading', () => {
    render(<ChartFrame {...props} />)
    const img = screen.getByRole('img', { name: props.alt })
    expect(img).toHaveAttribute('width', '1600')
    expect(img).toHaveAttribute('height', '900')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('omits the caption bar when no caption is given', () => {
    render(<ChartFrame {...props} caption={undefined} />)
    expect(screen.queryByText('Fig 1 — Calibration')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: props.alt })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd website && npm run test -- src/components/broadcast/ChartFrame.test.jsx
```

Expected: FAIL with `Failed to resolve import "./ChartFrame"`.

- [ ] **Step 3: Implement the component**

Create `website/src/components/broadcast/ChartFrame.jsx`:

```jsx
// Frames an exported analysis image inside the broadcast system. Notebook
// screenshots will not match the palette or the type; the border and mono
// caption bar make the image read as a figure rather than as decoration.
const ChartFrame = ({ src, alt, caption, width, height }) => (
  <figure className="my-8 border border-charcoal/15 rounded-xl overflow-hidden bg-white">
    {caption && (
      <figcaption className="bg-charcoal/5 border-b border-charcoal/10 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-widest text-charcoal/50">
        {caption}
      </figcaption>
    )}
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className="block w-full h-auto"
    />
  </figure>
);

export default ChartFrame;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd website && npm run test -- src/components/broadcast/ChartFrame.test.jsx
```

Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/broadcast/ChartFrame.jsx website/src/components/broadcast/ChartFrame.test.jsx
git commit -m "Add ChartFrame for framing analysis figures"
```

---

### Task 4: `IntersectionObserver` test stub and the `ProjectDetail` component

jsdom does not implement `IntersectionObserver`, and `useReveal` constructs one on mount — so rendering any real section in a test currently throws. That is why the existing smoke test renders a bare `<h1>`. The stub lands here because `ProjectDetail` is the first component that needs it, and it unblocks component testing across the whole codebase.

**Files:**
- Modify: `website/src/test/setup.js`
- Create: `website/src/components/ProjectDetail.jsx`
- Create: `website/src/components/ProjectDetail.test.jsx`

**Interfaces:**
- Consumes: `getProject(slug)` and the `Project` / `Section` / `Chart` shapes from Task 2; `<ChartFrame src alt caption width height />` from Task 3.
- Produces: `<ProjectDetail slug={string} />`. Task 5 renders exactly this from `Projects.jsx`.

- [ ] **Step 1: Add the `IntersectionObserver` stub**

Replace the contents of `website/src/test/setup.js` with:

```js
import '@testing-library/jest-dom/vitest'

// jsdom has no IntersectionObserver, but useReveal() constructs one on mount —
// so without this, rendering any section that uses the reveal hook throws.
// Reporting the element as intersecting immediately means revealed content is
// queryable without waiting on an observer that will never fire.
class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback
  }
  observe(element) {
    this.callback([{ isIntersecting: true, target: element }], this)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

globalThis.IntersectionObserver = IntersectionObserverStub
```

- [ ] **Step 2: Write the failing test**

Create `website/src/components/ProjectDetail.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProjectDetail from './ProjectDetail'

const renderDetail = (slug) =>
  render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects" element={<p>projects list</p>} />
        <Route path="/projects/:slug" element={<ProjectDetail slug={slug} />} />
      </Routes>
    </MemoryRouter>
  )

describe('ProjectDetail', () => {
  it('renders the project title as the section heading', () => {
    renderDetail('this-site')
    expect(
      screen.getByRole('heading', { name: /This Site/i, level: 2 })
    ).toBeInTheDocument()
  })

  it('renders every detail section heading and its prose', () => {
    renderDetail('this-site')
    expect(screen.getByRole('heading', { name: 'The serve' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accessibility' })).toBeInTheDocument()
    expect(screen.getByText(/slingshot, not a steering wheel/)).toBeInTheDocument()
  })

  it('renders list-style sections as an ordered list', () => {
    renderDetail('march-madness')
    expect(screen.getByRole('heading', { name: 'Approach' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(3)
  })

  it('renders the results stat line and its note', () => {
    renderDetail('march-madness')
    expect(screen.getByText('Logistic regression')).toBeInTheDocument()
    expect(screen.getByText('0.1252')).toBeInTheDocument()
    expect(screen.getByText('Top Kaggle score')).toBeInTheDocument()
    expect(screen.getByText('0.09588')).toBeInTheDocument()
    // "0.1250" is both the hero badge and a results value, so it appears twice.
    expect(screen.getAllByText('0.1250')).toHaveLength(2)
    expect(screen.getByText(/lower-is-better/)).toBeInTheDocument()
  })

  it('credits the team when the project has co-authors', () => {
    renderDetail('march-madness')
    expect(screen.getByText(/Three-person course project/)).toBeInTheDocument()
  })

  it('shows no team credit on a solo project', () => {
    renderDetail('this-site')
    expect(screen.queryByText(/course project/i)).not.toBeInTheDocument()
  })

  it('links to the code when a github url is present', () => {
    renderDetail('this-site')
    const link = screen.getByRole('link', { name: /view the code/i })
    expect(link).toHaveAttribute('href', 'https://github.com/smarthkaul/smarthkaul.github.io')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('omits the code link when github is null', () => {
    renderDetail('energy-forecasting')
    expect(screen.queryByRole('link', { name: /view the code/i })).not.toBeInTheDocument()
  })

  it('always offers a way back to the project list', () => {
    renderDetail('this-site')
    expect(screen.getByRole('link', { name: /all projects/i })).toHaveAttribute(
      'href',
      '/projects'
    )
  })

  it('renders no figure when the project has no chart', () => {
    renderDetail('this-site')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('redirects an unknown slug to the project list', () => {
    renderDetail('does-not-exist')
    expect(screen.getByText('projects list')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd website && npm run test -- src/components/ProjectDetail.test.jsx
```

Expected: FAIL with `Failed to resolve import "./ProjectDetail"`.

- [ ] **Step 4: Implement the component**

Create `website/src/components/ProjectDetail.jsx`:

```jsx
import { Fragment } from "react";
import { Link, Navigate } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import { getProject } from "../data/projects";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";
import ChartFrame from "./broadcast/ChartFrame";

const linkClass =
  "font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors";

const DetailSection = ({ section }) => (
  <div className="mb-8">
    <h3 className="font-display font-bold text-charcoal text-xl mb-3">
      {section.heading}
    </h3>
    {section.body && (
      <p className="text-charcoal/70 leading-relaxed">{section.body}</p>
    )}
    {section.items && (
      <ol className="list-decimal pl-5 space-y-3 text-charcoal/70 leading-relaxed">
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    )}
  </div>
);

const ProjectDetail = ({ slug }) => {
  // Hooks must run before any early return, so useReveal precedes the lookup guard.
  const [ref, visible] = useReveal();
  const project = getProject(slug);

  // The court stage is already mounted; falling through to the 404 route would
  // tear the whole stage down over a mistyped slug.
  if (!project) return <Navigate to="/projects" replace />;

  const { detail } = project;

  return (
    <section className="px-6 sm:px-12 lg:px-24 py-16">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <StatCard
          broadcast={detail.broadcast}
          title={project.title}
          headerRight={<Badge tone="ball">{project.hero}</Badge>}
        >
          {/* Collaborative projects say so up front, before any claim is made. */}
          {project.team && (
            <p className="font-mono text-xs uppercase tracking-widest text-charcoal/50 border-b border-charcoal/10 pb-4 mb-6">
              {project.team}
            </p>
          )}

          {detail.sections.map((section, i) => (
            <Fragment key={section.heading}>
              <DetailSection section={section} />
              {/* The figure sits after the opening section: above all prose it
                  reads as decoration, after it as evidence. */}
              {i === 0 && detail.chart && <ChartFrame {...detail.chart} />}
            </Fragment>
          ))}

          {detail.results && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border-t border-charcoal/10 pt-6 mb-4">
              {detail.results.map(({ k, v }) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 border-b border-charcoal/10 py-2"
                >
                  <dt className="font-mono text-xs uppercase tracking-widest text-charcoal/50">
                    {k}
                  </dt>
                  <dd className="text-charcoal font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {detail.resultsNote && (
            <p className="text-charcoal/70 text-sm leading-relaxed mb-8">
              {detail.resultsNote}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-8">
            {project.tech.map((t) => (
              <Badge key={t} tone="outline">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-charcoal/10 pt-6">
            <Link to="/projects" className={linkClass}>
              &larr; All projects
            </Link>
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                View the code &#8599;
              </a>
            )}
          </div>
        </StatCard>
      </div>
    </section>
  );
};

export default ProjectDetail;
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd website && npm run test -- src/components/ProjectDetail.test.jsx
```

Expected: PASS, all 9 tests.

- [ ] **Step 6: Run the whole suite — the setup change touches every test**

```bash
cd website && npm run test
```

Expected: PASS, every file. The `IntersectionObserver` stub is additive, so pre-existing tests are unaffected.

- [ ] **Step 7: Commit**

```bash
git add website/src/test/setup.js website/src/components/ProjectDetail.jsx website/src/components/ProjectDetail.test.jsx
git commit -m "Add ProjectDetail page and an IntersectionObserver test stub"
```

---

### Task 5: Wire the `/projects/:slug` route

`Projects.jsx` becomes route-aware and delegates to `ProjectDetail` when a slug is present. The list cards gain a link into their detail page.

**Files:**
- Modify: `website/src/App.jsx:13-15`
- Modify: `website/src/components/Projects.jsx`
- Create: `website/src/components/Projects.test.jsx`

**Interfaces:**
- Consumes: `<ProjectDetail slug />` from Task 4; `PROJECTS` from Task 2; first-segment `resolveActiveSection` from Task 1.
- Produces: the route `/projects/:slug`, rendered through `CourtStage` so the `Hud` stays docked and the erupt origin stays on the `far-bottom` box.

- [ ] **Step 1: Write the failing test**

Create `website/src/components/Projects.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Projects from './Projects'

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<Projects />} />
      </Routes>
    </MemoryRouter>
  )

describe('Projects', () => {
  it('renders the card list at /projects', () => {
    renderAt('/projects')
    expect(
      screen.getByRole('heading', { name: /March Madness/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /This Site/i })).toBeInTheDocument()
  })

  it('links each card to its detail page', () => {
    renderAt('/projects')
    const links = screen.getAllByRole('link', { name: /match report/i })
    expect(links).toHaveLength(3)
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/projects/march-madness',
      '/projects/energy-forecasting',
      '/projects/this-site',
    ])
  })

  it('renders the detail page at /projects/:slug instead of the list', () => {
    renderAt('/projects/this-site')
    expect(
      screen.getByRole('heading', { name: /This Site/i, level: 2 })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The serve' })).toBeInTheDocument()
    // The list's other cards must not be on the page.
    expect(
      screen.queryByRole('heading', { name: /March Madness/i })
    ).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd website && npm run test -- src/components/Projects.test.jsx
```

Expected: FAIL. `links each card to its detail page` fails because no "Match report" link exists, and `renders the detail page at /projects/:slug` fails because `Projects` ignores the route param and renders the list.

- [ ] **Step 3: Make `Projects.jsx` route-aware**

In `website/src/components/Projects.jsx`, replace the import block at the top with:

```jsx
import { Link, useParams } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import { PROJECTS } from "../data/projects";
import ProjectDetail from "./ProjectDetail";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";
```

Then replace the `Projects` component at the bottom of the file with:

```jsx
const Projects = () => {
  // useReveal must run unconditionally — hooks cannot sit after an early return.
  const [ref, visible] = useReveal();
  const { slug } = useParams();

  if (slug) return <ProjectDetail slug={slug} />;

  return (
    <section id="projects" className="px-6 sm:px-12 lg:px-24 py-16">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <h2 className="sr-only">Projects</h2>
        <p className="font-mono text-cream text-xs uppercase tracking-widest mb-4">
          Highlight Reel
        </p>
        <div className="grid grid-cols-1 gap-6">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Add the detail link to `ProjectCard`**

Still in `website/src/components/Projects.jsx`, replace the closing links row of `ProjectCard` (the `<div className="flex flex-wrap items-center justify-between gap-3">` block) with:

```jsx
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <Badge key={t} tone="outline">
            {t}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <Link
          to={`/projects/${project.slug}`}
          className="font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors"
        >
          Match report &rarr;
        </Link>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors"
          >
            Full match &#8599;
          </a>
        )}
      </div>
    </div>
```

Leave the rest of `ProjectCard` unchanged — its title is already an `<h3>`, which is what the test queries.

- [ ] **Step 5: Register the route**

In `website/src/App.jsx`, add the nested project route immediately after the `SECTIONS.map(...)` block, inside the `Layout` route:

```jsx
          {SECTIONS.map((s) => (
            <Route key={s.id} path={s.id} element={<CourtStage />} />
          ))}
          <Route path="projects/:slug" element={<CourtStage />} />
          <Route path="*" element={<Pagenotfound />} />
```

React Router 7 ranks routes by specificity rather than declaration order, so `projects/:slug` wins over the `*` catch-all regardless of position.

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd website && npm run test -- src/components/Projects.test.jsx
```

Expected: PASS, all 3 tests.

- [ ] **Step 7: Commit**

```bash
git add website/src/App.jsx website/src/components/Projects.jsx website/src/components/Projects.test.jsx
git commit -m "Route /projects/:slug to the project detail page"
```

---

### Task 6: Full verification

**Files:**
- No changes expected. This task is a gate.

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: a verified, deployable branch.

- [ ] **Step 1: Lint, test, and build**

```bash
cd website && npm run lint && npm run test && npm run build
```

Expected: lint reports no errors, every test passes, and the build writes `website/dist/` without warnings about unresolved imports.

If lint flags `react-hooks/rules-of-hooks` in `Projects.jsx`, the `useReveal()` call has ended up after the `if (slug)` return. Move it above.

- [ ] **Step 2: Verify the interaction manually**

```bash
cd website && npm run dev
```

Check each of these at `http://localhost:5173`:

1. Serve the ball into the lower-far service box — the Projects section erupts as before.
2. Each card shows a "Match report →" link; only "This Site" also shows "Full match ↗".
3. Click "Match report" on This Site — the detail page renders, and **the `Hud` stays docked in the corner showing Projects**. This is the payoff of Task 1; if the court re-expands to full size, `resolveActiveSection` is not matching the first segment.
4. "← All projects" returns to the list; "← Back to court" returns to `/`.
5. Load `http://localhost:5173/projects/this-site` directly — it renders the detail page, not the hub court.
6. Load `http://localhost:5173/projects/nonsense` — it redirects to the project list.
7. Narrow the window to ~375px: the results `<dl>` collapses to one column and no text overflows its card.

- [ ] **Step 3: Verify the reduced-motion path**

In DevTools, Rendering → "Emulate CSS prefers-reduced-motion: reduce", then reload and repeat check 3. The detail page should appear with an opacity swap and no scale animation.

- [ ] **Step 4: Commit any fixes and push**

```bash
git push -u origin project-detail-pages
```

Then open a PR against `main`. Do not push to `main` directly.

---

## Follow-ups (not in this plan)

These are recorded so they do not get lost. None block shipping.

1. **Chart screenshots** for March Madness and energy forecasting. Add `chart: { src, alt, caption, width, height }` to the relevant `detail` block and import the asset at the top of `data/projects.js`. Budget: ≤150 KB and ≤1600px wide each — the player assets were just cut 83% and two careless PNGs would hand most of it back.
   Good candidates already exist in the source documents: the energy report's Graph 8 (two-year forecasts with prediction bands) and Graphs 9–13 (impulse responses), and the March Madness deck's feature-importance slide.
2. **Code links for the two course projects.** Both are `github: null`.
   - March Madness lives in a Colab notebook. Its share setting could not be verified during planning — Colab returns HTTP 200 and a generic shell page to everyone and resolves access client-side. Open it in a private window: if it loads, it is link-shareable and the URL can go straight into `github`.
   - The energy project is a local `.Rmd`. A gist or a small repo would make it linkable.
3. **Exact RMSE/MAE figures and Granger p-values** for the energy project. The report states which model won each series, and the plan's `results` block quotes structure (coverage, series count, holdout, winner) rather than error metrics. The numbers live in the report's Tables 1–2 and could be added.
4. **`ServeTutorial`'s video placeholder** is still a placeholder. Out of scope here, but it should not become permanent by default.

### Resolved during planning

- **The March Madness statistics on the live site were wrong.** It claims a Brier score of 0.1230 against a 0.1041 benchmark. The presentation reports 0.1250 (ensemble), 0.1252 (logistic regression), 0.1269 (XGBoost), and 0.09588 for the top Kaggle leaderboard score — neither published figure appears in the source. The plan uses the deck's numbers throughout.
- **The energy project was described as demand data.** It is net electricity *supply* by generation source (combustible fuels, hydro, nuclear) across two countries, from the IEA via Borealis, Jan 2010 – Apr 2023.
- **Both course projects have co-authors** and now carry a `team` credit.
