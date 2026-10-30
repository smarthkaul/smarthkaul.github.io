import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { resolveActiveSection } from "../data/sections";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import IsoCourt from "../components/iso/IsoCourt";
import BroadcastTransition, { buildTransition } from "../components/iso/BroadcastTransition";
import Hud from "../components/court/Hud";
import ServeTutorial from "../components/court/ServeTutorial";
import OutCall from "../components/court/OutCall";
import crowdAwwUrl from "../assets/crowd-aww.mp3";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";

// Crowd SFX playback level (0–1). Kept low so the reaction reads as ambience
// behind the shot rather than a jump-scare on a quiet page.
const SFX_VOLUME = 0.08;

// How far the broadcast transition pushes in, as a multiple of the scene's
// fitted (whole-court) zoom — absolute, so it lands the same however the
// follow camera was framed when the ball landed.
const TRANSITION_ZOOM = 3.4;

const SECTION_COMPONENTS = {
  about: About,
  experience: Experience,
  projects: Projects,
  contact: Contact,
};

const focusHeading = (node) => {
  const heading = node?.querySelector("h2, h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.style.outline = "none"; // programmatic focus, not a keyboard tab stop
    heading.focus({ preventScroll: true });
  }
};

// The court routes. `active` is what the URL says; `displayed` is what is on
// screen — it lags behind so the broadcast transition can play out in reverse
// after the URL has already gone back to "/".
const CourtStage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const active = resolveActiveSection(location.pathname);

  const [displayed, setDisplayed] = useState(active);
  const [phase, setPhase] = useState(active ? "shown" : "idle"); // idle | entering | shown | exiting
  const [scene, setScene] = useState(null);
  const [outCall, setOutCall] = useState(false);
  const [tutorial, setTutorial] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const instantRef = useRef(!!active); // the next build renders at progress(1)
  const pendingRef = useRef(null);     // section to show once the current exit finishes
  const tlRef = useRef(null);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const cardRef = useRef(null);
  const liveRef = useRef(null);
  const missAudioRef = useRef(null);

  const playMiss = () => {
    let a = missAudioRef.current;
    if (!a) {
      a = new Audio(crowdAwwUrl);
      a.volume = SFX_VOLUME;
      missAudioRef.current = a;
    }
    a.currentTime = 0;
    a.play().catch(() => {});
  };

  const onLand = (result) => {
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

  // URL → displayed. Decides whether to enter, exit, swap or resume.
  useEffect(() => {
    const tl = tlRef.current;
    if (active && !displayed) {
      instantRef.current = false;
      setDisplayed(active);
    } else if (!active && displayed) {
      if (tl) {
        setPhase("exiting");
        tl.timeScale(1.3).reverse();
      } else {
        setDisplayed(null);
        setPhase("idle");
      }
    } else if (active && displayed && active.id !== displayed.id) {
      pendingRef.current = active;
      if (tl) {
        setPhase("exiting");
        tl.timeScale(1.6).reverse();
      } else {
        instantRef.current = false;
        setDisplayed(active);
      }
    } else if (active && displayed && tl && tl.reversed()) {
      // Came back to the same section while it was leaving.
      pendingRef.current = null;
      setPhase("entering");
      tl.timeScale(1).play();
    }
  }, [active, displayed]);

  // displayed → timeline. Built once the hidden content is in the DOM.
  useLayoutEffect(() => {
    if (!displayed) return undefined;
    const els = overlayRef.current?.getEls();
    const content = contentRef.current;
    const card = cardRef.current;
    if (!els || !content || !card) return undefined;

    const cam = scene?.cam ?? { x: 0, y: 0, zoom: 1 };
    const focus = scene ? scene.focus(displayed.id) : { x: 0, y: 0 };
    scene?.lockCamera(true);
    const zoomTo = scene ? scene.state.fitZoom * TRANSITION_ZOOM : undefined;
    const tl = buildTransition({ els, cam, focus, zoomTo, content, card, reduced });
    tl.eventCallback("onComplete", () => {
      setPhase("shown");
      focusHeading(content);
    });
    tl.eventCallback("onReverseComplete", () => {
      scene?.lockCamera(false);
      scene?.setCameraMode("follow"); // ease back to the player rather than cut
      const next = pendingRef.current;
      pendingRef.current = null;
      if (next) {
        instantRef.current = false;
        setDisplayed(next);
      } else {
        setDisplayed(null);
        setPhase("idle");
      }
    });
    tlRef.current = tl;

    const instant = instantRef.current || reduced || phaseRef.current === "shown";
    instantRef.current = false;
    if (instant) {
      tl.progress(1);
      setPhase("shown");
    } else {
      setPhase("entering");
      tl.play();
    }
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [displayed, scene, reduced]);

  useEffect(() => {
    if (displayed && liveRef.current) liveRef.current.textContent = `${displayed.label} section`;
  }, [displayed]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const goTo = (id) => navigate(id ? `/${id}` : "/");
  const Displayed = displayed ? SECTION_COMPONENTS[displayed.id] : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />

      <IsoCourt onReady={setScene} onLand={onLand} inputEnabled={!displayed && !tutorial} />

      <div className="fixed inset-0 z-30 pointer-events-none">
        <OutCall show={outCall} />
      </div>

      <BroadcastTransition ref={overlayRef} section={displayed} />

      {Displayed && (
        <div ref={contentRef} className="relative z-20" style={{ visibility: "hidden", opacity: 0 }}>
          <div ref={cardRef} className="py-24">
            <Displayed />
            <div className="max-w-3xl mx-auto px-6 sm:px-12 lg:px-24 mt-6">
              <Link
                to="/"
                className="font-mono text-xs uppercase tracking-widest text-cream hover:text-ball transition-colors"
              >
                &larr; Back to court
              </Link>
            </div>
          </div>
        </div>
      )}

      {displayed && phase === "shown" && <Hud active={displayed} onNavigate={goTo} />}
      <ServeTutorial open={tutorial} onClose={() => setTutorial(false)} />
    </div>
  );
};

export default CourtStage;
