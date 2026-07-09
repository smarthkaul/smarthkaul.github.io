# Phase 0 — Broadcast Reskin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the existing scrolling portfolio into a Wimbledon tennis-broadcast look (grass turf + cream stat cards + purple chrome + neon-ball accent) without changing navigation, so the visual system is de-risked and shippable before any court/ball/player work.

**Architecture:** Purely presentational. Keep the current single-page scroll (`Home.jsx` composition), React Router setup, section `id`s, and the `useReveal` scroll hook. Introduce a small **broadcast UI kit** (`StatCard`, `Badge`, `Ticker`) and a **grass-turf page background**; every content section becomes a **cream `StatCard`** floating on the turf. No new runtime dependencies.

**Tech Stack:** React 18, Vite 6, Tailwind CSS 3, React Router DOM 7. No animation library yet (Phase 2+). No test framework yet (see Global Constraints).

**Plan 1 of 2 for the MVP.** Phase 1 (static SVG court + ball-less zone navigation + Framer Motion + `404.html` SPA fallback + reduced-motion gate) is a separate plan, written next against the components this plan produces.

## Global Constraints

- **All npm commands run from `website/`.** There is no `package.json` at the repo root.
- **Node 20** (matches CI in `.github/workflows/deploy.yml`).
- **Verification method — lint + build + manual visual check.** Per `AGENTS.md` ("There are currently no automated tests — verify visually with `npm run dev`"), Phase 0 is almost entirely presentational, so each task is verified with `npm run lint`, `npm run build`, and a specific manual dev-server checklist. A unit-test framework (Vitest) is deliberately deferred to Phase 1, where genuine logic (nav state machine, reduced-motion hook, URL sync) makes it worthwhile.
- **Component conventions (from `AGENTS.md`):** functional arrow components, `export default` at the bottom, one section per file, content in `UPPER_CASE` data arrays that you `.map()` over. Tailwind utilities inline; global CSS only in `src/index.css`.
- **New palette (retire `slate-950`/`violet` in every file you touch):** `grass` green surface, `wimbledon` purple chrome, `cream` panels, `charcoal` body text, `ball` neon-yellow accent. Exact hex is defined in Task 1.
- **Legibility rule:** long body text lives on **cream** cards as **charcoal**. **Neon `ball` yellow is graphic/accent only — never body text** (fails contrast on cream/white).
- **Typography:** `font-display` (Syne) for headings, default sans (Inter) for body, `font-mono` for eyebrow/telemetry labels (uppercase, tracked-out).
- **Section `id`s stay:** `#hero`, `#about`, `#experience`, `#projects`, `#contact` must remain (Navbar anchors still use them). Do not rename them in Phase 0.
- **External links:** always `target="_blank" rel="noopener noreferrer"` + an `aria-label` on icon-only links.
- **Do not commit `website/dist/`** (gitignored, built in CI).
- **Git workflow:** work on branch `feat/phase0-broadcast-reskin`; commit per task (atomic, **no AI co-author trailer**); open a PR at the end (Task 12). Never push to `main` directly.

---

## Before you begin

Create the working branch from an up-to-date `main`:

```bash
cd /Users/smarthkaul/Developer/smarthkaul.github.io
git checkout main && git pull origin main
git checkout -b feat/phase0-broadcast-reskin
cd website && npm install
```

Confirm the baseline builds before changing anything:

```bash
npm run lint && npm run build
```
Expected: lint clean, build succeeds into `dist/`.

---

## Task 1: Palette tokens + global broadcast CSS

**Files:**
- Modify: `website/tailwind.config.js`
- Modify: `website/src/index.css`

**Interfaces:**
- Produces: Tailwind color classes `bg-grass` / `bg-grass-dark` / `bg-grass-light`, `bg-wimbledon` / `text-wimbledon` / `bg-wimbledon-dark`, `bg-cream`, `text-charcoal`, `bg-ball` / `text-ball` (and every other utility variant). CSS utilities `.court-turf` (grass background with mow-stripes) and `.animate-ticker`. A global `prefers-reduced-motion` block that neutralizes decorative motion.

- [ ] **Step 1: Add the palette to `tailwind.config.js`**

Replace the entire file with:

