import { motion } from "framer-motion";
import { Search, Mic, Loader2 } from "lucide-react";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SearchResultsPanel from "./SearchResultsPanel";
import FilterChips, { type ParsedFilters } from "./search/FilterChips";
import VoiceWaves from "./search/VoiceWaves";
import { mockProperties, toSearchResult } from "@/data/mockProperties";

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

      const aiResults = data?.results || [];
      const aiFilters = data?.parsed_filters || null;
      setParsedFilters(aiFilters);

      if (aiResults.length > 0) {
        setResults(aiResults);
      } else {
        const lower = q.toLowerCase();
        const filtered = mockProperties
          .filter((p) =>
            [p.title, p.condominium, p.neighborhood, p.city, p.description, p.property_type]
              .filter(Boolean)
              .some((field) => field!.toLowerCase().includes(lower))
          )
          .map(toSearchResult);
        setResults(filtered);
      }
    } catch {
      const lower = q.toLowerCase();
      const filtered = mockProperties
        .filter((p) =>
          [p.title, p.condominium, p.neighborhood, p.city, p.description, p.property_type]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(lower))
        )
        .map(toSearchResult);
      setResults(filtered);
      toast.info("Exibindo resultados de demonstração.");
    } finally {
      setSearching(false);
    }
  }, [query]);

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

  return (
    <section className="relative z-20 px-6 md:px-12 lg:px-24 -mt-10 mb-8">
      <div className="max-w-4xl mx-auto" ref={panelRef}>
        <motion.div
          className="bg-background rounded-lg shadow-xl p-4 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-display text-lg md:text-xl font-light text-foreground">
              Encontre seu imóvel com o <strong>Rafa IA</strong>
            </h3>
            <div className="hidden md:flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setMode("cognitive")}
                className={`text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all ${mode === "cognitive" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Cognitivo
              </button>
              <button
                onClick={() => setMode("traditional")}
                className={`text-body text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full transition-all ${mode === "traditional" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Busca tradicional
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 border border-border rounded-md px-4 py-3">
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
              placeholder="Descreva o imóvel dos seus sonhos..."
              className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            />
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-body text-xs tracking-[0.1em] uppercase hover-magnetic disabled:opacity-70 flex items-center gap-2 rounded-md"
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
        </motion.div>
      </div>
    </section>
  );
};

export default SearchBarSection;
