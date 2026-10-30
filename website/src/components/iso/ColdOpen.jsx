import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import introThemeUrl from "../../assets/intro-theme.m4a";
import headshotUrl from "../../assets/headshot.jpg";

// The first-visit cold-open. The name bumper and the player card are DOM on
// a solid turf overlay; then the card shrinks away, the overlay's background
// fades to transparent, and the live isometric canvas underneath (CourtStage
// built it with intro on) draws the court in and walks the player to his
// spot — scene.intro(). He arrives, onDone fires, the overlay goes.

const SEEN_KEY = "coldOpenSeen";
const THEME_VOLUME = 0.2;

// Broadcast "tale of the tape" — Smarth's real details.
const TAPE = [
  { k: "Base", v: "Toronto, ON 🇨🇦" },
  { k: "Plays", v: "Right-handed · Python / R" },
  { k: "Turned pro", v: "2022" },
  { k: "Specialty", v: "Machine Learning & Forecasting" },
  { k: "Form", v: "Statistics @ UofT" },
];

// Play only on the landing, once per visitor, never under reduced motion.
// `?intro` in the URL forces a replay (for tuning).
export function shouldPlay() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("intro")) return true;
  if (window.location.pathname !== "/") return false;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    if (localStorage.getItem(SEEN_KEY)) return false;
  } catch {
    /* ignore */
  }
  return true;
}

