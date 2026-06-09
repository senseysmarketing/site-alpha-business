import { MessageCircle, Sparkles } from "lucide-react";
import rafaAvatar from "@/assets/rafa-avatar.png";

interface Props {
  onClick: () => void;
  variant?: "hero" | "compact";
}

const AiSearchChatButton = ({ onClick, variant = "hero" }: Props) => {
  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 border border-border rounded-md px-3 py-2.5 hover:border-foreground/30 transition-colors text-left bg-background"
      >
        <img src={rafaAvatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover bg-muted" />
        <span className="flex-1 text-body text-sm text-muted-foreground">
          Conversar com <strong className="text-foreground font-medium">Rafa IA</strong>...
        </span>
        <span className="bg-primary text-primary-foreground p-2 rounded-md flex-shrink-0">
          <MessageCircle size={14} />
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-4 border border-border rounded-lg p-4 hover:border-foreground/30 hover:shadow-md transition-all text-left bg-background"
    >
      <img src={rafaAvatar} alt="Rafa IA" width={56} height={56} className="w-14 h-14 rounded-full object-cover bg-muted flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-display text-base md:text-lg text-foreground font-light leading-tight">
          Converse com o <strong className="font-medium">Rafa IA</strong>
        </p>
        <p className="text-body text-xs md:text-sm text-muted-foreground mt-0.5">
          Seu consultor digital — encontra o imóvel ideal por conversa
        </p>
      </div>
      <span className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-body text-xs tracking-[0.1em] uppercase group-hover:opacity-90">
        <Sparkles size={14} />
        Iniciar
      </span>
      <span className="sm:hidden bg-primary text-primary-foreground p-2.5 rounded-md">
        <Sparkles size={14} />
      </span>
    </button>
  );
};

export default AiSearchChatButton;
