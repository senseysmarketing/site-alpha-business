import { motion } from "framer-motion";
import { Search, Mic, Loader2 } from "lucide-react";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SearchResultsPanel from "./SearchResultsPanel";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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

interface HeroSettings {
  video_url: string;
  fallback_image: string;
  title: string;
  subtitle: string;
}

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const recognitionRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: heroSettings } = useSiteSettings<HeroSettings>("hero");

  const desktopVideo = heroSettings?.video_url || "/videos/hero-bg.mp4";
  const fallbackImage = heroSettings?.fallback_image || "";
  const heroTitle = heroSettings?.title || "";
  const heroSubtitle = heroSettings?.subtitle || "";

  // Close results on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
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

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-search", {
        body: { query: q },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResults(data?.results || []);
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error("Erro ao buscar imóveis. Tente novamente.");
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

  return (
    <section className="relative h-screen flex items-end pb-24 md:items-center md:pb-0 justify-center overflow-hidden">
      {/* Background videos */}
      <div className="absolute inset-0">
        <video
          src={desktopVideo}
          autoPlay
          muted
          loop
          playsInline
          poster={fallbackImage || undefined}
          className="hidden md:block w-full h-full object-cover object-center"
        />
        <video
          src="/videos/hero-bg-mobile.mp4"
          autoPlay
          muted
          loop
          playsInline
          poster={fallbackImage || undefined}
          className="md:hidden w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background md:hidden" />
        <div className="hidden md:block absolute inset-x-0 top-[85%] bottom-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center w-full max-w-3xl mx-auto px-4 md:px-6">
        {/* Dynamic title/subtitle from settings */}
        {(heroTitle || heroSubtitle) && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {heroTitle && (
              <h1 className="text-display text-4xl md:text-6xl lg:text-7xl font-light text-primary-foreground mb-3 leading-tight">
                {heroTitle}
              </h1>
            )}
            {heroSubtitle && (
              <p className="text-body text-sm md:text-base text-primary-foreground/70">
                {heroSubtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* AI Search bar */}
        <motion.div
          ref={panelRef}
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="glass-panel rounded-sm p-1.5 max-w-xl mx-auto relative">
            <div className="flex items-center gap-2 md:gap-3 md:pr-20">
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
                placeholder="Busque por nome, código ou região..."
                className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none py-3 min-w-0"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="w-full md:hidden bg-primary text-primary-foreground py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic mt-1.5 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : null}
              {searching ? "Buscando..." : "Buscar"}
            </button>
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="hidden md:flex bg-primary text-primary-foreground px-6 py-3 text-body text-xs tracking-[0.1em] uppercase hover-magnetic absolute right-1.5 top-1.5 bottom-1.5 items-center gap-2 disabled:opacity-70"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : null}
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          <SearchResultsPanel
            results={results}
            loading={searching}
            visible={showResults}
            onClose={() => setShowResults(false)}
            query={query}
          />
        </motion.div>

        {/* Quick links */}
        <motion.div
          className="flex items-center justify-center gap-2 md:gap-4 mt-4 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          {["Casas em Condomínio", "Mansões Exclusive", "Lançamentos"].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span className="text-cashmere/40 text-xs hidden md:inline">·</span>}
              <a
                href="#"
                className="text-body text-[10px] md:text-xs tracking-[0.12em] uppercase text-cashmere/70 hover:text-cashmere transition-colors duration-300"
              >
                {label}
              </a>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <motion.div
          className="w-px h-12 bg-cashmere/40"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
