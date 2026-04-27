import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logoRafael from "@/assets/logo-rafael.png";
import AdvertisePropertyModal from "@/components/AdvertisePropertyModal";

interface HeaderProps {
  variant?: "transparent" | "solid";
}

const Header = ({ variant = "transparent" }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [advertiseOpen, setAdvertiseOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isSolid = variant === "solid" || scrolled || menuOpen;
  const navItems = [
    { label: "Buscar", href: "/busca" },
    { label: "Venda", href: "#" },
    { label: "Locação", href: "#" },
    { label: "Serviços", href: "#" },
    { label: "Notícias", href: "/blog" },
    { label: "Fale Conosco", href: "#contact" },
  ];

  return (
    <motion.header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        isSolid
          ? "bg-[#1f1f1f]/95 backdrop-blur-md"
          : "bg-transparent"
      }`}
      style={{ fontFamily: "'Roboto', sans-serif" }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 gap-4">
        <a href="/" className="flex-shrink-0">
          <img
            src={logoRafael}
            alt="Rafael Albuquerque"
            className="h-8 md:h-10 w-auto"
          />
        </a>

        <nav className="hidden xl:flex items-center gap-5 2xl:gap-8 min-w-0">
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.label}
                to={item.href}
                className="font-normal text-xs tracking-[0.15em] uppercase whitespace-nowrap text-white/70 hover:text-white transition-colors duration-300"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="font-normal text-xs tracking-[0.15em] uppercase whitespace-nowrap text-white/70 hover:text-white transition-colors duration-300"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden xl:flex items-center flex-shrink-0">
          <button
            onClick={() => setAdvertiseOpen(true)}
            className="font-normal text-xs tracking-[0.1em] uppercase whitespace-nowrap px-6 py-2.5 border border-white/30 text-white rounded-full hover:bg-white/10 transition-colors duration-300"
          >
            Anuncie seu imóvel
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="xl:hidden text-white flex-shrink-0"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          className="xl:hidden bg-[#1f1f1f] border-t border-white/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <nav className="flex flex-col px-6 py-6 gap-4">
            {navItems.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="font-normal text-sm tracking-[0.1em] uppercase text-white/70 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="font-normal text-sm tracking-[0.1em] uppercase text-white/70 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
            <button
              onClick={() => { setAdvertiseOpen(true); setMenuOpen(false); }}
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
