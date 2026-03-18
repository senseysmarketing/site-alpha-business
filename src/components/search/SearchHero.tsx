import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mic, Loader2 } from "lucide-react";
import gsap from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

const LIFESTYLE_PILLS = [
  { label: "Gourmet Assinado", query: "casa com espaço gourmet assinado por arquiteto" },
  { label: "Automação", query: "casa com automação residencial completa" },
  { label: "VGV Exclusivo", query: "mansão acima de 5 milhões exclusiva" },
];

const SearchHero = ({ initialQuery, onResults, onLoading }: SearchHeroProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [searching, setSearching] = useState(false);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // GSAP zoom-out on load
  useEffect(() => {
    if (heroImageRef.current) {
      gsap.fromTo(
        heroImageRef.current,
        { scale: 1.15 },
        { scale: 1, duration: 2.5, ease: "power2.out" }
      );
    }
  }, []);

  // Auto-search on mount if query exists
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

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-search", {
        body: { query: q },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      onResults(data?.results || []);
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error("Erro ao buscar imóveis. Tente novamente.");
    } finally {
      setSearching(false);
      onLoading(false);
    }
  }, [query, onResults, onLoading]);

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
    <section className="relative h-[40vh] min-h-[320px] flex items-center justify-center overflow-hidden">
      {/* Background image with GSAP zoom-out */}
      <div ref={heroImageRef} className="absolute inset-0 will-change-transform">
        <img
          src="/videos/hero-bg.mp4"
          alt=""
          className="hidden"
        />
        <video
          src="/videos/hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-background" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 md:px-6">
        <motion.h1
          className="text-display text-2xl md:text-3xl font-light text-primary-foreground text-center mb-6 tracking-wide"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Alpha Concierge
        </motion.h1>

        {/* Search bar */}
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
                <Mic size={18} />
                {listening && (
                  <motion.div
                    className="absolute inset-0 rounded-sm border-2 border-accent"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
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
            {/* Mobile button */}
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="w-full md:hidden bg-primary text-primary-foreground py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic mt-1.5 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {searching && <Loader2 size={14} className="animate-spin" />}
              {searching ? "Buscando..." : "Buscar"}
            </button>
            {/* Desktop button */}
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="hidden md:flex bg-primary text-primary-foreground px-6 py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic absolute right-1.5 top-1.5 bottom-1.5 items-center gap-2 disabled:opacity-70"
            >
              {searching && <Loader2 size={14} className="animate-spin" />}
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </motion.div>

        {/* Lifestyle pills */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-4 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {LIFESTYLE_PILLS.map((pill, i) => (
            <button
              key={pill.label}
              onClick={() => handlePillClick(pill.query)}
              className="text-body text-[10px] md:text-xs tracking-[0.12em] uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-300 px-3 py-1.5 rounded-full border border-primary-foreground/20 hover:border-primary-foreground/50 backdrop-blur-sm"
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
