import { motion } from "framer-motion";
import { Search, Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBlogCategories } from "@/hooks/useBlogCategories";

interface BlogFiltersProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const BlogFilters = ({ activeCategory, onCategoryChange, searchQuery, onSearchChange }: BlogFiltersProps) => {
  const [listening, setListening] = useState(false);
  const { categories } = useBlogCategories();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [categories.length]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const allChips = [{ key: "all", label: "Todos" }, ...categories.map((c) => ({ key: c.slug, label: c.label }))];

  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.onresult = (e: { results: { 0: { 0: { transcript: string } } } }) => {
      onSearchChange(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-10">
      <div className="relative mb-6">
        {canScrollLeft && (
          <>
            <button
              onClick={() => scrollBy(-240)}
              aria-label="Anterior"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="absolute left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-[hsl(30_33%_97%)] to-transparent z-[5] pointer-events-none" />
          </>
        )}
        {canScrollRight && (
          <>
            <div className="absolute right-8 top-0 bottom-0 w-8 bg-gradient-to-l from-[hsl(30_33%_97%)] to-transparent z-[5] pointer-events-none" />
            <button
              onClick={() => scrollBy(240)}
              aria-label="Próximo"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {allChips.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`text-body text-xs tracking-[0.15em] uppercase whitespace-nowrap pb-2 border-b-2 transition-colors duration-300 flex-shrink-0 ${
                activeCategory === cat.key
                  ? "border-bordeaux text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-sm p-1.5 max-w-lg relative">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground ml-3 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar artigos..."
            className="flex-1 bg-transparent text-body text-sm text-foreground placeholder:text-muted-foreground outline-none py-2.5 min-w-0"
          />
          <button
            onClick={handleVoice}
            className={`p-2.5 rounded-sm transition-all duration-300 flex-shrink-0 relative ${
              listening ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Mic size={16} />
            {listening && (
              <motion.div
                className="absolute inset-0 rounded-sm border-2 border-accent"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogFilters;
