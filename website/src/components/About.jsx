// TODO: Update skill categories and items to match your actual tech stack
const SKILLS = {
  Languages: ["JavaScript", "TypeScript", "Python", "HTML", "CSS"],
  "Frameworks & Libraries": ["React", "Node.js", "Express", "Next.js"],
  "Tools & Platforms": ["Git", "GitHub", "Figma", "VS Code", "AWS"],
};

const About = () => {
  return (
    <section id="about" className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-2">
            01. About
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            About Me
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Bio column */}
          <div>
            {/* TODO: Replace "Your Name" with your name and fill in the city */}
            <p className="text-slate-300 text-lg leading-relaxed mb-5">
              Hi! I&apos;m{" "}
              <span className="text-indigo-400 font-semibold">Your Name</span>,
              a software engineer based in{" "}
              <span className="text-indigo-400">Your City</span>. I have X
              years of experience building web applications that are fast,
              accessible, and a pleasure to use.
            </p>

            {/* TODO: Personalize — how you got into engineering, what you've worked on */}
            <p className="text-slate-400 leading-relaxed mb-5">
              I got my start in software engineering through [your background —
              university, bootcamp, self-taught, etc.]. Since then I&apos;ve
              had the opportunity to work across [domains, e.g. fintech,
              developer tools, consumer apps].
            </p>

            {/* TODO: Add a personal touch — hobbies, interests, what you do outside work */}
            <p className="text-slate-400 leading-relaxed mb-10">
              Outside of work, I enjoy [hobby 1], [hobby 2], and [hobby 3].
              I&apos;m always looking for new things to learn and people to
              collaborate with.
            </p>

            {/* Résumé CTA */}
            {/* TODO: Replace # with the path to your résumé PDF, e.g. "/resume.pdf" */}
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Résumé
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
            </a>
          </div>

          {/* Photo + Skills column */}
          <div className="space-y-10">
            {/* Photo placeholder */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-52 h-52 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden group">
                {/*
                  TODO: Replace this placeholder with your photo:
                  <img
                    src="/your-photo.jpg"
                    alt="Your Name"
                    className="w-full h-full object-cover"
                  />
                */}
                <div className="text-center px-4">
                  <div className="text-slate-600 text-4xl mb-2">👤</div>
                  <span className="text-slate-500 text-xs font-mono">
                    photo TODO
                  </span>
                </div>
                <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/40 rounded-2xl transition-colors duration-300" />
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">
                Technologies I work with
              </h3>
              <div className="space-y-5">
                {Object.entries(SKILLS).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-mono">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full hover:border-indigo-500/50 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