```js
/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        grass: {
          light: "#3aa65c",
          DEFAULT: "#2f8f4e",
          dark: "#276e3c",
        },
        wimbledon: {
          light: "#6b4a8a",
          DEFAULT: "#4c2c69",
          dark: "#3a2151",
        },
        cream: "#f4f1e9",
        charcoal: "#181b18",
        ball: "#d6f84c",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Rewrite `src/index.css` for the broadcast system**

Replace the entire file with:

```css
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  background-color: #276e3c;
}

::selection {
  background-color: #d6f84c;
  color: #181b18;
}

/* Grass court background with mow-stripes */
.court-turf {
  background-color: #2f8f4e;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 0) 60px,
    rgba(0, 0, 0, 0.06) 60px,
    rgba(0, 0, 0, 0.06) 120px
  );
}

/* Broadcast ticker */
@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-ticker {
  animation: ticker 30s linear infinite;
}

/* Scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(28px);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Cursor blink for typewriter */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.cursor-blink {
  animation: blink 0.8s step-end infinite;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #3a2151;
}
::-webkit-scrollbar-thumb {
  background: #4c2c69;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d6f84c;
}

/* Reduced motion: neutralize all decorative animation */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .animate-ticker { animation: none; }
  .cursor-blink { animation: none; }
  .reveal { opacity: 1; transform: none; }
  .reveal.visible { transition: none; }
}
```

- [ ] **Step 3: Lint**

Run: `cd website && npm run lint`
Expected: no errors.

- [ ] **Step 4: Build**

Run: `cd website && npm run build`
Expected: build succeeds. (CSS-only changes; nothing consumes the new colors yet, so the visible page is unchanged except the body background is now dark green.)

- [ ] **Step 5: Commit**

```bash
git add website/tailwind.config.js website/src/index.css
git commit -m "Add broadcast palette tokens and global court CSS"
```

---

## Task 2: `StatCard` broadcast component

**Files:**
- Create: `website/src/components/broadcast/StatCard.jsx`

**Interfaces:**
- Produces: `StatCard` — default export. Props: `broadcast` (string, mono eyebrow), `title` (string, display heading), `headerRight` (ReactNode, right-aligned slot in the purple header), `id` (string), `className` (string), `children`. Renders a cream card; if any of `broadcast`/`title`/`headerRight` is set, a purple header strip is shown above the body. Consumed by Tasks 5, 6, 7, 8.

- [ ] **Step 1: Create the component**

Create `website/src/components/broadcast/StatCard.jsx` with:

```jsx
const StatCard = ({ broadcast, title, headerRight, id, className = "", children }) => {
  const hasHeader = broadcast || title || headerRight;
  return (
    <div
      id={id}
      className={`bg-cream text-charcoal rounded-2xl overflow-hidden shadow-xl shadow-black/25 ${className}`}
    >
      {hasHeader && (
        <div className="bg-wimbledon px-6 sm:px-8 py-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {broadcast && (
              <p className="font-mono text-ball text-xs uppercase tracking-widest">
                {broadcast}
              </p>
            )}
            {title && (
              <h2
                className="font-display font-extrabold text-white leading-tight mt-1"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
              >
                {title}
              </h2>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="px-6 sm:px-8 py-8">{children}</div>
    </div>
  );
};

export default StatCard;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build. (Not yet rendered anywhere — visual verification happens in Task 5 when About consumes it.)

- [ ] **Step 3: Commit**

```bash
git add website/src/components/broadcast/StatCard.jsx
git commit -m "Add StatCard broadcast component"
```

---

## Task 3: `Badge` broadcast component

**Files:**
- Create: `website/src/components/broadcast/Badge.jsx`

**Interfaces:**
- Produces: `Badge` — default export. Props: `children`, `tone` (`"ball"` | `"purple"` | `"outline"`, default `"ball"`), `className`. Renders a small pill-shaped mono chip. Consumed by Tasks 5, 6, 7, 8.

- [ ] **Step 1: Create the component**

Create `website/src/components/broadcast/Badge.jsx` with:

```jsx
const TONES = {
  ball: "bg-ball text-charcoal",
  purple: "bg-wimbledon text-white",
  outline: "border border-charcoal/25 text-charcoal/80",
};

const Badge = ({ children, tone = "ball", className = "" }) => (
  <span
    className={`inline-flex items-center font-mono text-[0.7rem] uppercase tracking-widest px-2.5 py-1 rounded-full ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Commit**

```bash
git add website/src/components/broadcast/Badge.jsx
git commit -m "Add Badge broadcast component"
```

---

## Task 4: `Ticker` broadcast component

**Files:**
- Create: `website/src/components/broadcast/Ticker.jsx`

**Interfaces:**
- Produces: `Ticker` — default export. Props: `items` (string[], default `[]`), `className`. Renders a horizontally scrolling purple strip; duplicates `items` once so the CSS `translateX(-50%)` loop is seamless. Decorative (`aria-hidden`). Consumed by Task 11 (`Home`).

- [ ] **Step 1: Create the component**

Create `website/src/components/broadcast/Ticker.jsx` with:

```jsx
const Ticker = ({ items = [], className = "" }) => {
  const loop = [...items, ...items];
  return (
    <div
      className={`overflow-hidden bg-wimbledon border-y border-black/20 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-8 whitespace-nowrap py-2 animate-ticker will-change-transform">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-mono text-cream/80 text-xs uppercase tracking-widest"
          >
            {item}
            <span className="text-ball">&bull;</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Commit**

```bash
git add website/src/components/broadcast/Ticker.jsx
git commit -m "Add Ticker broadcast component"
```

---

## Task 5: Reskin About → `THE PLAYER` stat card

**Files:**
- Modify: `website/src/components/About.jsx` (full replace)

**Interfaces:**
- Consumes: `StatCard` (Task 2), `Badge` (Task 3), `useReveal` (existing).

- [ ] **Step 1: Replace `About.jsx`**

Replace the entire file with:

```jsx
import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const PROFILE = [
  { k: "Base", v: "Toronto, ON 🇨🇦" },
  { k: "Plays", v: "Right-handed · Python / R" },
  { k: "Turned pro", v: "2022" },
  { k: "Specialty", v: "Machine Learning & Forecasting" },
];

const SKILLS = ["Machine Learning", "Statistics", "SQL", "Data Viz", "Python", "R"];

const About = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="about" className="px-6 sm:px-12 lg:px-24 py-16">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <StatCard broadcast="The Player" title="About">
          <p className="text-charcoal text-xl sm:text-2xl font-light leading-relaxed mb-6">
            I&apos;m a Statistics student at the University of Toronto specializing in
            machine learning and data science.
          </p>
          <p className="text-charcoal/70 text-base leading-relaxed mb-8">
            I care about building things that are both technically sound and actually
            useful — whether that&apos;s a forecasting model, a SQL pipeline, or a clean
            analysis. My background spans academic research, enterprise data work, and
            consulting, which gives me range. Outside of work: tennis, guitar, and trying
            to learn something new every week.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border-t border-charcoal/10 pt-6 mb-8">
            {PROFILE.map(({ k, v }) => (
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
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <Badge key={s} tone="purple">
                {s}
              </Badge>
            ))}
          </div>
        </StatCard>
      </div>
    </section>
  );
};

export default About;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Manual visual check**

Run: `cd website && npm run dev`, open the printed URL, scroll to the About section.
Expected: a cream card on green turf; purple header with a neon-yellow "THE PLAYER" eyebrow and white "About" title; bio in dark charcoal; a two-column profile grid; purple skill badges. Text is easily readable. Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add website/src/components/About.jsx
git commit -m "Reskin About as THE PLAYER stat card"
```

---

## Task 6: Reskin Experience → `CAREER RECORD` results table

**Files:**
- Modify: `website/src/components/Experience.jsx` (full replace)

**Interfaces:**
- Consumes: `StatCard` (Task 2), `Badge` (Task 3), `useReveal` (existing).
- Note: the accordion trigger is a `<button>`; the external company link lives **inside the expanded panel** (never nest an `<a>` in a `<button>`).

- [ ] **Step 1: Replace `Experience.jsx`**

Replace the entire file with:

```jsx
import { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const EXPERIENCE = [
  {
    company: "Grant Thornton",
    tournament: "Grant Thornton Open",
    url: "https://www.grantthornton.ca",
    role: "Business Consulting Intern",
    year: "2024",
    result: "def. 5 client projects",
    summary:
      "Analyzed market and regulatory datasets across 5 client projects, delivering data-driven insights for client strategy discussions.",
    tech: ["Excel", "Data Analysis", "Market Research"],
  },
  {
    company: "IESO",
    tournament: "IESO Championships",
    url: "https://www.ieso.ca",
    role: "Data Analyst Intern",
    year: "2023",
    result: "def. deploy time −25%",
    summary:
      "Built 30+ SQL queries for QA testing and streamlined 5 IT processes, reducing deployment time by 25%.",
    tech: ["SQL", "Python", "Identity Access Management"],
  },
  {
    company: "TekUncorked",
    tournament: "TekUncorked Classic",
    url: "https://www.tekuncorked.com/",
    role: "Industrial ML Intern",
    year: "2022",
    result: "def. energy disaggregation",
    summary:
      "Developed a supervised learning model using TensorFlow and Keras for household energy disaggregation.",
    tech: ["Python", "TensorFlow", "Keras"],
  },
];

const MatchRow = ({ job }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-charcoal/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left py-4 flex items-baseline justify-between gap-4"
      >
        <div className="flex items-baseline gap-4 min-w-0">
          <span className="font-mono text-charcoal/40 text-xs shrink-0">{job.year}</span>
          <span className="min-w-0">
            <span className="font-display font-bold text-charcoal block truncate">
              {job.tournament}
            </span>
            <span className="font-mono text-[0.7rem] uppercase tracking-widest text-grass-dark">
              {job.result}
            </span>
          </span>
        </div>
        <span
          className={`text-wimbledon shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          &#9662;
        </span>
      </button>

      {open && (
        <div className="pb-5 pl-10">
          <p className="text-charcoal/70 text-sm leading-relaxed mb-3">
            <span className="font-semibold text-charcoal">{job.role}</span> — {job.summary}
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.tech.map((t) => (
              <Badge key={t} tone="outline">
                {t}
              </Badge>
            ))}
          </div>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors"
          >
            Visit {job.company} &#8599;
          </a>
        </div>
      )}
    </div>
  );
};

