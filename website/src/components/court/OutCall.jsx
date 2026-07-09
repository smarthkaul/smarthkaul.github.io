const OutCall = ({ show }) => {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      <span
        className="absolute font-display font-extrabold text-white bg-wimbledon/90 px-5 py-2 rounded-lg text-xl sm:text-2xl tracking-widest shadow-xl"
        style={{ left: "30%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        OUT
      </span>
    </div>
  );
};

export default OutCall;
