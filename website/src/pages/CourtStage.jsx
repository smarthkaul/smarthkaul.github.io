import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BOXES, COURT, SERVE_ORIGIN, resolveActiveSection, landingFromPull, classifyLanding } from "../data/sections";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import Court from "../components/court/Court";
import Hud from "../components/court/Hud";
import Ball from "../components/court/Ball";
import Player from "../components/court/Player";
import ServeTutorial from "../components/court/ServeTutorial";
import OutCall from "../components/court/OutCall";
import crowdAwwUrl from "../assets/crowd-aww.mp3";
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

  const MAX_PULL = 250; // tune: pull distance (court units) for full power

  const [aim, setAim] = useState(null);
  const [shot, setShot] = useState(null);
  const [outCall, setOutCall] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const frameRef = useRef(null);
  const missAudioRef = useRef(null);

  const playMiss = () => {
    let a = missAudioRef.current;
    if (!a) {
      a = new Audio(crowdAwwUrl);
      a.volume = 0.5;
      missAudioRef.current = a;
    }
    a.currentTime = 0;
    a.play().catch(() => {});
  };

  const toCourtCoords = (e) => {
    const rect = frameRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * COURT.width,
      y: ((e.clientY - rect.top) / rect.height) * COURT.height,
    };
  };

  const onPointerDown = (e) => {
    if (shot) return; // ignore while a ball is in flight
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setAim({ pull: { x: 0, y: 0 }, power: 0 });
  };
  const onPointerMove = (e) => {
    if (!aim) return;
    const p = toCourtCoords(e);
    const pull = { x: p.x - SERVE_ORIGIN.x, y: p.y - SERVE_ORIGIN.y };
    setAim({ pull, power: Math.min(1, Math.hypot(pull.x, pull.y) / MAX_PULL) });
  };
  const onPointerUp = () => {
    if (!aim) return;
    const pull = aim.pull;
    setAim(null);
    if (Math.hypot(pull.x, pull.y) < 6) return; // a tap, not a drag — no launch
    setShot(landingFromPull(SERVE_ORIGIN, pull, { power: 2.6, maxReach: 720 }));
  };

  const onLand = () => {
    const result = classifyLanding(shot);
    setShot(null);
    if (result.type === "hit") {
      navigate(`/${result.sectionId}`);
    } else if (result.type === "out") {
      playMiss();
      setOutCall(true);
      setTimeout(() => setOutCall(false), 900);
    } else {
      playMiss();
      setTutorial(true);
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

  // Reset scroll on every navigation so the section card always appears from the
  // top, regardless of how far the previous view had been scrolled.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const ActiveSection = active ? SECTION_COMPONENTS[active.id] : null;
  // Transform-origin for the erupt: the active zone's centre, as % of the court.
  const origin = active
    ? `${(BOXES[active.box].cx / COURT.width) * 100}% ${(BOXES[active.box].cy / COURT.height) * 100}%`
    : "50% 50%";

  return (
    <div className="relative min-h-screen court-turf overflow-hidden">
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />
      {!active && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 pt-16">
          <div
            ref={frameRef}
            className="relative w-full touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ maxWidth: 960, aspectRatio: `${COURT.width} / ${COURT.height}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <Court active={null} onNavigate={() => {}} fill disabled />
            <Player aim={aim} shot={shot} />
            <Ball aim={aim} shot={shot} onLand={onLand} />
            <OutCall show={outCall} />
          </div>
          <p className="mt-6 font-mono text-cream/50 text-[0.7rem] uppercase tracking-widest text-center">
            Drag the ball back to aim — launch it into a zone
          </p>
          <p className="sr-only">
            Drag the ball to aim and launch it into a zone, or use the menu to jump to a section.
          </p>
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
      <ServeTutorial open={tutorial} onClose={() => setTutorial(false)} />
    </div>
  );
};

export default CourtStage;
