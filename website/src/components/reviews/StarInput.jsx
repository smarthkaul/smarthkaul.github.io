import { useState } from "react";
import { MAX_RATING, ratingLabel } from "../../data/reviews";

// Half-star rating picker. Each star is split into a left button (x.5) and a
// right button (x), so the eight buttons cover 0.5–4.
const StarInput = ({ value, onChange, labelledBy }) => {
  const [hover, setHover] = useState(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-4">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="flex text-4xl leading-none"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((star) => {
          const fill = Math.max(0, Math.min(1, shown - (star - 1)));
          return (
            <span key={star} className="relative inline-block">
              <span aria-hidden="true" className="text-charcoal/15">★</span>
              <span
                aria-hidden="true"
                className="absolute inset-0 overflow-hidden text-grass"
                style={{ width: `${fill * 100}%` }}
              >
                ★
              </span>
              {[star - 0.5, star].map((v, half) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={value === v}
                  aria-label={ratingLabel(v)}
                  onClick={() => onChange(v)}
                  onMouseEnter={() => setHover(v)}
                  onFocus={() => setHover(v)}
                  onBlur={() => setHover(null)}
                  className={`absolute inset-y-0 ${half ? "right-0" : "left-0"} w-1/2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-wimbledon`}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="font-mono text-sm text-charcoal/60">
        {shown ? `${shown} / ${MAX_RATING}` : "No rating"}
      </span>
    </div>
  );
};

export default StarInput;