const Experience = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="experience" className="px-6 sm:px-12 lg:px-24 py-16">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <StatCard
          broadcast="Career Record"
          title="Experience"
          headerRight={<Badge tone="ball">Career 3&ndash;0</Badge>}
        >
          {EXPERIENCE.map((job, i) => (
            <MatchRow key={i} job={job} />
          ))}
        </StatCard>
      </div>
    </section>
  );
};

export default Experience;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Manual visual check**

Run `npm run dev`, scroll to Experience.
Expected: cream card, "CAREER RECORD" eyebrow, "Experience" title, a neon "CAREER 3–0" badge top-right of the purple header. Three rows each showing year + tournament name + a "def. …" result line. Clicking a row expands it to reveal role, summary, tech badges, and a "Visit … ↗" external link; the chevron rotates. Keyboard: Tab to a row, press Enter — it toggles.

- [ ] **Step 4: Commit**

```bash
git add website/src/components/Experience.jsx
git commit -m "Reskin Experience as CAREER RECORD results table"
```

---

## Task 7: Reskin Projects → `HIGHLIGHT REEL` replay cards

**Files:**
- Modify: `website/src/components/Projects.jsx` (full replace)

**Interfaces:**
- Consumes: `StatCard` (Task 2), `Badge` (Task 3), `useReveal` (existing).

