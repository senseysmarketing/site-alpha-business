import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#2A070C] text-white/80 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
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
    </footer>
  );
};

export default Footer;
