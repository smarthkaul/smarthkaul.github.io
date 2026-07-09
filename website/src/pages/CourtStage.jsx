import { useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BOXES, resolveActiveSection } from "../data/sections";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import Court from "../components/court/Court";
import Hud from "../components/court/Hud";
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
  const reduced = usePrefersReducedMotion();
  const active = resolveActiveSection(location.pathname);
  const goTo = (id) => navigate(id ? `/${id}` : "/");

  const ActiveSection = active ? SECTION_COMPONENTS[active.id] : null;
  // Transform-origin for the erupt: the active zone's centre, as % of the court.
  const origin = active
    ? `${(BOXES[active.box].cx / 360) * 100}% ${(BOXES[active.box].cy / 540) * 100}%`
    : "50% 50%";

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
            Serve to explore — pick a zone
          </p>
          <Court active={null} onNavigate={goTo} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {ActiveSection && (
          <motion.div
            key={active.id}
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: origin }}
            className="py-24"
          >
            <ActiveSection />
            <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 mt-6">
              <Link
                to="/"
                className="font-mono text-xs uppercase tracking-widest text-cream hover:text-ball transition-colors"
              >
                &larr; Back to court
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {active && <Hud active={active} onNavigate={goTo} />}
    </div>
  );
};

export default CourtStage;
