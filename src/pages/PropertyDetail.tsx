import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, FileText, Building2, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
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

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import mansionModern from "@/assets/mansion-modern.jpg";
import familyHome from "@/assets/family-home.jpg";

const property = {
  type: "Apartamento",
  neighborhood: "Alphaville",
  code: "AB1234",
  price: "R$ 12.500.000",
  area: "850",
  bedrooms: "5",
  suites: "4",
  parking: "4",
  title: "Residência Altos de Alphaville",
  subtitle: "Arquitetura contemporânea com vista panorâmica",
  description: `O living com pé-direito duplo de 120m² integra-se perfeitamente ao espaço gourmet, criando uma área social que flui naturalmente para a varanda equipada com churrasqueira, forno de pizza e adega climatizada. Amplos painéis de vidro dissolvem os limites entre interior e exterior, convidando a luz natural a protagonizar cada ambiente.

A suíte master ocupa 65m² de pura sofisticação — closet planejado sob medida, banheiro revestido em mármore Carrara com cuba dupla e banheira de imersão freestanding posicionada diante de uma vista que se estende até a reserva verde.

Cada detalhe foi pensado para quem não aceita o ordinário: piso em mármore Travertino, iluminação Lumini, automação Savant, sistema de som Bose integrado e ar-condicionado central VRF. A área externa abraça uma piscina com borda infinita de 15 metros, deck em madeira cumaru e paisagismo assinado por Gilberto Elkis.`,
  images: [property1, property2, property3, property4, mansionModern, familyHome],
  broker: {
    name: "Carolina Mendes",
    title: "Corretora especialista em Alphaville",
  },
  neighborhoodInfo: {
    name: "Alphaville — Oásis Urbano",
    description:
      "Alphaville é referência em qualidade de vida, segurança e infraestrutura completa. A região combina a tranquilidade de condomínios fechados com acesso rápido aos principais centros empresariais e gastronômicos da Grande São Paulo.",
  },
};

const similarProperties = [
  { id: 2, image: property2, title: "Penthouse Sky Residence", location: "Barueri", price: "R$ 8.900.000" },
  { id: 3, image: property3, title: "Villa Pedra & Vidro", location: "Alphaville 11", price: "R$ 9.200.000" },
  { id: 4, image: property4, title: "Casa Contemporânea Light", location: "Tamboré", price: "R$ 7.800.000" },
  { id: 5, image: mansionModern, title: "Mansão Jardim Europa", location: "Alphaville 0", price: "R$ 15.200.000" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.5 },
};

const PropertyDetail = () => {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Gallery */}
      <div className="pt-[72px]">
        <PropertyGallery images={property.images} videoUrl="/videos/hero-bg.mp4" />
      </div>

      {/* Quick Info */}
      <motion.div {...fadeIn} className="px-6 md:px-12 lg:px-24 py-8 border-b border-border">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {[property.type, property.neighborhood, `Cód: ${property.code}`].map((tag) => (
            <span
              key={tag}
              className="text-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground border border-border px-3 py-1 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price + Title */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-display text-3xl md:text-4xl font-light tracking-wide text-foreground mb-1">
              {property.title}
            </h1>
            <p className="text-body text-sm text-muted-foreground">{property.subtitle}</p>
          </div>
          <p className="text-display text-3xl md:text-4xl font-semibold text-foreground whitespace-nowrap">
            {property.price}
          </p>
        </div>

        {/* Specs bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <PropertySpecs
            area={property.area}
            bedrooms={property.bedrooms}
            suites={property.suites}
            parking={property.parking}
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
          {/* Main content */}
          <div className="flex-1 lg:max-w-[65%] space-y-16">
            {/* Sobre o Imóvel */}
            <motion.section {...fadeIn}>
              <h2 className="text-serif text-2xl font-light tracking-wide text-foreground mb-6">
                Sobre o Imóvel
              </h2>
              <div className="text-body text-sm text-muted-foreground leading-[1.9] whitespace-pre-line">
                {property.description}
              </div>
            </motion.section>

            {/* Technical Details Accordion */}
            <motion.section {...fadeIn}>
              <h2 className="text-serif text-2xl font-light tracking-wide text-foreground mb-6">
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
                      <li>• Automação residencial Savant (iluminação, cortinas, climatização)</li>
                      <li>• Ar-condicionado central VRF com controle por zona</li>
                      <li>• Sistema de som ambiente Bose integrado</li>
                      <li>• Iluminação Lumini com cenas programáveis</li>
                      <li>• Piso em mármore Travertino (áreas sociais)</li>
                      <li>• Esquadrias em alumínio anodizado com vidro duplo</li>
                      <li>• Aquecimento solar + boiler a gás de passagem</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.section>

            {/* Localização */}
            <PropertyNeighborhood
              name={property.neighborhoodInfo.name}
              description={property.neighborhoodInfo.description}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-[35%]">
            <PropertySidebar
              brokerName={property.broker.name}
              brokerTitle={property.broker.title}
              propertyCode={property.code}
            />
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      <motion.section {...fadeIn} className="px-6 md:px-12 lg:px-24 py-16 border-t border-border">
        <h2 className="text-serif text-2xl md:text-3xl font-light tracking-wide text-foreground mb-10">
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
                  src={prop.image}
                  alt={prop.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="text-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                {prop.location}
              </p>
              <h3 className="text-serif text-lg font-light text-foreground mb-1">
                {prop.title}
              </h3>
              <p className="font-mono text-sm font-medium text-foreground">
                {prop.price}
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
      />
    </div>
  );
};

export default PropertyDetail;
