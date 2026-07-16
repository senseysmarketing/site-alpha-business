import { useState, useEffect, useMemo } from "react";
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
import { buildCondoMenuData } from "@/lib/condoGrouping";
import { useCondoList } from "@/hooks/useCondoList";

interface HeaderProps {
  variant?: "transparent" | "solid";
}

interface CondoLink {
  name: string;
  href?: string;
  image?: string;
}

interface CondoRegion {
  title: string;
  links: CondoLink[];
}

interface CondoMenuSettings {
  featured: CondoLink[];
  regions?: CondoRegion[]; // legacy, ignored
}

type NavItem = {
  label: string;
  to?: string;
  hash?: string;
  href?: string;
};

const WHATSAPP_URL = "https://wa.me/5511993116849";

const SALE_TYPES: { label: string; propertyType?: string }[] = [
  { label: "Casa", propertyType: "casa" },
  { label: "Apartamento", propertyType: "apartamento" },
  { label: "Cobertura", propertyType: "cobertura" },
  { label: "Terreno", propertyType: "terreno" },
  
];

const buildSaleHref = (propertyType?: string) =>
  propertyType
    ? `/busca?transactionType=venda&propertyType=${propertyType}`
    : `/busca?transactionType=venda`;

const Header = ({ variant = "transparent" }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [advertiseOpen, setAdvertiseOpen] = useState(false);
  const [condoMenuSettings, setCondoMenuSettings] = useState<CondoMenuSettings | null>(null);
  const [navMenuValue, setNavMenuValue] = useState("");
  const closeNavMenu = () => setNavMenuValue("");
  const condoMenuValue = navMenuValue;
  const setCondoMenuValue = setNavMenuValue;
  const closeCondoMenu = closeNavMenu;
  const location = useLocation();
  const navigate = useNavigate();
  const { condos: allCondos } = useCondoList();
  const condoMenuData = useMemo(() => buildCondoMenuData(allCondos), [allCondos]);

  useEffect(() => {
    const fetchCondoMenu = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "condo_menu")
        .maybeSingle();
      
      if (!error && data) {
        setCondoMenuSettings(data.value as unknown as CondoMenuSettings);
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
    { label: "Contato", href: WHATSAPP_URL },
  ];

  const getFeaturedHref = (item: CondoLink) => {
    if (item.href) return item.href;
    if (item.name) return `/busca?condominium=${encodeURIComponent(item.name)}`;
    return "/busca";
  };

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
    if (item.href) {
      return (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          className={sizeClass}
        >
          {item.label}
        </a>
      );
    }
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
      <div
        className="flex items-center justify-between"
        style={{
          paddingLeft: "clamp(1rem, 4vw, 6rem)",
          paddingRight: "clamp(1rem, 4vw, 6rem)",
          paddingTop: "clamp(0.75rem, 1.2vw, 1.25rem)",
          paddingBottom: "clamp(0.75rem, 1.2vw, 1.25rem)",
        }}
      >
        <Link to="/">
          <img
            src={logoRafael}
            alt="Rafael Albuquerque"
            className="w-auto"
            style={{ height: "clamp(1.75rem, 1.4vw + 1.1rem, 2.75rem)" }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          <NavigationMenu className="static max-w-none" value={navMenuValue} onValueChange={setNavMenuValue}>
            <NavigationMenuList className="gap-6 xl:gap-8">
              <NavigationMenuItem value="venda">
                <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent p-0 h-auto border-none shadow-none group">
                  <span className={desktopClass}>Venda</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[280px] bg-[#1f1f1f] p-6 text-white shadow-2xl flex flex-col gap-4">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">Por Tipo</p>
                    <div className="flex flex-col">
                    {SALE_TYPES.map((t) => (
                      <Link
                        key={t.label}
                        to={buildSaleHref(t.propertyType)}
                        onClick={closeNavMenu}
                        className="text-[11px] tracking-wider normal-case text-white/60 hover:text-white transition-colors py-2 border-b border-white/5 last:border-b-0"
                      >
                        {t.label}
                      </Link>
                    ))}
                    </div>
                    <Link
                      to={buildSaleHref()}
                      onClick={closeNavMenu}
                      className="mt-2 inline-flex items-center justify-between text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-colors group/all"
                    >
                      <span>Ver todos à venda</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white/40 group-hover/all:text-white transition-colors" />
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                {renderNavLink({ label: "Locação", to: "/busca?transactionType=locacao" }, desktopClass)}
              </NavigationMenuItem>

              <NavigationMenuItem value="condos">
                <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent p-0 h-auto border-none shadow-none group">
                  <span className={desktopClass}>Condomínios</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[calc(100vw-2rem)] md:w-[850px] bg-[#1f1f1f] p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row gap-8 md:gap-10 max-h-[80vh] overflow-y-auto md:overflow-y-visible">
                    {/* Featured Column */}
                    <div className="w-full md:w-1/3 space-y-4 flex flex-col min-h-0">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">Destaques</p>
                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 -mr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {(condoMenuSettings?.featured || []).map((item, idx) => (
                          <Link key={idx} to={getFeaturedHref(item)} onClick={closeCondoMenu} className="group/item block relative aspect-[16/9] overflow-hidden rounded-sm bg-muted/20">
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

                    {/* Regions Column (auto from DB) */}
                    <div className="w-full md:w-1/3 border-l-0 md:border-l border-white/5 pl-0 md:pl-8 flex flex-col min-h-0">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold mb-4">Por Condomínio</p>
                      <div className="space-y-5 max-h-[460px] overflow-y-auto pr-2 -mr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {(condoMenuData?.groups || []).map((group) => (
                          <div key={group.base} className="space-y-2">
                            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-widest">{group.canonical}</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {group.items.map((it) => (
                                <Link
                                  key={it.full}
                                  to={`/busca?condominium=${encodeURIComponent(it.full)}`}
                                  onClick={closeCondoMenu}
                                  className="min-w-[28px] h-7 px-2 inline-flex items-center justify-center rounded-full border border-white/10 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-colors"
                                >
                                  {it.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                        {(condoMenuData?.singles || []).length > 0 && (
                          <div className="space-y-2 pt-1">
                            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-widest">Outros</h4>
                            <div className="flex flex-col gap-2">
                              {condoMenuData!.singles.map((it) => (
                                <Link
                                  key={it.full}
                                  to={`/busca?condominium=${encodeURIComponent(it.full)}`}
                                  onClick={closeCondoMenu}
                                  className="text-[11px] text-white/50 hover:text-white transition-colors"
                                >
                                  {it.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
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
                        Temos imóveis em {allCondos.length || "mais de 100"} condomínios
                      </p>
                      <Link 
                        to="/busca" 
                        onClick={closeCondoMenu}
                        className="mt-4 px-6 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-semibold rounded-full hover:bg-white/90 transition-colors"
                      >
                        Ver todos imóveis
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                {renderNavLink({ label: "Notícias", to: "/blog" }, desktopClass)}
              </NavigationMenuItem>
              <NavigationMenuItem>
                {renderNavLink({ label: "Contato", hash: "contato" }, desktopClass)}
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
            className="lg:hidden bg-[#1f1f1f] border-t border-white/10 fixed top-[64px] md:top-[72px] left-0 right-0 bottom-0 overflow-y-auto z-50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100vh - 72px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <nav className="flex flex-col px-6 py-6 pb-20 gap-4">
            {/* Mobile Venda */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="venda" className="border-none">
                <AccordionTrigger className="font-normal text-sm tracking-[0.1em] uppercase text-white/70 hover:text-white hover:no-underline !py-2 transition-colors text-left [&>svg]:text-white/40" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Venda
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col pl-1">
                    {SALE_TYPES.map((t) => (
                      <Link
                        key={t.label}
                        to={buildSaleHref(t.propertyType)}
                        onClick={() => setMenuOpen(false)}
                        className="text-[11px] tracking-wider normal-case text-white/60 hover:text-white transition-colors py-2 border-b border-white/5"
                      >
                        {t.label}
                      </Link>
                    ))}
                    <Link
                      to={buildSaleHref()}
                      onClick={() => setMenuOpen(false)}
                      className="text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-colors pt-3"
                    >
                      Ver todos à venda →
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {renderNavLink({ label: "Locação", to: "/busca?transactionType=locacao" }, mobileClass)}
            
            {/* Mobile Condos */}
            <div className="flex flex-col">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="condos" className="border-none">
                  <AccordionTrigger className="font-normal text-sm tracking-[0.1em] uppercase text-white/70 hover:text-white hover:no-underline !py-2 transition-colors text-left [&>svg]:text-white/40" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Condomínios
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-8 mt-2">

                      {/* Condomínios Mobile (auto) */}
                      <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2 -mr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {(condoMenuData?.groups || []).map((group) => (
                          <div key={group.base} className="space-y-3">
                            <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] pl-1">{group.canonical}</h4>
                            <div className="flex flex-wrap gap-2 pl-1">
                              {group.items.map((it) => (
                                <Link
                                  key={it.full}
                                  to={`/busca?condominium=${encodeURIComponent(it.full)}`}
                                  onClick={() => setMenuOpen(false)}
                                  className="min-w-[36px] h-8 px-3 inline-flex items-center justify-center rounded-full border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/30 transition-colors"
                                >
                                  {it.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                        {(condoMenuData?.singles || []).length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] pl-1">Outros</h4>
                            <div className="flex flex-col gap-3 pl-3 border-l border-white/10">
                              {condoMenuData!.singles.map((it) => (
                                <Link
                                  key={it.full}
                                  to={`/busca?condominium=${encodeURIComponent(it.full)}`}
                                  onClick={() => setMenuOpen(false)}
                                  className="font-normal text-xs tracking-[0.05em] text-white/60 hover:text-white transition-colors"
                                >
                                  {it.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
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
            {renderNavLink({ label: "Contato", hash: "contato" }, mobileClass)}
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
