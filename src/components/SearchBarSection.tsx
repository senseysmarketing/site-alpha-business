import { motion } from "framer-motion";
import { Search, Hash, ArrowRight } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AiSearchChatButton from "./search/ai-chat/AiSearchChatButton";
import AiSearchChatModal from "./search/ai-chat/AiSearchChatModal";
import PropertyCodeAutocomplete from "./search/PropertyCodeAutocomplete";
import CondoAutocomplete from "./search/CondoAutocomplete";
import { trackSearch } from "@/lib/metaPixel";


const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const parseCurrency = (input: string): string => input.replace(/\D/g, "");
const formatCurrencyBRL = (digits: string): string =>
  digits ? brlFormatter.format(Number(digits)) : "";

const SearchBarSection = () => {
  const [mode, setMode] = useState<"cognitive" | "traditional">("cognitive");
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  // Traditional filters state
  const [filterCode, setFilterCode] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterCondo, setFilterCondo] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterParking, setFilterParking] = useState("");
  const [filterMinArea, setFilterMinArea] = useState("");
  const [filterTransaction, setFilterTransaction] = useState("");

  const isRental = filterTransaction === "locacao" || filterTransaction === "aluguel";

  const priceError = useMemo(() => {
    if (!filterMinPrice || !filterMaxPrice) return null;
    if (Number(filterMinPrice) > Number(filterMaxPrice)) {
      return "O valor mínimo não pode ser maior que o máximo.";
    }
    return null;
  }, [filterMinPrice, filterMaxPrice]);


  const handleCodeSearch = useCallback(() => {
    const code = filterCode.trim();
    if (!code) return;
    trackSearch({ search_string: code, content_category: "codigo" });
    navigate(`/busca?q=${encodeURIComponent(code)}`);
  }, [filterCode, navigate]);

  const handleTraditionalSearch = useCallback(() => {
    if (priceError) return;
    const params = new URLSearchParams();
    if (filterCode.trim()) params.set("q", filterCode.trim());
    if (filterTransaction) params.set("transactionType", filterTransaction);
    if (filterType) params.set("propertyType", filterType);
    if (filterBedrooms) params.set("minBedrooms", filterBedrooms);
    if (filterParking) params.set("minParking", filterParking);
    if (filterMinArea) params.set("minArea", filterMinArea);
    if (filterCondo) params.set("condominium", filterCondo);
    if (filterMinPrice) params.set("minPrice", filterMinPrice);
    if (filterMaxPrice) params.set("maxPrice", filterMaxPrice);
    trackSearch({
      search_string: params.toString(),
      content_category: "tradicional",
    });
    navigate(`/busca?${params.toString()}`);
  }, [
    filterCode, filterTransaction, filterType, filterBedrooms, filterParking,
    filterMinArea, filterCondo, filterMinPrice, filterMaxPrice, priceError, navigate,
  ]);

  const selectClass =
    "bg-background border border-border rounded-md px-3 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer w-full";

  return (
    <section className="relative z-20 px-6 md:px-12 lg:px-24 -mt-10 mb-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="bg-background rounded-lg shadow-xl p-3 sm:p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          {mode === "cognitive" ? (
            <AiSearchChatButton
              onClick={() => setChatOpen(true)}
              variant="hero"
              extraAction={
                <button
                  onClick={(e) => { e.stopPropagation(); setMode("traditional"); }}
                  className="inline-flex text-body text-[10px] tracking-[0.1em] uppercase px-3 sm:px-4 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 whitespace-nowrap"
                >
                  Tradicional
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              {/* Linha 1 — Busca rápida por código + toggle */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <PropertyCodeAutocomplete
                  value={filterCode}
                  onChange={setFilterCode}
                  onSubmit={handleCodeSearch}
                />
                <button
                  onClick={() => setMode("cognitive")}
                  className="text-body text-[10px] tracking-[0.1em] uppercase px-4 py-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors self-end sm:self-auto"
                >
                  Cognitivo
                </button>
              </div>


              {/* Linha 2 — Filtros principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={filterTransaction} onChange={(e) => setFilterTransaction(e.target.value)} className={selectClass}>
                  <option value="">Transação</option>
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                </select>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
                  <option value="">Tipo de imóvel</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="cobertura">Cobertura</option>
                  <option value="sobrado">Sobrado</option>
                  <option value="terreno">Terreno</option>
                </select>

                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyBRL(filterMinPrice)}
                  onChange={(e) => setFilterMinPrice(parseCurrency(e.target.value))}
                  onKeyDown={(e) => { if (e.key === "Enter" && !priceError) handleTraditionalSearch(); }}
                  placeholder={isRental ? "Mínimo (ex: R$ 5.000)" : "Mínimo (ex: R$ 1.500.000)"}
                  aria-invalid={!!priceError}
                  className={`${selectClass} text-left ${priceError ? "border-destructive focus:ring-destructive" : ""}`}
                />

                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyBRL(filterMaxPrice)}
                  onChange={(e) => setFilterMaxPrice(parseCurrency(e.target.value))}
                  onKeyDown={(e) => { if (e.key === "Enter" && !priceError) handleTraditionalSearch(); }}
                  placeholder={isRental ? "Máximo (ex: R$ 15.000)" : "Máximo (ex: R$ 5.000.000)"}
                  aria-invalid={!!priceError}
                  className={`${selectClass} text-left ${priceError ? "border-destructive focus:ring-destructive" : ""}`}
                />
              </div>

              {priceError && (
                <p className="text-body text-xs text-destructive -mt-2">{priceError}</p>
              )}


              {/* Linha 3 — Filtros secundários */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={filterCondo}
                  onChange={(e) => setFilterCondo(e.target.value)}
                  placeholder="Condomínio"
                  className={selectClass}
                />

                <select value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)} className={selectClass}>
                  <option value="">Suítes (mínimo)</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>

                <select value={filterParking} onChange={(e) => setFilterParking(e.target.value)} className={selectClass}>
                  <option value="">Vagas (mínimo)</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>

                <select value={filterMinArea} onChange={(e) => setFilterMinArea(e.target.value)} className={selectClass}>
                  <option value="">Área mínima</option>
                  <option value="100">100 m²+</option>
                  <option value="200">200 m²+</option>
                  <option value="300">300 m²+</option>
                  <option value="500">500 m²+</option>
                  <option value="800">800 m²+</option>
                  <option value="1000">1.000 m²+</option>
                </select>
              </div>

              <button
                onClick={handleTraditionalSearch}
                disabled={!!priceError}
                className="w-full bg-primary text-primary-foreground py-3 text-body text-xs tracking-[0.15em] uppercase hover-magnetic flex items-center justify-center gap-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SearchBarSection;
