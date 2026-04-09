import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import mansionModern from "@/assets/mansion-modern.jpg";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface FeaturedBannerSettings {
  tagline: string;
  title: string;
  description: string;
  background_image: string;
  buttons: { label: string; href: string }[];
}

const DEFAULT_TAGLINE = "Conheça os condomínios";
const DEFAULT_TITLE = "As propriedades mais que especiais em *Alphaville*";
const DEFAULT_DESCRIPTION = "Descubra os melhores condomínios da região e encontre o imóvel perfeito para o seu estilo de vida.";
const DEFAULT_BUTTONS = [
  { label: "Tamboré I", href: "/busca?condominio=tambore-1" },
  { label: "Tamboré II", href: "/busca?condominio=tambore-2" },
  { label: "Tamboré III", href: "/busca?condominio=tambore-3" },
];

const renderWithItalic = (text: string) => {
  const parts = text.split(/\*(.*?)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i} className="italic">{part}</em> : <span key={i}>{part}</span>
  );
};

const FeaturedPropertySection = () => {
  const { data: settings } = useSiteSettings<FeaturedBannerSettings>("featured_banner");

  const tagline = settings?.tagline || DEFAULT_TAGLINE;
  const title = settings?.title || DEFAULT_TITLE;
  const description = settings?.description || DEFAULT_DESCRIPTION;
  const backgroundImage = settings?.background_image || mansionModern;
  const buttons = settings?.buttons?.length ? settings.buttons : DEFAULT_BUTTONS;

  return (
    <section className="px-6 md:px-12 lg:px-24 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-lg overflow-hidden min-h-[400px] md:min-h-[450px]">
          <img
            src={backgroundImage}
            alt="Alphaville"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[hsl(350,60%,5%)]/80" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center h-full min-h-[400px] md:min-h-[450px] p-8 md:p-16">
            <motion.p
              className="text-body text-xs tracking-[0.3em] uppercase text-white/50 mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {tagline}
            </motion.p>

            <motion.h2
              className="text-display text-3xl md:text-5xl font-light text-white mb-4 max-w-2xl leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {renderWithItalic(title)}
            </motion.h2>

            <motion.p
              className="text-body text-sm text-white/60 mb-10 max-w-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {buttons.map((c) => (
                <Link
                  key={c.label}
                  to={c.href}
                  className="text-body text-xs tracking-[0.15em] uppercase px-8 py-3.5 border border-white/30 text-white hover:bg-white/10 transition-colors duration-300 rounded-sm"
                >
                  {c.label}
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPropertySection;
