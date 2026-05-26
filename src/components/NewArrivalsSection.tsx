import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockProperties, formatPrice } from "@/data/mockProperties";
import { toTitleCase } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const NewArrivalsSection = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const { data: featuredSetting } = useQuery({
    queryKey: ["site_settings", "homepage_featured_properties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "homepage_featured_properties")
        .maybeSingle();
      return (data?.value as { property_ids?: string[] } | null) ?? null;
    },
  });

  const curatedIds = featuredSetting?.property_ids ?? [];

  const { data: dbProperties } = useQuery({
    queryKey: ["new-arrivals-properties", curatedIds.join(",")],
    queryFn: async () => {
      if (curatedIds.length > 0) {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .in("id", curatedIds);
        if (error || !data?.length) return null;
        // preserve admin-defined order
        const order = new Map(curatedIds.map((id, i) => [id, i]));
        return [...data].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      }
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .not("photos", "is", null)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error || !data?.length) return null;
      return data;
    },
  });

  const mockByCode = Object.fromEntries(mockProperties.map((m) => [m.code, m.photo]));

  const properties = dbProperties?.length
    ? dbProperties.map((p) => ({
        id: p.id,
        image: p.photos?.[0] || mockByCode[p.code] || "/images/property-1.jpg",
        title: p.title,
        code: p.code,
        type: p.property_type || "Casa",
        area: p.area_total,
        suites: p.bedrooms || 0,
        parking: p.parking_spots || 0,
        price: p.price,
        transaction: p.transaction_type || "Venda",
      }))
    : mockProperties.slice(0, 12).map((p) => ({
        id: p.id,
        image: p.photo || p.images[0],
        title: p.title,
        code: p.code,
        type: p.property_type || "Casa",
        area: p.area_total,
        suites: p.suites,
        parking: p.parking,
        price: p.price,
        transaction: p.transaction_type || "Venda",
      }));

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => setScrollSnaps(emblaApi.scrollSnapList()));
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        {/* Header — uma linha */}
        <div className="flex items-center justify-between gap-6 mb-8">
          <h2 className="text-display text-2xl md:text-3xl font-normal text-foreground">
            Nossas propriedades especiais em Alphaville, Tamboré e Santana de Parnaiba
          </h2>
          <Link
            to="/busca"
            className="text-body text-sm text-foreground/70 hover:text-primary transition-colors whitespace-nowrap"
          >
            Ver todos
          </Link>
        </div>

        {/* Carrossel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {properties.map((prop) => (
              <article
                key={prop.id}
                className="flex-[0_0_85%] md:flex-[0_0_calc(33.333%-16px)] min-w-0"
              >
                <Link
                  to={`/imovel/${prop.id}`}
                  className="group block bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Imagem */}
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={prop.image}
                      alt={toTitleCase(prop.title)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Bloco inferior */}
                  <div className="p-5">
                    {/* Meta */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground">
                        {prop.type}
                      </span>
                      <span className="text-body text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
                        {prop.code}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className="text-display text-xl font-normal text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2 min-h-[3.5rem]">
                      {toTitleCase(prop.title)}
                    </h3>

                    {/* Specs */}
                    <p className="text-body text-sm text-muted-foreground">
                      {prop.area}m² &nbsp;-&nbsp; Suítes: {prop.suites} &nbsp;-&nbsp; Vagas: {prop.parking}
                    </p>

                    {/* Divisor */}
                    <div className="border-t border-border/60 my-4" />

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body text-[11px] tracking-[0.1em] uppercase font-semibold text-foreground">
                          {prop.transaction}:
                        </p>
                        <p className="text-display text-lg font-medium text-foreground">
                          {formatPrice(prop.price)}
                        </p>
                      </div>
                      <span className="text-body text-sm bg-foreground text-background px-5 py-2 rounded-md group-hover:bg-foreground/90 transition-colors">
                        Saiba Mais
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
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

export default NewArrivalsSection;
