import { useState } from "react";
import { useReveal } from "../hooks/useReveal";

const EXPERIENCE = [
  {
    company: "Grant Thornton",
    url: "https://www.grantthornton.ca",
    role: "Business Consulting Intern",
    year: "2024",
    summary:
      "Analyzed market and regulatory datasets across 5 client projects, delivering data-driven insights for client strategy discussions.",
    tech: ["Excel", "Data Analysis", "Market Research"],
  },
  {
    company: "IESO",
    url: "https://www.ieso.ca",
    role: "Data Analyst Intern",
    year: "2023",
    summary:
      "Built 30+ SQL queries for QA testing and streamlined 5 IT processes, reducing deployment time by 25%.",
    tech: ["SQL", "Python", "Identity Access Management"],
  },
  {
    company: "TekUncorked",
    url: "https://www.tekuncorked.com/",
    role: "Industrial ML Intern",
    year: "2022",
    summary:
      "Developed a supervised learning model using TensorFlow and Keras for household energy disaggregation.",
    tech: ["Python", "TensorFlow", "Keras"],
  },
];

const ExperienceRow = ({ job, idx }) => {
  const [open, setOpen] = useState(false);
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""}`}
      style={{ transitionDelay: `${idx * 80}ms` }}
    >
      <div
        className="group py-6 border-t border-slate-800 cursor-pointer select-none"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-5">
            <span className="font-mono text-slate-600 text-xs w-5 shrink-0">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div>
              <a
                href={job.url}
                className="text-white text-lg font-semibold hover:text-violet-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {job.company} ↗
              </a>
              <p className="text-slate-400 text-sm mt-0.5">{job.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-slate-500 text-sm">{job.year}</span>
            <span className={`text-slate-600 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
              ▾
            </span>
          </div>
        </div>

        {open && (
          <div className="mt-4 ml-10">
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              {job.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              {job.tech.map((t) => (
                <span
                  key={t}
                  className="font-mono text-xs text-violet-400 bg-violet-950/30 border border-violet-800/30 px-2.5 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Experience = () => {
  const [headerRef, headerVisible] = useReveal();

  return (
    <section id="experience" className="py-24 bg-slate-950 px-6 sm:px-12 lg:px-24">
      <div className="max-w-3xl">
        <div
          ref={headerRef}
          className={`reveal ${headerVisible ? "visible" : ""} mb-16`}
        >
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-6">
            Work
          </p>
          <h2
            className="font-display font-extrabold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Where I&apos;ve worked.
          </h2>
        </div>

        <div>
          {EXPERIENCE.map((job, i) => (
            <ExperienceRow key={i} job={job} idx={i} />
          ))}
          <div className="border-t border-slate-800" />
        </div>
      </div>
    </section>
  );
};

export default Experience;