- [ ] **Step 1: Replace `Projects.jsx`**

Replace the entire file with:

```jsx
import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const PROJECTS = [
  {
    title: "NCAA March Madness Prediction Model",
    hero: "0.1230",
    heroLabel: "Brier score",
    description:
      "Ensemble ML model predicting tournament outcomes. Engineered features including seed differences, 14-day win rates, and adjusted season stats. Achieved a Brier Score of 0.1230 vs. 0.1041 benchmark.",
    tech: ["Python", "XGBoost", "Logistic Regression", "Scikit-learn"],
    github: null,
  },
  {
    title: "Energy Forecasting Model",
    hero: "13+ yrs",
    heroLabel: "data modeled",
    description:
      "SARIMA + VAR time series models on 13+ years of Canadian and US electricity data. Applied seasonal differencing, stationarity testing, and Granger causality analysis to quantify cross-source dependencies.",
    tech: ["R", "SARIMA", "VAR", "Time Series"],
    github: null,
  },
];

const ProjectCard = ({ project }) => (
  <StatCard broadcast="Highlight Reel" headerRight={<Badge tone="ball">Replay</Badge>}>
    <div className="flex items-start justify-between gap-4 mb-4">
      <h3
        className="font-display font-extrabold text-charcoal leading-tight"
        style={{ fontSize: "clamp(1.4rem, 3.5vw, 2rem)" }}
      >
        {project.title}
      </h3>
      <div className="text-right shrink-0">
        <div className="font-mono font-bold text-charcoal text-2xl leading-none">
          {project.hero}
        </div>
        <div className="font-mono text-[0.6rem] uppercase tracking-widest text-charcoal/50 mt-1">
          {project.heroLabel}
        </div>
      </div>
    </div>
    <p className="text-charcoal/70 leading-relaxed mb-5">{project.description}</p>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <Badge key={t} tone="outline">
            {t}
          </Badge>
        ))}
      </div>
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors shrink-0"
        >
          Full match &#8599;
        </a>
      )}
    </div>
  </StatCard>
);

const Projects = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="projects" className="px-6 sm:px-12 lg:px-24 py-16">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <p className="font-mono text-cream text-xs uppercase tracking-widest mb-4">
          Highlight Reel
        </p>
        <div className="grid grid-cols-1 gap-6">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={i} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Manual visual check**

Run `npm run dev`, scroll to Projects.
Expected: two cream replay cards, each with a purple "HIGHLIGHT REEL" header + neon "REPLAY" badge, the project title on the left and a large hero numeral (`0.1230` / `13+ yrs`) on the right, description, and outline tech badges. (No GitHub links render because `github` is `null` — that's expected.)

- [ ] **Step 4: Commit**

```bash
git add website/src/components/Projects.jsx
git commit -m "Reskin Projects as HIGHLIGHT REEL replay cards"
```

---

## Task 8: Reskin Contact → `MATCH POINT` end card

**Files:**
- Modify: `website/src/components/Contact.jsx` (full replace)

**Interfaces:**
- Consumes: `StatCard` (Task 2), `Badge` (Task 3), `useReveal` (existing).

- [ ] **Step 1: Replace `Contact.jsx`**

Replace the entire file with:

```jsx
import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const Contact = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="contact" className="px-6 sm:px-12 lg:px-24 py-16 pb-24">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <StatCard
          broadcast="Match Point"
          title="Let's work together."
          headerRight={<Badge tone="ball">Match Point</Badge>}
        >
          <p className="text-charcoal/70 text-lg leading-relaxed mb-8 max-w-md">
            I&apos;m looking for co-op and full-time opportunities in data science and
            machine learning. If you have a role, a project, or just want to talk — return
            serve.
          </p>

          <a
            href="mailto:smarth.kaul@mail.utoronto.ca"
            className="inline-flex items-center gap-3 bg-wimbledon hover:bg-grass text-white font-display font-bold px-6 py-4 rounded-xl transition-colors mb-3"
          >
            <span>Return serve</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
          <p className="font-mono text-xs text-charcoal/50 break-all mb-10">
            smarth.kaul@mail.utoronto.ca
          </p>

          <p className="font-mono text-xs uppercase tracking-widest text-charcoal/40 mb-3">
            Official partners
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/smarthkaul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-charcoal/15 text-charcoal/70 hover:text-charcoal hover:border-charcoal/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/in/smarth-kaul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-charcoal/15 text-charcoal/70 hover:text-charcoal hover:border-charcoal/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </StatCard>
      </div>
    </section>
  );
};

