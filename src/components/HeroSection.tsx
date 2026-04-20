import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockProperties } from "@/data/mockProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface HeroSettings {
  tagline: string;
  headline: string;
  carousel_property_ids: string[];
}

interface Slide {
  id: string;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
}

const DEFAULT_TAGLINE = "Prepare-se para sonhar alto";
const SLIDE_DURATION_MS = 5000;
const TICK_MS = 50;
const PROGRESS_STEP = (TICK_MS / SLIDE_DURATION_MS) * 100;

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPausedManual, setIsPausedManual] = useState(false);
  const [isHoveredContent, setIsHoveredContent] = useState(false);
  const [isHoveredSection, setIsHoveredSection] = useState(false);

  const { data: heroSettings } = useSiteSettings<HeroSettings>("hero");
  const tagline = heroSettings?.tagline || DEFAULT_TAGLINE;
  const carouselIds = heroSettings?.carousel_property_ids || [];

  const { data: properties } = useQuery({
    queryKey: ["hero-carousel-properties", carouselIds],
    queryFn: async () => {
      if (carouselIds.length > 0) {
        const { data, error } = await supabase
          .from("properties")
          .select("id, title, condominium, neighborhood, city, photos, video_url, description")
          .in("id", carouselIds);
        if (error || !data?.length) return null;
        const byId = new Map(data.map((p) => [p.id, p]));
        return carouselIds.map((id) => byId.get(id)).filter(Boolean) as typeof data;
      }
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, condominium, neighborhood, city, photos, video_url, description")
        .eq("is_featured", true)
        .limit(3);
      if (error || !data?.length) return null;
      return data;
    },
  });

  const slides: Slide[] = useMemo(() => {
    if (properties?.length) {
      return properties.slice(0, 3).map((p) => {
        const address = [p.condominium, p.neighborhood, p.city].filter(Boolean).join(" · ");
        // Refinamento 2: priorizar short_pitch (defensivo) → title → endereço
        const shortPitch = (p as { short_pitch?: string }).short_pitch;
        const title = shortPitch || p.title || address;
        return {
          id: p.id,
          title,
          description: address || p.description?.slice(0, 120) || "",
          image: p.photos?.[0] || "",
          videoUrl: p.video_url || undefined,
        };
      });
    }
    return mockProperties.slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      description: [p.condominium, p.neighborhood].filter(Boolean).join(" · "),
      image: p.photo || p.images[0],
    }));
  }, [properties]);

  const isPaused = isPausedManual || isHoveredContent;

  // Progress timer
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + PROGRESS_STEP >= 100) {
          setActiveIndex((i) => (i + 1) % slides.length);
          return 0;
        }
        return prev + PROGRESS_STEP;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, activeIndex]);

  const goTo = (i: number) => {
    setActiveIndex(i);
    setProgress(0);
  };
  const next = () => goTo((activeIndex + 1) % slides.length);
  const prev = () => goTo((activeIndex - 1 + slides.length) % slides.length);

  if (slides.length === 0) {
    return <section className="h-[75vh] md:h-[80vh] bg-bordeaux" />;
  }

  const current = slides[activeIndex];

  return (
    <section
      className="relative h-[75vh] md:h-[80vh] overflow-hidden bg-black"
      onMouseEnter={() => setIsHoveredSection(true)}
      onMouseLeave={() => setIsHoveredSection(false)}
    >
      {/* Slides — cross-fade */}
      <div className="absolute inset-0">
        {slides.map((slide, i) => {
          const isActive = i === activeIndex;
          return (
            <motion.div
              key={slide.id}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {slide.videoUrl ? (
                <video
                  src={slide.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={slide.image}
                  className="w-full h-full object-cover"
                />
              ) : (
                <motion.img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  style={{ transformOrigin: i % 2 === 0 ? "center center" : "30% 70%" }}
                  initial={{ scale: 1 }}
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ duration: 6, ease: "linear" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            </motion.div>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-24">
        <div
          className="max-w-3xl"
          onMouseEnter={() => setIsHoveredContent(true)}
          onMouseLeave={() => setIsHoveredContent(false)}
        >
          <motion.p
            className="text-xs tracking-[0.3em] uppercase text-white/60 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {tagline}
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-display text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight italic">
                {current.title}
              </h1>
              {current.description && (
                <p className="mt-4 text-sm md:text-base text-white/70 max-w-xl">
                  {current.description}
                </p>
              )}
              <Link
                to={`/imovel/${current.id}`}
                className="inline-flex items-center mt-6 px-7 py-3 text-xs tracking-[0.2em] uppercase text-white border border-white/20 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#2A070C" }}
              >
                Saiba Mais
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop arrows — hover only */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className={`hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-opacity duration-300 ${isHoveredSection ? "opacity-100" : "opacity-0"}`}
      >
        <ChevronLeft size={20} strokeWidth={1.25} />
      </button>
      <button
        onClick={next}
        aria-label="Próximo"
        className={`hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-opacity duration-300 ${isHoveredSection ? "opacity-100" : "opacity-0"}`}
      >
        <ChevronRight size={20} strokeWidth={1.25} />
      </button>

      {/* Desktop controls — progress bars + play/pause */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 items-center gap-4">
        <div className="flex gap-2">
          {slides.map((_, i) => {
            const fill = i < activeIndex ? 100 : i === activeIndex ? progress : 0;
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className="relative w-20 h-[2px] bg-white/25 rounded-full overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-white rounded-full"
                  style={{ width: `${fill}%`, transition: i === activeIndex ? "width 50ms linear" : "width 300ms ease" }}
                />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setIsPausedManual((p) => !p)}
          aria-label={isPausedManual ? "Retomar" : "Pausar"}
          className="w-9 h-9 flex items-center justify-center text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-colors"
        >
          {isPaused ? <Play size={14} strokeWidth={1.25} /> : <Pause size={14} strokeWidth={1.25} />}
        </button>
      </div>

      {/* Mobile — single ultra-thin progress line */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 h-px bg-white/20 rounded-full">
        <div
          className="h-full bg-white rounded-full"
          style={{
            width: `${((activeIndex + progress / 100) / slides.length) * 100}%`,
            transition: "width 50ms linear",
          }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
