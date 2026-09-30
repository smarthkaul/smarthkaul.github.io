import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { isFirebaseConfigured } from "../lib/firebaseConfig";
import { createReview, getReview, updateReview } from "../lib/reviewsApi";
import { useReviewsOwner } from "../hooks/useReviewsOwner";
import StatCard from "../components/broadcast/StatCard";
import ReviewList from "../components/reviews/ReviewList";
import ReviewDetail from "../components/reviews/ReviewDetail";
import ReviewForm from "../components/reviews/ReviewForm";

// The Reviews page sits outside CourtStage: it's reached from the menu, not
// served into from the court. App.jsx lazy-loads it so Firebase only downloads
// when someone opens it. `mode` comes from the route: list | new | detail | edit.

const Shell = ({ children }) => (
  <div className="min-h-screen court-turf px-6 sm:px-12 lg:px-24 pt-24 pb-24">
    <div className="max-w-3xl mx-auto">{children}</div>
  </div>
);

const Message = ({ broadcast = "Scorecard", title, children }) => (
  <StatCard broadcast={broadcast} title={title}>
    <div className="text-charcoal/70 leading-relaxed space-y-4">{children}</div>
  </StatCard>
);

const backLink = (
  <Link to="/reviews" className="font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark">
    &larr; All reviews
  </Link>
);

// Loads one review for the detail and edit views.
function useReview(id) {
  const [state, setState] = useState({ status: "loading", review: null });
  useEffect(() => {
    let live = true;
    setState({ status: "loading", review: null });
    getReview(id)
      .then((review) => live && setState({ status: review ? "ready" : "missing", review }))
      .catch(() => live && setState({ status: "error", review: null }));
    return () => {
      live = false;
    };
  }, [id]);
  return state;
}

const SingleReview = ({ id, mode, owner }) => {
  const navigate = useNavigate();
  const { status, review } = useReview(id);

  if (status === "loading") return <Message title="Loading…" />;
  if (status === "error") return <Message title="Couldn't load this review.">{backLink}</Message>;
  if (status === "missing") return <Message title="Review not found.">{backLink}</Message>;

  if (mode === "edit") {
    if (owner.loading) return <Message title="Loading…" />;
    if (!owner.isOwner) return <Navigate to={`/reviews/${id}`} replace />;
    return (
      <ReviewForm
        heading="Edit review"
        initial={review}
        onSave={async (r) => {
          await updateReview(id, r);
          navigate(`/reviews/${id}`);
        }}
        onCancel={() => navigate(`/reviews/${id}`)}
      />
    );
  }
  return <ReviewDetail review={review} owner={owner} />;
};

const NewReview = ({ owner }) => {
  const navigate = useNavigate();
  if (owner.loading) return <Message title="Loading…" />;
  if (!owner.isOwner) return <Navigate to="/reviews" replace />;
  return (
    <ReviewForm
      heading="New review"
      onSave={async (r) => {
        const id = await createReview(r);
        navigate(`/reviews/${id}`);
      }}
      onCancel={() => navigate("/reviews")}
    />
  );
};

const Reviews = ({ mode }) => {
  const { id } = useParams();
  const owner = useReviewsOwner();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode, id]);

  let content;
  if (!isFirebaseConfigured) content = <Message title="Reviews">Reviews are coming soon.</Message>;
  else if (mode === "new") content = <NewReview owner={owner} />;
  else if (mode === "detail" || mode === "edit") content = <SingleReview id={id} mode={mode} owner={owner} />;
  else content = <ReviewList owner={owner} />;

  return <Shell>{content}</Shell>;
};

export default Reviews;
