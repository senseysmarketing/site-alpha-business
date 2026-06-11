import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, MessageCircle } from "lucide-react";
import type { ConversationLink } from "./types";

interface Props {
  links: ConversationLink[];
  onNavigate?: () => void;
}

const AiChatLinks = ({ links, onNavigate }: Props) => {
  if (!links?.length) return null;
  return (
    <div className="pl-12 space-y-1.5">
      {links.map((l, i) => {
        const isWhatsApp = l.type === "whatsapp";
        const isExternal = isWhatsApp || l.url.startsWith("http");
        const content = isWhatsApp ? (
          <span className="inline-flex items-center gap-2 text-body text-xs text-background hover:opacity-90 transition-opacity py-2 px-4 rounded-full bg-bordeaux">
            <MessageCircle size={14} strokeWidth={2} />
            {l.label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-body text-xs text-foreground hover:text-foreground/80 transition-colors py-1.5 px-3 rounded-md bg-muted/60 hover:bg-muted">
            {l.label}
            {isExternal ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
          </span>
        );
        return isExternal ? (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="block">
            {content}
          </a>
        ) : (
          <Link key={i} to={l.url} onClick={onNavigate} className="block">
            {content}
          </Link>
        );
      })}
    </div>
  );
};

export default AiChatLinks;
