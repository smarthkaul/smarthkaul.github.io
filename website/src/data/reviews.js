// Review categories, rating scale, and validation. Pure data + functions, no
// Firebase — the Firestore calls live in src/lib/reviewsApi.js. firestore.rules
// enforces the same limits server-side; keep the two in sync.

export const CATEGORIES = [
  { id: "movies", label: "Movies" },
  { id: "live-events", label: "Live events" },
  { id: "food-and-drinks", label: "Food and drinks" },
  { id: "sports", label: "Sports" },
  { id: "music", label: "Music" },
];

export const MAX_RATING = 4;
export const RATING_STEP = 0.5;
export const TITLE_MAX = 120;
export const BODY_MAX = 10000;

// 0.5, 1, 1.5 … 4
export const RATING_VALUES = Array.from(
  { length: MAX_RATING / RATING_STEP },
  (_, i) => (i + 1) * RATING_STEP
);

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

export function isValidRating(rating) {
  return RATING_VALUES.includes(rating);
}

// Trims the draft and returns { review, errors }. `errors` is keyed by field
// and empty when the draft is valid.
export function validateReview(draft) {
  const review = {
    title: (draft.title ?? "").trim(),
    category: draft.category ?? "",
    rating: Number(draft.rating),
    body: (draft.body ?? "").trim(),
  };
  const errors = {};
  if (!review.title) errors.title = "Give it a title.";
  else if (review.title.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;
  if (!getCategory(review.category)) errors.category = "Pick a category.";
  if (!isValidRating(review.rating)) errors.rating = "Pick a rating.";
  if (!review.body) errors.body = "Write the review.";
  else if (review.body.length > BODY_MAX) errors.body = `Keep the review under ${BODY_MAX} characters.`;
  return { review, errors };
}

// "3.5 out of 4 stars" — the accessible name for a rating.
export function ratingLabel(rating) {
  return `${rating} out of ${MAX_RATING} stars`;
}

export function formatReviewDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
