const OutCall = ({ show }) => {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24 z-30" aria-hidden="true">
      <span className="font-display font-extrabold text-white bg-wimbledon/90 px-5 py-2 rounded-lg text-2xl tracking-widest shadow-xl">
        OUT
      </span>
    </div>
  );
};

export default OutCall;
