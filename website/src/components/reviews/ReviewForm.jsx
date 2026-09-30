import { useState } from "react";
import { BODY_MAX, CATEGORIES, TITLE_MAX, validateReview } from "../../data/reviews";
import StatCard from "../broadcast/StatCard";
import StarInput from "./StarInput";

const EMPTY = { title: "", category: "", rating: null, body: "" };

const fieldClass =
  "w-full bg-white border border-charcoal/20 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-wimbledon focus:ring-2 focus:ring-wimbledon/20";
const labelClass = "block font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-2";

const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} className="text-red-700 text-sm mt-2">
      {message}
    </p>
  ) : null;

// Used for both writing and editing. `onSave` gets the validated review and
// should throw if the save fails.
const ReviewForm = ({ initial, heading, onSave, onCancel }) => {
  const [draft, setDraft] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const { review, errors: found } = validateReview(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(review);
    } catch {
      setSaveError("Couldn't save the review. Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <StatCard broadcast="Scorecard" title={heading}>
      <form onSubmit={submit} noValidate className="space-y-6">
        <div>
          <label htmlFor="review-title" className={labelClass}>
            Title
          </label>
          <input
            id="review-title"
            type="text"
            value={draft.title}
            maxLength={TITLE_MAX}
            onChange={(e) => set("title")(e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "review-title-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="review-title-error" message={errors.title} />
        </div>

        <div>
          <label htmlFor="review-category" className={labelClass}>
            Category
          </label>
          <select
            id="review-category"
            value={draft.category}
            onChange={(e) => set("category")(e.target.value)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "review-category-error" : undefined}
            className={fieldClass}
          >
            <option value="" disabled>
              Pick one
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError id="review-category-error" message={errors.category} />
        </div>

        <div>
          <p id="review-rating-label" className={labelClass}>
            Rating
          </p>
          <StarInput value={draft.rating} onChange={set("rating")} labelledBy="review-rating-label" />
          <FieldError id="review-rating-error" message={errors.rating} />
        </div>

        <div>
          <label htmlFor="review-body" className={labelClass}>
            Review
          </label>
          <textarea
            id="review-body"
            rows={10}
            value={draft.body}
            maxLength={BODY_MAX}
            onChange={(e) => set("body")(e.target.value)}
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? "review-body-error" : undefined}
            className={`${fieldClass} leading-relaxed`}
          />
          <FieldError id="review-body-error" message={errors.body} />
        </div>

        {saveError && (
          <p role="alert" className="text-red-700 text-sm">
            {saveError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 border-t border-charcoal/10 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-wimbledon hover:bg-grass disabled:opacity-60 text-white font-display font-bold px-6 py-3 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save review"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </StatCard>
  );
};

export default ReviewForm;
