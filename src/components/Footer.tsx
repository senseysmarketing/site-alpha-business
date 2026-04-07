import { useState } from "react";
import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import logoAlpha from "@/assets/logo-alpha.png";
import { Button } from "@/components/ui/button";
import AdvertisePropertyModal from "@/components/AdvertisePropertyModal";

const Footer = () => {
  const [advertiseOpen, setAdvertiseOpen] = useState(false);

  const navItems = [
    { label: "Sobre", href: "#" },
    { label: "Venda", href: "#" },
    { label: "Locação", href: "#" },
    { label: "Serviços", href: "#" },
    { label: "Fale Conosco", href: "#contact" },
  ];

  return (
    <footer className="bg-[#2A070C] text-white/80 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Barra superior: Logo + Nav + Botão */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
          <Link to="/">
            <img
              src={logoAlpha}
              alt="Alpha Business"
              className="h-8 brightness-0 invert"
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Button
            size="sm"
            className="bg-white text-[#2A070C] hover:bg-white/90 text-xs uppercase tracking-wider font-semibold rounded-none"
            onClick={() => setAdvertiseOpen(true)}
          >
            Anuncie seu imóvel
          </Button>
        </div>

        {/* Conteúdo informativo em 2 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Coluna Esquerda */}
          <div className="space-y-1 text-sm leading-relaxed">
            <p className="font-semibold text-white">Alpha Business - Imobiliária Alphaville</p>
            <p>Centro Empresarial Alphaville</p>
            <p>Al. Rio Negro, 967 – 2º and. – Cj: 212</p>
            <p>Alphaville – Barueri – SP – 06455-000</p>
            <div className="pt-4 space-y-1">
              <p className="font-semibold text-white">Rafael Albuquerque</p>
              <p>WHATSAPP: 11 99311-6849</p>
              <p>WHATSAPP: 11 94001-0287</p>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p>Nos siga nas redes sociais e acompanhe nossas novidades.</p>
            <div className="flex items-center gap-3">
              <Instagram size={18} className="text-white" />
              <span>@AlphavilleSP</span>
              <span>@AlphavilleAB</span>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-white/60 text-xs">
                ©2026 Rafael Albuquerque | Alpha Business
              </p>
              <p className="text-white/50 text-xs leading-relaxed">
                AlphaBusiness: Negócios Imobiliários em Alphaville São Paulo – Todos os direitos reservados. Imobiliária especializada em mansões e casas em Alphaville, Tamboré e Santana de Parnaíba. Casas e apartamentos a venda em Alphaville.
              </p>
              <p className="text-white/60 text-xs">CRECI-PJ: 035836</p>
            </div>
          </div>
        </div>
      </div>

      <AdvertisePropertyModal open={advertiseOpen} onOpenChange={setAdvertiseOpen} />
    </footer>
  );
};

export default Footer;
