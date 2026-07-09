import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import headUrl from "../../assets/player/head.svg";
import bodyUrl from "../../assets/player/body.svg";
import leftArmUrl from "../../assets/player/left-arm.svg";
import rightArmUrl from "../../assets/player/right-arm.svg";

const SEEN_KEY = "coldOpenSeen";

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
function shouldPlay() {
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

const ColdOpen = () => {
  const [play] = useState(shouldPlay);
  const [done, setDone] = useState(!play);
  const rootRef = useRef(null);
  const tlRef = useRef(null);

  const finish = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    tlRef.current?.kill();
    setDone(true);
  };

  useEffect(() => {
    if (done) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });
      tlRef.current = tl;

      // 1 · Bumper — SK + ball
      tl.from(".co-bumper", { opacity: 0, scale: 0.7, duration: 0.45, ease: "back.out(1.6)" })
        .to(".co-bumper-ball", { y: -22, duration: 0.32, ease: "power1.out", yoyo: true, repeat: 1 })
        .to(".co-bumper", { opacity: 0, scale: 1.15, duration: 0.4, ease: "power2.in" }, "+=0.15");

      // 2 · Court draws itself in
      tl.set(".co-stage", { opacity: 1 })
        .fromTo(".co-line", { strokeDashoffset: 640 }, { strokeDashoffset: 0, stagger: 0.07, duration: 0.7, ease: "power1.inOut" }, "<");

      // 3 · Player pops onto the court
      tl.from(".co-player", { opacity: 0, scale: 0, transformOrigin: "50% 100%", duration: 0.45, ease: "back.out(2)" }, "-=0.15")
        .to(".co-player", { y: -8, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 });

      // 4 · Intro card
      tl.from(".co-card", { opacity: 0, yPercent: 18, duration: 0.5, ease: "power2.out" }, "-=0.2")
        .from(".co-tape-row", { opacity: 0, x: -14, stagger: 0.08, duration: 0.3 }, "-=0.1")
        .to({}, { duration: 2.2 }); // hold on the card

      // 5 · Hand off to the live court
      tl.to(".co-stage, .co-card", { opacity: 0, duration: 0.5, ease: "power2.in" });
    }, rootRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] court-turf overflow-hidden flex items-center justify-center">
      <button
        type="button"
        onClick={finish}
        className="absolute top-4 right-4 z-20 font-mono text-cream/80 hover:text-ball text-xs uppercase tracking-widest"
      >
        Skip &#9656;
      </button>

      {/* 1 · Bumper */}
      <div className="co-bumper absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="co-bumper-ball w-6 h-6 rounded-full bg-ball" style={{ boxShadow: "0 0 24px #d6f84c" }} />
        <span className="font-display font-extrabold text-cream tracking-tight" style={{ fontSize: "clamp(3rem, 12vw, 7rem)" }}>
          SK
        </span>
        <span className="font-mono text-ball text-xs uppercase tracking-[0.4em]">Now serving</span>
      </div>

      {/* 2–4 · Court + player + card */}
      <div className="co-stage absolute inset-0 flex flex-col items-center justify-center px-4 gap-6" style={{ opacity: 0 }}>
        <div className="relative w-full" style={{ maxWidth: 560, aspectRatio: "400 / 260" }}>
          <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <rect x="30" y="30" width="340" height="200" rx="6" fill="#276e3c" />
            <g fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="640">
              <line className="co-line" x1="30" y1="30" x2="370" y2="30" />
              <line className="co-line" x1="30" y1="230" x2="370" y2="230" />
              <line className="co-line" x1="30" y1="30" x2="30" y2="230" />
              <line className="co-line" x1="370" y1="30" x2="370" y2="230" />
              <line className="co-line" x1="130" y1="30" x2="130" y2="230" />
              <line className="co-line" x1="270" y1="30" x2="270" y2="230" />
              <line className="co-line" x1="130" y1="130" x2="270" y2="130" />
            </g>
            <line className="co-line" x1="200" y1="24" x2="200" y2="236" stroke="#f4f1e9" strokeWidth="3" strokeDasharray="640" />
            {/* player (assembled parts) */}
            <g className="co-player">
              <image href={rightArmUrl} x="40" y="150" width="20" height="48" />
              <image href={bodyUrl} x="55" y="140" width="36" height="86" />
              <image href={headUrl} x="44" y="86" width="56" height="68" />
              <g transform="rotate(-18 90 150)">
                <image href={leftArmUrl} x="82" y="150" width="20" height="50" />
              </g>
            </g>
          </svg>
        </div>

        {/* 4 · Intro card */}
        <div className="co-card w-full bg-cream text-charcoal rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: 460 }}>
          <div className="bg-wimbledon px-6 py-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-ball text-[0.65rem] uppercase tracking-widest">Player introduction</p>
              <h2 className="font-display font-extrabold text-white text-2xl leading-tight">Smarth Kaul</h2>
            </div>
            <span className="font-display font-bold text-cream/90 text-lg">🇨🇦</span>
          </div>
          <div className="px-6 py-5">
            <p className="font-mono text-charcoal/40 text-[0.6rem] uppercase tracking-widest mb-3">Tale of the tape</p>
            <dl className="space-y-1.5">
              {TAPE.map(({ k, v }) => (
                <div key={k} className="co-tape-row flex items-baseline justify-between gap-4 border-b border-charcoal/10 pb-1.5">
                  <dt className="font-mono text-[0.65rem] uppercase tracking-widest text-charcoal/50">{k}</dt>
                  <dd className="text-charcoal font-medium text-sm text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="font-display font-bold text-wimbledon text-center mt-4">&ldquo;Big serve, low Brier score.&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColdOpen;
