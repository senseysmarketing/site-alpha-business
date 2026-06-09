import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Send, RotateCcw, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rafaAvatar from "@/assets/rafa-avatar.png";
import AiChatMessage from "./AiChatMessage";
import AiChatOptionChips from "./AiChatOptionChips";
import AiChatFiltersSummary from "./AiChatFiltersSummary";
import AiChatResultsPreview from "./AiChatResultsPreview";
import AiChatLinks from "./AiChatLinks";
import AiChatBreakdown from "./AiChatBreakdown";
import { useAiSearchChat } from "./useAiSearchChat";
import { filtersToSearchParams, type OptionChip, type PropertySearchFilters } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AiSearchChatModal = ({ open, onOpenChange }: Props) => {
  const { messages, filters, loading, send, reset, setFilters } = useAiSearchChat();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput("");
    void send(value);
    inputRef.current?.focus();
  };

  const handleOption = (opt: OptionChip) => {
    if (opt.kind === "navigate") {
      const url = opt.url ?? (() => {
        const qs = filtersToSearchParams(filters);
        return `/busca${qs ? `?${qs}` : ""}`;
      })();
      navigate(url);
      onOpenChange(false);
      return;
    }
    if (opt.kind === "reset") {
      reset();
      return;
    }
    void send({ message: opt.label, selectedOption: opt });
  };

  const handleRemoveFilter = (key: keyof PropertySearchFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === "highlights") next.highlights = [];
      else (next as any)[key] = null;
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-2xl w-[calc(100vw-2rem)] p-0 gap-0 overflow-hidden h-[min(85vh,720px)] flex flex-col bg-background border-border rounded-2xl">
        <DialogTitle className="sr-only">Conversar com Rafa IA</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={rafaAvatar}
                alt="Rafa IA"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover bg-muted"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <p className="text-display text-sm text-foreground font-medium leading-tight">Rafa IA</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Consultor digital</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Recomeçar"
              title="Recomeçar"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background">
          {messages.map((m) => (
            <div key={m.id} className="space-y-2">
              <AiChatMessage message={m} />
              {m.role === "assistant" && m.options && m.options.length > 0 && (
                <AiChatOptionChips options={m.options} onSelect={handleOption} />
              )}
              {m.role === "assistant" && m.preview && m.preview.length > 0 && (
                <AiChatResultsPreview
                  results={m.preview}
                  onNavigate={() => onOpenChange(false)}
                />
              )}
              {m.role === "assistant" && m.breakdown && m.breakdown.length > 0 && (
                <AiChatBreakdown items={m.breakdown} onNavigate={() => onOpenChange(false)} />
              )}
              {m.role === "assistant" && m.links && m.links.length > 0 && (
                <AiChatLinks links={m.links} onNavigate={() => onOpenChange(false)} />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 pl-12 text-muted-foreground text-xs">
              <Loader2 size={14} className="animate-spin" />
              <span className="italic">Rafa está pensando...</span>
            </div>
          )}
        </div>

        {/* Filters summary + Composer */}
        <form onSubmit={handleSubmit} className="px-5 pb-4 pt-2 border-t border-border bg-background">
          <AiChatFiltersSummary filters={filters} onRemove={handleRemoveFilter} />
          <div className="flex items-end gap-2 mt-2 border border-border rounded-2xl px-3 py-2 bg-background focus-within:border-foreground/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Descreva o imóvel ideal ou responda..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-body text-sm text-foreground placeholder:text-muted-foreground max-h-32 py-1.5"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AiSearchChatModal;
