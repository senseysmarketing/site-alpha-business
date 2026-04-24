import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toTitleCase } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  photo: string | null;
  condominium: string | null;
  price: number | null;
}

interface ConciergeSidebarProps {
  suggestions: Property[];
  visible: boolean;
}

const formatPrice = (v: number | null) => {
  if (!v) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
};

const ConciergeSidebar = ({ suggestions, visible }: ConciergeSidebarProps) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (!visible || dismissed || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-40 w-72 glass-panel rounded-xl p-4 shadow-2xl hidden md:block"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              Concierge IA
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-sm hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        <p className="text-body text-xs text-muted-foreground mb-3 leading-relaxed">
          Baseado na sua busca, selecionamos estas mansões exclusivas:
        </p>

        <div className="space-y-2">
          {suggestions.slice(0, 3).map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/imovel/${p.id}`)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {p.photo ? (
                  <img src={p.photo} alt={toTitleCase(p.title)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-display text-sm text-foreground truncate">{toTitleCase(p.title)}</h4>
                {p.price && (
                  <span className="text-body text-[11px] text-muted-foreground">
                    {formatPrice(p.price)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConciergeSidebar;
