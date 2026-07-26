import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import { PROJECTS } from "../data/projects";
import ProjectDetail from "./ProjectDetail";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";
import ActionLink from "./broadcast/ActionLink";

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
    <div className="flex flex-wrap gap-2 mb-5">
      {project.tech.map((t) => (
        <Badge key={t} tone="outline">
          {t}
        </Badge>
      ))}
    </div>
    {/* Actions get their own row rather than sharing one with the badges: the
        badge count varies per project and would otherwise shove the links to a
        different spot on every card. Mirrors ProjectDetail's actions row. */}
    <div className="flex flex-wrap items-center gap-6 border-t border-charcoal/10 pt-4">
      <ActionLink to={`/projects/${project.slug}`}>Match report &rarr;</ActionLink>
      {project.codeUrl && (
        <ActionLink href={project.codeUrl}>View the code &#8599;</ActionLink>
      )}
    </div>
  </StatCard>
);

const Projects = () => {
  // useReveal must run unconditionally — hooks cannot sit after an early return.
  const [ref, visible] = useReveal();
  const { slug } = useParams();

  const stageRef = useRef(null);
  const mountedRef = useRef(false);

  // CourtStage focuses a section's heading when that section MOUNTS. Navigating
  // between /projects and /projects/:slug keeps the same active section id, so
  // it re-renders in place and that never re-fires — while the link the user
  // just activated is removed from the DOM. Move focus here instead. Skipped on
  // first mount, where CourtStage has already handled it.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const heading = stageRef.current?.querySelector("h2");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }, [slug]);

  if (slug)
    return (
      <div ref={stageRef}>
        <ProjectDetail slug={slug} />
      </div>
    );

  return (
    <div ref={stageRef}>
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
    </div>
  );
};

export default Projects;
