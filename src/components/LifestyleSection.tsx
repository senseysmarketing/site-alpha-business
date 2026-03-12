import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="section-padding pb-8">
          <motion.p
            className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Lifestyle
          </motion.p>
          <motion.h2
            className="text-display text-3xl md:text-5xl font-light"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Navegue pelo seu <em className="italic">estilo de vida</em>
          </motion.h2>
        </div>

        <motion.div className="flex gap-6 md:gap-10 px-6 md:px-12 lg:px-24" style={{ x }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              className="flex-shrink-0 w-[80vw] md:w-[45vw] lg:w-[35vw] group cursor-pointer"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
            >
              <div className="relative overflow-hidden aspect-[4/5] mb-6">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-body text-xs tracking-[0.2em] uppercase text-cashmere/70 mb-2">
                    {cat.count}
                  </p>
                  <h3 className="text-display text-2xl md:text-3xl font-light text-cashmere">
                    {cat.title}
                  </h3>
                </div>
              </div>
              <p className="text-body text-sm text-muted-foreground">{cat.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LifestyleSection;