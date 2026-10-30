import { useEffect, useRef, useState } from "react";
import { createScene } from "../../iso/scene";
import { isMovementKey } from "../../iso/controls";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import headUrl from "../../assets/player/head.png";
import bodyUrl from "../../assets/player/body.png";
import leftArmUrl from "../../assets/player/left-arm.png";
import rightArmUrl from "../../assets/player/right-arm.png";

// The isometric court canvas. Owns nothing but the DOM and the listeners;
// the simulation lives in createScene(). Fixed and full-viewport, it sits
// behind every court route so the camera can keep zooming while a section
// is shown on top.

const TOP_INSET = 56; // the fixed Navbar (h-14)

// Slot → file. right-arm.png sits in the left slot and left-arm.png is the
// racket arm — the mapping the retired SVG Player used, which reads right.
const IMAGE_URLS = { head: headUrl, body: bodyUrl, leftArm: rightArmUrl, rightArm: leftArmUrl };

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const isTypingTarget = (el) => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

const IsoCourt = ({ onReady, onLand, onServe, inputEnabled = true }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [hintVisible, setHintVisible] = useState(true);
  const [coarse] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)")?.matches
  );

  // Latest callbacks without rebuilding the scene when they change identity.
  const callbacks = useRef({ onReady, onLand, onServe });
  callbacks.current = { onReady, onLand, onServe };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const scene = createScene({
      canvas,
      reduced,
      topInset: TOP_INSET,
      onLand: (result, point) => callbacks.current.onLand?.(result, point),
      onServe: () => {
        setHintVisible(false);
        callbacks.current.onServe?.();
      },
    });
    sceneRef.current = scene;
    const resize = () => scene.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    resize();
    scene.start();
    callbacks.current.onReady?.(scene);

    let cancelled = false;
    Promise.all(Object.entries(IMAGE_URLS).map(async ([slot, src]) => [slot, await loadImage(src)])).then(
      (entries) => { if (!cancelled) scene.setImages(Object.fromEntries(entries)); }
    );

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (isMovementKey(e.code)) {
        scene.setKey(e.code, true);
        e.preventDefault();
      } else if ((e.code === "Space" || e.code === "Enter") && document.activeElement === document.body) {
        if (scene.serve()) e.preventDefault();
      }
    };
    const onKeyUp = (e) => { if (isMovementKey(e.code)) scene.setKey(e.code, false); };
    const onBlur = () => scene.clearKeys();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      scene.destroy();
      sceneRef.current = null;
      callbacks.current.onReady?.(null);
    };
  }, [reduced]);

  useEffect(() => {
    sceneRef.current?.setInputEnabled(inputEnabled);
  }, [inputEnabled]);

  const toLocal = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onPointerMove = (e) => {
    if (e.pointerType === "touch") return;
    sceneRef.current?.setPointer(toLocal(e));
  };
  const onPointerLeave = () => sceneRef.current?.clearPointer();
  const onPointerDown = (e) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (e.pointerType === "touch") {
      scene.tap(toLocal(e));
    } else if (e.button === 0) {
      scene.setPointer(toLocal(e));
      scene.serve();
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 w-full h-full touch-none select-none cursor-crosshair"
        aria-hidden="true"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      />
      {hintVisible && inputEnabled && (
        <p className="fixed bottom-6 inset-x-0 z-10 text-center font-mono text-cream/50 text-[0.7rem] uppercase tracking-widest pointer-events-none">
          {coarse ? "Tap where you want to serve" : "WASD to move · aim with the mouse · click to serve"}
        </p>
      )}
      <p className="sr-only">
        Move with W, A, S and D, aim with the mouse and click to serve into a zone, or use the menu to jump to a section.
      </p>
    </>
  );
};

export default IsoCourt;
