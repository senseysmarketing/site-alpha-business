import { motion } from "framer-motion";
import { Search, Mic } from "lucide-react";
import { useState } from "react";

const categories = [
  { key: "all", label: "Todos" },
  { key: "inside-alphaville", label: "Inside Alphaville" },
  { key: "arquitetura-design", label: "Arquitetura & Design" },
  { key: "investimento", label: "Investimento" },
  { key: "guia-condominios", label: "Guia de Condomínios" },
];

interface BlogFiltersProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const BlogFilters = ({ activeCategory, onCategoryChange, searchQuery, onSearchChange }: BlogFiltersProps) => {
  const [listening, setListening] = useState(false);

  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.onresult = (e: any) => {
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
      <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`text-body text-xs tracking-[0.15em] uppercase whitespace-nowrap pb-2 border-b-2 transition-colors duration-300 ${
              activeCategory === cat.key
                ? "border-bordeaux text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
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