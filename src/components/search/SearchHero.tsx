import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mic, Loader2 } from "lucide-react";
import gsap from "gsap";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mockProperties } from "@/data/mockProperties";
import FilterChips, { type ParsedFilters } from "@/components/search/FilterChips";
import VoiceWaves from "@/components/search/VoiceWaves";

const mockByCode: Record<string, string> = {};
mockProperties.forEach((p) => {
  if (p.photo) mockByCode[p.code] = p.photo;
});

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

const enrichPhoto = (r: SearchResult): SearchResult => ({
  ...r,
  photo: r.photo || mockByCode[r.code] || "/images/property-1.jpg",
});

interface SearchHeroProps {
  initialQuery: string;
  onResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
  onParsedFilters?: (filters: ParsedFilters | null) => void;
}

const LIFESTYLE_PILLS = [
  { label: "Gourmet Assinado", query: "casa com espaço gourmet assinado por arquiteto" },
  { label: "Automação", query: "casa com automação residencial completa" },
  { label: "VGV Exclusivo", query: "mansão acima de 5 milhões exclusiva" },
];

const priceOptions = [
  { value: "500000", label: "R$ 500 mil" },
  { value: "1000000", label: "R$ 1 milhão" },
  { value: "2000000", label: "R$ 2 milhões" },
  { value: "3000000", label: "R$ 3 milhões" },
  { value: "5000000", label: "R$ 5 milhões" },
  { value: "8000000", label: "R$ 8 milhões" },
  { value: "10000000", label: "R$ 10 milhões" },
  { value: "15000000", label: "R$ 15 milhões" },
];

const selectClass =
  "bg-background border border-border rounded-md px-3 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer";

const SearchHero = ({ initialQuery, onResults, onLoading, onParsedFilters }: SearchHeroProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [searching, setSearching] = useState(false);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [mode, setMode] = useState<"cognitive" | "traditional">("cognitive");
  const heroImageRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Traditional filters state — initialized from URL
  const [filterType, setFilterType] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterCondo, setFilterCondo] = useState(() => searchParams.get("condominium") || "");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterTransaction, setFilterTransaction] = useState(
    () => searchParams.get("transactionType") || ""
  );

  useEffect(() => {
    if (heroImageRef.current) {
      gsap.fromTo(
        heroImageRef.current,
        { scale: 1.15 },
        { scale: 1, duration: 2.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery || query).trim();
      if (!q || q.length < 2) return;

      setSearching(true);
      onLoading(true);
      setParsedFilters(null);
      onParsedFilters?.(null);

      try {
        const { data, error } = await supabase.functions.invoke("ai-property-search", {
          body: { query: q },
        });
        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          onResults([]);
          return;
        }
        const results = data?.results || [];
        const filters = data?.parsed_filters || null;
        setParsedFilters(filters);
        onParsedFilters?.(filters);
        onResults(results.map(enrichPhoto));
      } catch (err: any) {
        console.error("Search error:", err);
        toast.error("Não foi possível realizar a busca. Tente novamente.");
        onResults([]);
      } finally {
        setSearching(false);
        onLoading(false);
      }
    },
    [query, onResults, onLoading, onParsedFilters]
  );

  const handleTraditionalSearch = useCallback(() => {
    const next = new URLSearchParams();
    const queryParts: string[] = [];
    if (filterType) queryParts.push(filterType);
    if (filterBedrooms) queryParts.push(`${filterBedrooms} quartos`);
    if (filterCondo) {
      next.set("condominium", filterCondo);
      queryParts.push(filterCondo);
    }
    if (filterTransaction) next.set("transactionType", filterTransaction);
    if (filterMinPrice) queryParts.push(`acima de ${filterMinPrice}`);
    if (filterMaxPrice) queryParts.push(`até ${filterMaxPrice}`);
    if (queryParts.length) next.set("q", queryParts.join(" "));
    setSearchParams(next);
    if (queryParts.length) {
      handleSearch(queryParts.join(" "));
    } else {
      // Sem termos: limpa results para acionar o fallback de "lista completa" do SearchResults
      onResults([]);
      onLoading(false);
    }
  }, [
    filterType,
    filterMinPrice,
    filterMaxPrice,
    filterCondo,
    filterBedrooms,
    filterTransaction,
    setSearchParams,
    handleSearch,
    onResults,
    onLoading,
  ]);

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

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        if (e.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
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
      console.error("Speech error:", e.error);
      setListening(false);
      recognitionRef.current = null;
      if (e.error !== "no-speech") {
        toast.error("Erro no reconhecimento de voz.");
      }
    };

    setListening(true);
    recognition.start();
  }, [listening, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handlePillClick = (pillQuery: string) => {
    setMode("cognitive");
    setQuery(pillQuery);
    handleSearch(pillQuery);
  };

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
          {/* Mode toggle */}
          <div className="flex items-center justify-center md:justify-end mb-4">
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setMode("cognitive")}
                className={`text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all ${
                  mode === "cognitive"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Cognitivo
              </button>
              <button
                onClick={() => setMode("traditional")}
                className={`text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all ${
                  mode === "traditional"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Busca tradicional
              </button>
            </div>
          </div>

          {mode === "cognitive" ? (
            <>
              <div className="flex items-center gap-2 md:gap-3 border border-border rounded-md px-3 md:px-4 py-2 md:py-2.5">
                <button
                  onClick={handleVoice}
                  className={`p-2 rounded-full transition-all flex-shrink-0 ${
                    listening
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  aria-label="Buscar por voz"
                >
                  {listening ? <VoiceWaves /> : <Mic size={18} />}
                </button>
                <Search size={18} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Descreva o imóvel dos seus sonhos..."
                  className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 min-w-0"
                />
                <button
                  onClick={() => handleSearch()}
                  disabled={searching}
                  className="bg-primary text-primary-foreground px-4 md:px-6 py-2.5 text-body text-xs tracking-[0.1em] uppercase hover-magnetic disabled:opacity-70 flex items-center gap-2 rounded-md"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  <span className="hidden sm:inline">{searching ? "Buscando..." : "Buscar"}</span>
                </button>
              </div>

              {listening && (
                <p className="text-body text-xs text-muted-foreground text-center mt-2">
                  Ouvindo...
                </p>
              )}

              {parsedFilters && !searching && (
                <div className="mt-3">
                  <FilterChips filters={parsedFilters} />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Nº Quartos</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>

                <select
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Preço mínimo</option>
                  {priceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Até</option>
                  {priceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={filterCondo}
                  onChange={(e) => setFilterCondo(e.target.value)}
                  placeholder="Condomínio"
                  className={`${selectClass} w-full`}
                />
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

        {mode === "cognitive" && (
          <motion.div
            className="flex items-center justify-center gap-2 mt-4 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {LIFESTYLE_PILLS.map((pill) => (
              <button
                key={pill.label}
                onClick={() => handlePillClick(pill.query)}
                className="text-body text-[10px] md:text-xs tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 px-3 py-1.5 rounded-full border border-border hover:border-muted-foreground/40 bg-muted/40 hover:bg-muted"
              >
                {pill.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default SearchHero;
