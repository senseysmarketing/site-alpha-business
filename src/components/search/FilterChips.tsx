import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ParsedFilters {
  price_min?: number | null;
  price_max?: number | null;
  bedrooms_min?: number | null;
  bathrooms_min?: number | null;
  parking_min?: number | null;
  area_min?: number | null;
  condominium?: string | null;
  transaction_type?: string | null;
  qualitative_terms?: string[] | null;
}

interface FilterChipsProps {
  filters: ParsedFilters | null;
  onRemove?: (key: string) => void;
  className?: string;
}

const formatPrice = (value: number) => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value}`;
};

const FilterChips = ({ filters, onRemove, className = "" }: FilterChipsProps) => {
  if (!filters) return null;

  const chips: { key: string; icon: string; label: string }[] = [];

  if (filters.price_min && filters.price_max) {
    chips.push({ key: "price", icon: "💰", label: `${formatPrice(filters.price_min)} – ${formatPrice(filters.price_max)}` });
  } else if (filters.price_max) {
    chips.push({ key: "price_max", icon: "💰", label: `Até ${formatPrice(filters.price_max)}` });
  } else if (filters.price_min) {
    chips.push({ key: "price_min", icon: "💰", label: `Min ${formatPrice(filters.price_min)}` });
  }

  if (filters.condominium) {
    chips.push({ key: "condominium", icon: "📍", label: filters.condominium });
  }

  if (filters.bedrooms_min) {
    chips.push({ key: "bedrooms_min", icon: "🛏", label: `${filters.bedrooms_min}+ quartos` });
  }

  if (filters.bathrooms_min) {
    chips.push({ key: "bathrooms_min", icon: "🚿", label: `${filters.bathrooms_min}+ banheiros` });
  }

  if (filters.parking_min) {
    chips.push({ key: "parking_min", icon: "🚗", label: `${filters.parking_min}+ vagas` });
  }

  if (filters.area_min) {
    chips.push({ key: "area_min", icon: "📐", label: `${filters.area_min}m²+` });
  }

  if (filters.transaction_type) {
    chips.push({ key: "transaction_type", icon: "🏷", label: filters.transaction_type === "aluguel" ? "Aluguel" : "Venda" });
  }

  if (filters.qualitative_terms?.length) {
    filters.qualitative_terms.forEach((term, i) => {
      chips.push({ key: `qual_${i}`, icon: "✨", label: term });
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <AnimatePresence mode="popLayout">
        {chips.map((chip, i) => (
          <motion.span
            key={chip.key}
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            className="inline-flex items-center gap-1.5 bg-background/80 border border-border/50 rounded-full px-3 py-1 text-xs text-foreground/80 backdrop-blur-sm"
          >
            <span>{chip.icon}</span>
            <span className="font-mono text-[11px]">{chip.label}</span>
            {onRemove && (
              <button
                onClick={() => onRemove(chip.key)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FilterChips;
