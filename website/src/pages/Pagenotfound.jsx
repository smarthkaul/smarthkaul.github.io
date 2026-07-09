import { Link } from "react-router-dom";

const Pagenotfound = () => {
  return (
    <section className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-display font-extrabold text-violet-400 text-8xl mb-4">404</p>
        <h1 className="font-display font-bold text-white text-2xl mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          ← Back home
        </Link>
      </div>
    </section>
  );
};

export default Pagenotfound;
