import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

// The ESPN-style hand-off between the court and a section: a slam caption, a
// vignette, three angled wipe panels with a ticker, and a flash. All DOM so
// the fonts and edges stay crisp; the camera zoom lives on the canvas and is
// tweened by buildTransition() through the shared cam object.

const PANEL_COLORS = ["#3a2151", "#d6f84c", "#f4f1e9"]; // wimbledon-dark, ball, cream

const tickerText = (section) =>
  Array(6).fill(`SMARTH KAUL · ${section.broadcast} · ${section.label}`).join("  ·  ").toUpperCase();

const BroadcastTransition = forwardRef(({ section }, ref) => {
  const vignette = useRef(null);
  const slam = useRef(null);
  const panels = useRef([]);
  const ticker = useRef(null);
  const flash = useRef(null);

  // Park the panels off-screen through GSAP rather than inline CSS: GSAP reads
  // an inline translateX(-130%) back as a pixel `x`, which a later xPercent
  // tween would not cancel — the panels would end up parked over the content.
  useLayoutEffect(() => {
    gsap.set(panels.current.filter(Boolean), { xPercent: -130, skewX: -14 });
  }, []);

  useImperativeHandle(ref, () => ({
    getEls: () => ({
      vignette: vignette.current,
      slam: slam.current,
      panels: panels.current.filter(Boolean),
      ticker: ticker.current,
      flash: flash.current,
    }),
  }));

  return (
    <>
      {/* The vignette dims the court behind the content, so it sits below z-20. */}
      <div
        ref={vignette}
        className="fixed inset-0 z-10 pointer-events-none opacity-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(24,27,24,0.45) 0%, rgba(24,27,24,0.92) 100%)",
        }}
      />
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">

      <div
        ref={slam}
        className="absolute left-[8%] bottom-[16%] opacity-0"
        style={{ transform: "skewX(-8deg)" }}
      >
        <p className="font-mono text-ball text-xs sm:text-sm uppercase tracking-[0.3em] mb-2">
          {section?.broadcast}
        </p>
        <div className="relative inline-block">
          <span className="absolute inset-y-1 -inset-x-3 bg-ball" />
          <h2
            className="relative font-display font-extrabold italic uppercase text-charcoal leading-none px-1"
            style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
          >
            {section?.label}
          </h2>
        </div>
      </div>

      {PANEL_COLORS.map((color, i) => (
        <div
          key={color}
          ref={(el) => (panels.current[i] = el)}
          className="absolute top-0 bottom-0 w-[130vw] -left-[15vw] overflow-hidden"
          style={{ background: color, transform: "translateX(-130%) skewX(-14deg)" }}
        >
          {i === 1 && (
            <div
              ref={ticker}
              className="absolute top-1/2 -translate-y-1/2 left-0 whitespace-nowrap font-mono text-charcoal text-sm sm:text-base tracking-[0.35em]"
              style={{ transform: "skewX(14deg)" }}
            >
              {section ? tickerText(section) : ""}
            </div>
          )}
        </div>
      ))}

      <div ref={flash} className="absolute inset-0 bg-white opacity-0" />
    </div>
    </>
  );
});
BroadcastTransition.displayName = "BroadcastTransition";

export default BroadcastTransition;

// One reversible timeline per section visit. Forward = court → content;
// reverse() = content → court. Every value is set through tweens (fromTo /
// set) so reverse restores the exact start state.
// `zoomTo` is the absolute zoom to push in to; without it the camera zooms to
// `zoomFactor` × wherever it started.
export function buildTransition({ els, cam, focus, zoomTo, zoomFactor = 3, content, card, reduced }) {
  const d = (seconds) => (reduced ? 0 : seconds);
  // No overwrite mode: every tween here is sequenced, and "auto" would kill
  // the sweep-in's xPercent so the panels could never travel back on reverse.
  const tl = gsap.timeline({ paused: true });
  const { vignette, slam, panels, ticker, flash } = els;
  const from = { x: cam.x, y: cam.y, zoom: cam.zoom };

  // Slam caption.
  tl.fromTo(slam, { autoAlpha: 0, scale: 1.4, x: -40 }, { autoAlpha: 1, scale: 1, x: 0, duration: d(0.35), ease: "back.out(1.8)" }, 0);

  // Vignette + camera push.
  tl.fromTo(vignette, { autoAlpha: 0 }, { autoAlpha: 1, duration: d(0.6), ease: "power2.out" }, d(0.1));
  tl.fromTo(
    cam,
    { x: from.x, y: from.y, zoom: from.zoom },
    { x: focus.x, y: focus.y, zoom: zoomTo ?? from.zoom * zoomFactor, duration: d(0.85), ease: "power3.inOut" },
    d(0.1)
  );

  // Panels sweep in (purple leads).
  panels.forEach((panel, i) => {
    tl.fromTo(panel, { xPercent: -130, x: 0, skewX: -14 }, { xPercent: 0, x: 0, skewX: -14, duration: d(0.45), ease: "power4.inOut" }, d(0.7 + i * 0.07));
  });
  if (ticker) tl.fromTo(ticker, { x: 0 }, { x: -480, duration: d(0.5), ease: "power2.out" }, d(1.0));

  // Flash + swap.
  tl.fromTo(flash, { autoAlpha: 0 }, { autoAlpha: 0.7, duration: d(0.05) }, d(1.08));
  tl.to(flash, { autoAlpha: 0, duration: d(0.25), ease: "power2.out" }, d(1.13));
  tl.to(slam, { autoAlpha: 0, duration: d(0.001) }, d(1.1));
  tl.fromTo(content, { autoAlpha: 0 }, { autoAlpha: 1, duration: d(0.001) }, d(1.1));

  // Panels sweep out (cream first, purple reveals last).
  panels.forEach((panel, i) => {
    tl.to(panel, { xPercent: 130, duration: d(0.5), ease: "power4.inOut" }, d(1.2 + (panels.length - 1 - i) * 0.07));
  });

  // Content card lands.
  tl.fromTo(card, { y: 48, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: d(0.6), ease: "expo.out" }, d(1.3));

  return tl;
}
