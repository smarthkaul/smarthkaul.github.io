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
            I graduated from the University of Toronto in 2026 and I&apos;m looking for
            full-time roles in machine learning and data science. If you have a role, a
            problem you&apos;re stuck on, or just want to talk — return serve.
          </p>

          <a
            href="mailto:kaul.smarth02@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-wimbledon hover:bg-grass text-white font-display font-bold px-6 py-4 rounded-xl transition-colors mb-3"
          >
            <span>Return serve</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
          <p className="font-mono text-xs text-charcoal/50 break-all">
            kaul.smarth02@gmail.com
          </p>
        </StatCard>
      </div>
    </section>
  );
};

export default Contact;
