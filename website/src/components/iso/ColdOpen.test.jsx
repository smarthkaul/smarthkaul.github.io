import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ColdOpen, { shouldPlay } from "./ColdOpen";

const fakeScene = () => ({ intro: vi.fn(), skipIntro: vi.fn() });

beforeEach(() => {
  window.history.pushState({}, "", "/?intro");
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  // jsdom does not implement media playback.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  window.history.pushState({}, "", "/");
});

describe("ColdOpen", () => {
  it("shouldPlay: ?intro forces it; a seen visitor or another route skips it", () => {
    expect(shouldPlay()).toBe(true);
    window.history.pushState({}, "", "/projects");
    expect(shouldPlay()).toBe(false);
    window.history.pushState({}, "", "/");
    localStorage.setItem("coldOpenSeen", "1");
    expect(shouldPlay()).toBe(false);
    localStorage.removeItem("coldOpenSeen");
    expect(shouldPlay()).toBe(true);
  });

  it("renders the bumper name, and Skip skips the scene intro and calls onDone", () => {
    const scene = fakeScene();
    const onDone = vi.fn();
    render(<ColdOpen scene={scene} onDone={onDone} />);
    expect(screen.getAllByText("Smarth Kaul").length).toBeGreaterThan(0);
    expect(screen.getByText("Now serving")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(scene.skipIntro).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("coldOpenSeen")).toBe("1");
    expect(screen.queryByText("Now serving")).toBeNull();
    localStorage.removeItem("coldOpenSeen");
  });

  it("Skip before the scene exists still finishes", () => {
    const onDone = vi.fn();
    render(<ColdOpen scene={null} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
