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

const DEFAULT_TAGLINE = "Tamboré I, II, III";
const DEFAULT_TITLE = "As propriedades mais que especiais em Alphaville";
const DEFAULT_DESCRIPTION =
  "A Alpha Business vem se consolidando como referência em vendas de propriedades de alto luxo. Encontre uma perfeita para você.";
const DEFAULT_BUTTONS = [
  { label: "Tamboré I", href: "/busca?condominio=tambore-1" },
  { label: "Tamboré II", href: "/busca?condominio=tambore-2" },
  { label: "Tamboré III", href: "/busca?condominio=tambore-3" },
];

const renderWithItalic = (text: string) => {
  const parts = text.split(/\*(.*?)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <span key={i}>{part}</span> : <span key={i}>{part}</span>
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
    <section className="px-6 md:px-12 lg:px-24 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[420px]">
          {/* Left column — dark content panel */}
          <div className="bg-[#1a1a1a] p-10 md:p-14 flex flex-col justify-center items-start text-left order-2 md:order-1">
            <motion.p
              className="text-body text-xs tracking-[0.25em] uppercase text-white/50 mb-5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {tagline}
            </motion.p>

            <motion.h2
              className="text-display text-3xl md:text-4xl lg:text-5xl font-normal text-white leading-[1.35] mb-6 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {renderWithItalic(title)}
            </motion.h2>

            <motion.p
              className="text-body text-sm md:text-base text-white/60 leading-relaxed mb-8 max-w-md"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {buttons.map((c) => (
                <Link
                  key={c.label}
                  to={c.href}
                  className="text-body text-sm font-medium px-6 py-3 border border-white/25 text-white hover:bg-white/10 transition-colors duration-300 rounded-md"
                >
                  {c.label}
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Right column — image */}
          <div className="relative min-h-[260px] md:min-h-full order-1 md:order-2">
            <img
              src={backgroundImage}
              alt="Alphaville"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Soft gradient blending into the dark panel (desktop only) */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1a1a1a] to-transparent hidden md:block pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPropertySection;
