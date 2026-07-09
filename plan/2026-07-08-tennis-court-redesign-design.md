# Design Spec — Tennis Broadcast Portfolio Redesign

- **Date:** 2026-07-08
- **Author:** Smarth Kaul
- **Status:** Approved design, ready for implementation planning
- **Scope:** Full redesign of `smarthkaul.github.io` around a top-down tennis-broadcast theme

---

## 1. Concept

The site becomes a **live tennis broadcast, viewed top-down**. Content is unchanged in substance (bio, three internships, two projects, contact) but is re-presented as a televised match: a grass court, broadcast graphics, and a Wii-style player mascot that represents Smarth.

The signature interaction is **ball-driven navigation**: a player stands at the baseline idly bouncing a ball; the four sections are the four **service boxes**; clicking a box makes the player hit the ball into it, and the section erupts from the ball's impact point. There is no traditional navbar. Scrolling reads *within* a section; hitting the ball moves *between* sections.

The whole thing is progressive: it ships as a complete, themed site early (Phase 0–1) and layers cinematic delight on top (Phases 2–4) without ever being live-broken.

---

## 2. Locked decisions (quick reference)

| Fork | Decision |
|---|---|
| Visual world | **Daytime broadcast realism** (not the old dark identity) |
| Court surface | **Grass / Wimbledon** — green + purple palette |
| Navigation | **Ball-driven**: click a service-box zone → player serves → section erupts from impact. No navbar. |
| Court persistence | Court is a **persistent stage**; opening a section **shrinks the court into a corner HUD**; sections are broadcast overlays, not a scrolling document |
| Player build | **Hand-built SVG mascot, rigged with GSAP** (not Rive/Lottie/Three.js) |
| Animation stack | **Framer Motion** (React UI layer) **+ GSAP** (choreography, ball physics, player rig) |
| Routing | **React Router** with per-section URLs; **`404.html` SPA fallback** for clean paths; `base: "/"` |
| Rival (matchup card) | **Deferred** — configurable "rival slot" with a placeholder; structure is fixed, identity is TBD |

Everything stays scoped to `website/` (per `AGENTS.md`). The one exception: `AGENTS.md` and `CLAUDE.md` guidance themselves must be updated as part of this work, because they currently codify the old dark/violet system (see §11).

---

## 3. Design system — a Wimbledon broadcast

### 3.1 Palette

Proposed starting values; exact hex is tuned in Phase 0. The old `slate-950` base is retired.

| Role | Proposed | Usage |
|---|---|---|
| Grass green (surface) | `#2F8F4E` primary + `#276E3C` stripe | Court surface, rendered with alternating **mow-stripes** (CSS gradient, not per-blade nodes) |
| Wimbledon purple | `#4C2C69` | Primary chrome: lower-thirds, HUD, headers — where the old violet now lives |
| White | `#FFFFFF` | Court lines; primary text on purple/green |
| Cream | `#F4F1E9` | **Content panels** — all long text lives on cream cards, never on raw grass (legibility) |
| Charcoal | `#181B18` | Body text on cream panels |
| Neon ball yellow | `#D6F84C` | The hot accent, used sparingly: the ball, active states, stat numerals, CTAs, "live" dots |

**Contrast rules:** cream + charcoal is the high-contrast body-text pairing. White-on-green/purple must be checked for AA. **Neon yellow is graphic-only — never body text** (fails contrast on white/cream). State is never signaled by color alone.

### 3.2 Typography

Keep the existing families and roles:

- **Syne** (`font-display`) — big broadcast headlines, section titles, scoreboard.
- **Inter** (default sans) — body text on cream cards.
- **Mono** (`font-mono`, existing eyebrow style: uppercase, tracked-out) — **broadcast telemetry**: scores, stat numerals, timecodes, tech tags. This is the sports-graphics numeral look and reuses the current convention.

