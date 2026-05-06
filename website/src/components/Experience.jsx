// TODO: Replace all placeholder values with your actual work history.
// Add or remove objects from the array as needed.
const EXPERIENCE = [
  {
    company: "Company Name",
    url: "#", // TODO: Company website URL
    role: "Senior Software Engineer",
    period: "Jan 2023 – Present",
    description:
      "TODO: Describe your key responsibilities and most impactful achievements here in 2–3 sentences. Focus on outcomes and scale rather than just duties.",
    tech: ["React", "TypeScript", "GraphQL", "AWS"],
  },
  {
    company: "Another Company",
    url: "#", // TODO: Company website URL
    role: "Software Engineer",
    period: "Jun 2021 – Dec 2022",
    description:
      "TODO: Describe your role here. Mention the team size, product scope, and specific things you shipped or improved during your time there.",
    tech: ["Vue.js", "Node.js", "PostgreSQL", "Docker"],
  },
  {
    company: "First Job / Internship",
    url: "#", // TODO: Company website URL
    role: "Software Engineer Intern",
    period: "May 2020 – Aug 2020",
    description:
      "TODO: Brief description of your internship project, what you learned, and any measurable impact you had.",
    tech: ["Python", "Django", "React", "Redis"],
  },
];

const Experience = () => {
  return (
    <section id="experience" className="py-24 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-2">
            02. Experience
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Work Experience
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line — hidden on mobile */}
          <div className="hidden md:block absolute left-0 top-2 bottom-2 w-px bg-slate-700" />

          <div className="space-y-12">
            {EXPERIENCE.map((job, i) => (
              <div key={i} className="md:pl-10 relative">
                {/* Timeline dot */}
                <div className="hidden md:block absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/40 transition-colors duration-300 group">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {job.role}
                      </h3>
                      <a
                        href={job.url}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {job.company} ↗
                      </a>
                    </div>
                    <span className="font-mono text-slate-500 text-sm whitespace-nowrap">
                      {job.period}
                    </span>
                  </div>

                  <p className="text-slate-400 leading-relaxed mb-4 text-sm">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {job.tech.map((t) => (
                      <span
                        key={t}
                        className="bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