export default Contact;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Manual visual check**

Run `npm run dev`, scroll to Contact.
Expected: cream card, "MATCH POINT" header + badge, the "Return serve" purple button (mails on click), the email in mono below, and two "Official partners" icon buttons (GitHub, LinkedIn) that open in new tabs.

- [ ] **Step 4: Commit**

```bash
git add website/src/components/Contact.jsx
git commit -m "Reskin Contact as MATCH POINT end card"
```

---

## Task 9: Reskin Hero → broadcast title card

**Files:**
- Modify: `website/src/components/Hero.jsx` (full replace)

**Interfaces:**
- Consumes: nothing new. Keeps the existing typewriter logic (`PHRASES`, `useState`/`useEffect`) verbatim; only markup/palette changes.
- Note: Hero is repurposed into the court hub in Phase 1; keep this reskin light but coherent.

- [ ] **Step 1: Replace `Hero.jsx`**

Replace the entire file with:

```jsx
import { useState, useEffect } from "react";

const PHRASES = ["statistics student.", "machine learning engineer.", "data scientist."];
const TYPE_SPEED = 65;
const DELETE_SPEED = 35;
const PAUSE_MS = 1800;

const Hero = () => {
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
      timeout = setTimeout(
        () => setDisplay(phrase.slice(0, display.length + 1)),
        TYPE_SPEED
      );
    } else {
      timeout = setTimeout(() => setDisplay(display.slice(0, -1)), DELETE_SPEED);
    }
    return () => clearTimeout(timeout);
  }, [display, deleting, phraseIdx]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24"
    >
      <div className="max-w-5xl">
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-ball animate-pulse" />
          <span className="font-mono text-cream text-xs uppercase tracking-widest">
            Live &middot; Toronto, ON
          </span>
        </div>

        <h1
          className="font-display font-extrabold text-cream leading-none tracking-tight mb-8"
          style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}
        >
          Smarth
          <br />
          Kaul
        </h1>

        <div className="flex items-center gap-1 mb-14" style={{ minHeight: "2.5rem" }}>
          <span className="text-cream/90 text-xl sm:text-2xl font-light">{display}</span>
          <span className="cursor-blink text-ball text-2xl font-light select-none">|</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/smarthkaul"
            aria-label="GitHub"
            className="text-cream/60 hover:text-cream transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/smarth-kaul"
            aria-label="LinkedIn"
            className="text-cream/60 hover:text-cream transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="mailto:smarth.kaul@mail.utoronto.ca"
            aria-label="Email"
            className="text-cream/60 hover:text-cream transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-6 sm:left-12 lg:left-24 flex flex-col items-start gap-1 text-cream/50">
        <span className="text-xs tracking-widest uppercase font-mono">Scroll</span>
        <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
```

