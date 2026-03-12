import { motion } from "framer-motion";
import { MapPin, Utensils, TreePine, ShoppingBag, GraduationCap } from "lucide-react";

interface HighlightItem {
  icon: React.ReactNode;
  label: string;
}

const highlights: HighlightItem[] = [
  { icon: <Utensils size={16} strokeWidth={1.5} />, label: "Gastronomia premium a minutos" },
  { icon: <TreePine size={16} strokeWidth={1.5} />, label: "Parques e áreas verdes" },
  { icon: <ShoppingBag size={16} strokeWidth={1.5} />, label: "Shopping Iguatemi Alphaville" },
  { icon: <GraduationCap size={16} strokeWidth={1.5} />, label: "Escolas internacionais" },
];

interface PropertyNeighborhoodProps {
  name: string;
  description: string;
}

const PropertyNeighborhood = ({ name, description }: PropertyNeighborhoodProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={18} className="text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-display text-xl font-light tracking-wide text-foreground">
          {name}
        </h2>
      </div>

      <p className="text-body text-sm text-muted-foreground leading-relaxed mb-8">
        {description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {highlights.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 border border-border rounded-sm bg-card/50"
          >
            <span className="text-muted-foreground">{item.icon}</span>
            <span className="text-body text-sm text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default PropertyNeighborhood;
