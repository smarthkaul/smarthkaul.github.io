import { useEffect, useRef } from "react";
import gsap from "gsap";
import { COURT } from "../../data/sections";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import headUrl from "../../assets/player/head.svg";
import bodyUrl from "../../assets/player/body.svg";
import leftArmUrl from "../../assets/player/left-arm.svg";
import rightArmUrl from "../../assets/player/right-arm.svg";

// Player assembled from the Figma-cut image parts, standing at the left baseline
// facing the court. Every placement below is in court-viewBox units and meant to
// be tuned by eye. The right arm is the swinging piece — it pivots at the
// shoulder for the wind-up (∝ pull) and the swing (on release).
const PARTS = {
  leftArm: { x: 73, y: 157, w: 17, h: 40 },
  body: { x: 85, y: 148, w: 30, h: 72 },
  head: { x: 76, y: 95, w: 46, h: 56 },
  rightArm: { x: 109, y: 155, w: 17, h: 42 },
};
const SHOULDER = { x: 116, y: 154 }; // right-arm pivot
const ORIGIN = `${SHOULDER.x} ${SHOULDER.y}`;
const REST = 0; // right-arm rotation at rest

const Player = ({ aim, shot }) => {
  const reduced = usePrefersReducedMotion();
  const armRef = useRef(null);
  const figureRef = useRef(null);

  useEffect(() => {
    const el = armRef.current;
    if (!el) return;

    if (shot) {
      if (reduced) {
        gsap.set(el, { rotation: REST, svgOrigin: ORIGIN });
        return;
      }
      const tl = gsap
        .timeline()
        .to(el, {
          rotation: REST + 60,
          svgOrigin: ORIGIN,
          duration: 0.14,
          ease: "power3.in",
        })
        .to(el, {
          rotation: REST,
          svgOrigin: ORIGIN,
          duration: 0.4,
          ease: "power2.out",
        });
      return () => tl.kill();
    }

    if (aim) {
      gsap.set(el, { rotation: REST - aim.power * -55, svgOrigin: ORIGIN });
      return;
    }

    const t = gsap.to(el, {
      rotation: REST,
      svgOrigin: ORIGIN,
      duration: reduced ? 0 : 0.3,
      ease: "power2.out",
    });
    return () => t.kill();
  }, [aim, shot, reduced]);

  // Idle bounce: gently bob the whole figure when not aiming or swinging.
  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;
    if (aim || shot || reduced) {
      gsap.set(el, { y: 0 });
      return;
    }
    const t = gsap.to(el, {
      y: -6,
      duration: 0.55,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => t.kill();
  }, [aim, shot, reduced]);

  const r = PARTS.rightArm;
  const rk = { cx: r.x + r.w / 2 + 11, cy: r.y + r.h + 4, rx: 8, ry: 11 }; // racket head
  return (
    <svg
      viewBox={`0 0 ${COURT.width} ${COURT.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <g ref={figureRef}>
        <image
          href={rightArmUrl}
          x={PARTS.leftArm.x}
          y={PARTS.leftArm.y}
          width={PARTS.leftArm.w}
          height={PARTS.leftArm.h}
        />
        <image
          href={bodyUrl}
          x={PARTS.body.x}
          y={PARTS.body.y}
          width={PARTS.body.w}
          height={PARTS.body.h}
        />
        <image
          href={headUrl}
          x={PARTS.head.x}
          y={PARTS.head.y}
          width={PARTS.head.w}
          height={PARTS.head.h}
        />

        {/* right arm (swings) + a vector racket in the hand */}
        <g ref={armRef}>
          <image href={leftArmUrl} x={r.x} y={r.y} width={r.w} height={r.h} />
          {/* handle */}
          <line
            x1={r.x + r.w / 2}
            y1={r.y + r.h - 6}
            x2={rk.cx - 4}
            y2={rk.cy + 7}
            stroke="#d6f84c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* racket frame */}
          <ellipse
            cx={rk.cx}
            cy={rk.cy}
            rx={rk.rx}
            ry={rk.ry}
            fill="none"
            stroke="#d6f84c"
            strokeWidth="2.5"
          />
          {/* strings */}
          <g stroke="#d6f84c" strokeWidth="0.7" opacity="0.65">
            <line x1={rk.cx - 4} y1={rk.cy - 9} x2={rk.cx - 4} y2={rk.cy + 9} />
            <line x1={rk.cx} y1={rk.cy - 10} x2={rk.cx} y2={rk.cy + 10} />
            <line x1={rk.cx + 4} y1={rk.cy - 9} x2={rk.cx + 4} y2={rk.cy + 9} />
            <line x1={rk.cx - 6} y1={rk.cy - 5} x2={rk.cx + 6} y2={rk.cy - 5} />
            <line x1={rk.cx - 7} y1={rk.cy} x2={rk.cx + 7} y2={rk.cy} />
            <line x1={rk.cx - 6} y1={rk.cy + 5} x2={rk.cx + 6} y2={rk.cy + 5} />
          </g>
        </g>
      </g>
    </svg>
  );
};

export default Player;
