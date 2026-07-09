import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BOXES, COURT, resolveActiveSection } from "../data/sections";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import Court from "../components/court/Court";
import Hud from "../components/court/Hud";
import Hub from "../components/court/Hub";
import Ball from "../components/court/Ball";
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

// Ref callback that fires when the section overlay mounts. Under
// AnimatePresence mode="wait" the new overlay mounts only AFTER the previous
// one finishes exiting, so at this point the new heading is in the DOM. Moving
// focus here (rather than in a useEffect keyed on the route) guarantees focus
// lands on the incoming section, not the outgoing one. Module-level so its
// identity is stable and it runs on mount/unmount only.
const focusSectionHeading = (node) => {
  if (!node) return;
  const heading = node.querySelector("h2, h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
};

const CourtStage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const [serveTarget, setServeTarget] = useState(null);

  const startServe = (id) => {
    const section = resolveActiveSection(`/${id}`);
    if (!section) return;
    if (reduced) {
      navigate(`/${id}`);
      return;
    }
    setServeTarget(section);
  };

  const handleServeComplete = () => {
    if (serveTarget) {
      const id = serveTarget.id;
      setServeTarget(null);
      navigate(`/${id}`);
    }
  };

  const active = resolveActiveSection(location.pathname);
  const goTo = (id) => navigate(id ? `/${id}` : "/");

  const liveRef = useRef(null);
  useEffect(() => {
    // Announce the section (timing-independent — reads from data, not the DOM).
    // Focus is handled by the overlay's ref callback, which mounts at the right time.
    if (active && liveRef.current) {
      liveRef.current.textContent = `${active.label} section`;
    }
  }, [active]);

  const ActiveSection = active ? SECTION_COMPONENTS[active.id] : null;
  // Transform-origin for the erupt: the active zone's centre, as % of the court.
  const origin = active
    ? `${(BOXES[active.box].cx / 360) * 100}% ${(BOXES[active.box].cy / 540) * 100}%`
    : "50% 50%";

  return (
    <div className="relative min-h-screen court-turf overflow-hidden">
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />
      {!active && (
        <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 py-24">
          <Hub />
          <p className="font-mono text-cream/70 text-xs uppercase tracking-widest mb-8">
            Serve to explore — pick a zone
          </p>
          <div
            className="relative mx-auto w-full"
            style={{ maxWidth: 520, aspectRatio: `${COURT.width} / ${COURT.height}` }}
          >
            <Court active={null} onNavigate={startServe} fill disabled={!!serveTarget} />
            <Ball target={serveTarget ? BOXES[serveTarget.box] : null} onComplete={handleServeComplete} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {ActiveSection && (
          <motion.div
            key={active.id}
            ref={focusSectionHeading}
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
