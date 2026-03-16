import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-background py-8 md:py-12 group">
      <div className="px-6 md:px-12 lg:px-24 mb-4 md:mb-6">
        <p className="text-body text-xs tracking-[0.3em] uppercase text-foreground/50 mb-3">
          Lifestyle
        </p>
        <h2 className="text-display text-3xl md:text-5xl font-light text-foreground">
          Navegue pelo seu{" "}
          <em className="italic text-foreground/60">estilo de vida</em>
        </h2>
      </div>

      <div className="relative">
        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden px-6 md:px-12 lg:px-24">
          <div className="flex gap-4 md:gap-6">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className={`relative flex-shrink-0 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing ${
                  isMobile
                    ? "basis-[85%] h-[350px]"
                    : "basis-[calc(33.33%-22px)] h-[450px]"
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out hover:scale-[1.02] hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                  <p className="text-body text-xs tracking-[0.2em] uppercase text-white/50 mb-1">
                    {cat.count}
                  </p>
                  <h3 className="text-display text-2xl md:text-3xl font-light text-white mb-2">
                    {cat.title}
                  </h3>
                  <p className="text-body text-sm text-white/60 mb-5">
                    {cat.subtitle}
                  </p>
                  <button className="self-start bg-bordeaux text-white text-body text-xs tracking-[0.15em] uppercase px-6 py-3 rounded-sm hover:bg-bordeaux-light transition-colors">
                    Explorar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrows — desktop only, visible on hover */}
        {!isMobile && (
          <>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-0 text-foreground/50 hover:text-foreground"
              aria-label="Previous"
            >
              <ChevronLeft size={32} strokeWidth={1} />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-0 text-foreground/50 hover:text-foreground"
              aria-label="Next"
            >
              <ChevronRight size={32} strokeWidth={1} />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {categories.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i === selectedIndex ? "bg-bordeaux" : "bg-foreground/20"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default LifestyleSection;
