const EXPERIENCE = [
  {
    company: "Grant Thornton",
    url: "https://www.grantthornton.ca",
    role: "Business Consulting Intern",
    period: "May 2024 – Aug 2024",
    bullets: [
      "Analyzed market and regulatory datasets across 5 client projects, synthesizing trends to support data-driven recommendations for decision-making.",
      "Cleaned, structured, and analyzed import-export datasets in Excel, delivering outputs under tight timelines.",
      "Communicated insights clearly in meetings and written deliverables to support client strategy discussions.",
    ],
    tech: ["Excel", "Data Analysis", "Market Research"],
  },
  {
    company: "Independent Electricity System Operator (IESO)",
    url: "https://www.ieso.ca",
    role: "Data Analyst Intern",
    period: "Sept 2023 – Dec 2023",
    bullets: [
      "Built and executed 30+ SQL queries for Quality Assurance testing, improving the accuracy of email triggers in the Identity Access Management solution.",
      "Streamlined 5 key IT processes for the distribution and use of Anaconda and Python, reducing deployment time by 25% and improving overall data services efficiency.",
      "Completed 15 tasks focused on improving Identity Access Management processes, helping the team achieve 100% of quarterly OKRs.",
    ],
    tech: ["SQL", "Python", "Anaconda", "Identity Access Management"],
  },
  {
    company: "TekUncorked",
    url: "https://www.tekuncorked.com/",
    role: "Industrial Machine Learning Intern",
    period: "May 2022 – Aug 2022",
    bullets: [
      "Developed a supervised learning model using Python, TensorFlow, and Keras to analyze household appliance energy consumption, enhancing accuracy and reliability of energy disaggregation.",
      "Fine-tuned model architecture and hyperparameters, significantly reducing training time and enabling large-scale energy disaggregation.",
      "Created detailed documentation for model architecture, data assumptions, and performance results, ensuring clarity for future maintenance.",
    ],
    tech: ["Python", "TensorFlow", "Keras", "Machine Learning"],
  },
];

const Experience = () => {
  return (
    <section id="experience" className="py-24 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-2">
            02. Experience
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Work Experience</h2>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="hidden md:block absolute left-0 top-2 bottom-2 w-px bg-slate-700" />

          <div className="space-y-10">
            {EXPERIENCE.map((job, i) => (
              <div key={i} className="md:pl-10 relative">
                {/* Timeline dot */}
                <div className="hidden md:block absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/40 transition-colors duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{job.role}</h3>
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

                  <ul className="space-y-2 mb-5">
                    {job.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-slate-400 text-sm leading-relaxed">
                        <span className="text-indigo-500 mt-1.5 shrink-0">▹</span>
                        {b}
                      </li>
                    ))}
                  </ul>

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
