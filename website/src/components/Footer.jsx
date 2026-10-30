import { Link } from "react-router-dom";

// No bar, no border: the footer is a quiet sign-off line on the court, the way a
// broadcast closes on a single caption rather than a slab of chrome.
const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 py-6 px-6 sm:px-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-shadow-broadcast">
        <Link
          to="/"
          className="font-mono text-label font-semibold uppercase tracking-eyebrow text-cream/75 hover:text-ball transition-colors"
        >
          Smarth Kaul
        </Link>
        <p className="font-mono text-label uppercase tracking-eyebrow text-cream/50">
          &copy; {year}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
