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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
        .from("site_settings")
        .select("value")
        .eq("key", "condo_menu")
        .maybeSingle();
      
      if (!error && data) {
        setCondoMenuSettings((data as any).value as CondoMenuSettings);
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
          
          <NavigationMenu className="static max-w-none">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent p-0 h-auto border-none shadow-none group">
                  <span className={desktopClass}>Condomínios</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[calc(100vw-2rem)] md:w-[850px] bg-[#1f1f1f] p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row gap-8 md:gap-10 max-h-[80vh] overflow-y-auto md:overflow-y-visible">
                    {/* Featured Column */}
                    <div className="w-full md:w-1/3 space-y-4">
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
                    <div className="w-full md:w-1/3 border-l-0 md:border-l border-white/5 pl-0 md:pl-8 space-y-6">
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
                    <div className="w-full md:w-1/3 bg-white/5 p-6 rounded-sm flex flex-col justify-center items-center text-center space-y-4 border border-white/5">
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

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="lg:hidden bg-[#1f1f1f] border-t border-white/10 fixed top-[72px] left-0 right-0 bottom-0 overflow-y-auto z-50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100vh - 72px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <nav className="flex flex-col px-6 py-6 pb-20 gap-4">
            {renderNavLink({ label: "Venda", to: "/busca?transactionType=venda" }, mobileClass)}
            {renderNavLink({ label: "Locação", to: "/busca?transactionType=locacao" }, mobileClass)}
            
            {/* Mobile Condos */}
            <div className="flex flex-col gap-0 border-t border-white/5 mt-2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="condos" className="border-none">
                  <AccordionTrigger className="font-normal text-sm tracking-[0.1em] uppercase text-white/70 hover:text-white hover:no-underline py-2 transition-colors">
                    Condomínios
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-8 mt-2">
                      {/* Destaques Mobile */}
                      <div className="space-y-4">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold pl-1">Destaques</p>
                        <div className="grid grid-cols-1 gap-3">
                          {(condoMenuSettings?.featured || []).slice(0, 3).map((item, idx) => (
                            <Link key={idx} to={item.href} onClick={() => setMenuOpen(false)} className="group/item block relative aspect-[21/9] overflow-hidden rounded-sm bg-white/5 border border-white/5">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute bottom-3 left-3">
                                <p className="text-xs font-medium tracking-wider uppercase text-white">{item.name}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Regiões Mobile */}
                      <div className="space-y-6">
                        {(condoMenuSettings?.regions || []).map((region, idx) => (
                          <div key={idx} className="space-y-4">
                            <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] pl-1">{region.title}</h4>
                            <div className="flex flex-col gap-4 pl-3 border-l border-white/10">
                              {region.links.map((link, lIdx) => (
                                <Link key={lIdx} to={link.href} className="text-sm text-white/60 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
                                  {link.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Link to="/busca" className="flex items-center justify-center font-normal text-xs tracking-[0.1em] uppercase px-6 py-3 border border-white/30 text-white rounded-full text-center mt-2 transition-colors hover:bg-white/10" onClick={() => setMenuOpen(false)}>
                        Ver todos os condomínios
                        <ArrowRight size={14} className="ml-2 text-white/40" />
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
      </AnimatePresence>
      <AdvertisePropertyModal open={advertiseOpen} onOpenChange={setAdvertiseOpen} />
    </motion.header>
  );
};

export default Header;
