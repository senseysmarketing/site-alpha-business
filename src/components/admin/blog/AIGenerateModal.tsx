import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface GeneratedArticle {
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
}

interface AIGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (article: GeneratedArticle) => void;
}

const AIGenerateModal = ({ open, onOpenChange, onGenerated }: AIGenerateModalProps) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Digite um tema ou referência", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("blog-ai-assist", {
        body: { action: "generate-full-article", content: prompt.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const article = data?.result as GeneratedArticle;
      if (!article?.title || !article?.content) {
        throw new Error("Resposta incompleta da IA");
      }

      onGenerated(article);
      onOpenChange(false);
      setPrompt("");
      toast({ title: "Artigo gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar artigo", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-[Inter]">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Artigo com IA
          </DialogTitle>
          <DialogDescription className="font-[Inter] text-sm">
            Descreva o tema, cole um texto de referência ou dê instruções. A IA gerará título, subtítulo, conteúdo e descrição SEO.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Escreva sobre as vantagens de morar em Alphaville Tamboré, focando em segurança, qualidade de vida e valorização imobiliária..."
          className="min-h-[160px] font-[Inter] text-sm resize-none"
          disabled={loading}
        />

        <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full font-[Inter] gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando artigo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Artigo
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AIGenerateModal;
