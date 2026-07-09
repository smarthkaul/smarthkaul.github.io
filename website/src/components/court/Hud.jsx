import { motion } from "framer-motion";
import Court from "./Court";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const Hud = ({ active, onNavigate }) => {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.aside
      initial={reduced ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
      className="hidden sm:block fixed top-20 right-4 z-40 w-44 sm:w-52 bg-wimbledon/90 backdrop-blur-md rounded-xl border border-wimbledon-dark p-3 shadow-xl"
      aria-label="Court navigation"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-ball text-[0.6rem] uppercase tracking-widest">On court</span>
        <span className="font-display font-bold text-cream text-sm">{active.label}</span>
      </div>
      <Court active={active} onNavigate={onNavigate} docked />
    </motion.aside>
  );
};

export default Hud;
