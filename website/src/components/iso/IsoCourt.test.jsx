import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// jsdom 25 has no PointerEvent, so fireEvent.pointerDown would build a bare
// Event and drop clientX / button / pointerType. A MouseEvent subclass that
// keeps pointerType is all IsoCourt reads.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventShim extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "";
    }
  }
  window.PointerEvent = PointerEventShim;
}

const fakeScene = () => ({
  start: vi.fn(), stop: vi.fn(), destroy: vi.fn(), resize: vi.fn(), fit: vi.fn(),
  lockCamera: vi.fn(), focus: vi.fn(() => ({ x: 0, y: 0 })), setImages: vi.fn(),
  setPointer: vi.fn(), clearPointer: vi.fn(), setKey: vi.fn(), clearKeys: vi.fn(),
  setInputEnabled: vi.fn(), serve: vi.fn(() => true), tap: vi.fn(), step: vi.fn(),
  cam: { x: 0, y: 0, zoom: 1 }, state: {},
});
let scene;
vi.mock("../../iso/scene", () => ({ createScene: vi.fn(() => scene) }));

import IsoCourt from "./IsoCourt";
import { createScene } from "../../iso/scene";

beforeEach(() => {
  scene = fakeScene();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

describe("IsoCourt", () => {
  it("creates and starts the scene, reports it ready, and destroys it on unmount", () => {
    const onReady = vi.fn();
    const { unmount } = render(<IsoCourt onReady={onReady} />);
    expect(createScene).toHaveBeenCalledTimes(1);
    expect(scene.start).toHaveBeenCalled();
    expect(scene.resize).toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledWith(scene);
    unmount();
    expect(scene.destroy).toHaveBeenCalled();
    expect(onReady).toHaveBeenLastCalledWith(null);
  });

  it("shows the desktop hint and the screen-reader instruction", () => {
    render(<IsoCourt />);
    expect(screen.getByText(/WASD to move/i)).toBeInTheDocument();
    expect(screen.getByText(/use the menu to jump to a section/i)).toBeInTheDocument();
  });

  it("forwards movement keys and serves on Space from the page body", () => {
    render(<IsoCourt />);
    fireEvent.keyDown(window, { code: "KeyW" });
    expect(scene.setKey).toHaveBeenCalledWith("KeyW", true);
    fireEvent.keyUp(window, { code: "KeyW" });
    expect(scene.setKey).toHaveBeenCalledWith("KeyW", false);
    fireEvent.keyDown(window, { code: "Space" });
    expect(scene.serve).toHaveBeenCalledTimes(1);
  });

  it("does not serve on Enter when a link has focus", () => {
    render(<><a href="/x">link</a><IsoCourt /></>);
    const link = screen.getByText("link");
    link.focus();
    fireEvent.keyDown(link, { code: "Enter" });
    expect(scene.serve).not.toHaveBeenCalled();
  });

  it("aims on pointer move and serves on a mouse click", () => {
    const { container } = render(<IsoCourt />);
    const canvas = container.querySelector("canvas");
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 50, pointerType: "mouse" });
    expect(scene.setPointer).toHaveBeenCalled();
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 50, pointerType: "mouse", button: 0 });
    expect(scene.serve).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 50, pointerType: "touch", button: 0 });
    expect(scene.tap).toHaveBeenCalledTimes(1);
  });

  it("passes inputEnabled through to the scene", () => {
    const { rerender } = render(<IsoCourt inputEnabled />);
    rerender(<IsoCourt inputEnabled={false} />);
    expect(scene.setInputEnabled).toHaveBeenLastCalledWith(false);
  });
});
