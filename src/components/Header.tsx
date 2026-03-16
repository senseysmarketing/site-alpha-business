import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Instagram, Youtube, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoAlpha from "@/assets/logo-alpha.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Comprar", href: "#" },
    { label: "Alugar", href: "#" },
    { label: "Blog", href: "/blog" },
    { label: "Sobre", href: "#about" },
    { label: "Contato", href: "#contact" },
  ];

  return (
    <>
      {/* Utility bar */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-[51] h-8 bg-card border-b border-border/40">
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 h-full">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            <Instagram size={14} />
          </a>
          <a
            href="tel:+5511999999999"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 text-body text-[11px] tracking-[0.1em]"
          >
            <Phone size={12} />
            (11) 9999-9999
          </a>
        </div>
      </div>

      <motion.header
        className="fixed left-0 right-0 z-50 glass-panel top-0 md:top-8"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 py-4">
          <a href="/">
            <img
              src={logoAlpha}
              alt="Alpha Business Imobiliária"
              className="h-8 md:h-10 w-auto brightness-0"
            />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-12">
            {navItems.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-body text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 line-reveal"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-body text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 line-reveal"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-xs tracking-[0.1em] uppercase px-6 py-2.5 bg-primary text-primary-foreground hover-magnetic"
            >
              WhatsApp
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-foreground"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            className="md:hidden bg-background border-t border-border"
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
                    className="text-body text-sm tracking-[0.1em] uppercase text-muted-foreground py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-body text-sm tracking-[0.1em] uppercase text-muted-foreground py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              )}
              <a
                href="https://wa.me/5511999999999"
                className="text-body text-xs tracking-[0.1em] uppercase px-6 py-3 bg-primary text-primary-foreground text-center mt-2"
              >
                WhatsApp
              </a>
            </nav>
          </motion.div>
        )}
      </motion.header>
    </>
  );
};

export default Header;
