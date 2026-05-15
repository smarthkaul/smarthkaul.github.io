import { useReveal } from "../hooks/useReveal";

const About = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="about" className="py-32 bg-slate-950 px-6 sm:px-12 lg:px-24">
      <div ref={ref} className={`max-w-2xl reveal ${visible ? "visible" : ""}`}>
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-10">
          About
        </p>
        <p className="text-white text-2xl sm:text-3xl font-light leading-relaxed mb-6">
          I&apos;m a Statistics student at the University of Toronto specializing
          in machine learning and data science.
        </p>
        <p className="text-slate-400 text-lg leading-relaxed mb-6">
          I care about building things that are both technically sound and
          actually useful — whether that&apos;s a forecasting model, a SQL
          pipeline, or a clean analysis. My background spans academic research,
          enterprise data work, and consulting, which gives me range.
        </p>
        <p className="text-slate-400 text-lg leading-relaxed">
          Outside of work: tennis, guitar, and trying to learn something new
          every week.
        </p>
      </div>
    </section>
  );
};

export default About;
