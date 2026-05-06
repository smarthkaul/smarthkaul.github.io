import { useState, useEffect } from "react";

// TODO: Update initials/name to match yours
const SITE_NAME = "YN";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#hero"
            className="text-white font-bold text-xl tracking-tight hover:text-indigo-400 transition-colors"
          >
            {SITE_NAME}
          </a>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              {/* TODO: Replace # with your resume PDF path, e.g. "/resume.pdf" */}
              <a
                href="#"
                className="border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Résumé
              </a>
            </li>
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-slate-800/95 backdrop-blur-md rounded-xl mb-4 p-4 border border-slate-700">
            <ul className="flex flex-col gap-1 list-none m-0 p-0">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-slate-300 hover:text-white hover:bg-slate-700 block px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    onClick={closeMenu}
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="mt-2 pt-2 border-t border-slate-700">
                {/* TODO: Replace # with your resume PDF path */}
                <a
                  href="#"
                  className="block text-center border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={closeMenu}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Résumé
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
