import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import mansionModern from "@/assets/mansion-modern.jpg";

const condominiums = [
  { label: "Tamboré I", href: "/busca?condominio=tambore-1" },
  { label: "Tamboré II", href: "/busca?condominio=tambore-2" },
  { label: "Tamboré III", href: "/busca?condominio=tambore-3" },
];

const FeaturedPropertySection = () => {
  return (
    <section className="px-6 md:px-12 lg:px-24 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-lg overflow-hidden min-h-[400px] md:min-h-[450px]">
          <img
            src={mansionModern}
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
              Conheça os condomínios
            </motion.p>

            <motion.h2
              className="text-display text-3xl md:text-5xl font-light text-white mb-4 max-w-2xl leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              As propriedades mais que especiais em{" "}
              <em className="italic">Alphaville</em>
            </motion.h2>

            <motion.p
              className="text-body text-sm text-white/60 mb-10 max-w-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Descubra os melhores condomínios da região e encontre o imóvel
              perfeito para o seu estilo de vida.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {condominiums.map((c) => (
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
