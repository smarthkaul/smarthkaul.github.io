// TODO: Replace all placeholder values with your actual projects.
// Add or remove objects from the array as needed.
// Set featured: true on the 1–2 projects you want to highlight prominently.
const PROJECTS = [
  {
    title: "Project Alpha",
    description:
      "TODO: 2–3 sentence description of what this project does, the problem it solves, and any interesting technical decisions you made.",
    tech: ["React", "Node.js", "PostgreSQL", "AWS"],
    github: "#", // TODO: GitHub repo URL
    live: "#",   // TODO: Live demo URL — remove this key if no live demo
    featured: true,
  },
  {
    title: "Project Beta",
    description:
      "TODO: Brief description of this project. What does it do? Who is it for? What are you most proud of about it?",
    tech: ["TypeScript", "Next.js", "Tailwind CSS", "Vercel"],
    github: "#", // TODO: GitHub repo URL
    live: "#",   // TODO: Live demo URL
    featured: true,
  },
  {
    title: "Project Gamma",
    description:
      "TODO: Brief description of this project. Highlight any interesting algorithms, integrations, or scale-related challenges.",
    tech: ["Python", "FastAPI", "React", "Docker"],
    github: "#", // TODO: GitHub repo URL
    featured: false,
  },
  {
    title: "Project Delta",
    description:
      "TODO: Brief description of this project. Even small side projects show initiative — include it if you're proud of it.",
    tech: ["Vue.js", "Firebase", "CSS"],
    github: "#", // TODO: GitHub repo URL
    live: "#",   // TODO: Live demo URL
    featured: false,
  },
];

const ExternalIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const Projects = () => {
  const featured = PROJECTS.filter((p) => p.featured);
  const other = PROJECTS.filter((p) => !p.featured);

  return (
    <section id="projects" className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-2">
            03. Projects
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Things I&apos;ve Built
          </h2>
        </div>

        {/* Featured projects */}
        <div className="space-y-8 mb-16">
          {featured.map((project, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 sm:p-8 hover:border-indigo-500/40 transition-colors duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-1">
                    Featured Project
                  </p>
                  <h3 className="text-white font-bold text-xl">
                    {project.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <a
                    href={project.github}
                    aria-label="GitHub repository"
                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitHubIcon />
                  </a>
                  {project.live && (
                    <a
                      href={project.live}
                      aria-label="Live demo"
                      className="text-slate-400 hover:text-indigo-400 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalIcon />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed mb-5 max-w-2xl">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-indigo-300 text-xs bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Other projects grid */}
        {other.length > 0 && (
          <>
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-6">
              Other Projects
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {other.map((project, i) => (
                <div
                  key={i}
                  className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <div className="flex items-center gap-2">
                      <a
                        href={project.github}
                        aria-label="GitHub repository"
                        className="text-slate-500 hover:text-indigo-400 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <GitHubIcon />
                      </a>
                      {project.live && (
                        <a
                          href={project.live}
                          aria-label="Live demo"
                          className="text-slate-500 hover:text-indigo-400 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalIcon />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className="text-white font-semibold mb-2">
                    {project.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-grow">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-slate-400 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Projects;