Fonts are **self-hosted + preloaded** (not render-blocking from Google's CDN) to kill FOUT.

### 3.3 Broadcast UI kit (recurring components)

A small, reusable set that makes everything read as one telecast:

- **Lower-third** — graphic bar sliding in from bottom-left to name the current section. Section headers *are* lower-thirds.
- **Score bug / HUD** — persistent top-corner scoreboard. Doubles as the **mini-court minimap** with player + four zones; this is what keeps the player "always visible."
- **Stat card** — cream panel, purple header strip, yellow numerals. Universal container for content-heavy sections.
- **Replay / call badges** — circular chips: `REPLAY`, `ACE`, `MATCH POINT`, `CHALLENGE`. Used as tags, "live" indicators, easter eggs.
- **Ticker** — thin scrolling strip for skills/tech, tournament-broadcast style.
- **Hawk-Eye trace** — dotted ball-trajectory line; reused as decorative motif and transition path.
- **Transitions** — replay-wipe, camera-cut flash, score-flip, and the signature **ball-impact ripple**.

---

## 4. Court & navigation model

### 4.1 Court layout & zone map

Top-down grass court, **net across the middle**, vertical mow-stripes. The player mascot stands at the **near baseline, bottom-center**. The four **service boxes** are the destinations. Because a real court is longer than wide, this maps naturally to a portrait phone screen (near boxes low, far boxes high).

| Court position | Section | Broadcast label |
|---|---|---|
| Near-left box | **About** | `THE PLAYER` |
| Near-right box | **Experience** | `CAREER RECORD` |
| Far-left box | **Projects** | `HIGHLIGHT REEL` |
| Far-right box | **Contact** | `MATCH POINT` |

Near boxes are short, inviting serves; far boxes arc higher/longer (Contact = the deep "match point" put-away). The mapping is a single config array, trivially reordered.

### 4.2 The serve — the core interaction

1. **Idle.** Player bounces the ball (looping GSAP timeline). Zones **breathe** (soft glow pulse) to read as live.
2. **Hover** (desktop). Zone label brightens; a faint **Hawk-Eye dotted arc** previews the trajectory; a `SERVE ▸` chip appears.
3. **Trigger.** Click / Enter → player **wind-up → toss → swing**.
4. **Flight.** GSAP `MotionPath` arcs the ball to the box (~600–800ms; far boxes higher/longer), dotted trail following. **The destination section mounts hidden during flight** — this is the loading buffer.
5. **Impact.** Ball lands → **impact ripple**: expanding ring + court-line flash + neon pop. Optional soft "pock" SFX (muted default).
6. **Erupt.** The section's **cream stat card grows from the exact impact coordinates** (Framer Motion, transform-origin = landing point); **lower-third slides in**; URL updates to `/about` etc.

### 4.3 Court's two states (one element, two sizes)

- **Hub state** — full court fills the stage (the landing after the intro); four live zones.
- **Docked state** — opening a section **smoothly shrinks the whole court into the top-corner score-bug HUD**; same court/player/zones, miniaturized; the cream card takes the main stage.

One court component animates between full-size and mini. From a section, navigate by hitting a zone on the docked mini-court, or a `↩ RETURN TO COURT` button re-expands it. Section-to-section: current card **replay-wipes** out as the ball flies to the new box and the next card erupts. Mental model: **serve = move between · scroll = read within.**

### 4.4 Fallbacks, discovery, mobile

- **Escape hatch:** a discreet **menu button** in the HUD opens a plain list of the four sections as ordinary links — insurance for anyone who doesn't grok the ball metaphor. Required.
- **Accessible:** zones are real `<button>`s with `aria-label`s and broadcast-styled focus rings; Tab + Enter serves. On navigation, focus moves to the new section heading and a live region announces it. Court/players are `aria-hidden` decoration.
- **First-time coach-mark:** after the intro, the player performs **one phantom auto-demo serve** — hits the ball at a zone and it **bounces straight back** (no navigation), teaching the gesture; then `SERVE TO EXPLORE` fades in over the nearest zone. Shown once, works on mobile (where hover can't teach). Enabled on all platforms.
- **Mobile:** zones tap directly to serve; court sits naturally in portrait; HUD becomes a bottom bar; flights shortened; menu fallback more prominent.

---

## 5. Entry experience — cold open to first serve

### 5.1 Structure reconciliation

The brief's "two players walk on" and the "matchup card" (inherently two-sided) reconcile with single-player navigation via a **rival**: two players walk on (Smarth + a tongue-in-cheek opponent), the card shows a real head-to-head, then the match "starts," the rival is dispatched, and **only Smarth's player stays** for navigation. The rival's identity is a **deferred content decision** (see §11) — a placeholder fills the slot; the mechanic is agnostic to it.

### 5.2 Choreography (beats & timing)

| Beat | ~Time | What happens |
|---|---|---|
| **0 · Bumper** | 0–0.8s | Black → neon ball bounces in and "serves" the `SK` monogram; a `LIVE` bug blinks. |
| **1 · Court builds** | 0.8–2.5s | Top-down. Court lines **draw themselves** (GSAP `stroke-dashoffset`): boundary → singles lines → service boxes → center line. Grass mow-stripes wipe across; net rises. Muted crowd swell. |
| **2 · Players walk on** | 2.5–3.8s | Smarth from near baseline, rival from far. Rackets up, a wave, a quick meet-at-net. |
| **3 · Matchup card** | 3.8–6.3s | Tale-of-the-tape flips in; stat rows animate; **numerals count up** (serve-speed style). Holds ~2.5s. |
| **4 · Match point** | 6.3–7.5s | Card wipes out; Smarth wins the point; rival bows off; player settles to baseline, idle-bounces. Court enters **Hub** state, zones breathe, **phantom auto-demo** fires, `SERVE TO EXPLORE` appears. |

### 5.3 Matchup card content

Split card, `VS` middle. Left = Smarth (real stats), right = rival (placeholder/joke stats). Stats pull from existing content arrays. Draft (copy finalized later):

```
SMARTH KAUL              🇨🇦    │        [RIVAL — deferred]
Toronto, ON                    │
── TALE OF THE TAPE ──         │
PLAYS      Right · Python/R     │
TURNED PRO 2022                │
SPECIALTY  ML & Forecasting     │
TITLES     3 internships        │
FORM       Stats @ UofT         │
── "Big serve, low Brier score." ──
```

The rendered matchup card is exported as the site's **Open Graph image** for link previews.

### 5.4 Guardrails (non-negotiable)

- **Skippable always** — persistent `SKIP ▸` on every beat.
- **Plays once** — `localStorage` flag sends returning visitors straight to Hub (or a ~1.5s micro-version).
- **Reduced-motion / slow assets** — `prefers-reduced-motion` → skip to Hub, matchup card shown static (or omitted). If real assets lag, the court-build gently loops until the app is ready, masking the load.

---

## 6. The four sections

Each erupts from ball impact as a cream stat card wearing the broadcast kit.

### 6.1 About — `THE PLAYER` (athlete profile)

Broadcast "meet the player" dossier. Left: mascot in a framed **player card** (flag, base, "plays right-handed · Python/R"). Right: bio as a **scouting report** that types in. Feature element: a **skills radar chart** — the "player attributes" graphic sports games use, with axes *ML, Statistics, SQL, Data Viz, Communication* — a genuine data-viz that reads as a broadcast player rating. Stat rows stagger in; radar draws itself.

### 6.2 Experience — `CAREER RECORD` (results table)

Match-history scoreboard where **every accomplishment is a defeated opponent**. Each job is a tournament; each impact metric is a scoreline:

```
2024   GRANT THORNTON OPEN     Business Consulting   def. 5 client projects        ▸
2023   IESO CHAMPIONSHIPS      Data Analyst          def. deploy time  −25%        ▸
2022   TEKUNCORKED CLASSIC     Industrial ML         def. energy disaggregation    ▸
```

Rows **deal in** like cards; clicking a row **flips it open** into a "match report" (the existing accordion pattern, reskinned) with the full summary + tech tags as match stats. A persistent **`CAREER 3–0`** record bug. Metric numerals count up on reveal. Data stays in the existing `EXPERIENCE` array.

### 6.3 Projects — `HIGHLIGHT REEL` (replay cards)

Two projects → **highlight/replay cards** (cards scale better than a two-node bracket). Each is a "SHOT OF THE DAY" panel with a **`REPLAY` badge** and a **hero numeral** in serve-speed type — using the existing metrics: **`0.1230 Brier`** and **`13+ yrs data`**. Hover draws a **Hawk-Eye dotted trace**; click expands to the full "replay" write-up; the GitHub link is `FULL MATCH ▸`. Cards fly in dealt-style; hero numbers count up. Data stays in the existing `PROJECTS` array.

### 6.4 Contact — `MATCH POINT` (the ball's in your court)

Closing end-card. A **`MATCH POINT`** scoreboard reading, then the ball rests on the **visitor's** side of the net, pulsing, inviting a **`RETURN SERVE`** (email). Social links styled as **sponsor bugs** (GitHub, LinkedIn). No backend — `mailto:` + links, dressed as the post-match handshake. A `GAME · SET · MATCH` flourish (+ muted crowd cheer) on the CTA.

**Threading:** the HUD score-bug always shows the current "game"; the ticker carries the tech stack across the bottom.

---

## 7. Technical architecture

### 7.1 Stack

- **React 18 + Vite 6 + Tailwind 3 + React Router 7** — unchanged base.
- **Framer Motion** — React UI layer: section overlays (`AnimatePresence` mount/unmount), hover/tap states, HUD, matchup-card reveal, court shrink-to-HUD (layout animation). Beginner-friendly, prop-driven. Use `LazyMotion` + `m` components to trim bundle.
- **GSAP** (free, incl. `MotionPath`) — imperative choreography: loading timeline, court `stroke-dashoffset` draw-in, ball serve arc, player rig, ripples. `@gsap/react` `useGSAP` for React integration.
- **Player mascot** — hand-built SVG, body parts as `<g>` groups, animated via GSAP timelines (idle-bounce, wind-up, swing, celebrate, walk-on). Recolorable; rival = recolored clone.

Explicitly **not used** in v1: Three.js (3D is wrong for a 2D top-down theme and a huge beginner cost), Rive/Lottie (require a separate authoring tool). anime.js considered and passed over in favor of GSAP (better docs, `MotionPath`, now fully free).

### 7.2 App structure

- Navigation is a **state machine** (`activeSection`), not a scrolling document. URL is synced to `activeSection` via React Router; the ball flight *is* the transition, and the route updates on impact. Back button reverses.
- `Home.jsx` (currently a scroll composition) is replaced by a **court stage** that hosts: the `Court` (SVG, two size states), `Player`, `Ball`, `HUD`/score-bug, `Ticker`, and an `AnimatePresence` region for the active section card.
- New components (all in `website/src/`): `Loader`/intro sequence, `MatchupCard`, `Court`, `Player`, `Ball`, `Hud`, broadcast-kit primitives (`LowerThird`, `StatCard`, `Badge`, `Ticker`), plus reskinned `About`, `Experience`, `Projects`, `Contact`.
- The intro sequence + GSAP load in a **lazy-imported chunk** so first paint isn't blocked.
- Content stays **data-driven** in `UPPER_CASE` arrays per the existing convention (`EXPERIENCE`, `PROJECTS`, plus new `NAV_ZONES`, `PLAYER_STATS`).

---

## 8. Performance & accessibility

### 8.1 Performance

- **Vector-first assets:** court, player, ball, graphics are SVG/CSS. Mow-stripes are a CSS gradient. No video, no sprite sheets. Fonts self-hosted + preloaded.
- **Lean JS:** intro + GSAP in a lazy chunk; `LazyMotion` for Framer Motion. Content is a few KB of data arrays.
- **Animate cheap:** `transform` + `opacity` only (GPU-composited) — ball flight, ripples, card eruptions, court shrink. Glows sparing/pre-baked (no animated `box-shadow`/`filter`). GSAP runs on rAF.
- **Once-only intro** via `localStorage` → instant repeat visits.

### 8.2 Accessibility (one `useReducedMotion()` gate wired throughout)

- `prefers-reduced-motion` (or a manual toggle) → no intro, no ball flight, no ripples; sections cross-fade; player static; ticker stopped.
- Navigation is real HTML: zone `<button>`s + menu-list fallback; focus management + live-region announcements on route change; skip-to-content link; visible focus rings.
- Contrast per §3.1; neon yellow graphic-only; never color-alone state.

### 8.3 GitHub Pages specifics

- **SPA routing:** client routes 404 on direct load/refresh. Fix with a **`404.html` that restores the path into `index.html`** (standard Vite+Pages SPA trick); `base: "/"` (user site, domain root). `HashRouter` is the documented zero-config fallback if the 404 trick misbehaves.
- **SEO / link previews:** content is client-rendered, so put `<title>`, meta description, and an **Open Graph image** (matchup-card export) in `index.html`. Full prerendering is out of scope.
- CI (`.github/workflows/deploy.yml`) unchanged except ensuring `404.html` ships in `dist`.

---

## 9. Phased build plan

Each phase ships a complete, deployable site; difficulty ramps with the learning curve.

| Phase | Build | Library | Shippable result |
|---|---|---|---|
| **0 · Reskin** | Palette in Tailwind config; broadcast UI kit as static components; reskin existing content onto cream cards, still a normal scrolling page. | CSS/Tailwind only | Looks like a Wimbledon broadcast, fully working. De-risks the visual system. |
| **1 · Court nav** ⭐ | Static SVG court + four zone buttons; section cards mount/unmount; court shrinks to HUD; URL sync; reduced-motion gate. | Framer Motion | **The concept works** — click zone, section erupts, court docks. The real MVP. |
| **2 · The ball** | GSAP ball `MotionPath` arc, impact ripple, Hawk-Eye trail, eruption from impact point, replay-wipe. | + GSAP | Ball-driven navigation live. |
| **3 · The player** | SVG mascot rigged with GSAP (idle, wind-up, swing, celebrate); wire to serve; phantom auto-demo + coach-mark. | GSAP | Site feels alive. |
| **4 · Cold open** | Full intro: bumper → court draws in → two players walk on → matchup card (rival slot) → handoff. Count-ups, skip, once-only, reduced-motion path. | GSAP timelines | Full cinematic first-impression. |
| **5 · Polish** | Muted SFX/ambience, ticker copy, OG image, mobile tuning, Lighthouse + reduced-motion QA, micro-delights. | — | Ongoing shine. |

**⭐ MVP = Phases 0 + 1:** a themed, court-navigable, accessible portfolio worth shipping. Phase 2+ is progressive enhancement — none of it blocks going live. Order is beginner-safe: never two hard things at once; GSAP arrives on one scoped feature (a flying ball) before a character (Phase 3) or a 7-second film (Phase 4); scariest bits last.

---

## 10. Non-goals

- No backend, CMS, database, or contact form — remains a static site; contact is `mailto:` + links.
- No 3D (Three.js), no Rive/Lottie authoring pipeline in v1.
- No blog (per existing `AGENTS.md`).
- No full server-side prerendering (meta tags + OG image only).
- No change to CI/CD topology or the `website/` subdirectory layout.

---

## 11. Open / deferred decisions

- **Rival identity** — the matchup-card opponent (e.g. "The Null Hypothesis", "Overfitting", "The Field", or none). Placeholder slot ships; decided before Phase 4.
- **Final copy** — matchup-card tale-of-the-tape lines, taglines, `def.` phrasings, zone labels. Loose now; finalized during implementation.
- **Exact palette hex** — §3.1 values are starting points, tuned in Phase 0.
- **Intro length** — targeting ~7.5s; may tighten toward ~5s in Phase 4 tuning.
- **`AGENTS.md` / `CLAUDE.md` update** — these currently mandate the old dark/`slate-950`/`violet` system and "no indigo/other accents." They must be rewritten to describe this broadcast design system as part of the work (likely alongside Phase 0), so future agents follow the new language rather than reverting to the old one.
