import { useReveal } from "../hooks/useReveal";

const PROJECTS = [
  {
    title: "NCAA March Madness\nPrediction Model",
    description:
      "Ensemble ML model predicting tournament outcomes. Engineered features including seed differences, 14-day win rates, and adjusted season stats. Achieved a Brier Score of 0.1230 vs. 0.1041 benchmark.",
    tech: ["Python", "XGBoost", "Logistic Regression", "Scikit-learn"],
    github: null,
  },
  {
    title: "Energy Forecasting\nModel",
    description:
      "SARIMA + VAR time series models on 13+ years of Canadian and US electricity data. Applied seasonal differencing, stationarity testing, and Granger causality analysis to quantify cross-source dependencies.",
    tech: ["R", "SARIMA", "VAR", "Time Series"],
    github: null,
  },
];

const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const ProjectCard = ({ project, idx }) => {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} py-10 border-t border-slate-800`}
      style={{ transitionDelay: `${idx * 120}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1">
          <h3
            className="font-display font-extrabold text-white leading-tight mb-4 whitespace-pre-line"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {project.title}
          </h3>
          <p className="text-slate-400 leading-relaxed mb-6 max-w-xl">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span
                key={t}
                className="font-mono text-xs text-violet-400 bg-violet-950/30 border border-violet-800/30 px-2.5 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {project.github && (
          <a
            href={project.github}
            aria-label="GitHub repository"
            className="text-slate-500 hover:text-white transition-colors shrink-0 mt-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
          </a>
        )}
      </div>
    </div>
  );
};

const Projects = () => {
  const [headerRef, headerVisible] = useReveal();

  return (
    <section id="projects" className="py-24 bg-slate-950 px-6 sm:px-12 lg:px-24">
      <div className="max-w-3xl">
        <div
          ref={headerRef}
          className={`reveal ${headerVisible ? "visible" : ""} mb-16`}
        >
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-6">
            Projects
          </p>
          <h2
            className="font-display font-extrabold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Things I&apos;ve built.
          </h2>
        </div>

        <div>
          {PROJECTS.map((project, i) => (
            <ProjectCard key={i} project={project} idx={i} />
          ))}
          <div className="border-t border-slate-800" />
        </div>
      </div>
    </section>
  );
};

export default Projects;
