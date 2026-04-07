import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockProperties } from "@/data/mockProperties";

const HeroSection = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch properties for carousel
  const { data: properties } = useQuery({
    queryKey: ["hero-carousel-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, condominium, neighborhood, city, photos")
        .eq("status", "available")
        .limit(5);
      if (error || !data?.length) return null;
      return data;
    },
  });

  const slides = properties?.length
    ? properties.map((p) => ({
        image: p.photos?.[0] || "",
        title: p.title,
        location: [p.condominium, p.neighborhood, p.city].filter(Boolean).join(" · "),
      }))
    : mockProperties.slice(0, 4).map((p) => ({
        image: p.photo || p.images[0],
        title: p.title,
        location: [p.condominium, p.neighborhood].filter(Boolean).join(" · "),
      }));

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Auto-advance
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="relative h-[65vh] md:h-[70vh] overflow-hidden pt-[60px]">
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 relative h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-3xl">
          <motion.p
            className="text-body text-xs tracking-[0.3em] uppercase text-white/60 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Prepare-se para sonhar alto
          </motion.p>
          <motion.h1
            className="text-display text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Se você está buscando{" "}
            <em className="italic">imóveis de luxo</em>,<br />
            aqui é o seu lugar
          </motion.h1>

          {/* Property info */}
          {slides[selectedIndex] && (
            <motion.div
              key={selectedIndex}
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-body text-sm text-white/80">{slides[selectedIndex].title}</p>
              <p className="text-body text-xs text-white/50 mt-1">{slides[selectedIndex].location}</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-8">
          <button onClick={scrollPrev} className="w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === selectedIndex ? "bg-white w-6" : "bg-white/40"}`}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
          <button onClick={scrollNext} className="w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