- [ ] **Step 2: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 3: Manual visual check**

Run `npm run dev`, view the top of the page.
Expected: cream "Smarth Kaul" over green turf, a pulsing neon "LIVE · Toronto, ON" bug, the typewriter tagline cycling with a neon caret, cream social icons, and a scroll hint. Reduce-motion users: the caret and pulse hold still (verify by enabling "Reduce motion" in OS settings if convenient — optional).

- [ ] **Step 4: Commit**

```bash
git add website/src/components/Hero.jsx
git commit -m "Reskin Hero as broadcast title card"
```

---

## Task 10: Reskin Navbar + Footer chrome

**Files:**
- Modify: `website/src/components/Navbar.jsx` (full replace)
- Modify: `website/src/components/Footer.jsx` (full replace)

- [ ] **Step 1: Replace `Navbar.jsx`**

Replace the entire file with:

```jsx
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Work", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-wimbledon/90 backdrop-blur-md border-b border-wimbledon-dark"
          : "bg-transparent"
      }`}
    >
      <nav className="flex items-center justify-between h-16 px-6 sm:px-12 lg:px-24">
        <a
          href="#hero"
          className="font-display font-bold text-cream text-lg tracking-tight hover:text-ball transition-colors"
        >
          SK
        </a>

        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-cream/70 hover:text-ball transition-colors text-sm font-medium"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden text-cream/70 hover:text-ball transition-colors"
          onClick={() => setMenuOpen((p) => !p)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden bg-wimbledon/95 backdrop-blur-md border-b border-wimbledon-dark px-6 py-4">
          <ul className="flex flex-col gap-4 list-none m-0 p-0">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="text-cream hover:text-ball text-sm font-medium transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
```

- [ ] **Step 2: Replace `Footer.jsx`**

Replace the entire file with:

```jsx
const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-wimbledon-dark py-8 px-6 sm:px-12 lg:px-24 bg-wimbledon">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <a
          href="#hero"
          className="font-display font-bold text-cream/70 hover:text-ball transition-colors text-sm"
        >
          Smarth Kaul
        </a>
        <p className="font-mono text-cream/40 text-xs">&copy; {year}</p>
      </div>
    </footer>
  );
};

