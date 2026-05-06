const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Name / logo */}
          <a
            href="#hero"
            className="text-slate-400 hover:text-white font-bold text-lg tracking-tight transition-colors"
          >
            {/* TODO: Replace "Your Name" with your name */}
            Your Name
          </a>

          {/* Nav links */}
          <nav>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 list-none m-0 p-0">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Copyright */}
          <p className="text-slate-600 text-xs font-mono">
            © {year} {/* TODO: Replace with your name */}Your Name
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
