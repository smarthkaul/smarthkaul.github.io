import { SECTIONS, COURT, BOXES } from "../../data/sections";

const pct = (value, total) => `${(value / total) * 100}%`;

const Court = ({ active, onNavigate, docked = false, fill = false, disabled = false }) => {
  return (
    <div
      className={fill ? "absolute inset-0 w-full h-full" : "relative mx-auto w-full"}
      style={fill ? undefined : { maxWidth: docked ? 280 : 960, aspectRatio: `${COURT.width} / ${COURT.height}` }}
    >
      {/* Court lines (decorative) */}
      <svg
        viewBox={`0 0 ${COURT.width} ${COURT.height}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* playing surface */}
        <rect x="140" y="20" width="500" height="320" rx="6" fill="#276e3c" />
        {/* boundary + singles sidelines + service lines */}
        <g fill="none" stroke="#ffffff" strokeWidth="3">
          <rect x="140" y="20" width="500" height="320" />
          <line x1="140" y1="60" x2="640" y2="60" />
          <line x1="140" y1="300" x2="640" y2="300" />
          <line x1="265" y1="60" x2="265" y2="300" />
          <line x1="515" y1="60" x2="515" y2="300" />
          <line x1="265" y1="180" x2="515" y2="180" />
        </g>
        {/* net (vertical, mid-court) */}
        <line x1="390" y1="20" x2="390" y2="340" stroke="#f4f1e9" strokeWidth="4" strokeDasharray="4 4" />
      </svg>

      {/* Zone targets */}
      {SECTIONS.map((s) => {
        const b = BOXES[s.box];
        const isActive = active?.id === s.id;
        const isRing = s.box.startsWith("beyond");
        const position = {
          left: pct(b.x, COURT.width),
          top: pct(b.y, COURT.height),
          width: pct(b.w, COURT.width),
          height: pct(b.h, COURT.height),
        };

        if (isRing) {
          // Circular archery target (a "beyond the baseline" zone).
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigate(s.id)}
              disabled={disabled}
              aria-label={`Go to ${s.label}`}
              aria-current={isActive ? "page" : undefined}
              className={`absolute rounded-full flex items-center justify-center transition-transform
                ${isActive ? "ring-2 ring-ball scale-105" : "hover:scale-105"}
                ${docked ? "" : "zone-pulse"}
                ${disabled ? "pointer-events-none" : ""}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-ball`}
              style={position}
            >
              <span aria-hidden className="absolute inset-0 rounded-full border-2 border-cream/70 bg-wimbledon/20" />
              <span aria-hidden className="absolute inset-[22%] rounded-full border-2 border-ball/80" />
              <span aria-hidden className="absolute inset-[42%] rounded-full bg-ball/40 border border-ball" />
              {!docked && (
                <span className="relative z-10 font-display font-bold text-cream text-xs sm:text-sm leading-none text-center px-1" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                  {s.label}
                </span>
              )}
            </button>
          );
        }

        // Rectangular service-box zone.
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onNavigate(s.id)}
            disabled={disabled}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive ? "page" : undefined}
            className={`absolute flex flex-col items-center justify-center rounded-md border-2 transition-colors
              ${isActive
                ? "border-ball bg-ball/20 text-cream"
                : "border-white/40 bg-white/5 text-cream/90 hover:bg-ball/15 hover:border-ball"}
              ${docked ? "" : "zone-pulse"}
              ${disabled ? "pointer-events-none" : ""}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ball`}
            style={position}
          >
            {!docked && (
              <>
                <span className="font-mono text-[0.55rem] sm:text-[0.65rem] uppercase tracking-widest text-ball">
                  {s.broadcast}
                </span>
                <span className="font-display font-bold text-sm sm:text-lg leading-tight">
                  {s.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Court;
