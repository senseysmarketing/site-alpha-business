import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { mockProperties, formatPrice } from "@/data/mockProperties";

// Use the most expensive property as featured
const featured = [...mockProperties].sort((a, b) => (b.price || 0) - (a.price || 0))[0];

const FeaturedPropertySection = () => {
  return (
    <section className="px-6 md:px-12 lg:px-24 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-lg overflow-hidden min-h-[500px] md:min-h-[600px]">
          <img
            src={featured.photo || featured.images[0]}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/60 to-transparent" />

          <div className="relative z-10 flex flex-col justify-end h-full min-h-[500px] md:min-h-[600px] p-8 md:p-14 lg:p-20 max-w-2xl">
            <motion.p
              className="text-body text-[10px] tracking-[0.35em] uppercase text-primary-foreground/70 mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Destaque
            </motion.p>

            <motion.h2
              className="text-display text-3xl md:text-5xl lg:text-6xl font-light text-primary-foreground mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {featured.title}
            </motion.h2>

            <motion.p
              className="text-body text-sm md:text-base text-primary-foreground/80 mb-3"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {featured.subtitle}
            </motion.p>

            <motion.p
              className="text-body text-xs tracking-wide text-primary-foreground/60 mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {featured.area_total?.toLocaleString("pt-BR")} m² · {featured.suites} suítes · {featured.parking} vagas
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-2 mb-8"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {featured.amenities.map((item) => (
                <span
                  key={item}
                  className="text-body text-[10px] md:text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border border-primary-foreground/30 text-primary-foreground/80 rounded-sm"
                >
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link
                to={`/imovel/${featured.id}`}
                className="inline-block text-body text-xs tracking-[0.2em] uppercase px-8 py-3.5 bg-primary-foreground text-foreground font-medium hover:bg-primary-foreground/90 transition-colors"
              >
                Agendar visita
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPropertySection;
