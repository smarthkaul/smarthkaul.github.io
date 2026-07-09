import { useEffect, useRef } from "react";
import gsap from "gsap";
import { COURT } from "../../data/sections";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

// Stylized geometric figure standing at the left baseline. The racket arm is a
// group that pivots at the shoulder: it winds back as you aim (∝ power) and
// swings through on release. All coordinates are in the court's SVG viewBox, so
// the racket sits next to the ball at SERVE_ORIGIN (~155,180).
const SHOULDER = { x: 110, y: 158 };
const ORIGIN = `${SHOULDER.x} ${SHOULDER.y}`;

const Player = ({ aim, shot }) => {
  const reduced = usePrefersReducedMotion();
  const armRef = useRef(null);

  useEffect(() => {
    const el = armRef.current;
    if (!el) return;

    // Swing: sweep the arm forward through contact, then settle back to rest.
    if (shot) {
      if (reduced) {
        gsap.set(el, { rotation: 0, svgOrigin: ORIGIN });
        return;
      }
      const tl = gsap
        .timeline()
        .to(el, { rotation: 48, svgOrigin: ORIGIN, duration: 0.13, ease: "power3.in" })
        .to(el, { rotation: 0, svgOrigin: ORIGIN, duration: 0.4, ease: "power2.out" });
      return () => tl.kill();
    }

    // Wind-up: track the pull power instantly so the racket follows the drag.
    if (aim) {
      gsap.set(el, { rotation: -aim.power * 55, svgOrigin: ORIGIN });
      return;
    }

    // Idle: glide the arm back to rest.
    const t = gsap.to(el, { rotation: 0, svgOrigin: ORIGIN, duration: reduced ? 0 : 0.3, ease: "power2.out" });
    return () => t.kill();
  }, [aim, shot, reduced]);

  return (
    <svg
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {/* legs */}
      <line x1="103" y1="183" x2="100" y2="209" stroke="#181b18" strokeWidth="5" strokeLinecap="round" />
      <line x1="111" y1="183" x2="114" y2="209" stroke="#181b18" strokeWidth="5" strokeLinecap="round" />
      {/* torso */}
      <rect x="99" y="150" width="16" height="35" rx="7" fill="#4c2c69" />
      {/* head + hair */}
      <circle cx="107" cy="140" r="11" fill="#f0d0a8" />
      <ellipse cx="107" cy="133" rx="12" ry="7.5" fill="#3a2151" />
      {/* racket arm (pivots at the shoulder) */}
      <g ref={armRef}>
        <line x1={SHOULDER.x} y1={SHOULDER.y} x2="147" y2="176" stroke="#f0d0a8" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="153" cy="178" rx="9" ry="12" fill="none" stroke="#d6f84c" strokeWidth="3" />
      </g>
    </svg>
  );
};

export default Player;
