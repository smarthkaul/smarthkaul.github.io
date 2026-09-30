import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatReviewDate, getCategory } from "../../data/reviews";
import { deleteReview } from "../../lib/reviewsApi";
import StatCard from "../broadcast/StatCard";
import ActionLink from "../broadcast/ActionLink";
import StarRating from "./StarRating";

const ReviewDetail = ({ review, owner }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm(`Delete "${review.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteReview(review.id);
      navigate("/reviews");
    } catch {
      setDeleting(false);
      window.alert("Couldn't delete the review. Try again.");
    }
  };

  return (
    <StatCard broadcast={getCategory(review.category)?.label ?? "Review"} title={review.title}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <StarRating rating={review.rating} className="text-3xl" />
        <span className="font-mono text-xs text-charcoal/50">{formatReviewDate(review.createdAt)}</span>
      </div>
      {/* Plain text, not HTML: line breaks are kept with whitespace-pre-line. */}
      <p className="text-charcoal/80 text-lg leading-relaxed whitespace-pre-line">{review.body}</p>

      <div className="flex flex-wrap items-center gap-6 border-t border-charcoal/10 pt-4 mt-8">
        <ActionLink to="/reviews">&larr; All reviews</ActionLink>
        {owner.isOwner && (
          <>
            <ActionLink to={`/reviews/${review.id}/edit`}>Edit</ActionLink>
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="font-mono text-xs uppercase tracking-widest text-red-700 hover:text-red-900 disabled:opacity-60 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </StatCard>
  );
};

export default ReviewDetail;
