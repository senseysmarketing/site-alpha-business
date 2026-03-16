import { useState } from "react";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <section className="bg-foreground py-16 section-padding">
        <div className="mb-10">
          <p className="text-body text-xs tracking-[0.3em] uppercase text-white/50 mb-3">
            Lifestyle
          </p>
          <h2 className="text-display text-3xl font-light text-white">
            Navegue pelo seu{" "}
            <em className="italic text-white/80">estilo de vida</em>
          </h2>
        </div>
        <div className="flex flex-col gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="relative h-[300px] rounded-lg overflow-hidden"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-6">
                <p className="text-body text-xs tracking-[0.2em] uppercase text-white/50 mb-1">
                  {cat.count}
                </p>
                <h3 className="text-display text-2xl font-light text-white mb-2">
                  {cat.title}
                </h3>
                <p className="text-body text-sm text-white/60 mb-4">
                  {cat.subtitle}
                </p>
                <button className="self-start bg-bordeaux text-white text-body text-xs tracking-[0.15em] uppercase px-6 py-3 rounded-sm hover:bg-bordeaux-light transition-colors">
                  Explorar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-foreground">
      <div className="section-padding pt-12 pb-8">
        <p className="text-body text-xs tracking-[0.3em] uppercase text-white/50 mb-3">
          Lifestyle
        </p>
        <h2 className="text-display text-3xl md:text-5xl font-light text-white">
          Navegue pelo seu{" "}
          <em className="italic text-white/80">estilo de vida</em>
        </h2>
      </div>

      <div
        className="flex h-[85vh]"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {categories.map((cat, i) => {
          const isActive = hoveredIndex === i;
          const hasHover = hoveredIndex !== null;

          return (
            <motion.div
              key={cat.title}
              className="relative overflow-hidden cursor-pointer"
              animate={{
                flex: isActive ? 3 : hasHover ? 0.7 : 1,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              onMouseEnter={() => setHoveredIndex(i)}
            >
              {/* Background image with zoom */}
              <motion.img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover"
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-black/20" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                {/* Collapsed: vertical title */}
                <AnimatePresence mode="wait">
                  {!isActive ? (
                    <motion.h3
                      key="vertical"
                      className="text-display text-2xl md:text-3xl font-light text-white whitespace-nowrap"
                      style={{ writingMode: "vertical-rl" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, rotate: 180 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {cat.title}
                    </motion.h3>
                  ) : (
                    <motion.div
                      key="expanded"
                      className="flex flex-col items-start justify-end h-full w-full p-4 md:p-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <p className="text-body text-xs tracking-[0.2em] uppercase text-white/50 mb-2">
                        {cat.count}
                      </p>
                      <h3 className="text-display text-4xl md:text-5xl lg:text-6xl font-light text-white mb-3">
                        {cat.title}
                      </h3>
                      <p className="text-body text-sm md:text-base text-white/60 max-w-md mb-6">
                        {cat.subtitle}
                      </p>
                      <motion.button
                        className="bg-bordeaux text-white text-body text-xs tracking-[0.15em] uppercase px-8 py-3 rounded-sm hover:bg-bordeaux-light transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        Explorar
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default LifestyleSection;
