import { useEffect, useRef } from "react";

const ServeTutorial = ({ open, onClose }) => {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Serve tutorial"
        className="bg-cream text-charcoal rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-wimbledon px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-ball text-xs uppercase tracking-widest">Whoa &mdash; way out</span>
          <span className="font-mono text-cream/70 text-[0.65rem] uppercase tracking-widest">Replay</span>
        </div>
        <div className="px-6 py-6">
          <h2 className="font-display font-extrabold text-charcoal text-2xl mb-2">
            This is a tutorial on how to serve.
          </h2>
          <p className="text-charcoal/70 text-sm mb-5">
            That one sailed past the baseline. Here&apos;s how it&apos;s done &mdash;
          </p>
          {/* Video placeholder — a real serve clip drops in here later. */}
          <div className="w-full rounded-xl border border-charcoal/15 bg-charcoal/5 flex items-center justify-center" style={{ aspectRatio: "16 / 9" }}>
            <span className="font-mono text-xs uppercase tracking-widest text-charcoal/40">Serve tutorial &mdash; coming soon</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex items-center gap-2 bg-wimbledon hover:bg-grass text-white font-display font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Got it &mdash; back to the baseline
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServeTutorial;
