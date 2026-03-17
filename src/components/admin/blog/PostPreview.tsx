import { Calendar, Clock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { renderMarkdownContent } from "@/lib/markdown";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  authorName: string;
  readingTime: number;
};

const categoryLabels: Record<string, string> = {
  "inside-alphaville": "Inside Alphaville",
  "arquitetura-design": "Arquitetura & Design",
  "investimento": "Investimento",
  "guia-condominios": "Guia de Condomínios",
};

const PostPreview = ({ open, onOpenChange, title, subtitle, content, category, authorName, readingTime }: Props) => {
  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Pré-visualização do artigo</DialogTitle>
        </DialogHeader>

        {/* Hero */}
        <section className="relative h-[40vh] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--bordeaux))] to-foreground" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A070C]/90 via-[#2A070C]/40 to-transparent" />
          </div>
          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 md:px-12 pb-10">
            <span className="block text-body text-xs tracking-[0.3em] uppercase text-[hsl(var(--cashmere))]/50 mb-4">
              {categoryLabels[category] ?? category}
            </span>
            <h1 className="text-display text-3xl md:text-4xl font-light text-[hsl(var(--cashmere))] leading-[1.1] mb-3">
              {title || "Título do artigo..."}
            </h1>
            {subtitle && (
              <p className="text-body text-lg text-[hsl(var(--cashmere))]/60 mb-4">{subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-[hsl(var(--cashmere))]/40">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                <span className="text-body text-xs">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span className="text-body text-xs">{readingTime} min de leitura</span>
              </div>
              <span className="text-body text-xs">{authorName}</span>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className="max-w-3xl mx-auto px-6 md:px-12 py-12">
          {!content.trim() ? (
            <p className="text-body text-base text-muted-foreground italic">Comece a escrever para ver o preview...</p>
          ) : (
            renderMarkdownContent(content)
          )}
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default PostPreview;
