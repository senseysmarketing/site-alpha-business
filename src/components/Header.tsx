import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoRafael from "@/assets/logo-rafael.png";
import AdvertisePropertyModal from "@/components/AdvertisePropertyModal";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  variant?: "transparent" | "solid";
}

interface CondoLink {
  name: string;
  href: string;
  image?: string;
}

interface CondoRegion {
  title: string;
  links: CondoLink[];
}

interface CondoMenuSettings {
  featured: CondoLink[];
  regions: CondoRegion[];
}

type NavItem = {
  label: string;
  to?: string;
  hash?: string;
};

const Header = ({ variant = "transparent" }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [advertiseOpen, setAdvertiseOpen] = useState(false);
  const [condoMenuSettings, setCondoMenuSettings] = useState<CondoMenuSettings | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCondoMenu = async () => {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "condo_menu")
        .single();
      
      if (!error && data) {
        setCondoMenuSettings(data.value as CondoMenuSettings);
      }
    };
    fetchCondoMenu();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isSolid = variant === "solid" || scrolled || menuOpen;

  const navItems: NavItem[] = [
    { label: "Venda", to: "/busca?transactionType=venda" },
    { label: "Locação", to: "/busca?transactionType=locacao" },
    { label: "Notícias", to: "/blog" },
    { label: "Fale Conosco", hash: "contato" },
  ];

  const handleHashClick = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${hash}`);
    }
  };

  const renderNavLink = (item: NavItem, sizeClass: string) => {
    if (item.hash) {
      return (
        <a
          key={item.label}
          href={`/#${item.hash}`}
          onClick={(e) => handleHashClick(e, item.hash!)}
          className={sizeClass}
        >
          {item.label}
        </a>
      );
    }
    return (
      <Link
        key={item.label}
        to={item.to!}
        onClick={() => setMenuOpen(false)}
        className={sizeClass}
      >
        {item.label}
      </Link>
    );
  };

  const desktopClass =
    "font-normal text-xs tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-300";
  const mobileClass =
    "font-normal text-sm tracking-[0.1em] uppercase text-white/70 py-2";

  return (
    <motion.header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        isSolid ? "bg-[#1f1f1f]/95 backdrop-blur-md" : "bg-transparent"
      }`}
      style={{ fontFamily: "'Roboto', sans-serif" }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 py-4">
        <Link to="/">
          <img
            src={logoRafael}
            alt="Rafael Albuquerque"
            className="h-8 md:h-10 w-auto"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {renderNavLink({ label: "Venda", to: "/busca?transactionType=venda" }, desktopClass)}
          {renderNavLink({ label: "Locação", to: "/busca?transactionType=locacao" }, desktopClass)}
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent p-0 h-auto border-none shadow-none group">
                  <span className={desktopClass}>Condomínios</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[850px] bg-[#1f1f1f] p-8 text-white border border-white/10 shadow-2xl flex gap-10">
                    {/* Featured Column */}
                    <div className="w-1/3 space-y-4">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold mb-4">Destaques</p>
                      <div className="space-y-4">
                        {(condoMenuSettings?.featured || []).slice(0, 3).map((item, idx) => (
                          <Link key={idx} to={item.href} className="group/item block relative aspect-[16/9] overflow-hidden rounded-sm bg-muted/20">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110 opacity-70" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-3">
                              <p className="text-xs font-medium tracking-wider uppercase text-white">{item.name}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Regions Column */}
                    <div className="w-1/3 border-l border-white/5 pl-8 space-y-6">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold mb-2">Por Região</p>
                      <div className="grid grid-cols-1 gap-6">
                        {(condoMenuSettings?.regions || []).map((region, idx) => (
                          <div key={idx} className="space-y-3">
                            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-widest">{region.title}</h4>
                            <div className="flex flex-col gap-2">
                              {region.links.map((link, lIdx) => (
                                <Link key={lIdx} to={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors">
                                  {link.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Column */}
                    <div className="w-1/3 bg-white/5 p-6 rounded-sm flex flex-col justify-center items-center text-center space-y-4 border border-white/5">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                        <ArrowRight className="text-white/40 h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-light tracking-wide leading-relaxed">
                        Procurando algo específico?
                      </h4>
                      <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
                        Temos imóveis em mais de 100 condomínios
                      </p>
                      <Link 
                        to="/busca" 
                        className="mt-4 px-6 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-semibold rounded-full hover:bg-white/90 transition-colors"
                      >
                        Ver todos imóveis
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {renderNavLink({ label: "Notícias", to: "/blog" }, desktopClass)}
          {renderNavLink({ label: "Fale Conosco", hash: "contato" }, desktopClass)}
        </nav>

        <div className="hidden lg:flex items-center">
          <button
            onClick={() => setAdvertiseOpen(true)}
            className="font-normal text-xs tracking-[0.1em] uppercase whitespace-nowrap px-6 py-2.5 border border-white/30 text-white rounded-full hover:bg-white/10 transition-colors duration-300"
          >
            Anuncie seu imóvel
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-white"
          aria-label="Abrir menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          className="lg:hidden bg-[#1f1f1f] border-t border-white/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <nav className="flex flex-col px-6 py-6 gap-4">
            {renderNavLink({ label: "Venda", to: "/busca?transactionType=venda" }, mobileClass)}
            {renderNavLink({ label: "Locação", to: "/busca?transactionType=locacao" }, mobileClass)}
            
            {/* Mobile Condos */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-[10px] tracking-[0.2em] uppercase text-white/30 pt-2 pb-1">Condomínios</span>
              {condoMenuSettings?.regions.map((region, idx) => (
                <div key={idx} className="flex flex-col gap-2 py-1">
                  <span className="text-[11px] text-white/50 uppercase tracking-widest">{region.title}</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {region.links.map((link, lIdx) => (
                      <Link key={lIdx} to={link.href} className="text-sm text-white/80" onClick={() => setMenuOpen(false)}>
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <Link to="/busca" className="text-sm text-white/90 underline underline-offset-4 mt-2" onClick={() => setMenuOpen(false)}>
                Ver todos os condomínios
              </Link>
            </div>

            {renderNavLink({ label: "Notícias", to: "/blog" }, mobileClass)}
            {renderNavLink({ label: "Fale Conosco", hash: "contato" }, mobileClass)}
            <button
              onClick={() => {
                setAdvertiseOpen(true);
                setMenuOpen(false);
              }}
              className="font-normal text-xs tracking-[0.1em] uppercase px-6 py-3 border border-white/30 text-white rounded-full text-center mt-2"
            >
              Anuncie seu imóvel
            </button>
          </nav>
        </motion.div>
      )}
      <AdvertisePropertyModal open={advertiseOpen} onOpenChange={setAdvertiseOpen} />
    </motion.header>
  );
};

export default Header;