export default Footer;
```

- [ ] **Step 3: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 4: Manual visual check**

Run `npm run dev`.
Expected: navbar is transparent at the top, then turns translucent purple with a neon "SK" + links on scroll; mobile menu (narrow the window) opens a purple panel. Footer is a solid purple bar with cream text.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/Navbar.jsx website/src/components/Footer.jsx
git commit -m "Reskin Navbar and Footer chrome"
```

---

## Task 11: Turf background, Ticker wiring, 404 reskin, meta

**Files:**
- Modify: `website/src/pages/Layout.jsx` (full replace)
- Modify: `website/src/pages/Home.jsx` (full replace)
- Modify: `website/src/pages/Pagenotfound.jsx` (full replace)
- Modify: `website/index.html` (add one meta tag)

**Interfaces:**
- Consumes: `Ticker` (Task 4).

- [ ] **Step 1: Replace `Layout.jsx` (apply turf to the page)**

Replace the entire file with:

```jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

const Layout = () => (
  <>
    <Navbar />
    <main className="court-turf min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

export default Layout;
```

- [ ] **Step 2: Replace `Home.jsx` (compose + skills ticker)**

Replace the entire file with:

```jsx
import Hero from "../components/Hero";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";
import Ticker from "../components/broadcast/Ticker";

const TECH = [
  "Python",
  "R",
  "SQL",
  "TensorFlow",
  "Scikit-learn",
  "XGBoost",
  "Time Series",
  "Machine Learning",
  "Data Viz",
  "Statistics",
];

const Home = () => (
  <>
    <Hero />
    <Ticker items={TECH} />
    <About />
    <Experience />
    <Projects />
    <Contact />
  </>
);

export default Home;
```

- [ ] **Step 3: Replace `Pagenotfound.jsx` (broadcast "OUT" call)**

Replace the entire file with:

```jsx
import { Link } from "react-router-dom";

const Pagenotfound = () => (
  <section className="min-h-screen court-turf flex items-center justify-center px-4">
    <div className="bg-cream text-charcoal rounded-2xl overflow-hidden shadow-xl shadow-black/25 max-w-md w-full text-center">
      <div className="bg-wimbledon px-6 py-4">
        <p className="font-mono text-ball text-xs uppercase tracking-widest">Line call</p>
      </div>
      <div className="px-6 py-10">
        <p className="font-display font-extrabold text-wimbledon text-7xl mb-2">OUT</p>
        <h1 className="font-display font-bold text-charcoal text-2xl mb-3">404 — page not found</h1>
        <p className="text-charcoal/60 mb-8">
          That shot landed out of bounds. The page you&apos;re looking for doesn&apos;t
          exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-wimbledon hover:bg-grass text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          &larr; Back to the court
        </Link>
      </div>
    </div>
  </section>
);

export default Pagenotfound;
```

- [ ] **Step 4: Add a theme-color meta tag to `index.html`**

In `website/index.html`, add a `theme-color` meta immediately after the existing `description` meta (line 8). The `<head>` should read:

```html
    <title>Smarth Kaul — Statistics & Machine Learning</title>
    <meta name="description" content="Personal portfolio of Smarth Kaul — Statistics & ML student at the University of Toronto, with experience in data analysis, machine learning, and business consulting." />
    <meta name="theme-color" content="#2f8f4e" />
```

- [ ] **Step 5: Lint + build**

