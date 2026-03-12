import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertySpecs from "@/components/property/PropertySpecs";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyNeighborhood from "@/components/property/PropertyNeighborhood";

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
  description: `Residência de alto padrão com 850m² de área construída, localizada em um dos endereços mais exclusivos de Alphaville. O projeto arquitetônico valoriza a integração entre os ambientes internos e externos, com amplos painéis de vidro que proporcionam iluminação natural abundante e vista privilegiada para a reserva verde.

O living de 120m² com pé-direito duplo se conecta à varanda gourmet equipada com churrasqueira, forno de pizza e espaço para adega climatizada. A suíte master de 65m² conta com closet planejado, banheiro com cuba dupla em mármore Carrara e banheira de imersão freestanding.

Acabamentos premium incluem piso em mármore Travertino, iluminação Lumini em todos os ambientes, automação residencial completa (Savant), sistema de som ambiente Bose e ar-condicionado central VRF. A área externa possui piscina com borda infinita de 15 metros, deck em madeira cumaru e paisagismo assinado por Gilberto Elkis.`,
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

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.5 },
};

const PropertyDetail = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Gallery */}
      <div className="pt-[72px]">
        <PropertyGallery images={property.images} />
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
            <h1 className="text-display text-2xl md:text-3xl font-light tracking-wide text-foreground mb-1">
              {property.title}
            </h1>
            <p className="text-body text-sm text-muted-foreground">{property.subtitle}</p>
          </div>
          <p className="text-display text-2xl md:text-3xl font-semibold text-foreground whitespace-nowrap">
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
            <button className="hidden md:block px-6 py-2.5 border border-border text-body text-xs tracking-[0.1em] uppercase text-foreground hover:bg-muted transition-colors">
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
              <h2 className="text-display text-xl font-light tracking-wide text-foreground mb-6">
                Sobre o Imóvel
              </h2>
              <div className="text-body text-sm text-muted-foreground leading-[1.9] whitespace-pre-line">
                {property.description}
              </div>
            </motion.section>

            {/* Galeria Completa */}
            <motion.section {...fadeIn}>
              <h2 className="text-display text-xl font-light tracking-wide text-foreground mb-6">
                Galeria
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.images.map((img, i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-sm ${
                      i === 0 ? "col-span-2 row-span-2" : ""
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Galeria ${i + 1}`}
                      className="w-full h-full object-cover aspect-[4/3] hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
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
            />
          </div>
        </div>
      </div>

      <Footer />

      {/* Mobile sticky WhatsApp bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-primary p-4">
        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white text-body text-sm font-medium rounded-sm"
        >
          <MessageCircle size={18} />
          Falar com {property.broker.name.split(" ")[0]}
        </a>
      </div>
    </div>
  );
};

export default PropertyDetail;