const ColdOpen = ({ scene = null, onDone }) => {
  const [done, setDone] = useState(false);
  const rootRef = useRef(null);
  const tlRef = useRef(null);
  const ctxRef = useRef(null);
  const audioRef = useRef(null);
  const finishedRef = useRef(false);
  // The scene can arrive a few frames after the overlay mounts (and is
  // rebuilt under StrictMode), so the timeline reads the latest one from here.
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    tlRef.current?.kill();
    // Fade the theme out rather than cutting it. This tween is created outside
    // the gsap.context below so it survives to complete the fade.
    const a = audioRef.current;
    if (a) {
      gsap.to(a, {
        volume: 0,
        duration: 0.6,
        onComplete: () => {
          a.pause();
          a.currentTime = 0;
        },
      });
    }
    setDone(true);
    onDoneRef.current?.();
  };

  const skip = () => {
    sceneRef.current?.skipIntro();
    finish();
  };

  // Hands over to the canvas. No scene yet (it should long exist by now) →
  // finish anyway; CourtStage then puts the scene in its final state.
  const startCourt = () => {
    const s = sceneRef.current;
    if (!s) {
      finish();
      return;
    }
    // ignore(): this runs inside a timeline callback, so without it GSAP
    // would file the scene's reveal tween under our context, and ctx.revert()
    // on unmount would rewind the court to undrawn.
    const run = () => s.intro({ onDone: finish });
    if (ctxRef.current) ctxRef.current.ignore(run);
    else run();
  };

  // The theme and the timeline are owned by ONE effect so there is exactly one
  // audio element and it can never outlive the animation it belongs to.
  useEffect(() => {
    if (done) return;

    const audio = new Audio(introThemeUrl);
    audio.volume = THEME_VOLUME;
    audioRef.current = audio;
    let cancelled = false;

    const ctx = gsap.context(() => {
      gsap.set(".co-bumper-ball", { y: -70 });

      // Built paused: the show is released below, once we know whether the
      // theme can play, so music and first frame begin on the same beat. The
      // timeline ends once the overlay is see-through; finish() waits for the
      // scene's walk-in to complete.
      const tl = gsap.timeline({ paused: true });
      tlRef.current = tl;

      // 1 · Bumper — "Smarth Kaul" + the ball bouncing 3 times
      tl.from(".co-bumper-name", { opacity: 0, y: 24, duration: 0.5, ease: "power2.out" })
        .to(".co-bumper-ball", { y: 0, duration: 1.15, ease: "bounce.out" }, "-=0.25")
        .from(".co-eyebrow", { opacity: 0, duration: 0.4 }, "-=0.4")
        .to(".co-bumper", { opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.35");

      // 2 · Player card, alone, held ≥4s
      tl.set(".co-card-scene", { opacity: 1 })
        .from(".co-card", { opacity: 0, scale: 0.82, yPercent: 8, duration: 0.55, ease: "back.out(1.3)" })
        .from(".co-card-photo", { scale: 0.5, opacity: 0, duration: 0.4, ease: "back.out(2)" }, "-=0.25")
        .from(".co-tape-row", { opacity: 0, x: -14, stagger: 0.08, duration: 0.3 }, "-=0.15")
        .to({}, { duration: 2 });

      // 3 · Card shrinks away and the turf goes see-through: the live canvas
      // underneath draws the court in, then walks the player on (scene.intro).
      tl.add(startCourt)
        .to(".co-card", { scale: 0.35, opacity: 0, yPercent: -35, duration: 0.7, ease: "power2.inOut" }, "<")
        .to(".co-bg", { opacity: 0, duration: 0.8, ease: "power1.inOut" }, "<0.15")
        .set(".co-card-scene", { opacity: 0 });
    }, rootRef);
    ctxRef.current = ctx;

    // Release the show as soon as the play() promise settles — resolved (music
    // is running) or rejected (browser blocked autoplay, so it plays silent).
    // Either way the visuals start from frame 1, never mid-animation. The
    // timeout is a safety net in case the promise never settles.
    const start = () => {
      if (!cancelled) tlRef.current?.play();
    };
    const guard = setTimeout(start, 400);
    Promise.resolve(audio.play()).then(start, start);

    return () => {
      cancelled = true;
      clearTimeout(guard);
      // CourtStage unmounts us the moment finish() runs: leave the theme to
      // its fade-out tween then, and only cut it on an early unmount.
      if (!finishedRef.current) audio.pause();
      ctx.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] overflow-hidden">
      {/* Solid turf for the bumper and card; fades out to reveal the canvas. */}
      <div className="co-bg absolute inset-0 court-turf" aria-hidden="true" />

      {/* 1 · Bumper */}
      <div className="co-bumper absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="co-bumper-ball w-7 h-7 rounded-full bg-ball" style={{ boxShadow: "0 0 26px #d6f84c" }} />
        <span className="co-bumper-name font-display font-extrabold text-cream text-center leading-none" style={{ fontSize: "clamp(2.5rem, 9vw, 6rem)" }}>
          Smarth Kaul
        </span>
        <span className="co-eyebrow font-mono text-ball text-xs uppercase tracking-[0.4em]">Now serving</span>
      </div>

      {/* 2 · Player card (alone) */}
      <div className="co-card-scene absolute inset-0 flex items-center justify-center px-4" style={{ opacity: 0 }}>
        <div className="co-card w-full bg-cream text-charcoal rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: 480 }}>
          <div className="bg-wimbledon px-6 py-4 flex items-center gap-4">
            {/* alt="" — the name sits right beside it, so announcing the photo
                would just repeat it. */}
            <img
              className="co-card-photo w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-ball"
              src={headshotUrl}
              alt=""
              width="600"
              height="800"
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-ball text-[0.65rem] uppercase tracking-widest">Player introduction</p>
              <h2 className="font-display font-extrabold text-white text-3xl leading-tight">Smarth Kaul</h2>
            </div>
            <span className="text-2xl">🇨🇦</span>
          </div>
          <div className="px-6 py-6">
            <p className="font-mono text-charcoal/40 text-[0.6rem] uppercase tracking-widest mb-3">Tale of the tape</p>
            <dl className="space-y-2">
              {TAPE.map(({ k, v }) => (
                <div key={k} className="co-tape-row flex items-baseline justify-between gap-4 border-b border-charcoal/10 pb-2">
                  <dt className="font-mono text-[0.65rem] uppercase tracking-widest text-charcoal/50">{k}</dt>
                  <dd className="text-charcoal font-medium text-sm text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="font-display font-bold text-wimbledon text-center mt-5 text-lg">&ldquo;Big serve, low Brier score.&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Skip sits in its own layer, never faded, until the intro ends. */}
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-6 z-20 font-mono text-cream/80 hover:text-ball text-xs uppercase tracking-widest text-shadow-broadcast"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
      >
        Skip &#9656;
      </button>
    </div>
  );
};

export default ColdOpen;
