import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockProperties } from "@/data/mockProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface HeroSettings {
  tagline: string;
  headline: string;
  carousel_property_ids: string[];
}

const DEFAULT_TAGLINE = "Prepare-se para sonhar alto";
const DEFAULT_HEADLINE = "Se você está buscando *imóveis de luxo*, aqui é o seu lugar";

// Render text with *italic* support
const renderWithItalic = (text: string) => {
  const parts = text.split(/\*(.*?)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i} className="italic">{part}</em> : <span key={i}>{part}</span>
  );
};

const HeroSection = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: heroSettings } = useSiteSettings<HeroSettings>("hero");

  const tagline = heroSettings?.tagline || DEFAULT_TAGLINE;
  const headline = heroSettings?.headline || DEFAULT_HEADLINE;
  const carouselIds = heroSettings?.carousel_property_ids || [];

  // Fetch properties for carousel
  const { data: properties } = useQuery({
    queryKey: ["hero-carousel-properties", carouselIds],
    queryFn: async () => {
      if (carouselIds.length > 0) {
        const { data, error } = await supabase
          .from("properties")
          .select("id, title, condominium, neighborhood, city, photos")
          .in("id", carouselIds);
        if (error || !data?.length) return null;
        // Preserve order from carouselIds
        const byId = new Map(data.map((p) => [p.id, p]));
        return carouselIds.map((id) => byId.get(id)).filter(Boolean) as typeof data;
      }
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
    <section className="relative h-[75vh] md:h-[85vh] overflow-hidden">
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
            {tagline}
          </motion.p>
          <motion.h1
            className="text-display text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {renderWithItalic(headline)}
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
