import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import headUrl from "../../assets/player/head.svg";
import bodyUrl from "../../assets/player/body.svg";
import leftArmUrl from "../../assets/player/left-arm.svg";
import rightArmUrl from "../../assets/player/right-arm.svg";
import introThemeUrl from "../../assets/intro-theme.m4a";
import headshotUrl from "../../assets/headshot.jpg";

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

// Player home position in the court viewBox — mirrors Player.jsx.
const P = {
  leftArm: { x: 73, y: 157, w: 17, h: 40 },
  body: { x: 85, y: 148, w: 30, h: 72 },
  head: { x: 76, y: 95, w: 46, h: 56 },
  rightArm: { x: 109, y: 155, w: 17, h: 42 },
};
const RK = { cx: P.rightArm.x + P.rightArm.w / 2 + 11, cy: P.rightArm.y + P.rightArm.h + 4, rx: 8, ry: 11 };

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
  const audioRef = useRef(null);
  const finishedRef = useRef(false);

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
      // Entry offset from his home spot. y is capped at -80: his head sits at
      // y=95 in the court viewBox, so anything past about -90 pushes it above
      // the viewBox top edge and the SVG clips it off.
      gsap.set(".co-player", { opacity: 0, x: 290, y: -80 });

      // Built paused: the show is released below, once we know whether the
      // theme can play, so music and first frame begin on the same beat.
      const tl = gsap.timeline({ paused: true, onComplete: finish });
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

      // 3 · Card transitions away as the court builds itself
      tl.set(".co-court-scene", { opacity: 1 })
        .to(".co-card", { scale: 0.35, opacity: 0, yPercent: -35, duration: 0.7, ease: "power2.inOut" }, "<")
        .set(".co-card-scene", { opacity: 0 })
        .from(".co-grass", { opacity: 0, duration: 0.4 }, "<0.15")
        .fromTo(".co-line", { strokeDashoffset: 720 }, { strokeDashoffset: 0, stagger: 0.05, duration: 0.7, ease: "power1.inOut" }, "<");

      // 4 · Player enters top-centre and waddle-walks AROUND the court to his
      // baseline spot: first left along the top, then down the left side.
      // Two separate keyframes (not a diagonal) so he skirts the court, and a
      // beat at the corner where he turns.
      tl.to(".co-player", { opacity: 1, duration: 0.2 })
        .to(
          ".co-player",
          {
            keyframes: [
              { x: 0, duration: 1.5, ease: "none" },
              { x: 0, duration: 0.25 }, // pause + turn at the corner
              { y: 0, duration: 1.4, ease: "none" },
            ],
          },
          "<"
        )
        .to(".co-player", { rotation: 4, transformOrigin: "50% 95%", duration: 0.24, yoyo: true, repeat: 12, ease: "sine.inOut" }, "<");

      // 5 · Hand off to the live court
      tl.to(".co-court-scene", { opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.3");
    }, rootRef);

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
      audio.pause();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] court-turf overflow-hidden">
      <button
        type="button"
        onClick={finish}
        className="absolute top-4 right-4 z-20 font-mono text-cream/80 hover:text-ball text-xs uppercase tracking-widest"
      >
        Skip &#9656;
      </button>

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

      {/* 3–4 · Court builds + player walks in (matches the live court, viewBox 780×360) */}
      <div className="co-court-scene absolute inset-0 flex items-center justify-center px-4 pt-16" style={{ opacity: 0 }}>
        <div className="relative w-full" style={{ maxWidth: 960, aspectRatio: "780 / 360" }}>
          <svg viewBox="0 0 780 360" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <rect className="co-grass" x="140" y="20" width="500" height="320" rx="6" fill="#276e3c" />
            <g fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="720">
              <line className="co-line" x1="140" y1="20" x2="640" y2="20" />
              <line className="co-line" x1="140" y1="340" x2="640" y2="340" />
              <line className="co-line" x1="140" y1="20" x2="140" y2="340" />
              <line className="co-line" x1="640" y1="20" x2="640" y2="340" />
              <line className="co-line" x1="140" y1="60" x2="640" y2="60" />
              <line className="co-line" x1="140" y1="300" x2="640" y2="300" />
              <line className="co-line" x1="265" y1="60" x2="265" y2="300" />
              <line className="co-line" x1="515" y1="60" x2="515" y2="300" />
              <line className="co-line" x1="265" y1="180" x2="515" y2="180" />
            </g>
            <line className="co-line" x1="390" y1="20" x2="390" y2="340" stroke="#f4f1e9" strokeWidth="4" strokeDasharray="720" />

            {/* player (assembled parts, walked in) */}
            <g className="co-player">
              <image href={rightArmUrl} x={P.leftArm.x} y={P.leftArm.y} width={P.leftArm.w} height={P.leftArm.h} />
              <image href={bodyUrl} x={P.body.x} y={P.body.y} width={P.body.w} height={P.body.h} />
              <image href={headUrl} x={P.head.x} y={P.head.y} width={P.head.w} height={P.head.h} />
              <g>
                <image href={leftArmUrl} x={P.rightArm.x} y={P.rightArm.y} width={P.rightArm.w} height={P.rightArm.h} />
                <line x1={P.rightArm.x + P.rightArm.w / 2} y1={P.rightArm.y + P.rightArm.h - 6} x2={RK.cx - 4} y2={RK.cy + 7} stroke="#d6f84c" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx={RK.cx} cy={RK.cy} rx={RK.rx} ry={RK.ry} fill="none" stroke="#d6f84c" strokeWidth="2.5" />
                <g stroke="#d6f84c" strokeWidth="0.7" opacity="0.65">
                  <line x1={RK.cx - 4} y1={RK.cy - 9} x2={RK.cx - 4} y2={RK.cy + 9} />
                  <line x1={RK.cx} y1={RK.cy - 10} x2={RK.cx} y2={RK.cy + 10} />
                  <line x1={RK.cx + 4} y1={RK.cy - 9} x2={RK.cx + 4} y2={RK.cy + 9} />
                  <line x1={RK.cx - 6} y1={RK.cy - 5} x2={RK.cx + 6} y2={RK.cy - 5} />
                  <line x1={RK.cx - 7} y1={RK.cy} x2={RK.cx + 7} y2={RK.cy} />
                  <line x1={RK.cx - 6} y1={RK.cy + 5} x2={RK.cx + 6} y2={RK.cy + 5} />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ColdOpen;
