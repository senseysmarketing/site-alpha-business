import { motion } from "framer-motion";
import { Search } from "lucide-react";
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
  const [filterType, setFilterType] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterCondo, setFilterCondo] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterTransaction, setFilterTransaction] = useState("");

  const priceBounds = usePriceBounds();
  const isRental = filterTransaction === "locacao" || filterTransaction === "aluguel";
  const priceOptions = isRental
    ? buildPriceOptions(priceBounds.rentMin, priceBounds.rentMax, true)
    : buildPriceOptions(priceBounds.saleMin, priceBounds.saleMax, false);

  const handleTraditionalSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (filterTransaction) params.set("transactionType", filterTransaction);
    if (filterType) params.set("propertyType", filterType);
    if (filterBedrooms) params.set("minBedrooms", filterBedrooms);
    if (filterCondo) params.set("condominium", filterCondo);
    if (filterMinPrice) params.set("minPrice", filterMinPrice);
    if (filterMaxPrice) params.set("maxPrice", filterMaxPrice);
    navigate(`/busca?${params.toString()}`);
  }, [filterTransaction, filterType, filterMinPrice, filterMaxPrice, filterCondo, filterBedrooms, navigate]);

  const selectClass =
    "bg-background border border-border rounded-md px-3 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer";

  return (
    <section className="relative z-20 px-6 md:px-12 lg:px-24 -mt-10 mb-8">
      <div className="max-w-4xl mx-auto">
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
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setMode("cognitive")}
                  className="text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cognitivo
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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

                <select value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} className={selectClass}>
                  <option value="">Preço mínimo</option>
                  {priceOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <select value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} className={selectClass}>
                  <option value="">Até</option>
                  {priceOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={filterCondo}
                  onChange={(e) => setFilterCondo(e.target.value)}
                  placeholder="Condomínio"
                  className={`${selectClass} w-full`}
                />

                <select value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)} className={selectClass}>
                  <option value="">Suítes (mínimo)</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
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