Run: `cd website && npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 6: Manual visual check**

Run `npm run dev`.
Expected: the whole page sits on green turf with visible mow-stripes behind the cream cards; a purple skills ticker scrolls between the hero and About. Visit a bad URL (e.g. `/nope`) to see the reskinned "OUT" 404 card.

- [ ] **Step 7: Commit**

```bash
git add website/src/pages/Layout.jsx website/src/pages/Home.jsx website/src/pages/Pagenotfound.jsx website/index.html
git commit -m "Apply turf background, wire skills ticker, reskin 404 and meta"
```

---

## Task 12: Full-site verification + open PR

**Files:** none (verification + release).

- [ ] **Step 1: Clean lint + production build**

Run: `cd website && npm run lint && npm run build`
Expected: lint passes with no errors; build completes and writes `dist/`.

- [ ] **Step 2: Preview the production build**

Run: `cd website && npm run preview`
Open the printed URL and walk the whole page top to bottom.
Expected checklist (all must hold):
  - Green turf background with mow-stripes throughout; no leftover `slate-950` dark panels; no `violet` accents anywhere.
  - Hero, ticker, and all four cream cards (About / Experience / Projects / Contact) render legibly (charcoal on cream).
  - Navbar anchor links (`Work` / `Projects` / `Contact`) scroll to the right sections; the `SK` and footer links jump to the hero.
  - Experience rows expand/collapse on click and on keyboard (Tab + Enter).
  - `Return serve` opens a mail draft; all external links open in new tabs.
  - Neon yellow appears only as accents/badges/numerals, never as body text.
Stop the preview server when done.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feat/phase0-broadcast-reskin
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --title "Phase 0: Wimbledon broadcast reskin" --body "Implements Phase 0 of the tennis-broadcast redesign (plan/2026-07-08-tennis-redesign-phase0-reskin-plan.md).

- Broadcast palette (grass / Wimbledon purple / cream / charcoal / neon-ball) in Tailwind + global court CSS
- Broadcast UI kit: StatCard, Badge, Ticker
- Reskinned sections: About (THE PLAYER), Experience (CAREER RECORD, def. framing), Projects (HIGHLIGHT REEL replay cards), Contact (MATCH POINT)
- Turf page background, skills ticker, reskinned Navbar/Footer/Hero/404
- Navigation unchanged (still a scrolling page); court/ball/player land in later phases

Docs-and-UI only; no dependency or routing changes."
```

- [ ] **Step 5: Review and merge**

Review the PR diff on GitHub, confirm CI (the deploy workflow builds on push) is green, then merge (squash) and delete the branch. Sync local `main` afterward:

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull origin main
```

---

## Self-Review (against the spec)

**1. Spec coverage (§3 design system, §6 sections):**
- §3.1 palette → Task 1. §3.2 typography → preserved in Task 1 config + used throughout. §3.3 UI kit → StatCard/Badge/Ticker (Tasks 2–4); `LowerThird`/score-bug/Hawk-Eye are HUD/court elements deferred to Phase 1 (noted below). ✅
- §6.1 About "THE PLAYER" → Task 5. The **skills radar chart** (§6.1) is intentionally deferred — it needs SVG-polygon work that doesn't belong in a CSS-only reskin phase; Task 5 ships a profile stat-grid + skill badges in its place. Tracked as a Phase 1/polish follow-up.
- §6.2 Experience "CAREER RECORD" + `def.` framing + `CAREER 3–0` → Task 6. ✅
- §6.3 Projects "HIGHLIGHT REEL" + REPLAY badge + hero numerals → Task 7. ✅
- §6.4 Contact "MATCH POINT" + RETURN SERVE + sponsor bugs → Task 8. ✅
- §9 Phase 0 scope ("reskin onto cream cards, still a normal scrolling page") → Tasks 1–11 exactly. Ball/court/player/HUD, URL sync, the 404.html SPA fallback, and the JS reduced-motion gate are **Phase 1** and correctly excluded here (a CSS-level reduced-motion block is included in Task 1 as a down-payment). ✅

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N". Every code step shows complete file contents. ✅

**3. Type/name consistency:** `StatCard` prop set (`broadcast`, `title`, `headerRight`, `id`, `className`, `children`) is defined in Task 2 and used with exactly those names in Tasks 5–8. `Badge` `tone` values (`ball`/`purple`/`outline`) defined in Task 3 and only those are used. `Ticker` `items` prop defined in Task 4, passed in Task 11. Color classes (`grass`/`grass-dark`/`grass-light`, `wimbledon`/`wimbledon-dark`, `cream`, `charcoal`, `ball`) defined in Task 1 and used consistently. ✅

**Deferred to Phase 1 (recorded so nothing is lost):** skills radar chart, `LowerThird`/score-bug/Hawk-Eye kit pieces, `sections.js` zone config, Vitest test harness, the JS `usePrefersReducedMotion` hook, and all court/ball/player/routing work.
