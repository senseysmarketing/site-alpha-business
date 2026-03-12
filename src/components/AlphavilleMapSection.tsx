import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, ArrowRight } from "lucide-react";

interface Neighborhood {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  available: number;
  x: number;
  y: number;
}

const neighborhoods: Neighborhood[] = [
  {
    id: "alpha0",
    name: "Alphaville 0",
    description: "O residencial mais exclusivo, com lotes amplos e vista privilegiada.",
    priceRange: "R$ 10M – 18M",
    available: 4,
    x: 38,
    y: 28,
  },
  {
    id: "alpha11",
    name: "Alphaville 11",
    description: "Tradição e sofisticação em um dos endereços mais desejados.",
    priceRange: "R$ 7M – 14M",
    available: 6,
    x: 55,
    y: 42,
  },
  {
    id: "tambore",
    name: "Tamboré",
    description: "Infraestrutura completa com acesso a comércio e serviços premium.",
    priceRange: "R$ 5M – 12M",
    available: 8,
    x: 72,
    y: 32,
  },
  {
    id: "aldeia",
    name: "Aldeia da Serra",
    description: "Natureza exuberante com privacidade e tranquilidade absolutas.",
    priceRange: "R$ 4M – 9M",
    available: 5,
    x: 25,
    y: 58,
  },
  {
    id: "genesis",
    name: "Genesis",
    description: "Projeto arquitetônico contemporâneo com sustentabilidade integrada.",
    priceRange: "R$ 8M – 15M",
    available: 3,
    x: 48,
    y: 68,
  },
  {
    id: "burle",
    name: "Burle Marx",
    description: "Inspirado no paisagismo brasileiro, com jardins e áreas verdes únicas.",
    priceRange: "R$ 6M – 11M",
    available: 7,
    x: 68,
    y: 62,
  },
];

const AlphavilleMapSection = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const selectedNeighborhood = neighborhoods.find((n) => n.id === selected);

  return (
    <section id="mapa" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:mb-16">
          <motion.p
            className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Explore por região
          </motion.p>
          <motion.h2
            className="text-display text-3xl md:text-5xl font-light"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Mapa de <em className="italic">Alphaville</em>
          </motion.h2>
        </div>

        {isMobile ? (
          <div className="space-y-4">
            {neighborhoods.map((n, i) => (
              <motion.div
                key={n.id}
                className="border border-border p-6 cursor-pointer hover:bg-muted/50 transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-display text-lg font-light">{n.name}</h3>
                    <p className="text-body text-xs text-muted-foreground mt-1">
                      {n.available} imóveis disponíveis
                    </p>
                  </div>
                  <span className="text-body text-sm font-medium text-foreground">
                    {n.priceRange}
                  </span>
                </div>
                <p className="text-body text-sm text-muted-foreground leading-relaxed mb-4">
                  {n.description}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-foreground line-reveal pb-1"
                >
                  Explorar <ArrowRight className="w-3 h-3" />
                </a>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="relative w-full aspect-[16/9] border border-border overflow-hidden bg-muted/30">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M 10 50 Q 30 30, 50 45 T 90 40" stroke="hsl(var(--border))" strokeWidth="0.3" fill="none" />
                <path d="M 20 20 Q 40 60, 60 50 T 85 70" stroke="hsl(var(--border))" strokeWidth="0.3" fill="none" />
                <path d="M 15 70 Q 35 55, 55 65 T 80 45" stroke="hsl(var(--border))" strokeWidth="0.2" fill="none" />
                <path d="M 30 15 L 30 85" stroke="hsl(var(--border))" strokeWidth="0.15" fill="none" strokeDasharray="1 1" />
                <path d="M 60 10 L 60 90" stroke="hsl(var(--border))" strokeWidth="0.15" fill="none" strokeDasharray="1 1" />
                <ellipse cx="20" cy="35" rx="8" ry="6" fill="hsl(var(--muted))" opacity="0.5" />
                <ellipse cx="75" cy="55" rx="10" ry="7" fill="hsl(var(--muted))" opacity="0.4" />
                <ellipse cx="45" cy="80" rx="12" ry="5" fill="hsl(var(--muted))" opacity="0.3" />
                <text x="50" y="12" textAnchor="middle" className="text-body" fill="hsl(var(--muted-foreground))" fontSize="2" letterSpacing="0.3" opacity="0.4">
                  REGIÃO ALPHAVILLE
                </text>
              </svg>

              {neighborhoods.map((n, i) => (
                <motion.button
                  key={n.id}
                  className="absolute group"
                  style={{
                    left: `${n.x}%`,
                    top: `${n.y}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                >
                  <motion.div
                    className="absolute -inset-3 rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                  />
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                      selected === n.id
                        ? "bg-primary scale-125"
                        : "bg-primary/80 hover:bg-primary hover:scale-110"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-body text-[10px] tracking-[0.15em] uppercase transition-opacity duration-300 ${
                      selected === n.id
                        ? "text-foreground opacity-100"
                        : "text-muted-foreground opacity-70 group-hover:opacity-100"
                    }`}
                  >
                    {n.name}
                  </span>
                </motion.button>
              ))}

              <AnimatePresence>
                {selectedNeighborhood && (
                  <motion.div
                    className="absolute z-20 glass-panel p-6 w-72"
                    style={{
                      left: selectedNeighborhood.x > 60 ? `${selectedNeighborhood.x - 22}%` : `${selectedNeighborhood.x + 5}%`,
                      top: `${Math.max(5, selectedNeighborhood.y - 15)}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-display text-lg font-light text-foreground">{selectedNeighborhood.name}</h3>
                      <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors text-xs">✕</button>
                    </div>
                    <p className="text-body text-sm text-muted-foreground leading-relaxed mb-4">{selectedNeighborhood.description}</p>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                      <div>
                        <p className="text-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Faixa de preço</p>
                        <p className="text-body text-sm font-medium text-foreground">{selectedNeighborhood.priceRange}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Disponíveis</p>
                        <p className="text-body text-sm font-medium text-foreground">{selectedNeighborhood.available} imóveis</p>
                      </div>
                    </div>
                    <a href="#" className="inline-flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-foreground line-reveal pb-1">
                      Explorar região <ArrowRight className="w-3 h-3" />
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AlphavilleMapSection;