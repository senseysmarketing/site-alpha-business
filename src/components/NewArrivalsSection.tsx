import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockProperties, formatPrice } from "@/data/mockProperties";
import useEmblaCarousel from "embla-carousel-react";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Ruler, BedDouble, Car } from "lucide-react";

const NewArrivalsSection = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const { data: dbProperties } = useQuery({
    queryKey: ["new-arrivals-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
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
    : mockProperties.slice(0, 6).map((p) => ({
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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.p
              className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Seleção especial
            </motion.p>
            <motion.h2
              className="text-display text-2xl md:text-4xl font-light max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Nossas propriedades especiais em{" "}
              <em className="italic">Alphaville, Tamboré e Santana de Parnaíba</em>
            </motion.h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={scrollPrev} className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md">
              <ChevronLeft size={18} />
            </button>
            <button onClick={scrollNext} className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {properties.map((prop, i) => (
              <motion.article
                key={prop.id}
                className="flex-[0_0_85%] md:flex-[0_0_calc(33.333%-16px)] min-w-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link to={`/imovel/${prop.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-lg aspect-[4/3] mb-4">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="text-body text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 bg-primary text-primary-foreground rounded-sm">
                        {prop.type}
                      </span>
                      <span className="text-body text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 bg-background/90 text-foreground rounded-sm">
                        {prop.code}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-display text-lg font-light mb-2 text-foreground group-hover:text-primary transition-colors">
                    {prop.title}
                  </h3>

                  <div className="flex items-center gap-4 text-muted-foreground text-body text-xs mb-3">
                    <span className="flex items-center gap-1.5">
                      <Ruler size={13} />
                      {prop.area} m²
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BedDouble size={13} />
                      {prop.suites} suítes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Car size={13} />
                      {prop.parking} vagas
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{prop.transaction}</p>
                      <p className="text-display text-lg font-medium text-foreground">
                        {formatPrice(prop.price)}
                      </p>
                    </div>
                    <span className="text-body text-[10px] tracking-[0.15em] uppercase text-primary border border-primary px-4 py-2 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Saiba Mais
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8 md:hidden">
          {properties.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex ? "bg-primary w-6" : "bg-muted-foreground/30"}`}
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
