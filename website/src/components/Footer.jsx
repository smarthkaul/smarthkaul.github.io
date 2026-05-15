const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-800 py-8 px-6 sm:px-12 lg:px-24 bg-slate-950">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <a
          href="#hero"
          className="font-display font-bold text-slate-500 hover:text-white transition-colors text-sm"
        >
          Smarth Kaul
        </a>
        <p className="font-mono text-slate-700 text-xs">&copy; {year}</p>
      </div>
    </footer>
  );
};

export default Footer;
