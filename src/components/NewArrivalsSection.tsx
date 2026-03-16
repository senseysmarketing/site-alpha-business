import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";

const properties = [
  { id: 1, image: property1, title: "Residência Altos de Alphaville", location: "Alphaville 0", area: "850 m²", rooms: "5 suítes", price: "R$ 12.500.000", tag: "Nova" },
  { id: 2, image: property2, title: "Penthouse Sky Residence", location: "Barueri", area: "420 m²", rooms: "4 suítes", price: "R$ 8.900.000", tag: "Exclusiva" },
  { id: 3, image: property3, title: "Villa Pedra & Vidro", location: "Alphaville 11", area: "680 m²", rooms: "4 suítes", price: "R$ 9.200.000", tag: "Nova" },
  { id: 4, image: property4, title: "Casa Contemporânea Light", location: "Tamboré", area: "520 m²", rooms: "5 suítes", price: "R$ 7.800.000", tag: null },
];

const NewArrivalsSection = () => {
  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12 md:mb-16">
          <div>
            <motion.p className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Acabaram de chegar
            </motion.p>
            <motion.h2 className="text-display text-3xl md:text-5xl font-light" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              Novas <em className="italic">oportunidades</em>
            </motion.h2>
          </div>
          <motion.a href="#" className="hidden md:inline-block text-body text-xs tracking-[0.15em] uppercase text-muted-foreground line-reveal pb-1" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            Ver todos
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {properties.map((prop, i) => (
            <motion.article
              key={prop.id}
              className={`group cursor-pointer ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <Link to={`/imovel/${prop.id}`}>
                <motion.div
                  layoutId={`property-${prop.id}`}
                  className={`relative overflow-hidden mb-4 ${i === 0 ? "aspect-[4/5]" : "aspect-square"}`}
                >
                  <img src={prop.image} alt={prop.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  {prop.tag && (
                    <span className="absolute top-4 left-4 text-body text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 glass-panel">{prop.tag}</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
                <div>
                  <p className="text-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">{prop.location} · {prop.area} · {prop.rooms}</p>
                  <h3 className="text-display text-lg md:text-xl font-light mb-2">{prop.title}</h3>
                  <p className="text-body text-sm font-medium text-foreground">{prop.price}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
