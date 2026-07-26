import { Fragment } from "react";
import { Link, Navigate } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import { getProject } from "../data/projects";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";
import ChartFrame from "./broadcast/ChartFrame";
import StatList from "./broadcast/StatList";

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

          {detail.results && <StatList items={detail.results} className="mb-4" />}

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
