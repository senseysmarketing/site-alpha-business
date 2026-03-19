import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Instagram, Youtube, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoAlpha from "@/assets/logo-alpha.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ContactSettings {
  phone: string;
  email: string;
  instagram: string;
  address: string;
}

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: contactData } = useSiteSettings<ContactSettings>("contact");

  const phone = contactData?.phone || "(11) 9999-9999";
  const instagram = contactData?.instagram || "alphaville.sp";
  const whatsappNumber = phone.replace(/\D/g, "") || "5511999999999";

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
          <div className="flex items-center gap-4">
            <a
              href={`https://instagram.com/${instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 text-[11px] tracking-[0.1em]"
            >
              <Instagram size={12} />
              {instagram.replace("@", "")}
            </a>
            <span className="text-border">|</span>
            <a
              href="https://www.youtube.com/@alphavilleab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 text-[11px] tracking-[0.1em]"
            >
              <Youtube size={12} />
              AlphaBusiness
            </a>
          </div>
          <a
            href={`tel:+55${phone.replace(/\D/g, "")}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 text-[11px] tracking-[0.1em]"
          >
            <Phone size={12} />
            {phone}
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
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-xs tracking-[0.1em] uppercase px-6 py-2.5 bg-primary text-primary-foreground hover-magnetic"
            >
              WhatsApp
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-foreground"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

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
                href={`https://wa.me/${whatsappNumber}`}
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
