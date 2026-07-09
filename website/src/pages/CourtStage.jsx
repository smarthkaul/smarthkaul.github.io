import { useLocation, useNavigate, Link } from "react-router-dom";
import { SECTIONS, resolveActiveSection } from "../data/sections";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";

const SECTION_COMPONENTS = {
  about: About,
  experience: Experience,
  projects: Projects,
  contact: Contact,
};

const CourtStage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = resolveActiveSection(location.pathname);
  const goTo = (id) => navigate(id ? `/${id}` : "/");

  const ActiveSection = active ? SECTION_COMPONENTS[active.id] : null;

  return (
    <div className="relative min-h-screen court-turf overflow-hidden">
      {!active && (
        <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 py-24">
          <h1
            className="font-display font-extrabold text-cream leading-none tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
          >
            Smarth Kaul
          </h1>
          <p className="font-mono text-cream/70 text-xs uppercase tracking-widest mb-8">
            Pick a section
          </p>
          <ul className="flex flex-wrap gap-3 list-none p-0 m-0">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(s.id)}
                  className="font-mono text-xs uppercase tracking-widest bg-cream text-charcoal px-4 py-2 rounded-full hover:bg-ball transition-colors"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ActiveSection && (
        <div className="py-24">
          <ActiveSection />
          <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 mt-6">
            <Link
              to="/"
              className="font-mono text-xs uppercase tracking-widest text-cream hover:text-ball transition-colors"
            >
              &larr; Back to court
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtStage;
