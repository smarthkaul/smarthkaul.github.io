// Single source of truth for the Projects section. Both the list cards and the
// per-project detail pages at /projects/:slug read from here. Array order is
// display order — the modelling work comes before the site itself.

export const PROJECTS = [
  {
    slug: "march-madness",
    title: "NCAA March Madness Prediction Model",
    hero: "0.1250",
    heroLabel: "Brier · lower is better",
    description:
      "Predicting NCAA tournament matchups for the Kaggle competition. Opponent-adjusted season statistics, seed differences, and 14-day form, scored by Brier score rather than accuracy.",
    tech: ["Python", "XGBoost", "Logistic Regression", "Scikit-learn", "GridSearchCV"],
    team: "Three-person course project (STAD68)",
    codeUrl: "https://colab.research.google.com/drive/1bP96pdm7lTWnZg8EFO6-8kEsH8NyWInU",
    detail: {
      broadcast: "Match Report",
      sections: [
        {
          heading: "The problem",
          body:
            "Predict the outcome of every NCAA tournament matchup from historical game data, scored by Brier score rather than accuracy. That scoring choice drives everything downstream: a model that is confidently wrong is punished far harder than one that hedges, so the goal is a calibrated probability rather than a pick. The underlying data is discrete — wins, losses, box-score lines — and the working assumption going in was that possession is what decides games.",
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
            "Brier score is lower-is-better throughout. The ensemble scored 0.1250. Logistic regression alone scored 0.1252 — a gap of 0.0002, which is to say no gap at all. XGBoost, the model with all the capacity, finished last at 0.1269. That ordering is the most useful thing the project produced. With a limited number of tournament games to learn from and features whose effects are largely linear, there is not much non-linear structure left for a boosted tree to find, and the regularized linear model generalizes better precisely because it cannot chase it. Ensembling the two bought essentially nothing over the simpler model, and would not have been worth its complexity in production.",
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
    codeUrl: "https://gist.github.com/smarthkaul/4a601da41fe99f1062e8fe77242b8594",
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
            "Testing this on raw series would mostly measure the shared calendar, so the dependence analysis ran on STL-adjusted data instead. STL strips the seasonal component without touching short-run dynamics; seasonal differencing would have mechanically transformed the data and could manufacture autocorrelation that has nothing to do with real co-movement. Once seasonality was out, most apparent dependence went with it. Within the US, combustible fuels Granger-cause both nuclear and hydro. Across the border, exactly one directional link survived: Canadian nuclear Granger-causes US nuclear, and not the reverse. Impulse responses fill in what the significance tests leave out: even where no Granger link registered, a Canadian hydro shock visibly depresses US hydro for a few periods before fading, with no lasting change to the mix.",
        },
        {
          heading: "What it adds up to",
          body:
            "A negative result, and a useful one. North American electricity supply is driven overwhelmingly by its own strong seasonal cycles, and each source is best forecast by a model of itself. The multivariate machinery earned its keep on exactly one of six series and produced only a handful of significant Granger-causal links. Reporting that plainly is more valuable than finding a way to make VAR look necessary — the practical recommendation is source-specific seasonal models, and the cross-border coordination story the data might have told simply is not there.",
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
    codeUrl: "https://github.com/smarthkaul/smarthkaul.github.io",
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
