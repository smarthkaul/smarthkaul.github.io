const SKILLS = {
  Languages: ["Python", "R", "SQL", "JavaScript", "Java", "C", "MATLAB"],
  "Libraries & Frameworks": [
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
    "Pandas", "NumPy", "Matplotlib", "LangChain",
  ],
  "Tools & Technologies": [
    "Docker", "Azure", "Airflow", "Tableau", "Excel",
  ],
};

const About = () => {
  return (
    <section id="about" className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-2">
            01. About
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">About Me</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Bio */}
          <div>
            <p className="text-slate-300 text-lg leading-relaxed mb-5">
              Hi! I&apos;m{" "}
              <span className="text-indigo-400 font-semibold">Smarth Kaul</span>, a
              Statistics student at the{" "}
              <span className="text-indigo-400">University of Toronto</span> specializing
              in Statistical Machine Learning and Data Mining.
            </p>
            <p className="text-slate-400 leading-relaxed mb-5">
              I&apos;m passionate about using data to uncover insights and build models
              that solve real problems. My experience spans machine learning research,
              data analysis in enterprise environments, and business consulting — giving
              me a perspective that bridges technical depth with practical impact.
            </p>
            <p className="text-slate-400 leading-relaxed mb-5">
              I&apos;ve worked at Grant Thornton, the Independent Electricity System
              Operator (IESO), and TekUncorked — building everything from SQL-driven
              QA pipelines to supervised learning models for energy disaggregation.
            </p>
            {/* TODO: Add a personal touch — hobbies, interests, what you do outside work */}
            <p className="text-slate-400 leading-relaxed mb-10">
              Outside of academics and work, I enjoy [hobby 1], [hobby 2], and [hobby 3].
            </p>

            {/* Education callout */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-8">
              <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Education</p>
              <p className="text-white font-semibold">University of Toronto</p>
              <p className="text-slate-300 text-sm">BS, Statistics — Statistical Machine Learning &amp; Data Mining Specialist</p>
              <p className="text-slate-500 text-xs font-mono mt-1">Sept 2021 – 2026 · Toronto, ON</p>
            </div>

            {/* TODO: Add your resume PDF to website/public/resume.pdf and update href */}
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Résumé
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Photo + Skills */}
          <div className="space-y-10">
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-52 h-52 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden group">
                {/*
                  TODO: Replace with your photo:
                  <img src="/photo.jpg" alt="Smarth Kaul" className="w-full h-full object-cover" />
                */}
                <div className="text-center px-4">
                  <div className="text-slate-600 text-4xl mb-2">👤</div>
                  <span className="text-slate-500 text-xs font-mono">photo TODO</span>
                </div>
                <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/40 rounded-2xl transition-colors duration-300" />
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">
                Technical Skills
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
