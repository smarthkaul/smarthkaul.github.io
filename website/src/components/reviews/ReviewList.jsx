import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CATEGORIES, formatReviewDate, getCategory } from "../../data/reviews";
import { OWNER_UID } from "../../lib/firebaseConfig";
import { listReviews, signInOwner, signOutOwner } from "../../lib/reviewsApi";
import StatCard from "../broadcast/StatCard";
import Badge from "../broadcast/Badge";
import StarRating from "./StarRating";

const PREVIEW_CHARS = 180;

const preview = (body) => (body.length > PREVIEW_CHARS ? `${body.slice(0, PREVIEW_CHARS).trimEnd()}…` : body);

const chipClass = (active) =>
  `font-mono text-[0.7rem] uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
    active ? "bg-wimbledon text-white" : "border border-charcoal/25 text-charcoal/70 hover:border-wimbledon hover:text-wimbledon"
  }`;

const ReviewRow = ({ review }) => (
  <li className="py-6 border-b border-charcoal/10 last:border-b-0">
    <div className="flex flex-wrap items-center gap-3 mb-2">
      <Badge tone="outline">{getCategory(review.category)?.label ?? review.category}</Badge>
      <span className="font-mono text-xs text-charcoal/50">{formatReviewDate(review.createdAt)}</span>
    </div>
    <h3 className="font-display font-bold text-charcoal text-xl sm:text-2xl leading-tight mb-2">
      <Link to={`/reviews/${review.id}`} className="hover:text-wimbledon transition-colors">
        {review.title}
      </Link>
    </h3>
    <StarRating rating={review.rating} className="text-xl mb-3" />
    <p className="text-charcoal/70 leading-relaxed">{preview(review.body)}</p>
  </li>
);

// Sign-in lives at the bottom of the list rather than in the site chrome, so
// visitors barely notice it and Firebase only loads on this page.
const OwnerBar = ({ owner }) => {
  const { user, isOwner } = owner;
  if (owner.loading) return null;
  const linkClass = "font-mono text-xs uppercase tracking-widest text-charcoal/40 hover:text-wimbledon transition-colors";

  if (!user)
    return (
      <button type="button" onClick={() => signInOwner().catch(() => {})} className={linkClass}>
        Sign in
      </button>
    );

  return (
    <div className="space-y-2">
      {!isOwner && (
        <p className="text-sm text-charcoal/60">
          {OWNER_UID
            ? "This account can't write reviews here."
            : "No owner is set yet. Put this user ID in firebaseConfig.js and firestore.rules:"}
          {!OWNER_UID && <code className="block mt-1 font-mono text-xs text-charcoal break-all">{user.uid}</code>}
        </p>
      )}
      <button type="button" onClick={() => signOutOwner()} className={linkClass}>
        Sign out
      </button>
    </div>
  );
};

const ReviewList = ({ owner }) => {
  const [state, setState] = useState({ status: "loading", reviews: [] });
  const [params, setParams] = useSearchParams();
  const category = getCategory(params.get("category"))?.id ?? null;

  useEffect(() => {
    let live = true;
    listReviews()
      .then((reviews) => live && setState({ status: "ready", reviews }))
      .catch(() => live && setState({ status: "error", reviews: [] }));
    return () => {
      live = false;
    };
  }, []);

  const shown = category ? state.reviews.filter((r) => r.category === category) : state.reviews;
  const pick = (id) => setParams(id ? { category: id } : {}, { replace: true });

  return (
    <StatCard
      broadcast="Scorecard"
      title="Reviews"
      headerRight={
        owner.isOwner && (
          <Link
            to="/reviews/new"
            className="inline-block bg-ball text-charcoal font-display font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Write a review
          </Link>
        )
      }
    >
      <p className="text-charcoal/70 leading-relaxed mb-6">
        Movies, live events, food, sports and music I&apos;ve checked out, rated out of 4 stars.
      </p>

      <div role="group" className="flex flex-wrap gap-2 mb-2" aria-label="Filter by category">
        <button type="button" aria-pressed={!category} onClick={() => pick(null)} className={chipClass(!category)}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => pick(c.id)}
            className={chipClass(category === c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {state.status === "loading" && <p className="py-8 text-charcoal/50">Loading reviews…</p>}
      {state.status === "error" && <p className="py-8 text-charcoal/70">Couldn&apos;t load reviews right now.</p>}
      {state.status === "ready" && shown.length === 0 && (
        <p className="py-8 text-charcoal/50">No reviews {category ? "in this category " : ""}yet.</p>
      )}
      {shown.length > 0 && (
        <ul className="list-none m-0 p-0">
          {shown.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </ul>
      )}

      <div className="border-t border-charcoal/10 pt-4 mt-2">
        <OwnerBar owner={owner} />
      </div>
    </StatCard>
  );
};

export default ReviewList;
