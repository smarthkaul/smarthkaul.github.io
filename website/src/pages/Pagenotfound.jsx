import { Link } from "react-router-dom";

const Pagenotfound = () => (
  <section className="min-h-screen court-turf flex items-center justify-center px-4">
    <div className="bg-cream text-charcoal rounded-2xl overflow-hidden shadow-xl shadow-black/25 max-w-md w-full text-center">
      <div className="bg-wimbledon px-6 py-4">
        <p className="font-mono text-ball text-xs uppercase tracking-widest">Line call</p>
      </div>
      <div className="px-6 py-10">
        <p className="font-display font-extrabold text-wimbledon text-7xl mb-2">OUT</p>
        <h1 className="font-display font-bold text-charcoal text-2xl mb-3">404 — page not found</h1>
        <p className="text-charcoal/60 mb-8">
          That shot landed out of bounds. The page you&apos;re looking for doesn&apos;t
          exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-wimbledon hover:bg-grass text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          &larr; Back to the court
        </Link>
      </div>
    </div>
  </section>
);

export default Pagenotfound;
