import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bed, Bath, Maximize, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  id: string;
  code: string;
  title: string;
  condominium: string | null;
  neighborhood: string | null;
  city: string | null;
  price: number | null;
  rental_price: number | null;
  transaction_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

interface SearchResultsPanelProps {
  results: SearchResult[];
  loading: boolean;
  visible: boolean;
  onClose: () => void;
  query?: string;
}

const formatPrice = (value: number | null) => {
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SearchResultsPanel = ({ results, loading, visible, onClose, query = "" }: SearchResultsPanelProps) => {
  const navigate = useNavigate();

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute left-0 right-0 top-full mt-3 glass-panel rounded-sm max-h-[60vh] overflow-y-auto z-50"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors z-10"
        >
          <X size={14} />
        </button>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-20 h-16 rounded-sm flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-body text-sm text-muted-foreground">
              Nenhum imóvel encontrado para sua busca.
            </p>
          </div>
        ) : (
          <div className="p-2">
            <p className="text-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground px-2 pt-2 pb-3">
              {results.length} {results.length === 1 ? "resultado" : "resultados"} encontrados
            </p>
            {/* Ver todos button */}
            <button
              onClick={() => {
                onClose();
                navigate(`/busca?q=${encodeURIComponent(query)}`);
              }}
              className="w-full text-body text-xs tracking-[0.1em] uppercase text-accent hover:text-foreground transition-colors py-2.5 mb-1 border-b border-border/30"
            >
              Ver todos os resultados →
            </button>
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onClose();
                  navigate(`/imovel/${result.id}`);
                }}
                className="w-full flex gap-3 p-2 rounded-sm hover:bg-muted/50 transition-colors text-left group"
              >
                {/* Photo */}
                <div className="w-20 h-16 rounded-sm overflow-hidden flex-shrink-0 bg-muted">
                  {result.photo ? (
                    <img
                      src={result.photo}
                      alt={result.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] tracking-wider uppercase">
                      Sem foto
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-body text-sm font-medium text-foreground truncate">
                      {result.title}
                    </h4>
                    <span className="text-body text-[10px] tracking-wider uppercase text-muted-foreground flex-shrink-0">
                      {result.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {result.condominium && (
                      <span className="text-body text-xs text-muted-foreground truncate">
                        {result.condominium}
                      </span>
                    )}
                    {result.condominium && result.neighborhood && (
                      <span className="text-muted-foreground/40 text-xs">·</span>
                    )}
                    {result.neighborhood && (
                      <span className="text-body text-xs text-muted-foreground truncate">
                        {result.neighborhood}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    {(result.price || result.rental_price) && (
                      <span className="text-body text-xs font-medium text-foreground">
                        {formatPrice(
                          result.transaction_type === "aluguel"
                            ? result.rental_price
                            : result.price
                        )}
                      </span>
                    )}
                    {result.bedrooms ? (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Bed size={12} /> {result.bedrooms}
                      </span>
                    ) : null}
                    {result.bathrooms ? (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Bath size={12} /> {result.bathrooms}
                      </span>
                    ) : null}
                    {result.area_total ? (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Maximize size={12} /> {result.area_total}m²
                      </span>
                    ) : null}
                  </div>

                  {/* AI relevance reason */}
                  <p className="text-body text-[11px] text-accent-foreground/70 mt-1 line-clamp-1 italic">
                    {result.relevance_reason}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchResultsPanel;
