import { motion } from "framer-motion";
import { Search, Mic } from "lucide-react";
import { useState } from "react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);

  return (
    <section className="relative h-screen flex items-end pb-24 md:items-center md:pb-0 justify-center overflow-hidden">
      {/* Background videos */}
      <div className="absolute inset-0">
        {/* Desktop video */}
        <video
          src="/videos/hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="hidden md:block w-full h-full object-cover object-center"
        />
        {/* Mobile video */}
        <video
          src="/videos/hero-bg-mobile.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="md:hidden w-full h-full object-cover object-center"
        />
        {/* Mobile overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background md:hidden" />
        {/* Desktop subtle bottom fade */}
        <div className="hidden md:block absolute inset-x-0 top-[85%] bottom-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center w-full max-w-3xl mx-auto px-4 md:px-6">
        {/* AI Search bar */}
        <motion.div
          className="glass-panel rounded-sm p-1.5 max-w-xl mx-auto relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {/* Input row */}
          <div className="flex items-center gap-2 md:gap-3 md:pr-20">
            {/* Mic button - moved to left */}
            <button
              onClick={() => setListening(!listening)}
              className={`p-3 rounded-sm transition-all duration-300 flex-shrink-0 relative ml-2 md:ml-4 ${
                listening
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Mic size={18} />
              {listening && (
                <motion.div
                  className="absolute inset-0 rounded-sm border-2 border-accent"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </button>
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por nome, código ou região..."
              className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none py-3 min-w-0"
            />
          </div>
          {/* Buscar button - full width on mobile, inline on desktop */}
          <button className="w-full md:hidden bg-primary text-primary-foreground py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic mt-1.5">
            Buscar
          </button>
          <button className="hidden md:block bg-primary text-primary-foreground px-6 py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic absolute right-1.5 top-1.5 bottom-1.5">
            Buscar
          </button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          className="flex items-center justify-center gap-2 md:gap-4 mt-4 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          {["Casas em Condomínio", "Mansões Exclusive", "Lançamentos"].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span className="text-cashmere/40 text-xs hidden md:inline">·</span>}
              <a
                href="#"
                className="text-body text-[10px] md:text-xs tracking-[0.12em] uppercase text-cashmere/70 hover:text-cashmere transition-colors duration-300"
              >
                {label}
              </a>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <motion.div
          className="w-px h-12 bg-cashmere/40"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;