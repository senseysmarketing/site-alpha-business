import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { getLucideIcon } from "@/lib/lucideIconMap";

export interface NeighborhoodHighlight {
  icon: string;
  label: string;
}

interface PropertyNeighborhoodProps {
  name: string;
  description?: string;
  highlights?: NeighborhoodHighlight[];
}

const PropertyNeighborhood = ({ name, description, highlights = [] }: PropertyNeighborhoodProps) => {
  const hasContent = (description && description.trim().length > 0) || highlights.length > 0;
  if (!name && !hasContent) return null;

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

      {description && description.trim().length > 0 && (
        <p className="text-body text-sm text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">
          {description}
        </p>
      )}

      {highlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map((item, i) => {
            const Icon = getLucideIcon(item.icon);
            return (
              <div
                key={`${item.label}-${i}`}
                className="flex items-center gap-3 p-4 border border-border rounded-sm bg-card/50"
              >
                <span className="text-muted-foreground">
                  <Icon size={16} strokeWidth={1.5} />
                </span>
                <span className="text-body text-sm text-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
};

export default PropertyNeighborhood;
