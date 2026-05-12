const property1 = "/images/property-1.jpg";
const property2 = "/images/property-2.jpg";
const property3 = "/images/property-3.jpg";
const property4 = "/images/property-4.jpg";
const mansionModern = "/images/mansion-modern.jpg";
const familyHome = "/images/family-home.jpg";

export interface MockProperty {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  condominium: string | null;
  neighborhood: string | null;
  city: string | null;
  price: number | null;
  rental_price: number | null;
  transaction_type: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number;
  parking: number;
  area_total: number | null;
  photo: string | null;
  images: string[];
  relevance_reason: string;
  description: string;
  amenities: string[];
  tag: string | null;
  broker: { name: string; title: string };
  neighborhoodInfo: { name: string; description: string };
  video_url?: string;
}

export const mockProperties: MockProperty[] = [
  {
    id: "1",
    code: "ALT-001",
    title: "Residência Altos de Alphaville",
    subtitle: "Arquitetura contemporânea com vista panorâmica",
    condominium: "Alphaville Residencial",
    neighborhood: "Alphaville",
    city: "Barueri",
    price: 12500000,
    rental_price: null,
    transaction_type: "venda",
    property_type: "Casa",
    bedrooms: 5,
    bathrooms: 7,
    suites: 5,
    parking: 4,
    area_total: 850,
    photo: property1,
    images: [property1, property2, property3, property4, mansionModern, familyHome],
    relevance_reason: "Imóvel premium com arquitetura assinada e localização privilegiada",
    description: `O living com pé-direito duplo de 120m² integra-se perfeitamente ao espaço gourmet, criando uma área social que flui naturalmente para a varanda equipada com churrasqueira, forno de pizza e adega climatizada. Amplos painéis de vidro dissolvem os limites entre interior e exterior, convidando a luz natural a protagonizar cada ambiente.

A suíte master ocupa 65m² de pura sofisticação — closet planejado sob medida, banheiro revestido em mármore Carrara com cuba dupla e banheira de imersão freestanding posicionada diante de uma vista que se estende até a reserva verde.

Cada detalhe foi pensado para quem não aceita o ordinário: piso em mármore Travertino, iluminação Lumini, automação Savant, sistema de som Bose integrado e ar-condicionado central VRF. A área externa abraça uma piscina com borda infinita de 15 metros, deck em madeira cumaru e paisagismo assinado por Gilberto Elkis.`,
    amenities: ["Piscina aquecida", "Adega climatizada", "Home theater", "Espaço gourmet", "Jardim zen", "Automação completa"],
    tag: "Nova",
    broker: { name: "Rafael Albuquerque", title: "Corretor especialista em Alphaville" },
    neighborhoodInfo: {
      name: "Alphaville — Oásis Urbano",
      description: "Alphaville é referência em qualidade de vida, segurança e infraestrutura completa. A região combina a tranquilidade de condomínios fechados com acesso rápido aos principais centros empresariais e gastronômicos da Grande São Paulo.",
    },
  },
  {
    id: "2",
    code: "SKY-002",
    title: "Penthouse Sky Residence",
    subtitle: "Cobertura duplex com terraço panorâmico de 360°",
    condominium: "Sky Towers",
    neighborhood: "Centro",
    city: "Barueri",
    price: 8900000,
    rental_price: null,
    transaction_type: "venda",
    property_type: "Cobertura",
    bedrooms: 4,
    bathrooms: 5,
    suites: 4,
    parking: 3,
    area_total: 420,
    photo: property2,
    images: [property2, property1, property3, mansionModern, familyHome, property4],
    relevance_reason: "Cobertura duplex com vista 360° e acabamento de altíssimo padrão",
    description: `Cobertura duplex no último andar do Sky Towers, com vista panorâmica de 360° que abraça a Serra da Cantareira e o skyline de São Paulo. O pavimento social apresenta living de 80m² com lareira ecológica, sala de jantar para 12 pessoas e cozinha Ornare com ilha central em quartzo.

O terraço de 120m² oferece piscina aquecida com raia de 10 metros, lounge bar com bancada gourmet e spa com sauna seca e úmida. O pavimento íntimo abriga 4 suítes, sendo a master com 55m², banheiro em ônix e closet com iluminação automatizada.

Acabamentos: piso em porcelanato Portobello 120x120, marcenaria Todeschini, esquadrias Prado com vidro acústico laminado, elevador privativo com biometria.`,
    amenities: ["Piscina com raia", "Terraço 360°", "Spa privativo", "Lareira ecológica", "Elevador privativo", "Cozinha Ornare"],
    tag: "Exclusiva",
    broker: { name: "Ricardo Almeida", title: "Especialista em coberturas de alto padrão" },
    neighborhoodInfo: {
      name: "Centro Barueri — Sofisticação Vertical",
      description: "O centro de Barueri se transformou em um polo de empreendimentos de alto padrão, oferecendo infraestrutura completa com shopping centers, restaurantes premiados e fácil acesso às principais rodovias.",
    },
  },
  {
    id: "3",
    code: "VPV-003",
    title: "Villa Pedra & Vidro",
    subtitle: "Design brutalista encontra natureza exuberante",
    condominium: "Alphaville 11",
    neighborhood: "Alphaville 11",
    city: "Santana de Parnaíba",
    price: 9200000,
    rental_price: null,
    transaction_type: "venda",
    property_type: "Casa",
    bedrooms: 4,
    bathrooms: 6,
    suites: 4,
    parking: 4,
    area_total: 680,
    photo: property3,
    images: [property3, property4, property1, property2, familyHome, mansionModern],
    relevance_reason: "Projeto arquitetônico premiado com materiais naturais",
    description: `Projetada pelo escritório Studio MK27, a Villa Pedra & Vidro é uma celebração da harmonia entre concreto aparente, pedra natural e grandes panos de vidro. O volume principal flutua sobre um espelho d'água de 30m², criando uma experiência sensorial única desde a chegada.

O living de 95m² com pé-direito de 4,5 metros se abre completamente para o jardim através de portas pivotantes em vidro temperado de 3 metros. A suíte master no pavimento superior conta com varanda privativa, closet em madeira freijó e banheiro com ducha ao ar livre cercada por bambus.

Destaques técnicos: estrutura em concreto protendido, vidros low-e com controle solar, sistema de captação de água pluvial, aquecimento solar, iluminação cênica Erco e paisagismo de Isabel Duprat.`,
    amenities: ["Espelho d'água", "Ducha ao ar livre", "Projeto MK27", "Portas pivotantes", "Paisagismo I. Duprat", "Captação pluvial"],
    tag: "Nova",
    broker: { name: "Rafael Albuquerque", title: "Corretor especialista em Alphaville" },
    neighborhoodInfo: {
      name: "Alphaville 11 — Exclusividade Verde",
      description: "O residencial Alphaville 11 é um dos condomínios mais arborizados da região, com lotes generosos, mata nativa preservada e segurança 24h com tecnologia de ponta.",
    },
  },
  {
    id: "4",
    code: "CCL-004",
    title: "Casa Contemporânea Light",
    subtitle: "Linhas minimalistas e integração total com o verde",
    condominium: "Tamboré 10",
    neighborhood: "Tamboré",
    city: "Santana de Parnaíba",
    price: 7800000,
    rental_price: null,
    transaction_type: "venda",
    property_type: "Casa",
    bedrooms: 5,
    bathrooms: 6,
    suites: 5,
    parking: 3,
    area_total: 520,
    photo: property4,
    images: [property4, property3, property2, property1, mansionModern, familyHome],
    relevance_reason: "Casa minimalista com eficiência energética e design premiado",
    description: `A Casa Light é um manifesto de arquitetura sustentável e design minimalista. Fachada em alumínio composto branco com brises automatizados que acompanham o sol, reduzindo em 40% o consumo de energia para climatização.

O interior é um exercício de proporções perfeitas: living de 75m² com pé-direito de 3,5m, cozinha aberta com ilha em Silestone e marcenaria laqueada em tom off-white. As 5 suítes ocupam o pavimento superior, cada uma com banheiro individual e varanda com guarda-corpo em vidro.

A área de lazer inclui piscina com deck em pedra Hijau, campo de beach tennis, playground e brinquedoteca. Infraestrutura completa de automação Alexa com controle de iluminação, cortinas, câmeras e fechaduras digitais.`,
    amenities: ["Beach tennis", "Brises automatizados", "Energia solar", "Piscina infinity", "Automação Alexa", "Brinquedoteca"],
    tag: null,
    broker: { name: "Fernanda Costa", title: "Especialista em imóveis sustentáveis" },
    neighborhoodInfo: {
      name: "Tamboré — Modernidade e Natureza",
      description: "Tamboré é sinônimo de qualidade de vida premium. Com infraestrutura de primeiro mundo, o bairro oferece escolas internacionais, centros médicos e uma vida comunitária ativa entre residências de alto padrão.",
    },
  },
  {
    id: "5",
    code: "MJE-005",
    title: "Mansão Jardim Europa",
    subtitle: "A residência mais exclusiva de Alphaville",
    condominium: "Alphaville Residencial Zero",
    neighborhood: "Alphaville 0",
    city: "Barueri",
    price: 15200000,
    rental_price: null,
    transaction_type: "venda",
    property_type: "Mansão",
    bedrooms: 6,
    bathrooms: 8,
    suites: 6,
    parking: 6,
    area_total: 1200,
    photo: mansionModern,
    images: [mansionModern, property1, property2, property3, property4, familyHome],
    relevance_reason: "A mansão mais exclusiva disponível na região de Alphaville",
    description: `A Mansão Jardim Europa redefine o conceito de residência de ultra-luxo em Alphaville. Em um terreno de 2.400m², a construção de 1.200m² distribui-se em 3 pavimentos interligados por elevador panorâmico e escadaria em mármore Calacatta.

O pavimento térreo é um palco para recepções: salão de festas para 100 pessoas, adega subterrânea com capacidade para 2.000 rótulos, cinema com 12 poltronas reclináveis Poltrona Frau e bar em ônix retroiluminado.

O primeiro andar abriga as 6 suítes, sendo a master um verdadeiro apartamento de 120m² com sitting room, lareira, closet his & hers com 40m² e banheiro com banheira Victoria + Albert em mármore nero. A cobertura oferece rooftop com piscina aquecida, ofurô, lounge com lareira e vista de 270° para a mata.

Paisagismo de Benedito Abbud com espécies tropicais raras, sistema de irrigação automatizado e iluminação paisagística Bega.`,
    amenities: ["Elevador panorâmico", "Cinema 12 lugares", "Adega 2000 rótulos", "Rooftop com piscina", "Banheira V+A", "Paisagismo B. Abbud"],
    tag: "Destaque",
    broker: { name: "Rafael Albuquerque", title: "Corretor especialista em Alphaville" },
    neighborhoodInfo: {
      name: "Alphaville 0 — O Endereço Definitivo",
      description: "O Alphaville Residencial Zero é o condomínio mais exclusivo da região, com apenas 40 lotes de grande metragem, mata atlântica preservada, lago privativo e segurança com padrão embaixada.",
    },
  },
];

/** Helper to format price as BRL */
export const formatPrice = (price: number | null): string => {
  if (!price) return "Sob consulta";
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
};

/** Convert MockProperty to SearchResult shape */
export const toSearchResult = (p: MockProperty) => ({
  id: p.id,
  code: p.code,
  title: p.title,
  condominium: p.condominium,
  neighborhood: p.neighborhood,
  city: p.city,
  price: p.price,
  rental_price: p.rental_price,
  transaction_type: p.transaction_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  area_total: p.area_total,
  photo: p.photo,
  relevance_reason: p.relevance_reason,
});
