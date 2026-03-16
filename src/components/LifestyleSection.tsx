import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import mansionModern from "@/assets/mansion-modern.jpg";
import familyHome from "@/assets/family-home.jpg";
import sustainableHome from "@/assets/sustainable-home.jpg";

const categories = [
  {
    title: "Mansões Modernas",
    subtitle: "Arquitetura contemporânea e design autoral",
    image: mansionModern,
    count: "24 imóveis",
  },
  {
    title: "Vida em Família",
    subtitle: "Residenciais com infraestrutura completa",
    image: familyHome,
    count: "38 imóveis",
  },
  {
    title: "Refúgios Sustentáveis",
    subtitle: "Harmonia entre luxo e natureza",
    image: sustainableHome,
    count: "12 imóveis",
  },
];

const LifestyleSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isMobile) return;
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.current = cx * -20;
      mouseY.current = cy * -20;

      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setParallax({ x: mouseX.current, y: mouseY.current });
      });
    },
    [isMobile],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || isMobile) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove, isMobile]);

  const active = categories[activeIndex];

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-foreground">
      {/* Background images */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            x: isMobile ? 0 : parallax.x,
            y: isMobile ? 0 : parallax.y,
          }}
          exit={{ opacity: 0 }}
          transition={{
            scale: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: { duration: 0.8 },
            x: { duration: 0.3, ease: "linear" },
            y: { duration: 0.3, ease: "linear" },
          }}
        >
          <img src={active.image} alt={active.title} className="w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between section-padding">
        {/* Top: label + title */}
        <div className="pt-8 md:pt-12">
          <p className="text-body text-xs tracking-[0.3em] uppercase text-white/50 mb-3">Lifestyle</p>
          <h2 className="text-display text-3xl md:text-5xl font-light text-white">
            Navegue pelo seu <em className="italic text-white/50">estilo de vida</em>
          </h2>
        </div>

        {/* Center: active category info */}
        <div className="flex-1 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <p className="text-body text-xs tracking-[0.2em] uppercase text-white/50 mb-3">{active.count}</p>
              <h3 className="text-display text-4xl md:text-6xl lg:text-7xl font-light text-white mb-4">
                {active.title}
              </h3>
              <p className="text-body text-sm md:text-base text-white/60 max-w-md">{active.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: navigation buttons */}
        <div className="pb-8 md:pb-12">
          <div className="flex items-center gap-8 md:gap-12">
            {categories.map((cat, i) => (
              <button
                key={cat.title}
                onClick={() => setActiveIndex(i)}
                className="group relative text-left transition-colors duration-300"
              >
                <span
                  className={`text-body text-xs md:text-sm tracking-[0.15em] uppercase transition-colors duration-300 ${
                    i === activeIndex ? "text-white" : "text-white/40 group-hover:text-white/70"
                  }`}
                >
                  {cat.title}
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 h-px bg-white"
                  initial={false}
                  animate={{
                    width: i === activeIndex ? "100%" : "0%",
                    opacity: i === activeIndex ? 1 : 0,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;
