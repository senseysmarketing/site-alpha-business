import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bed, Bath, Maximize, X, Building2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { type ParsedFilters } from "@/components/search/FilterChips";

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
  parsedFilters?: ParsedFilters | null;
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

  const displayResults = results.slice(0, 4);
  const hasMore = results.length > 4;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute left-0 right-0 top-full mt-3 bg-background/60 backdrop-blur-[20px] border border-border/30 shadow-2xl rounded-sm max-h-[60vh] overflow-y-auto z-50"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
      >
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
            <p className="text-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground px-2 pt-2 pb-3">
              {results.length} {results.length === 1 ? "resultado" : "resultados"} encontrados
            </p>

            {displayResults.map((result, i) => (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
                onClick={() => {
                  onClose();
                  navigate(`/imovel/${result.id}`);
                }}
                className="w-full flex gap-3 p-2 rounded-sm hover:bg-foreground/[0.03] transition-colors text-left group relative"
              >
                <div className="w-20 h-16 rounded-sm overflow-hidden flex-shrink-0 bg-muted">
                  {result.photo ? (
                    <img
                      src={result.photo}
                      alt={result.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Building2 size={20} strokeWidth={1} />
                    </div>
                  )}
                </div>

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
                      <span className="text-body text-xs font-medium text-foreground font-mono">
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
                      <span className="flex items-center gap-1 text-muted-foreground text-xs font-mono">
                        <Maximize size={12} /> {result.area_total}m²
                      </span>
                    ) : null}
                  </div>

                  <p className="text-body text-[11px] text-accent-foreground/70 mt-1 line-clamp-1 italic">
                    {result.relevance_reason}
                  </p>
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ArrowRight size={14} className="text-[#2A070C]" />
                </div>
              </motion.button>
            ))}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: displayResults.length * 0.08 + 0.1 }}
              onClick={() => {
                onClose();
                navigate(`/busca?q=${encodeURIComponent(query)}`);
              }}
              className="w-full text-body text-[10px] tracking-[0.2em] uppercase text-foreground hover:text-[#2A070C] transition-colors py-4 mt-1 border-t border-border/30 flex items-center justify-center gap-2"
            >
              Ver todos os resultados {hasMore && `(${results.length})`}
              <ArrowRight size={12} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchResultsPanel;
