import { useState } from "react";
import { Instagram, MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoRafael from "@/assets/logo-rafael.png";
import { Button } from "@/components/ui/button";
import AdvertisePropertyModal from "@/components/AdvertisePropertyModal";

type NavItem = { label: string; to?: string; hash?: string };

const Footer = () => {
  const [advertiseOpen, setAdvertiseOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: "Venda", to: "/busca?transactionType=venda" },
    { label: "Locação", to: "/busca?transactionType=locacao" },
    { label: "Notícias", to: "/blog" },
    { label: "Fale Conosco", hash: "contato" },
  ];

  const handleHashClick = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${hash}`);
    }
  };

  return (
    <footer className="bg-accent text-accent-foreground/80 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Barra superior: Logo + Nav + Botão */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
          <Link to="/">
            <img
              src={logoRafael}
              alt="Rafael Albuquerque"
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-6">
            {navItems.map((item) =>
              item.hash ? (
                <a
                  key={item.label}
                  href={`/#${item.hash}`}
                  onClick={(e) => handleHashClick(e, item.hash!)}
                  className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to!}
                  className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <Button
            size="sm"
            className="bg-white text-[#1f1f1f] hover:bg-white/90 text-xs uppercase tracking-wider font-semibold rounded-md"
            onClick={() => setAdvertiseOpen(true)}
          >
            Anuncie seu imóvel
          </Button>
        </div>

        {/* Conteúdo informativo em 2 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Coluna Esquerda */}
          <div className="space-y-1">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Alpha Business - Imobiliária Alphaville</p>
            <p className="text-xs text-white/60">Centro Empresarial Alphaville</p>
            <p className="text-xs text-white/60">Al. Rio Negro, 967 – 2º and. – Cj: 212</p>
            <p className="text-xs text-white/60">Alphaville – Barueri – SP – 06455-000</p>
            <div className="pt-4 space-y-1">
              <p className="font-bold text-white uppercase tracking-wider text-xs">Rafael Albuquerque</p>
              <a
                href="https://wa.me/5511993116849"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors group"
              >
                <MessageCircle size={14} className="text-white/60 group-hover:text-white transition-colors" />
                <span>WHATSAPP: (11) 99311-6849</span>
              </a>

              
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-4">
            <p className="text-xs text-white/60 uppercase tracking-wider">Nos siga nas redes sociais e acompanhe nossas novidades.</p>
            <a
              href="https://instagram.com/alphaville.sp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-white hover:text-white/80 transition-colors"
            >
              <Instagram size={16} className="text-white" />
              <span>@AlphavilleSP</span>
            </a>

            <div className="pt-4 space-y-2">
              <p className="text-[11px] text-white/50">
                ©2026 Rafael Albuquerque | Alpha Business
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed">
                AlphaBusiness: Negócios Imobiliários em Alphaville São Paulo – Todos os direitos reservados. Imobiliária especializada em mansões e casas em Alphaville, Tamboré e Santana de Parnaíba. Casas e apartamentos a venda em Alphaville.
              </p>
              <p className="text-xs text-white/60">CRECI-PJ: 035836</p>
            </div>
          </div>
        </div>
      </div>

      <AdvertisePropertyModal open={advertiseOpen} onOpenChange={setAdvertiseOpen} />
    </footer>
  );
};

export default Footer;
