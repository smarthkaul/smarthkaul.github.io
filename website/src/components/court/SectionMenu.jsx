import { useState } from "react";
import { NavLink } from "react-router-dom";
import { SECTIONS } from "../../data/sections";

// Broadcast lower-third style rows: Syne for the destination, a ball-yellow tick
// marks the route you're on.
const itemClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2 font-display font-bold text-base tracking-display transition-colors ${
    isActive ? "text-ball" : "text-cream hover:text-ball"
  }`;

const Tick = ({ isActive }) => (
  <span
    aria-hidden="true"
    className={`h-3 w-0.5 rounded-full transition-colors ${isActive ? "bg-ball" : "bg-cream/20"}`}
  />
);

const MenuLink = ({ to, end, onClick, children }) => (
  <NavLink to={to} end={end} onClick={onClick} className={itemClass}>
    {({ isActive }) => (
      <>
        <Tick isActive={isActive} />
        {children}
      </>
    )}
  </NavLink>
);

const SectionMenu = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className={`flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-eyebrow text-shadow-broadcast transition-colors ${
          open ? "text-ball" : "text-cream hover:text-ball"
        }`}
      >
        <span aria-hidden="true" className="flex flex-col gap-[3px]">
          <span className="block h-0.5 w-4 bg-current" />
          <span className="block h-0.5 w-3 bg-current" />
        </span>
        Menu
      </button>
      {open && (
        <ul className="absolute right-0 mt-3 bg-wimbledon-dark/95 backdrop-blur-md rounded-xl shadow-xl shadow-black/30 py-3 list-none m-0 min-w-48 z-50">
          <li className="px-4 pb-2 font-mono text-label uppercase tracking-eyebrow text-ball/80">
            Sections
          </li>
          <li>
            <MenuLink to="/" end onClick={close}>
              Court
            </MenuLink>
          </li>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <MenuLink to={`/${s.id}`} onClick={close}>
                {s.label}
              </MenuLink>
            </li>
          ))}
          {/* Not a court section (no target to serve into), so it's listed by hand. */}
          <li className="border-t border-cream/10 mt-2 pt-2">
            <MenuLink to="/reviews" onClick={close}>
              Reviews
            </MenuLink>
          </li>
        </ul>
      )}
    </div>
  );
};

export default SectionMenu;
