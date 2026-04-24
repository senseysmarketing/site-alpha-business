import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mic, Loader2 } from "lucide-react";
import gsap from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mockProperties, toSearchResult } from "@/data/mockProperties";

const mockByCode: Record<string, string> = {};
mockProperties.forEach((p) => {
  if (p.photo) mockByCode[p.code] = p.photo;
});

const enrichPhoto = (r: SearchResult): SearchResult => ({
  ...r,
  photo: r.photo || mockByCode[r.code] || "/images/property-1.jpg",
});
import FilterChips, { type ParsedFilters } from "@/components/search/FilterChips";
import VoiceWaves from "@/components/search/VoiceWaves";

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

const SearchHero = ({ initialQuery, onResults, onLoading, onParsedFilters }: SearchHeroProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [searching, setSearching] = useState(false);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const handleSearch = useCallback(async (searchQuery?: string) => {
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
  }, [query, onResults, onLoading, onParsedFilters]);

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
    setQuery(pillQuery);
    handleSearch(pillQuery);
  };

  return (
    <section className="relative bg-background pt-28 md:pt-32 pb-10 md:pb-12 flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 md:px-6">
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
        >
          <div className="glass-panel rounded-sm p-1.5 relative">
            <div className="flex items-center gap-2 md:gap-3 md:pr-24">
              <button
                onClick={handleVoice}
                className={`p-3 rounded-sm transition-all duration-300 flex-shrink-0 relative ml-2 md:ml-4 ${
                  listening
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
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
                className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none py-3 min-w-0"
              />
            </div>
            {listening && (
              <p className="text-body text-xs text-muted-foreground text-center py-1">Ouvindo...</p>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="w-full md:hidden bg-primary text-primary-foreground py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic mt-1.5 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {searching && <Loader2 size={14} className="animate-spin" />}
              {searching ? "Buscando..." : "Buscar"}
            </button>
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="hidden md:flex bg-primary text-primary-foreground px-6 py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic absolute right-1.5 top-1.5 bottom-1.5 items-center gap-2 disabled:opacity-70"
            >
              {searching && <Loader2 size={14} className="animate-spin" />}
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {/* Filter chips below search */}
          {parsedFilters && !searching && (
            <div className="mt-3">
              <FilterChips filters={parsedFilters} />
            </div>
          )}
        </motion.div>

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
      </div>
    </section>
  );
};

export default SearchHero;
