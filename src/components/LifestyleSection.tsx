import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
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
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      onSelect();
      setScrollSnaps(emblaApi.scrollSnapList());
    });
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header — uma linha */}
        <div className="flex items-center justify-between gap-6 mb-8">
          <h2 className="text-display text-2xl md:text-3xl font-normal text-foreground">
            Encontre propriedades que{" "}
            <span className="font-semibold">representam seu estilo de vida</span>
          </h2>
          <Link
            to="/busca"
            className="text-body text-sm text-foreground/70 hover:text-primary transition-colors whitespace-nowrap"
          >
            Ver todos
          </Link>
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-6">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing basis-[85%] md:basis-[calc(33.33%-16px)]"
              >
                <div className="group block bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="overflow-hidden aspect-[4/3]">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-display text-lg md:text-xl font-normal text-foreground">
                      {cat.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className="flex items-center justify-center"
            >
              {i === selectedIndex ? (
                <span className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="w-2 h-2 bg-background rounded-sm" />
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;
