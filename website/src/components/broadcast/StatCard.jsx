const StatCard = ({ broadcast, title, headerRight, id, className = "", children }) => {
  const hasHeader = broadcast || title || headerRight;
  return (
    <div
      id={id}
      className={`bg-cream text-charcoal rounded-2xl overflow-hidden shadow-xl shadow-black/25 ${className}`}
    >
      {hasHeader && (
        <div className="bg-wimbledon px-6 sm:px-8 py-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {broadcast && (
              <p className="font-mono text-ball text-label font-semibold uppercase tracking-eyebrow">
                {broadcast}
              </p>
            )}
            {title && (
              <h2
                className="font-display font-extrabold text-white tracking-display leading-[0.95] mt-2"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}
              >
                {title}
              </h2>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="px-6 sm:px-8 py-8">{children}</div>
    </div>
  );
};

export default StatCard;
