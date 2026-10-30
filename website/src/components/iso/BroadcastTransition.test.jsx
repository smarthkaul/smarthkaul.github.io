import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import gsap from "gsap";
import BroadcastTransition, { buildTransition } from "./BroadcastTransition";

const section = { id: "experience", label: "Experience", broadcast: "Career Record" };

const setup = () => {
  const ref = createRef();
  const utils = render(<BroadcastTransition ref={ref} section={section} />);
  const content = document.createElement("div");
  content.style.visibility = "hidden";
  content.style.opacity = "0";
  const card = document.createElement("div");
  content.appendChild(card);
  document.body.appendChild(content);
  return { ref, content, card, ...utils };
};

describe("BroadcastTransition", () => {
  it("renders the caption from the section and is hidden from assistive tech", () => {
    const { container } = setup();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(container.textContent).toMatch(/Career Record/);
    expect(container.textContent).toMatch(/Experience/);
  });

  it("exposes the overlay elements", () => {
    const { ref } = setup();
    const els = ref.current.getEls();
    expect(els.vignette).toBeInstanceOf(HTMLElement);
    expect(els.slam).toBeInstanceOf(HTMLElement);
    expect(els.panels).toHaveLength(3);
    expect(els.ticker).toBeInstanceOf(HTMLElement);
    expect(els.flash).toBeInstanceOf(HTMLElement);
  });

  it("builds a paused timeline that zooms the camera onto the focus and reveals the content", () => {
    const { ref, content, card } = setup();
    const cam = { x: 10, y: 20, zoom: 1 };
    const tl = buildTransition({
      els: ref.current.getEls(), cam, focus: { x: 100, y: -50 }, content, card, reduced: false,
    });
    expect(tl.paused()).toBe(true);
    expect(tl.duration()).toBeGreaterThan(1.5);
    tl.progress(1);
    expect(cam.x).toBeCloseTo(100);
    expect(cam.y).toBeCloseTo(-50);
    expect(cam.zoom).toBeCloseTo(3);
    expect(content.style.visibility).toBe("inherit");
    expect(Number(content.style.opacity)).toBe(1);
    // Reversing restores the camera and hides the content again.
    tl.progress(0);
    expect(cam.x).toBeCloseTo(10);
    expect(cam.zoom).toBeCloseTo(1);
    expect(content.style.visibility).toBe("hidden");
    tl.kill();
  });

  it("is instant under reduced motion", () => {
    const { ref, content, card } = setup();
    const tl = buildTransition({
      els: ref.current.getEls(), cam: { x: 0, y: 0, zoom: 1 }, focus: { x: 1, y: 1 }, content, card, reduced: true,
    });
    expect(tl.duration()).toBeLessThan(0.01);
    tl.kill();
    gsap.globalTimeline.clear();
  });
});
