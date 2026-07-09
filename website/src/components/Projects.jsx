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
