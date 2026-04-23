import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { mockProperties } from "@/data/mockProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface HeroSlide {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  media_type: "image" | "video";
  media_url: string;
  poster_url?: string;
}

interface HeroSettings {
  slides?: HeroSlide[];
  // Legacy
  tagline?: string;
  headline?: string;
  carousel_property_ids?: string[];
}

interface NormalizedSlide {
  id: string;
  tagline: string;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
  ctaLabel: string;
  ctaHref: string;
}

const DEFAULT_TAGLINE = "Prepare-se para sonhar alto";
const SLIDE_DURATION_MS = 6000;
const TICK_MS = 50;
const PROGRESS_STEP = (TICK_MS / SLIDE_DURATION_MS) * 100;

const renderTitle = (text: string) => {
  const parts = text.split(/\*(.*?)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} className="italic font-normal">{part}</em>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPausedManual, setIsPausedManual] = useState(false);
  const [isHoveredContent, setIsHoveredContent] = useState(false);
  const [isHoveredSection, setIsHoveredSection] = useState(false);

  const { data: heroSettings } = useSiteSettings<HeroSettings>("hero");

  const slides: NormalizedSlide[] = useMemo(() => {
    const configured = heroSettings?.slides?.filter((s) => s.media_url || s.poster_url) ?? [];
    if (configured.length) {
      return configured.slice(0, 5).map((s) => ({
        id: s.id,
        tagline: s.tagline || heroSettings?.tagline || DEFAULT_TAGLINE,
        title: s.title || heroSettings?.headline || "",
        description: s.subtitle || "",
        image: s.media_type === "image" ? s.media_url : (s.poster_url || ""),
        videoUrl: s.media_type === "video" ? s.media_url : undefined,
        ctaLabel: s.cta_label || "Saiba Mais",
        ctaHref: s.cta_href || "#",
      }));
    }
    // Fallback: mockProperties
    const fallbackTagline = heroSettings?.tagline || DEFAULT_TAGLINE;
    const fallbackTitle = heroSettings?.headline || "";
    return mockProperties.slice(0, 3).map((p) => ({
      id: p.id,
      tagline: fallbackTagline,
      title: fallbackTitle || p.title,
      description: [p.condominium, p.neighborhood].filter(Boolean).join(" · "),
      image: p.photo || p.images[0],
      ctaLabel: "Saiba Mais",
      ctaHref: `/imovel/${p.id}`,
    }));
  }, [heroSettings]);

  const isPaused = isPausedManual || isHoveredContent;

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
  const isExternalCta = /^https?:\/\//i.test(current.ctaHref);

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

      {/* Left-to-right gradient overlay for title legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-24">
        <div
          className="max-w-3xl"
          onMouseEnter={() => setIsHoveredContent(true)}
          onMouseLeave={() => setIsHoveredContent(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs tracking-[0.3em] uppercase text-white/60 mb-4">
                {current.tagline}
              </p>
              <h1 className="text-display text-3xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.35]">
                {renderTitle(current.title)}
              </h1>
              {current.description && (
                <p className="mt-4 text-sm md:text-base text-white/70 max-w-xl">
                  {current.description}
                </p>
              )}
              {current.ctaLabel && current.ctaHref && current.ctaHref !== "#" && (
                isExternalCta ? (
                  <a
                    href={current.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-6 px-7 py-3 text-xs tracking-[0.2em] uppercase text-white border border-white/20 rounded-full hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#2A070C" }}
                  >
                    {current.ctaLabel}
                  </a>
                ) : (
                  <Link
                    to={current.ctaHref}
                    className="inline-flex items-center mt-6 px-7 py-3 text-xs tracking-[0.2em] uppercase text-white border border-white/20 rounded-full hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#2A070C" }}
                  >
                    {current.ctaLabel}
                  </Link>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop arrows — hover only */}
      {slides.length > 1 && (
        <>
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
          <div className="hidden md:flex absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-20 items-center gap-4">
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
          <div className="md:hidden absolute bottom-32 left-6 right-6 z-20 h-px bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: `${((activeIndex + progress / 100) / slides.length) * 100}%`,
                transition: "width 50ms linear",
              }}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSection;
