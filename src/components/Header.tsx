import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logoAlpha from "@/assets/logo-alpha.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Buscar", href: "/busca" },
    { label: "Venda", href: "#" },
    { label: "Locação", href: "#" },
    { label: "Serviços", href: "#" },
    { label: "Blog", href: "/blog" },
    { label: "Fale Conosco", href: "#contact" },
  ];

  return (
    <motion.header
      className="fixed left-0 right-0 z-50 bg-[hsl(350,60%,5%)]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 py-4">
        <a href="/">
          <img
            src={logoAlpha}
            alt="Alpha Business Imobiliária"
            className="h-8 md:h-10 w-auto brightness-0 invert"
          />
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-body text-xs tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-300"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-body text-xs tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-300"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center">
          <a
            href="#"
            className="text-body text-xs tracking-[0.1em] uppercase px-6 py-2.5 border border-white/30 text-white hover:bg-white/10 transition-colors duration-300"
          >
            Acessar meu imóvel
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          className="md:hidden bg-[hsl(350,60%,5%)] border-t border-white/10"
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
                  className="text-body text-sm tracking-[0.1em] uppercase text-white/70 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-body text-sm tracking-[0.1em] uppercase text-white/70 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
            <a
              href="#"
              className="text-body text-xs tracking-[0.1em] uppercase px-6 py-3 border border-white/30 text-white text-center mt-2"
            >
              Acessar meu imóvel
            </a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
