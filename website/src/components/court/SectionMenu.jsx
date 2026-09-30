import { useState } from "react";
import { Link } from "react-router-dom";
import { SECTIONS } from "../../data/sections";

const SectionMenu = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="font-mono text-cream/80 hover:text-ball text-xs uppercase tracking-widest"
      >
        Menu
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 bg-wimbledon border border-wimbledon-dark rounded-lg py-2 list-none m-0 min-w-40 z-50">
          <li>
            <Link to="/" onClick={() => setOpen(false)} className="block px-4 py-2 text-cream hover:text-ball text-sm">
              Court
            </Link>
          </li>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                to={`/${s.id}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-cream hover:text-ball text-sm"
              >
                {s.label}
              </Link>
            </li>
          ))}
          {/* Not a court section (no target to serve into), so it's listed by hand. */}
          <li className="border-t border-wimbledon-dark mt-2 pt-2">
            <Link
              to="/reviews"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-cream hover:text-ball text-sm"
            >
              Reviews
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
};

export default SectionMenu;
