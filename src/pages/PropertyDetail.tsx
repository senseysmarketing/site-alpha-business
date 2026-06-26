import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, Loader2 } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png.asset.json";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertySpecs from "@/components/property/PropertySpecs";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyNeighborhood from "@/components/property/PropertyNeighborhood";
import ScheduleVisitModal from "@/components/property/ScheduleVisitModal";
import { formatPrice } from "@/lib/formatters";
import { toTitleCase } from "@/lib/utils";
import { normalizeCondoName } from "@/lib/lucideIconMap";
import { fetchAllPages } from "@/lib/supabasePagination";
import { isRentalTransaction } from "@/lib/propertyQueries";
import type { Database } from "@/integrations/supabase/types";
import type { NeighborhoodHighlight } from "@/components/property/PropertyNeighborhood";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.5 },
};

const isUUID = (s?: string) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const PLACEHOLDER_IMAGE = "/placeholder.svg";
const DEFAULT_BROKER = {
  name: "Rafael Albuquerque",
  title: "Corretor especialista em Alphaville",
};

type DbProperty = Database["public"]["Tables"]["properties"]["Row"];
type DbCondo = Database["public"]["Tables"]["condominiums"]["Row"];

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [dbProperty, setDbProperty] = useState<DbProperty | null>(null);
  const [dbCondo, setDbCondo] = useState<DbCondo | null>(null);
  const [similarDb, setSimilarDb] = useState<DbProperty[]>([]);
  const [loadingDb, setLoadingDb] = useState(isUUID(id));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);
    if (!isUUID(id)) {
      setDbProperty(null);
      setDbCondo(null);
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
        .eq("status", "ativo")
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setDbProperty(null);
        setDbCondo(null);
        setLoadingDb(false);
        return;
      }
      setDbProperty(data);
      setLoadingDb(false);

      // Fetch condominium info by normalized name
      if (data.condominium) {
        const condos = await fetchAllPages<DbCondo>(() =>
          supabase
            .from("condominiums")
            .select("*")
            .eq("is_active", true)
        ).catch(() => []);
        if (!cancelled && condos) {
          const target = normalizeCondoName(data.condominium);
          const match = condos.find(
            (c) => normalizeCondoName(c.name ?? "") === target,
          );
          setDbCondo(match ?? null);
        }
      } else {
        setDbCondo(null);
      }

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
  if (!isUUID(id) || notFound || !dbProperty) {
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

  const condoRegion = dbCondo?.region || null;
  const condoCity = dbCondo?.city || null;
  const condoHighlights: NeighborhoodHighlight[] = Array.isArray(dbCondo?.highlights)
    ? (dbCondo!.highlights as unknown as NeighborhoodHighlight[])
    : [];
  const dbImages =
    dbProperty?.photos && dbProperty.photos.length > 0
      ? dbProperty.photos
      : [PLACEHOLDER_IMAGE];

  const property = {
        id: dbProperty.id,
        code: dbProperty.code,
        title: dbProperty.title,
        subtitle: [
          dbProperty.condominium,
          condoRegion || dbProperty.neighborhood,
          condoCity || dbProperty.city,
        ].filter(Boolean).join(" · "),
        condominium: dbProperty.condominium,
        neighborhood: condoRegion || dbProperty.neighborhood,
        city: condoCity || dbProperty.city,
        property_type: dbProperty.property_type,
        transaction_type: dbProperty.transaction_type,
        price: (dbProperty.transaction_type === "locacao" || dbProperty.transaction_type === "aluguel")
          ? dbProperty.rental_price
          : dbProperty.price,
        sale_price: dbProperty.price,
        rental_price: dbProperty.rental_price,
        has_both: dbProperty.transaction_type === "ambos"
          && !!dbProperty.price && !!dbProperty.rental_price,
        bedrooms: dbProperty.bedrooms ?? 0,
        bathrooms: dbProperty.bathrooms ?? 0,
        suites: dbProperty.bedrooms ?? 0,
        parking: dbProperty.parking_spots ?? 0,
        area_total: dbProperty.area_total ?? 0,
        photo: dbImages[0],
        images: dbImages,
        description: dbProperty.description ?? "",
        amenities: dbProperty.engineering_highlights ?? [],
        broker: DEFAULT_BROKER,
        neighborhoodInfo: {
          name: condoRegion || dbProperty.neighborhood || dbProperty.city || "",
          description: dbCondo?.description ?? "",
          highlights: condoHighlights,
        },
        video_url: dbProperty.video_url,
        condo_fee: (dbProperty as any).condo_fee as number | null,
        iptu: (dbProperty as any).iptu as number | null,
      };



  // Similar: prefer DB results when current property is from DB
  const similarProperties = similarDb.length > 0
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
        photo: p.photos?.[0] || PLACEHOLDER_IMAGE,
        images: p.photos?.length ? p.photos : [PLACEHOLDER_IMAGE],
      }))
    : [];

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
          {property.has_both ? (
            <div className="flex flex-col items-start md:items-end gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-body text-[10px] tracking-[0.18em] uppercase text-muted-foreground">Compra</span>
                <span className="text-display text-2xl md:text-3xl font-light text-foreground whitespace-nowrap">
                  {formatPrice(property.sale_price)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-body text-[10px] tracking-[0.18em] uppercase text-muted-foreground">Locação</span>
                <span className="text-display text-xl md:text-2xl font-light text-foreground whitespace-nowrap">
                  {formatPrice(property.rental_price)}<span className="text-xs text-muted-foreground ml-1">/mês</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-display text-3xl md:text-4xl font-light text-foreground whitespace-nowrap">
              {formatPrice(property.price)}
              {isRentalTransaction(property.transaction_type) && (
                <span className="text-sm text-muted-foreground ml-1">/mês</span>
              )}
            </p>
          )}
        </div>

        {(property.condo_fee || property.iptu) && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-body text-xs text-muted-foreground">
            {property.condo_fee ? (
              <span>
                <span className="uppercase tracking-[0.15em] text-[10px] mr-1.5">Condomínio</span>
                <span className="text-foreground">{formatPrice(property.condo_fee)}<span className="ml-1">/mês</span></span>
              </span>
            ) : null}
            {property.iptu ? (
              <span>
                <span className="uppercase tracking-[0.15em] text-[10px] mr-1.5">IPTU</span>
                <span className="text-foreground">{formatPrice(property.iptu)}<span className="ml-1">/ano</span></span>
                <span className="ml-1 text-muted-foreground/70">(≈ {formatPrice(Math.round(property.iptu / 12))}/mês)</span>
              </span>
            ) : null}
          </div>
        )}




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
              <img src={whatsappIcon.url} alt="" className="w-4 h-4" />
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

            <PropertyNeighborhood
              name={property.neighborhoodInfo.name}
              description={property.neighborhoodInfo.description}
              highlights={property.neighborhoodInfo.highlights}
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
      {similarProperties.length > 0 && (
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
      )}

      <Footer />

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t border-border p-3 flex gap-2">
        <a
          href="https://wa.me/5511993116849"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-body text-sm font-medium rounded-full"
        >
          <img src={whatsappIcon.url} alt="" className="w-5 h-5" />
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
