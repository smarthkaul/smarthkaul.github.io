import { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const EXPERIENCE = [
  {
    company: "Grant Thornton",
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
              {job.company}
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
