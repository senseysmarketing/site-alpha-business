import { motion } from "framer-motion";
import { Search, Hash, ArrowRight } from "lucide-react";
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePriceBounds, buildPriceOptions } from "@/hooks/usePriceBounds";
import AiSearchChatButton from "./search/ai-chat/AiSearchChatButton";
import AiSearchChatModal from "./search/ai-chat/AiSearchChatModal";

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

  const priceBounds = usePriceBounds();
  const isRental = filterTransaction === "locacao" || filterTransaction === "aluguel";
  const priceOptions = isRental
    ? buildPriceOptions(priceBounds.rentMin, priceBounds.rentMax, true)
    : buildPriceOptions(priceBounds.saleMin, priceBounds.saleMax, false);

  const handleCodeSearch = useCallback(() => {
    const code = filterCode.trim();
    if (!code) return;
    navigate(`/busca?q=${encodeURIComponent(code)}`);
  }, [filterCode, navigate]);

  const handleTraditionalSearch = useCallback(() => {
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
    navigate(`/busca?${params.toString()}`);
  }, [
    filterCode, filterTransaction, filterType, filterBedrooms, filterParking,
    filterMinArea, filterCondo, filterMinPrice, filterMaxPrice, navigate,
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
                <div className="flex-1 relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={filterCode}
                    onChange={(e) => setFilterCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCodeSearch(); }}
                    placeholder="Buscar por código do imóvel (ex: AB1234)"
                    className="w-full bg-background border border-border rounded-md pl-9 pr-24 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary tracking-wider"
                  />
                  <button
                    onClick={handleCodeSearch}
                    disabled={!filterCode.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-3 py-1.5 rounded text-body text-[10px] tracking-[0.1em] uppercase bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
                  >
                    Ir <ArrowRight size={12} />
                  </button>
                </div>
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

                <select value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} className={selectClass}>
                  <option value="">Preço mínimo</option>
                  {priceOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <select value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} className={selectClass}>
                  <option value="">Preço máximo</option>
                  {priceOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Linha 3 — Filtros secundários */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-border/40">
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

export default SearchBarSection;
