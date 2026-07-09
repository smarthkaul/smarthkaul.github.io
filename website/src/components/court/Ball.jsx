import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { COURT, SERVE_ORIGIN, serveControl, servePathD, bezierPoint } from "../../data/sections";

const Ball = ({ target, onComplete }) => {
  const scope = useRef(null);
  const ballRef = useRef(null);
  const trailRef = useRef(null);
  const rippleRef = useRef(null);

  // Idle bob at the baseline when not serving.
  useGSAP(
    () => {
      if (target) return;
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });
      gsap.to(ballRef.current, {
        attr: { cy: SERVE_ORIGIN.y - 8 },
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope, dependencies: [target] }
  );

  // Serve: follow the bézier from origin to the target zone, then onComplete.
  useGSAP(
    () => {
      if (!target) return;
      const targetPt = { x: target.cx, y: target.cy };
      const control = serveControl(SERVE_ORIGIN, targetPt);
      const d = servePathD(SERVE_ORIGIN, control, targetPt);

      gsap.set(trailRef.current, { attr: { d }, opacity: 0 });
      gsap.set(rippleRef.current, { attr: { cx: targetPt.x, cy: targetPt.y, r: 2 }, opacity: 0 });
      gsap.set(ballRef.current, { attr: { cx: SERVE_ORIGIN.x, cy: SERVE_ORIGIN.y } });

      const progress = { t: 0 };
      const tl = gsap.timeline({ onComplete });
      tl.to(trailRef.current, { opacity: 0.7, duration: 0.12 }, 0);
      tl.to(
        progress,
        {
          t: 1,
          duration: 0.75,
          ease: "power1.in",
          onUpdate: () => {
            const p = bezierPoint(SERVE_ORIGIN, control, targetPt, progress.t);
            gsap.set(ballRef.current, { attr: { cx: p.x, cy: p.y } });
          },
        },
        0
      );
      // Impact ripple at landing.
      tl.to(rippleRef.current, { attr: { r: 42 }, opacity: 0.6, duration: 0.05 }, ">-0.03");
      tl.to(rippleRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" });
      tl.to(trailRef.current, { opacity: 0, duration: 0.4 }, "<");
    },
    { scope, dependencies: [target] }
  );

  return (
    <svg
      ref={scope}
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <path
        ref={trailRef}
        fill="none"
        stroke="#d6f84c"
        strokeWidth="3"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0"
      />
      <circle ref={rippleRef} fill="none" stroke="#d6f84c" strokeWidth="3" opacity="0" />
      <circle ref={ballRef} cx={SERVE_ORIGIN.x} cy={SERVE_ORIGIN.y} r="8" fill="#d6f84c" stroke="#276e3c" strokeWidth="1.5" />
    </svg>
  );
};

export default Ball;
