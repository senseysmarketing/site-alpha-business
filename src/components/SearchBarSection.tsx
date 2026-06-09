import { motion } from "framer-motion";
import { Search } from "lucide-react";
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePriceBounds, buildPriceOptions } from "@/hooks/usePriceBounds";
import AiSearchChatButton from "./search/ai-chat/AiSearchChatButton";
import AiSearchChatModal from "./search/ai-chat/AiSearchChatModal";

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


const SearchBarSection = () => {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [mode, setMode] = useState<"cognitive" | "traditional">("cognitive");
  const recognitionRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowResults(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q || q.length < 2) return;

    setSearching(true);
    setShowResults(true);
    setResults([]);
    setParsedFilters(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-search", {
        body: { query: q },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setResults(data?.results || []);
      setParsedFilters(data?.parsed_filters || null);
    } catch {
      toast.error("Não foi possível realizar a busca. Tente novamente.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleTraditionalSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (filterTransaction) params.set("transactionType", filterTransaction);
    if (filterType) params.set("propertyType", filterType);
    if (filterBedrooms) {
      params.set("minBedrooms", filterBedrooms);
    }
    if (filterCondo) {
      params.set("condominium", filterCondo);
    }
    if (filterMinPrice) params.set("minPrice", filterMinPrice);
    if (filterMaxPrice) params.set("maxPrice", filterMaxPrice);
    navigate(`/busca?${params.toString()}`);
  }, [filterTransaction, filterType, filterMinPrice, filterMaxPrice, filterCondo, filterBedrooms, navigate]);

  const handleVoice = useCallback(() => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      setQuery(finalTranscript + interim);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (finalTranscript.trim()) {
        setQuery(finalTranscript.trim());
        handleSearch(finalTranscript.trim());
      }
    };

    recognition.onerror = (e: any) => {
      setListening(false);
      recognitionRef.current = null;
      if (e.error !== "no-speech") toast.error("Erro no reconhecimento de voz.");
    };

    setListening(true);
    recognition.start();
  }, [listening, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
  };

  const selectClass = "bg-background border border-border rounded-md px-3 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer";

  return (
    <section className="relative z-20 px-6 md:px-12 lg:px-24 -mt-10 mb-8">
      <div className="max-w-4xl mx-auto" ref={panelRef}>
        <motion.div
          className="bg-background rounded-lg shadow-xl p-4 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-display text-base md:text-xl font-light text-foreground whitespace-nowrap text-center sm:text-left">
              Encontre seu imóvel com o <strong>Rafa IA</strong>
            </h3>
            <div className="flex items-center gap-1 bg-muted rounded-full p-1 w-full sm:w-auto">
              <button
                onClick={() => setMode("cognitive")}
                className={`flex-1 sm:flex-none text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all ${mode === "cognitive" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Cognitivo
              </button>
              <button
                onClick={() => setMode("traditional")}
                className={`flex-1 sm:flex-none text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all ${mode === "traditional" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Tradicional
              </button>
            </div>
          </div>

          {mode === "cognitive" ? (
            <>
              <div className="flex items-center gap-2 md:gap-3 border border-border rounded-md px-3 md:px-4 py-2.5 md:py-3">
                <button
                  onClick={handleVoice}
                  className={`p-2 rounded-full transition-all flex-shrink-0 ${listening ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground"}`}
                >
                  {listening ? <VoiceWaves /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Descreva seu imóvel ideal..."
                  className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                />
                <button
                  onClick={() => handleSearch()}
                  disabled={searching}
                  className="bg-primary text-primary-foreground px-4 md:px-6 py-2.5 text-body text-xs tracking-[0.1em] uppercase hover-magnetic disabled:opacity-70 flex items-center gap-2 rounded-md"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {searching ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {listening && (
                <p className="text-body text-xs text-muted-foreground text-center mt-2">Ouvindo...</p>
              )}

              {parsedFilters && !searching && (
                <div className="mt-3">
                  <FilterChips filters={parsedFilters} />
                </div>
              )}

              <SearchResultsPanel
                results={results}
                loading={searching}
                visible={showResults}
                onClose={() => setShowResults(false)}
                query={query}
                parsedFilters={parsedFilters}
              />
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <select
                  value={filterTransaction}
                  onChange={(e) => setFilterTransaction(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Transação</option>
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Tipo</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                </select>

                <select
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Preço mínimo</option>
                  {priceOptions.filter(o => o.value).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <select
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Até</option>
                  {priceOptions.filter(o => o.value).map(o => (
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

                <select
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(e.target.value)}
                  className={selectClass}
                >
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
    </section>
  );
};

export default SearchBarSection;
