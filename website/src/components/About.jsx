import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";
import StatList from "./broadcast/StatList";
import headshotUrl from "../assets/headshot.jpg";

const PROFILE = [
  { k: "Base", v: "Toronto, ON 🇨🇦" },
  { k: "Plays", v: "Right-handed · Python, R, SQL" },
  { k: "Turned pro", v: "2022 — first ML internship" },
  { k: "Specialty", v: "Statistical ML & Data Mining" },
  { k: "Graduated", v: "2026 · UofT" },
];

const SKILLS = [
  "Python",
  "R",
  "SQL",
  "Scikit-learn",
  "TensorFlow",
  "PyTorch",
  "Time Series Forecasting",
  "Statistical Inference",
];

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
              I&apos;m a 2026 Statistics graduate of the University of Toronto, out of the
              Statistical Machine Learning and Data Mining specialist program.
            </p>
          </div>
          <p className="text-charcoal/70 text-base leading-relaxed mb-4">
            I like building products that solve real problems, and I like doing that
            through technology and data. The part I enjoy most is digging into the numbers
            until they say something useful about what to build next.
          </p>
          <p className="text-charcoal/70 text-base leading-relaxed mb-8">
            Outside of work I play and watch a lot of tennis, I&apos;m learning the guitar,
            and I&apos;ll happily drive out to the cinema to catch the latest movie.
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
