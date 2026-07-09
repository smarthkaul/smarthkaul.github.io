import { useState, useEffect } from "react";
import Ticker from "../broadcast/Ticker";

const PHRASES = ["statistics student.", "machine learning engineer.", "data scientist."];
const TYPE_SPEED = 65;
const DELETE_SPEED = 35;
const PAUSE_MS = 1800;
const TECH = [
  "Python", "R", "SQL", "TensorFlow", "Scikit-learn",
  "XGBoost", "Time Series", "Machine Learning", "Data Viz", "Statistics",
];

const Hub = () => {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    let timeout;
    if (!deleting && display === phrase) {
      timeout = setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && display === "") {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    } else if (!deleting) {
      timeout = setTimeout(() => setDisplay(phrase.slice(0, display.length + 1)), TYPE_SPEED);
    } else {
      timeout = setTimeout(() => setDisplay(display.slice(0, -1)), DELETE_SPEED);
    }
    return () => clearTimeout(timeout);
  }, [display, deleting, phraseIdx]);

  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-ball animate-pulse" />
        <span className="font-mono text-cream text-xs uppercase tracking-widest">Live &middot; Toronto, ON</span>
      </div>
      <h1
        className="font-display font-extrabold text-cream leading-none tracking-tight mb-6"
        style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
      >
        Smarth Kaul
      </h1>
      <div className="flex items-center gap-1" style={{ minHeight: "2rem" }}>
        <span className="text-cream/90 text-lg sm:text-xl font-light">{display}</span>
        <span className="cursor-blink text-ball text-xl font-light select-none">|</span>
      </div>
      <Ticker items={TECH} className="rounded-lg mt-8" />
    </div>
  );
};

export default Hub;
