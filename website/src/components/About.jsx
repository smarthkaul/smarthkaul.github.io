import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";
import StatList from "./broadcast/StatList";
import headshotUrl from "../assets/headshot.jpg";

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
            <img
              src={headshotUrl}
              alt="Smarth Kaul"
              width="600"
              height="800"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shrink-0 ring-4 ring-ball/70 shadow-md"
            />
            <p className="text-charcoal text-xl sm:text-2xl font-light leading-relaxed">
              I&apos;m a Statistics student at the University of Toronto specializing in
              machine learning and data science.
            </p>
          </div>
          <p className="text-charcoal/70 text-base leading-relaxed mb-8">
            I care about building things that are both technically sound and actually
            useful — whether that&apos;s a forecasting model, a SQL pipeline, or a clean
            analysis. My background spans academic research, enterprise data work, and
            consulting, which gives me range. Outside of work: tennis, guitar, and trying
            to learn something new every week.
          </p>
          <StatList items={PROFILE} className="mb-8" />
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
