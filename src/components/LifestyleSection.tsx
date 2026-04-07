import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import mansionModern from "@/assets/mansion-modern.jpg";
import familyHome from "@/assets/family-home.jpg";
import sustainableHome from "@/assets/sustainable-home.jpg";

interface LifestyleCategory {
  title: string;
  image: string;
}

const defaultCategories = [
  { title: "Refúgios para relaxar", image: mansionModern },
  { title: "Imóveis Assinados", image: familyHome },
  { title: "Mais espaço para a família", image: sustainableHome },
];

const LifestyleSection = () => {
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const { data: lifestyleSettings } = useSiteSettings<{ categories: LifestyleCategory[] }>("lifestyle_categories");

  const categories = defaultCategories.map((def, i) => {
    const dbCat = lifestyleSettings?.categories?.[i];
    return {
      title: dbCat?.title || def.title,
      image: dbCat?.image || def.image,
    };
  });

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
    <section className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header with title and nav buttons */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-display text-2xl md:text-4xl font-light text-foreground max-w-lg">
            Encontre propriedades que representam seu{" "}
            <span className="font-bold">estilo de vida</span>
          </h2>

          {!isMobile && (
            <div className="flex gap-2 flex-shrink-0 ml-8">
              <button
                className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md disabled:opacity-40"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md disabled:opacity-40"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4 md:gap-6">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className={`flex-shrink-0 cursor-grab active:cursor-grabbing ${
                  isMobile ? "basis-[85%]" : "basis-[calc(33.33%-16px)]"
                }`}
              >
                <div className="rounded-sm overflow-hidden aspect-[4/3]">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-all duration-500 ease-out hover:scale-[1.02] hover:brightness-110"
                  />
                </div>
                <h3 className="text-display text-lg md:text-xl font-light text-foreground mt-3">
                  {cat.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile dots */}
        {isMobile && (
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
        )}
      </div>
    </section>
  );
};

export default LifestyleSection;
