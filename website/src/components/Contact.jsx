import { useReveal } from "../hooks/useReveal";
import StatCard from "./broadcast/StatCard";
import Badge from "./broadcast/Badge";

const Contact = () => {
  const [ref, visible] = useReveal();

  return (
    <section id="contact" className="px-6 sm:px-12 lg:px-24 py-16 pb-24">
      <div ref={ref} className={`max-w-3xl mx-auto reveal ${visible ? "visible" : ""}`}>
        <StatCard
          broadcast="Match Point"
          title="Let's work together."
          headerRight={<Badge tone="ball">Match Point</Badge>}
        >
          <p className="text-charcoal/70 text-lg leading-relaxed mb-8 max-w-md">
            I&apos;m looking for co-op and full-time opportunities in data science and
            machine learning. If you have a role, a project, or just want to talk — return
            serve.
          </p>

          <a
            href="mailto:smarth.kaul@mail.utoronto.ca"
            className="inline-flex items-center gap-3 bg-wimbledon hover:bg-grass text-white font-display font-bold px-6 py-4 rounded-xl transition-colors mb-3"
          >
            <span>Return serve</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
          <p className="font-mono text-xs text-charcoal/50 break-all">
            smarth.kaul@mail.utoronto.ca
          </p>
        </StatCard>
      </div>
    </section>
  );
};

export default Contact;
