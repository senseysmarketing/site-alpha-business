import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import logoRafael from "@/assets/logo-rafael.png";

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
  const [phase, setPhase] = useState<"drawing" | "expanding" | "done">("drawing");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const expandAfter = prefersReducedMotion ? 100 : 900;
    const finishAfter = prefersReducedMotion ? 180 : 1300;

    const t1 = setTimeout(() => setPhase("expanding"), expandAfter);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, finishAfter);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bordeaux"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              phase === "expanding"
                ? { opacity: 1, scale: 1, y: -200 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-6 mb-4">
              <motion.div
                className="h-px bg-cashmere/60"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              <motion.img
                src={logoRafael}
                alt="Rafael Albuquerque"
                className="h-10 md:h-14 w-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              />
              <motion.div
                className="h-px bg-cashmere/60"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-8 left-8 w-16 h-16 border-l border-t border-cashmere/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-cashmere/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
