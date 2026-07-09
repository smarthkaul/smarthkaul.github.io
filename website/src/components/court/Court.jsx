import { SECTIONS, COURT, BOXES } from "../../data/sections";

const pct = (value, total) => `${(value / total) * 100}%`;

const Court = ({ active, onNavigate, docked = false, fill = false, disabled = false }) => {
  return (
    <div
      className={fill ? "absolute inset-0 w-full h-full" : "relative mx-auto w-full"}
      style={fill ? undefined : { maxWidth: docked ? 220 : 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
    >
      {/* Court lines (decorative) */}
      <svg
        viewBox={`0 0 ${COURT.width} ${COURT.height}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* playing surface */}
        <rect x="20" y="20" width="320" height="500" rx="6" fill="#276e3c" />
        {/* boundary + singles lines + service boxes + net */}
        <g fill="none" stroke="#ffffff" strokeWidth="3">
          <rect x="20" y="20" width="320" height="500" />
          <line x1="60" y1="20" x2="60" y2="520" />
          <line x1="300" y1="20" x2="300" y2="520" />
          <line x1="60" y1="135" x2="300" y2="135" />
          <line x1="60" y1="405" x2="300" y2="405" />
          <line x1="180" y1="135" x2="180" y2="405" />
        </g>
        {/* net */}
        <line x1="20" y1="270" x2="340" y2="270" stroke="#f4f1e9" strokeWidth="4" strokeDasharray="4 4" />
      </svg>

      {/* Zone buttons */}
      {SECTIONS.map((s) => {
        const b = BOXES[s.box];
        const isActive = active?.id === s.id;
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
            style={{
              left: pct(b.x, COURT.width),
              top: pct(b.y, COURT.height),
              width: pct(b.w, COURT.width),
              height: pct(b.h, COURT.height),
            }}
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
