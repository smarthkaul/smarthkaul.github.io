const TONES = {
  ball: "bg-ball text-charcoal",
  purple: "bg-wimbledon text-white",
  outline: "border border-charcoal/25 text-charcoal/80",
};

const Badge = ({ children, tone = "ball", className = "" }) => (
  <span
    className={`inline-flex items-center font-mono text-[0.7rem] uppercase tracking-widest px-2.5 py-1 rounded-full ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
