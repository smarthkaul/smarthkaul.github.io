import { Link, useParams } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import { PROJECTS } from "../data/projects";
import ProjectDetail from "./ProjectDetail";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const cardLinkClass =
  "font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors";

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
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <Link to={`/projects/${project.slug}`} className={cardLinkClass}>
          Match report &rarr;
        </Link>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className={cardLinkClass}
          >
            Full match &#8599;
          </a>
        )}
      </div>
    </div>
  </StatCard>
);

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

export default Projects;
