import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { COURT, SERVE_ORIGIN, serveControl, servePathD, bezierPoint } from "../../data/sections";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const Ball = ({ aim, shot, onLand }) => {
  const reduced = usePrefersReducedMotion();
  const scope = useRef(null);
  const ballRef = useRef(null);
  const trailRef = useRef(null);
  const rippleRef = useRef(null);

  // Idle bob at the baseline when neither aiming nor mid-flight.
  useGSAP(
    () => {
      if (aim || shot) return;
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });
      if (reduced) return;
      gsap.to(ballRef.current, {
        attr: { cy: SERVE_ORIGIN.y - 8 },
        duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1,
      });
    },
    { scope, dependencies: [aim, shot, reduced] }
  );

  // Flight to the landing point, then onLand.
  useGSAP(
    () => {
      if (!shot) return;
      const control = serveControl(SERVE_ORIGIN, shot);
      const d = servePathD(SERVE_ORIGIN, control, shot);
      gsap.set(trailRef.current, { attr: { d }, opacity: 0 });
      gsap.set(rippleRef.current, { attr: { cx: shot.x, cy: shot.y, r: 2 }, opacity: 0 });
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });

      if (reduced) {
        gsap.set(ballRef.current, { attr: { cx: shot.x, cy: shot.y } });
        onLand?.();
        return;
      }

      const progress = { t: 0 };
      const tl = gsap.timeline({ onComplete: () => onLand?.() });
      tl.to(trailRef.current, { opacity: 0.7, duration: 0.12 }, 0);
      tl.to(progress, {
        t: 1, duration: 0.7, ease: "power1.in",
        onUpdate: () => {
          const p = bezierPoint(SERVE_ORIGIN, control, shot, progress.t);
          gsap.set(ballRef.current, { attr: { cx: p.x, cy: p.y } });
        },
      }, 0);
      tl.to(rippleRef.current, { attr: { r: 40 }, opacity: 0.6, duration: 0.05 }, ">-0.02");
      tl.to(rippleRef.current, { opacity: 0, duration: 0.35, ease: "power2.out" });
      tl.to(trailRef.current, { opacity: 0, duration: 0.35 }, "<");
    },
    { scope, dependencies: [shot, reduced] }
  );

  // Aim line + power gauge (computed inline from the pull vector).
  const aimLine = aim
    ? { x2: SERVE_ORIGIN.x - aim.pull.x, y2: SERVE_ORIGIN.y - aim.pull.y }
    : null;

  return (
    <svg
      ref={scope}
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {aimLine && (
        <>
          <line
            x1={SERVE_ORIGIN.x} y1={SERVE_ORIGIN.y}
            x2={aimLine.x2} y2={aimLine.y2}
            stroke="#d6f84c" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" opacity="0.8"
          />
          {/* Power gauge: a short bar near the baseline, fill ∝ power */}
          <rect x={SERVE_ORIGIN.x - 40} y={SERVE_ORIGIN.y + 6} width="80" height="6" rx="3" fill="#276e3c" opacity="0.5" />
          <rect x={SERVE_ORIGIN.x - 40} y={SERVE_ORIGIN.y + 6} width={80 * Math.min(1, aim.power)} height="6" rx="3" fill="#d6f84c" />
        </>
      )}
      <path ref={trailRef} fill="none" stroke="#d6f84c" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" opacity="0" />
      <circle ref={rippleRef} fill="none" stroke="#d6f84c" strokeWidth="3" opacity="0" />
      <circle ref={ballRef} cx={SERVE_ORIGIN.x} cy={SERVE_ORIGIN.y} r="8" fill="#d6f84c" stroke="#276e3c" strokeWidth="1.5" />
    </svg>
  );
};

export default Ball;
