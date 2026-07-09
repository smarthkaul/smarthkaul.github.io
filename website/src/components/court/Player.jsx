import { useEffect, useRef } from "react";
import gsap from "gsap";
import { COURT } from "../../data/sections";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

// Stylized mascot (inspired by Smarth's Mii — curly hair, glasses, mustache,
// cream ringer tee, jeans) standing at the left baseline, facing the court. The
// racket forearm is a separate group that pivots at the shoulder: it winds back
// as you aim (∝ power) and swings through on release. Coordinates are in the
// court viewBox, so the racket rests by the ball at SERVE_ORIGIN (~155,180).
const SHOULDER = { x: 114, y: 160 };
const ORIGIN = `${SHOULDER.x} ${SHOULDER.y}`;

const Player = ({ aim, shot }) => {
  const reduced = usePrefersReducedMotion();
  const armRef = useRef(null);

  useEffect(() => {
    const el = armRef.current;
    if (!el) return;

    if (shot) {
      if (reduced) {
        gsap.set(el, { rotation: 0, svgOrigin: ORIGIN });
        return;
      }
      const tl = gsap
        .timeline()
        .to(el, { rotation: 55, svgOrigin: ORIGIN, duration: 0.13, ease: "power3.in" })
        .to(el, { rotation: 0, svgOrigin: ORIGIN, duration: 0.4, ease: "power2.out" });
      return () => tl.kill();
    }

    if (aim) {
      gsap.set(el, { rotation: -aim.power * 60, svgOrigin: ORIGIN });
      return;
    }

    const t = gsap.to(el, { rotation: 0, svgOrigin: ORIGIN, duration: reduced ? 0 : 0.3, ease: "power2.out" });
    return () => t.kill();
  }, [aim, shot, reduced]);

  return (
    <svg
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {/* legs (jeans) */}
      <rect x="91" y="186" width="9" height="30" rx="4" fill="#3a5a8c" />
      <rect x="101" y="186" width="9" height="30" rx="4" fill="#3a5a8c" />
      {/* feet */}
      <ellipse cx="95" cy="217" rx="5.5" ry="3" fill="#e6b98a" />
      <ellipse cx="106" cy="217" rx="5.5" ry="3" fill="#e6b98a" />
      {/* torso — cream ringer tee */}
      <rect x="84" y="152" width="33" height="37" rx="9" fill="#f4f1e9" />
      {/* left arm (static): skin forearm + hand + short cream sleeve w/ red cuff */}
      <line x1="88" y1="162" x2="82" y2="183" stroke="#dba46e" strokeWidth="6" strokeLinecap="round" />
      <circle cx="81" cy="185" r="4" fill="#dba46e" />
      <rect x="82" y="153" width="9" height="11" rx="4.5" fill="#f4f1e9" />
      <rect x="82" y="161" width="9" height="2.5" fill="#c0392b" />
      {/* right sleeve (static; the forearm below is the moving arm) */}
      <rect x="110" y="153" width="9" height="11" rx="4.5" fill="#f4f1e9" />
      <rect x="110" y="161" width="9" height="2.5" fill="#c0392b" />
      {/* red collar trim */}
      <path d="M93 153 Q100.5 159 108 153" fill="none" stroke="#c0392b" strokeWidth="2.4" />
      {/* neck */}
      <rect x="96" y="146" width="9" height="8" rx="2" fill="#dba46e" />
      {/* head */}
      <circle cx="100.5" cy="132" r="15" fill="#dba46e" />
      {/* hair (dark curly) */}
      <g fill="#241c15">
        <circle cx="100" cy="116" r="12" />
        <circle cx="89" cy="121" r="8.5" />
        <circle cx="112" cy="121" r="8.5" />
        <circle cx="95" cy="112" r="8" />
        <circle cx="107" cy="112" r="8" />
        <circle cx="86" cy="129" r="5" />
        <circle cx="115" cy="129" r="5" />
      </g>
      {/* glasses */}
      <g fill="none" stroke="#2a2620" strokeWidth="1.8">
        <rect x="88.5" y="127" width="10" height="8" rx="3" />
        <rect x="102.5" y="127" width="10" height="8" rx="3" />
        <line x1="98.5" y1="131" x2="102.5" y2="131" />
      </g>
      <circle cx="93.5" cy="131" r="1.4" fill="#2a2620" />
      <circle cx="107.5" cy="131" r="1.4" fill="#2a2620" />
      {/* mustache + soul patch */}
      <path d="M94 140 Q100.5 144 107 140 Q100.5 141.5 94 140 Z" fill="#241c15" />
      <rect x="99" y="143" width="3" height="3.5" rx="1.2" fill="#241c15" />

      {/* right forearm + racket — the swinging arm (pivots at the shoulder) */}
      <g ref={armRef}>
        <line x1={SHOULDER.x} y1={SHOULDER.y} x2="145" y2="176" stroke="#dba46e" strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="146" cy="177" r="4" fill="#dba46e" />
        <line x1="147" y1="177" x2="153" y2="179" stroke="#d6f84c" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="156" cy="180" rx="8" ry="11" fill="none" stroke="#d6f84c" strokeWidth="3" />
      </g>
    </svg>
  );
};

export default Player;
