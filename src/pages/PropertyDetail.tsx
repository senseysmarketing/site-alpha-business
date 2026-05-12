import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, FileText, Building2, Wrench, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertySpecs from "@/components/property/PropertySpecs";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyNeighborhood from "@/components/property/PropertyNeighborhood";
import ScheduleVisitModal from "@/components/property/ScheduleVisitModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { mockProperties, formatPrice } from "@/data/mockProperties";
import { toTitleCase } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.5 },
};

const isUUID = (s?: string) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [dbProperty, setDbProperty] = useState<any | null>(null);
  const [similarDb, setSimilarDb] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(isUUID(id));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);
    if (!isUUID(id)) {
      setDbProperty(null);
      setLoadingDb(false);
      return;
    }
    setLoadingDb(true);
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setDbProperty(null);
        setLoadingDb(false);
        return;
      }
      setDbProperty(data);
      setLoadingDb(false);

      // Fetch similar from DB (exclude current)
      const { data: sim } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "ativo")
        .neq("id", id)
        .limit(3);
      if (!cancelled) setSimilarDb(sim ?? []);
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Only fall back to mock for explicit non-UUID demo IDs
  const mockMatch = !isUUID(id) ? mockProperties.find((p) => p.id === id) : null;
  const fallback = mockMatch || mockProperties[0];

  // Loading state for real DB fetches
  if (isUUID(id) && loadingDb) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 max-w-7xl mx-auto section-padding">
          <Skeleton className="w-full aspect-[16/9] rounded-lg mb-8" />
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (isUUID(id) && notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-40 pb-20 max-w-3xl mx-auto section-padding text-center">
          <h1 className="text-display text-3xl md:text-4xl font-light text-foreground mb-4">
            Imóvel não encontrado
          </h1>
          <p className="text-body text-sm text-muted-foreground mb-8">
            Este imóvel pode ter sido removido ou está temporariamente indisponível.
          </p>
          <Link
            to="/busca"
            className="inline-block px-6 py-2.5 bg-primary text-primary-foreground text-body text-xs tracking-[0.1em] uppercase rounded-full"
          >
            Ver outros imóveis
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const property = dbProperty
    ? {
        id: dbProperty.id,
        code: dbProperty.code,
        title: dbProperty.title,
        subtitle: [dbProperty.condominium, dbProperty.neighborhood, dbProperty.city].filter(Boolean).join(" · "),
        condominium: dbProperty.condominium,
        neighborhood: dbProperty.neighborhood,
        city: dbProperty.city,
        property_type: dbProperty.property_type,
        transaction_type: dbProperty.transaction_type,
        price: (dbProperty.transaction_type === "locacao" || dbProperty.transaction_type === "aluguel")
          ? dbProperty.rental_price
          : dbProperty.price,
        bedrooms: dbProperty.bedrooms ?? 0,
        bathrooms: dbProperty.bathrooms ?? 0,
        suites: dbProperty.bedrooms ?? 0,
        parking: dbProperty.parking_spots ?? 0,
        area_total: dbProperty.area_total ?? 0,
        photo: dbProperty.photos?.[0] ?? fallback.photo,
        images: (dbProperty.photos && dbProperty.photos.length > 0) ? dbProperty.photos : fallback.images,
        description: dbProperty.description ?? "",
        amenities: dbProperty.engineering_highlights ?? [],
        broker: fallback.broker,
        neighborhoodInfo: {
          name: dbProperty.neighborhood || fallback.neighborhoodInfo.name,
          description: fallback.neighborhoodInfo.description,
        },
        video_url: dbProperty.video_url,
      }
    : fallback;

  // Similar: prefer DB results when current property is from DB
  const similarProperties = dbProperty && similarDb.length > 0
    ? similarDb.map((p) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        property_type: p.property_type,
        transaction_type: p.transaction_type,
        price: (p.transaction_type === "locacao" || p.transaction_type === "aluguel") ? p.rental_price : p.price,
        area_total: p.area_total ?? 0,
        suites: p.bedrooms ?? 0,
        parking: p.parking_spots ?? 0,
        photo: p.photos?.[0],
        images: p.photos ?? [],
      }))
    : mockProperties.filter((p) => p.id !== property.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Gallery — starts from top, header overlays transparently */}
      <PropertyGallery images={property.images} videoUrl={property.video_url} />

      {/* Quick Info */}
      <motion.div {...fadeIn} className="section-padding py-8 border-b border-border max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {[property.property_type, property.neighborhood, `Cód: ${property.code}`].map((tag) => (
            <span
              key={tag}
              className="text-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground border border-border px-3 py-1 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
          <h1 className="text-display text-2xl md:text-4xl font-light tracking-normal leading-relaxed text-foreground mb-1">
              {toTitleCase(property.title)}
            </h1>
            <p className="text-body text-sm text-muted-foreground">{property.subtitle}</p>
          </div>
          <p className="text-display text-3xl md:text-4xl font-light text-foreground whitespace-nowrap">
            {formatPrice(property.price)}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <PropertySpecs
            area={String(property.area_total)}
            bedrooms={String(property.bedrooms)}
            suites={String(property.suites)}
            parking={String(property.parking)}
          />
          <div className="flex gap-3">
            <a
              href="https://wa.me/5511993116849"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-body text-xs tracking-[0.1em] uppercase hover-magnetic rounded-full"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <button
              onClick={() => setScheduleOpen(true)}
              className="hidden md:block px-6 py-2.5 border border-border text-body text-xs tracking-[0.1em] uppercase text-foreground hover:bg-muted transition-colors rounded-full"
            >
              Agendar visita
            </button>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="section-padding py-12 md:py-20 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 lg:max-w-[65%] space-y-16">
            <motion.section {...fadeIn}>
              <h2 className="text-display text-2xl md:text-3xl font-light tracking-tight text-foreground mb-6">
                Sobre o Imóvel
              </h2>
              <div className="text-body text-sm text-muted-foreground leading-[1.9] whitespace-pre-line">
                {property.description}
              </div>
            </motion.section>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <motion.section {...fadeIn}>
                <h2 className="text-display text-2xl md:text-3xl font-light tracking-tight text-foreground mb-6">
                  Diferenciais
                </h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((item) => (
                    <span
                      key={item}
                      className="text-body text-[10px] md:text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border border-border text-muted-foreground rounded-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Technical Details Accordion — only show for mock/demo properties with curated content */}
            {!dbProperty && (
              <motion.section {...fadeIn}>
                <h2 className="text-display text-2xl md:text-3xl font-light tracking-tight text-foreground mb-6">
                  Detalhes do Imóvel
                </h2>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="docs" className="border-border">
                    <AccordionTrigger className="text-body text-sm font-medium text-foreground hover:no-underline py-4">
                      <span className="flex items-center gap-3">
                        <FileText size={16} strokeWidth={1} className="text-muted-foreground" />
                        Documentação
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-body text-sm text-muted-foreground leading-relaxed pb-4">
                      Matrícula atualizada disponível. Imóvel livre de ônus e pendências judiciais. Escritura definitiva em nome do proprietário. Certidões negativas de débitos municipais e federais emitidas.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="costs" className="border-border">
                    <AccordionTrigger className="text-body text-sm font-medium text-foreground hover:no-underline py-4">
                      <span className="flex items-center gap-3">
                        <Building2 size={16} strokeWidth={1} className="text-muted-foreground" />
                        IPTU & Condomínio
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-body text-sm text-muted-foreground leading-relaxed pb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>IPTU (2026)</span>
                          <span className="font-mono text-foreground">R$ 18.500/ano</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Condomínio</span>
                          <span className="font-mono text-foreground">R$ 3.200/mês</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tech" className="border-border">
                    <AccordionTrigger className="text-body text-sm font-medium text-foreground hover:no-underline py-4">
                      <span className="flex items-center gap-3">
                        <Wrench size={16} strokeWidth={1} className="text-muted-foreground" />
                        Características Técnicas
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-body text-sm text-muted-foreground leading-relaxed pb-4">
                      <ul className="space-y-1.5">
                        <li>• Automação residencial completa</li>
                        <li>• Ar-condicionado central VRF</li>
                        <li>• Sistema de som ambiente integrado</li>
                        <li>• Iluminação cênica programável</li>
                        <li>• Esquadrias em alumínio com vidro duplo</li>
                        <li>• Aquecimento solar + boiler a gás</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.section>
            )}

            <PropertyNeighborhood
              name={property.neighborhoodInfo.name}
              description={property.neighborhoodInfo.description}
            />
          </div>

          <div className="lg:w-[35%]">
            <PropertySidebar
              brokerName={property.broker.name}
              brokerTitle={property.broker.title}
              propertyCode={property.code}
              propertyId={id}
            />
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      <motion.section {...fadeIn} className="section-padding py-16 border-t border-border max-w-7xl mx-auto">
        <h2 className="text-display text-2xl md:text-3xl font-light tracking-tight text-foreground mb-10">
          Imóveis que você também pode gostar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {similarProperties.map((prop) => (
            <Link
              key={prop.id}
              to={`/imovel/${prop.id}`}
              className="group block bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={prop.photo || prop.images[0]}
                  alt={toTitleCase(prop.title)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground">
                    {prop.property_type || "Casa"}
                  </span>
                  <span className="text-body text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
                    {prop.code}
                  </span>
                </div>
                <h3 className="text-display text-xl font-normal text-foreground group-hover:text-primary transition-colors mb-2">
                  {toTitleCase(prop.title)}
                </h3>
                <p className="text-body text-sm text-muted-foreground">
                  {prop.area_total}m² &nbsp;-&nbsp; Suítes: {prop.suites} &nbsp;-&nbsp; Vagas: {prop.parking}
                </p>
                <div className="border-t border-border/60 my-4" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body text-[11px] tracking-[0.1em] uppercase font-semibold text-foreground">
                      {prop.transaction_type || "Venda"}:
                    </p>
                    <p className="text-display text-lg font-medium text-foreground">
                      {formatPrice(prop.price)}
                    </p>
                  </div>
                  <span className="text-body text-sm bg-foreground text-background px-5 py-2 rounded-full group-hover:bg-foreground/90 transition-colors">
                    Saiba Mais
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      <Footer />

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t border-border p-3 flex gap-2">
        <a
          href="https://wa.me/5511993116849"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-body text-sm font-medium rounded-full"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
        <button
          onClick={() => setScheduleOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-body text-sm font-medium rounded-full"
        >
          <Calendar size={18} />
          Agendar visita
        </button>
      </div>

      <ScheduleVisitModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        propertyCode={property.code}
        brokerName={property.broker.name}
        propertyId={id}
      />
    </div>
  );
};

export default PropertyDetail;
