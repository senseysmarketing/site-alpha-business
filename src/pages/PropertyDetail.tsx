import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, FileText, Building2, Wrench } from "lucide-react";
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

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.5 },
};

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const property = mockProperties.find((p) => p.id === id) || mockProperties[0];
  const similarProperties = mockProperties.filter((p) => p.id !== property.id).slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Gallery */}
      <div className="pt-[100px]">
        <PropertyGallery images={property.images} videoUrl="/videos/hero-bg.mp4" />
      </div>

      {/* Quick Info */}
      <motion.div {...fadeIn} className="px-6 md:px-12 lg:px-24 py-8 border-b border-border">
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
            <h1 className="text-display text-3xl md:text-4xl font-light tracking-wide text-foreground mb-1">
              {property.title}
            </h1>
            <p className="text-body text-sm text-muted-foreground">{property.subtitle}</p>
          </div>
          <p className="text-display text-3xl md:text-4xl font-semibold text-foreground whitespace-nowrap">
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
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-body text-xs tracking-[0.1em] uppercase hover-magnetic"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <button
              onClick={() => setScheduleOpen(true)}
              className="hidden md:block px-6 py-2.5 border border-border text-body text-xs tracking-[0.1em] uppercase text-foreground hover:bg-muted transition-colors"
            >
              Agendar visita
            </button>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="px-6 md:px-12 lg:px-24 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 lg:max-w-[65%] space-y-16">
            <motion.section {...fadeIn}>
              <h2 className="text-display text-2xl font-light tracking-wide text-foreground mb-6">
                Sobre o Imóvel
              </h2>
              <div className="text-body text-sm text-muted-foreground leading-[1.9] whitespace-pre-line">
                {property.description}
              </div>
            </motion.section>

            {/* Amenities */}
            <motion.section {...fadeIn}>
              <h2 className="text-display text-2xl font-light tracking-wide text-foreground mb-6">
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

            {/* Technical Details Accordion */}
            <motion.section {...fadeIn}>
              <h2 className="text-display text-2xl font-light tracking-wide text-foreground mb-6">
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
      <motion.section {...fadeIn} className="px-6 md:px-12 lg:px-24 py-16 border-t border-border">
        <h2 className="text-display text-2xl md:text-3xl font-light tracking-wide text-foreground mb-10">
          Imóveis que você também pode gostar
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
          {similarProperties.map((prop) => (
            <Link
              key={prop.id}
              to={`/imovel/${prop.id}`}
              className="flex-shrink-0 w-[280px] group cursor-pointer"
            >
              <div className="relative overflow-hidden aspect-[4/3] rounded-sm mb-3">
                <img
                  src={prop.photo || prop.images[0]}
                  alt={prop.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="text-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                {prop.neighborhood}
              </p>
              <h3 className="text-display text-lg font-light text-foreground mb-1">
                {prop.title}
              </h3>
              <p className="font-mono text-sm font-medium text-foreground">
                {formatPrice(prop.price)}
              </p>
            </Link>
          ))}
        </div>
      </motion.section>

      <Footer />

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t border-border p-3 flex gap-2">
        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-body text-sm font-medium rounded-sm"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
        <button
          onClick={() => setScheduleOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-body text-sm font-medium rounded-sm"
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
