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
  { k: "Graduating", v: "2026" },
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
              I&apos;m a final-year Statistics student at the University of Toronto, in the
              Statistical Machine Learning and Data Mining specialist program.
            </p>
          </div>
          <p className="text-charcoal/70 text-base leading-relaxed mb-8">
            Three internships in, my work has mostly sat where a model meets the system
            around it: a TensorFlow model for household energy disaggregation at
            TekUncorked, SQL-driven QA on an identity access platform at Ontario&apos;s
            electricity system operator, and market and regulatory analysis for consulting
            clients at Grant Thornton. Coursework since has pulled me further toward
            modelling — time series and statistical learning theory — which is where both
            projects here came from. The thing I keep circling back to is calibration:
            whether a number a model hands you can be trusted, and what it costs to find
            out. Outside of that, tennis and guitar.
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
