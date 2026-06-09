import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import gsap from "gsap";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParsedFilters } from "@/components/search/FilterChips";
import { useCondoList } from "@/hooks/useCondoList";
import { usePriceBounds, buildPriceOptions } from "@/hooks/usePriceBounds";
import AiSearchChatButton from "@/components/search/ai-chat/AiSearchChatButton";
import AiSearchChatModal from "@/components/search/ai-chat/AiSearchChatModal";

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
  parking_spots?: number | null;
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

const enrichPhoto = (r: SearchResult): SearchResult => ({
  ...r,
  photo: r.photo || "/placeholder.svg",
});

interface SearchHeroProps {
  initialQuery: string;
  onResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
  onParsedFilters?: (filters: ParsedFilters | null) => void;
}

const selectClass =
  "bg-background border border-border rounded-md px-3 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer";

const SearchHero = ({ initialQuery, onResults, onLoading, onParsedFilters }: SearchHeroProps) => {
  const { condos: allCondos } = useCondoList();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<"cognitive" | "traditional">("cognitive");
  const [chatOpen, setChatOpen] = useState(false);
  const heroImageRef = useRef<HTMLDivElement>(null);

  // Traditional filters — initialized from URL
  const [filterType, setFilterType] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterCondo, setFilterCondo] = useState(() => searchParams.get("condominium") || "");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterTransaction, setFilterTransaction] = useState(
    () => searchParams.get("transactionType") || ""
  );

  const priceBounds = usePriceBounds();
  const rental = filterTransaction === "locacao" || filterTransaction === "aluguel";
  const priceOptions = rental
    ? buildPriceOptions(priceBounds.rentMin, priceBounds.rentMax, true)
    : buildPriceOptions(priceBounds.saleMin, priceBounds.saleMax, false);

  useEffect(() => {
    if (heroImageRef.current) {
      gsap.fromTo(heroImageRef.current, { scale: 1.15 }, { scale: 1, duration: 2.5, ease: "power2.out" });
    }
  }, []);

  // Backward compat: if a ?q= initial query is present, run legacy search once.
  useEffect(() => {
    const q = (initialQuery || "").trim();
    if (!q || q.length < 2) return;
    (async () => {
      onLoading(true);
      onParsedFilters?.(null);
      try {
        const { data, error } = await supabase.functions.invoke("ai-property-search", { body: { query: q } });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); onResults([]); return; }
        onResults((data?.results || []).map(enrichPhoto));
      } catch (err) {
        console.error("Search error:", err);
        toast.error("Não foi possível realizar a busca. Tente novamente.");
        onResults([]);
      } finally {
        onLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTraditionalSearch = useCallback(() => {
    const next = new URLSearchParams();
    if (filterType) next.set("propertyType", filterType);
    if (filterBedrooms) next.set("minBedrooms", filterBedrooms);
    if (filterCondo) next.set("condominium", filterCondo);
    if (filterTransaction) next.set("transactionType", filterTransaction);
    if (filterMinPrice) next.set("minPrice", filterMinPrice);
    if (filterMaxPrice) next.set("maxPrice", filterMaxPrice);
    setSearchParams(next);
    onParsedFilters?.(null);
    onLoading(false);
  }, [
    filterType, filterMinPrice, filterMaxPrice, filterCondo, filterBedrooms, filterTransaction,
    setSearchParams, onLoading, onParsedFilters,
  ]);

  return (
    <section className="relative bg-background pt-28 md:pt-32 pb-10 md:pb-12 flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 md:px-6">
        <motion.h1
          className="text-display text-2xl md:text-3xl font-light text-foreground text-center mb-6 tracking-wide"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Alpha Concierge
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white border border-border rounded-lg shadow-2xl p-4 md:p-6"
        >
          {mode === "cognitive" ? (
            <AiSearchChatButton
              onClick={() => setChatOpen(true)}
              variant="hero"
              extraAction={
                <button
                  onClick={(e) => { e.stopPropagation(); setMode("traditional"); }}
                  className="hidden sm:inline-flex text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  Busca tradicional
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setMode("cognitive")}
                  className="text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cognitivo
                </button>
              </div>
                <select value={filterTransaction} onChange={(e) => setFilterTransaction(e.target.value)} className={selectClass}>
                  <option value="">Transação</option>
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                </select>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
                  <option value="">Tipo</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                </select>

                <select value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)} className={selectClass}>
                  <option value="">Suítes (mínimo)</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>

                <select value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} className={selectClass}>
                  <option value="">Preço mínimo</option>
                  {priceOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <select value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} className={selectClass}>
                  <option value="">Até</option>
                  {priceOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <select value={filterCondo} onChange={(e) => setFilterCondo(e.target.value)} className={`${selectClass} w-full`}>
                  <option value="">Condomínio</option>
                  {allCondos.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleTraditionalSearch}
                className="w-full bg-primary text-primary-foreground py-3 text-body text-xs tracking-[0.15em] uppercase hover-magnetic flex items-center justify-center gap-2 rounded-md"
              >
                <Search size={14} />
                Buscar imóveis
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <AiSearchChatModal open={chatOpen} onOpenChange={setChatOpen} />
    </section>
  );
};

export default SearchHero;
