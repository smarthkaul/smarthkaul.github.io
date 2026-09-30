import { MAX_RATING, ratingLabel } from "../../data/reviews";

const STARS = "★".repeat(MAX_RATING);

// Read-only rating. A filled row of stars is clipped to rating/MAX over an
// empty row, which is what draws the half star.
const StarRating = ({ rating, className = "" }) => (
  <span role="img" aria-label={ratingLabel(rating)} className={`relative inline-block leading-none whitespace-nowrap ${className}`}>
    <span aria-hidden="true" className="text-charcoal/15">
      {STARS}
    </span>
    <span
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden text-grass"
      style={{ width: `${(rating / MAX_RATING) * 100}%` }}
    >
      {STARS}
    </span>
  </span>
);

export default StarRating;
