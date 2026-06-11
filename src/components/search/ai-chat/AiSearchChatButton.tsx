import { MessageCircle, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import rafaAvatar from "@/assets/rafa-avatar.png";

interface Props {
  onClick: () => void;
  variant?: "hero" | "compact" | "pill";
  extraAction?: ReactNode;
}

const AiSearchChatButton = ({ onClick, variant = "hero", extraAction }: Props) => {
  if (variant === "pill") {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-1 pr-4 py-1 text-body text-xs tracking-[0.1em] uppercase hover:opacity-90 transition-opacity"
      >
        <img src={rafaAvatar} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover bg-muted" />
        <Sparkles size={12} />
        Rafa IA
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <div className="w-full flex items-center gap-3 border border-border rounded-md px-3 py-2.5 hover:border-foreground/30 transition-colors text-left bg-background">
        <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <img src={rafaAvatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover bg-muted" />
          <span className="flex-1 text-body text-sm text-muted-foreground truncate">
            Conversar com <strong className="text-foreground font-medium">Rafa IA</strong>...
          </span>
        </button>
        {extraAction}
        <button onClick={onClick} className="bg-primary text-primary-foreground p-2 rounded-md flex-shrink-0">
          <MessageCircle size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group w-full flex items-center gap-2 sm:gap-4 border border-border rounded-lg p-3 sm:p-4 hover:border-foreground/30 hover:shadow-md transition-all text-left bg-background">
      <button onClick={onClick} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left">
        <img src={rafaAvatar} alt="Rafa IA" width={56} height={56} className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover bg-muted flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-display text-sm sm:text-lg text-foreground font-light leading-tight">
            Converse com o <strong className="font-medium">Rafa IA</strong>
          </p>
          <p className="text-body text-[11px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">
            Seu consultor digital — encontra o imóvel ideal por conversa
          </p>
        </div>
      </button>
      {extraAction}
      <button
        onClick={onClick}
        className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-body text-xs tracking-[0.1em] uppercase hover:opacity-90 flex-shrink-0"
      >
        <Sparkles size={14} />
        Iniciar
      </button>
      <button
        onClick={onClick}
        className="sm:hidden bg-primary text-primary-foreground p-2.5 rounded-md flex-shrink-0"
      >
        <Sparkles size={14} />
      </button>
    </div>
  );
};

export default AiSearchChatButton;
