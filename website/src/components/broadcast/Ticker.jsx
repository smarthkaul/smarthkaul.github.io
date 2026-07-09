const Ticker = ({ items = [], className = "" }) => {
  const loop = [...items, ...items];
  return (
    <div
      className={`overflow-hidden bg-wimbledon border-y border-black/20 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-8 whitespace-nowrap py-2 animate-ticker will-change-transform">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-mono text-cream/80 text-xs uppercase tracking-widest"
          >
            {item}
            <span className="text-ball">&bull;</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
