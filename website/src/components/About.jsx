import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const PROFILE = [
  { k: "Base", v: "Toronto, ON 🇨🇦" },
  { k: "Plays", v: "Right-handed · Python / R" },
  { k: "Turned pro", v: "2022" },
  { k: "Specialty", v: "Machine Learning & Forecasting" },
];

const SKILLS = ["Machine Learning", "Statistics", "SQL", "Data Viz", "Python", "R"];

const About = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="about" className="px-6 sm:px-12 lg:px-24 py-16">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <StatCard broadcast="The Player" title="About">
          <p className="text-charcoal text-xl sm:text-2xl font-light leading-relaxed mb-6">
            I&apos;m a Statistics student at the University of Toronto specializing in
            machine learning and data science.
          </p>
          <p className="text-charcoal/70 text-base leading-relaxed mb-8">
            I care about building things that are both technically sound and actually
            useful — whether that&apos;s a forecasting model, a SQL pipeline, or a clean
            analysis. My background spans academic research, enterprise data work, and
            consulting, which gives me range. Outside of work: tennis, guitar, and trying
            to learn something new every week.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border-t border-charcoal/10 pt-6 mb-8">
            {PROFILE.map(({ k, v }) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 border-b border-charcoal/10 py-2"
              >
                <dt className="font-mono text-xs uppercase tracking-widest text-charcoal/50">
                  {k}
                </dt>
                <dd className="text-charcoal font-medium text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <Badge key={s} tone="purple">
                {s}
              </Badge>
            ))}
          </div>
        </StatCard>
      </div>
    </section>
  );
};

export default About;
