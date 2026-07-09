# AGENTS.md

Guidance for AI agents (and humans) working in this repository. Read this before making changes.

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
└── website/
    ├── index.html                 # Vite entry HTML; <title> + meta description
    ├── vite.config.js             # minimal (react plugin only, base = "/")
    ├── tailwind.config.js         # font family extensions
    ├── postcss.config.js          # tailwind + autoprefixer
    ├── eslint.config.js           # flat ESLint config
    ├── package.json
    └── src/
        ├── main.jsx               # React root, StrictMode
        ├── App.jsx                # Router + route table
        ├── index.css              # font import, Tailwind directives, custom keyframes
        ├── pages/
        │   ├── Layout.jsx         # Navbar + <Outlet/> + Footer shell
        │   ├── Home.jsx           # composes the section components
        │   └── Pagenotfound.jsx   # 404 route
        ├── components/            # one file per page section (see below)
        └── hooks/
            └── useReveal.js       # IntersectionObserver scroll-reveal hook
```

## Rendering architecture

```
main.jsx
└── App.jsx  (BrowserRouter)
    └── "/" → Layout.jsx
              ├── Navbar        (fixed, anchor-link nav)
              ├── <Outlet/>
              │   ├── index    → Home.jsx
              │   │             Hero → About → Experience → Projects → Contact
              │   └── "*"      → Pagenotfound.jsx
              └── Footer
```

`Home.jsx` is a pure composition file — it renders the section components in order. Each section is a self-contained component in `src/components/` that owns its own data and layout.

### The sections

- **Hero** — name + animated typewriter tagline (self-contained `setTimeout`/`useEffect` typing logic) + social links.
- **About** — short bio prose.
- **Experience** — accordion list of jobs; data in the `EXPERIENCE` array; each row expands to show summary + tech tags.
- **Projects** — list of projects; data in the `PROJECTS` array; optional GitHub link per project.
- **Contact** — email + social links CTA.
- **Navbar / Footer** — chrome rendered by `Layout`, shared across routes.

## Conventions — follow these when editing

**Components**
- Functional components, arrow-function style, `export default` at the bottom.
- One section per file. Keep a component's content, sub-components (e.g. `ExperienceRow`, `ProjectCard`), and data in the same file.
- Content is **data-driven**: declare an `UPPER_CASE` const array/object at the top of the file (`EXPERIENCE`, `PROJECTS`, `NAV_LINKS`, `PHRASES`) and `.map()` over it. To add a job or project, edit the array — don't hand-write JSX rows.

**Styling**
- Tailwind utility classes inline. No separate CSS files per component; global custom CSS lives only in `src/index.css`.
- Use inline `style={{ fontSize: "clamp(...)" }}` for fluid/responsive font sizes — this is the established pattern for large display headings.
- **Palette:** `slate-950` backgrounds, `white`/`slate-300`/`slate-400` text, **`violet-400`** as the accent color.
- **Typography:** `font-display` (Syne) for headings, `font-mono` for eyebrow labels and metadata, default sans (Inter) for body.
- **Eyebrow label pattern:** `font-mono text-slate-500 text-xs uppercase tracking-widest` above each section heading.
- **Section shell pattern:** `<section id="..." className="py-24 bg-slate-950 px-6 sm:px-12 lg:px-24">` with an inner `max-w-3xl` (or similar) wrapper.

**Section IDs & navigation**
- Navbar links are in-page anchors (`#hero`, `#experience`, `#projects`, `#contact`). Every navigable section needs a matching `id`. If you rename or remove a section id, update `NAV_LINKS` in `Navbar.jsx`.

**Scroll reveal**
- To animate a block in on scroll, use the `useReveal()` hook: `const [ref, visible] = useReveal();` then apply `ref` and `` className={`reveal ${visible ? "visible" : ""}`} ``. The `.reveal` / `.visible` CSS lives in `index.css`. Stagger multiple items with `style={{ transitionDelay: \`${idx * 80}ms\` }}`.

**External links**
- Always `target="_blank" rel="noopener noreferrer"` and an `aria-label` on icon-only links.

## Commands

Run all of these from the `website/` directory:

```bash
npm install     # install deps
npm run dev      # local dev server (http://localhost:5173)
npm run build    # production build → website/dist/
npm run preview  # preview the production build locally
npm run lint     # ESLint
```

## Build & deploy

- **Automatic.** `.github/workflows/deploy.yml` runs on every push to `main` (and via manual `workflow_dispatch`).
- The workflow: checkout → setup Node 20 → `npm ci` → `npm run build` (in `website/`) → upload `website/dist` → deploy to GitHub Pages.
- Deploys are serialized with a `pages` concurrency group; in-progress runs are cancelled by newer pushes.
- **Do not commit `website/dist/`** — it's gitignored and built in CI.
- This is a **user site** (`smarthkaul.github.io`), served from the domain root, so Vite's `base` stays `"/"`. Do not add a repo sub-path base.

## Design consistency

The whole site now uses one design language — there is no `indigo`/`violet` split anymore. Keep it that way:

- **Accent color is `violet`** everywhere (`violet-400` for text/icons, `violet-600`/`violet-500` for buttons). Do not introduce `indigo` or other accent hues.
- **Headings use `font-display`** (Syne). This applies to route pages too, not just the home sections (see `Pagenotfound.jsx`).
- The favicon is an `SK` monogram at `public/favicon.svg` (slate-950 background, violet lettering), referenced from `index.html`. If you rebrand, update that one file.
- There is no blog. A `Blog.jsx` component previously existed as an orphaned placeholder and was removed. If you add one, follow the current conventions (violet accent, `font-display` headings, `max-w-3xl` section shell, `useReveal` for scroll-in) rather than reviving the old placeholder patterns.

## Guardrails for agents

- Keep changes scoped to `website/`. There is no source outside it.
- When adding content (a job, project, link), edit the relevant data array — don't restructure the component.
- Match the existing Tailwind palette and typography rather than introducing new colors/fonts.
- Run `npm run lint` and `npm run build` from `website/` before finishing; a broken build blocks deploys.
- There are currently **no automated tests** — verify visually with `npm run dev` when changing layout or interactive behavior (typewriter, accordion, scroll reveal, mobile menu).
