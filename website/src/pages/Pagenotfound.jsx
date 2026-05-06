import { Link } from "react-router-dom";

const Pagenotfound = () => {
  return (
    <section className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-indigo-400 text-8xl font-bold mb-4">404</p>
        <h1 className="text-white text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          ← Back home
        </Link>
      </div>
    </section>
  );
};

export default Pagenotfound;
