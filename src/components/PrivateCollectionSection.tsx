import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import privateImg from "@/assets/private-collection.jpg";

const features = [
  { title: "Curadoria Exclusiva", description: "Cada imóvel da coleção é selecionado pessoalmente por nossos especialistas, garantindo um padrão inigualável de qualidade e acabamento." },
  { title: "Acesso Antecipado", description: "Clientes Alpha Private têm acesso a lançamentos e oportunidades antes de serem publicadas no mercado." },
  { title: "Concierge Imobiliário", description: "Um consultor dedicado acompanha todo o processo, desde a visita até a entrega das chaves, com atendimento 24/7." },
  { title: "Avaliação Premium", description: "Laudos técnicos detalhados, análise de potencial de valorização e consultoria patrimonial completa." },
];

const PrivateCollectionSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section ref={containerRef} id="private" className="relative min-h-[200vh] bg-bordeaux">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full">
          <div className="relative h-[50vh] lg:h-full overflow-hidden">
            <motion.img
              src={privateImg}
              alt="Alpha Private Collection"
              className="w-full h-full object-cover"
              style={{ scale: imageScale }}
            />
            <div className="absolute inset-0 bg-bordeaux/30" />
          </div>

          <div className="flex flex-col justify-center px-6 md:px-12 lg:px-20 py-12 lg:py-0">
            <motion.p className="text-body text-xs tracking-[0.4em] uppercase text-cashmere/50 mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Exclusivo
            </motion.p>
            <motion.h2 className="text-display text-3xl md:text-5xl font-light text-cashmere mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Alpha Private
              <br />
              <em className="italic">Collection</em>
            </motion.h2>

            <div className="space-y-8">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  className="border-t border-cashmere/15 pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                >
                  <h3 className="text-display text-xl font-light text-cashmere mb-2">{feat.title}</h3>
                  <p className="text-body text-sm text-cashmere/60 leading-relaxed">{feat.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="#"
              className="inline-block mt-12 text-body text-xs tracking-[0.15em] uppercase px-8 py-3 border border-cashmere/30 text-cashmere hover:bg-cashmere/10 transition-colors duration-300 w-fit"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Solicitar Acesso
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivateCollectionSection;