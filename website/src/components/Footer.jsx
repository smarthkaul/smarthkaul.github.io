import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-wimbledon-dark py-8 px-6 sm:px-12 lg:px-24 bg-wimbledon">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/"
          className="font-display font-bold text-cream/70 hover:text-ball transition-colors text-sm"
        >
          Smarth Kaul
        </Link>
        <p className="font-mono text-cream/40 text-xs">&copy; {year}</p>
      </div>
    </footer>
  );
};

export default Footer;
