import { useState } from "react";
import { Sparkles, Type, FileText, Search, Wand2, Expand, Loader2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Props = {
  content: string;
  title: string;
  onApplyTitle: (title: string) => void;
  onApplyExcerpt: (excerpt: string) => void;
  onApplyContent: (content: string) => void;
};

type AIAction = "generate-titles" | "generate-excerpt" | "suggest-keywords" | "improve-content" | "expand-content";

const AICopilotSidebar = ({ content, title, onApplyTitle, onApplyExcerpt, onApplyContent }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [improvedContent, setImprovedContent] = useState("");
  const [expandedContent, setExpandedContent] = useState("");

  const callAI = async (action: AIAction, inputContent?: string) => {
    const text = inputContent || content || title;
    if (!text.trim()) {
      toast({ title: "Escreva algo primeiro", description: "O co-pilot precisa de conteúdo para trabalhar.", variant: "destructive" });
      return null;
    }

    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("blog-ai-assist", {
        body: { action, content: text },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro da IA", description: data.error, variant: "destructive" });
        return null;
      }
      return data.result as string;
    } catch (err: any) {
      toast({ title: "Erro ao chamar IA", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateTitles = async () => {
    const result = await callAI("generate-titles");
    if (result) {
      setTitles(result.split("\n").map((t: string) => t.trim()).filter(Boolean).slice(0, 3));
    }
  };

  const handleGenerateExcerpt = async () => {
    const result = await callAI("generate-excerpt");
    if (result) setExcerpt(result.slice(0, 160));
  };

  const handleSuggestKeywords = async () => {
    const result = await callAI("suggest-keywords");
    if (result) setKeywords(result.split(",").map((k: string) => k.trim()).filter(Boolean));
  };

  const handleImproveContent = async () => {
    const result = await callAI("improve-content");
    if (result) setImprovedContent(result);
  };

  const handleExpandContent = async () => {
    const result = await callAI("expand-content");
    if (result) setExpandedContent(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-[Inter] text-xs font-semibold text-foreground tracking-wide">AI CO-PILOT</h3>
      </div>

      {/* Generate Titles */}
      <section className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 font-[Inter] text-xs"
          onClick={handleGenerateTitles}
          disabled={loading === "generate-titles"}
        >
          {loading === "generate-titles" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Type className="h-3.5 w-3.5" />}
          Gerar Títulos com IA
        </Button>
        {titles.length > 0 && (
          <div className="space-y-1.5">
            {titles.map((t, i) => (
              <button
                key={i}
                onClick={() => { onApplyTitle(t); toast({ title: "Título aplicado!" }); }}
                className="w-full text-left px-3 py-2 rounded-md bg-accent/50 hover:bg-accent text-xs font-[Inter] text-foreground transition-colors leading-snug"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Generate Excerpt */}
      <section className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 font-[Inter] text-xs"
          onClick={handleGenerateExcerpt}
          disabled={loading === "generate-excerpt"}
        >
          {loading === "generate-excerpt" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          Gerar Descrição SEO
        </Button>
        {excerpt && (
          <div className="relative">
            <p className="px-3 py-2 rounded-md bg-accent/50 text-xs font-[Inter] text-foreground leading-relaxed">{excerpt}</p>
            <div className="flex gap-1 mt-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 font-[Inter]" onClick={() => { onApplyExcerpt(excerpt); toast({ title: "Descrição aplicada!" }); }}>
                <Check className="h-3 w-3" /> Aplicar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 font-[Inter]" onClick={() => copyToClipboard(excerpt)}>
                <Copy className="h-3 w-3" /> Copiar
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Suggest Keywords */}
      <section className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 font-[Inter] text-xs"
          onClick={handleSuggestKeywords}
          disabled={loading === "suggest-keywords"}
        >
          {loading === "suggest-keywords" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Sugerir Keywords SEO
        </Button>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k, i) => (
              <button
                key={i}
                onClick={() => copyToClipboard(k)}
                className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-[Inter] font-medium hover:bg-primary/20 transition-colors"
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Improve Content */}
      <section className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 font-[Inter] text-xs"
          onClick={handleImproveContent}
          disabled={loading === "improve-content"}
        >
          {loading === "improve-content" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          Melhorar Texto
        </Button>
        {improvedContent && (
          <div>
            <div className="px-3 py-2 rounded-md bg-accent/50 text-xs font-[Inter] text-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {improvedContent.slice(0, 500)}{improvedContent.length > 500 ? "..." : ""}
            </div>
            <div className="flex gap-1 mt-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 font-[Inter]" onClick={() => { onApplyContent(improvedContent); toast({ title: "Conteúdo substituído!" }); }}>
                <Check className="h-3 w-3" /> Aplicar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 font-[Inter]" onClick={() => copyToClipboard(improvedContent)}>
                <Copy className="h-3 w-3" /> Copiar
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Expand Content */}
      <section className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 font-[Inter] text-xs"
          onClick={handleExpandContent}
          disabled={loading === "expand-content"}
        >
          {loading === "expand-content" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Expand className="h-3.5 w-3.5" />}
          Expandir Rascunho
        </Button>
        {expandedContent && (
          <div>
            <div className="px-3 py-2 rounded-md bg-accent/50 text-xs font-[Inter] text-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {expandedContent.slice(0, 500)}{expandedContent.length > 500 ? "..." : ""}
            </div>
            <div className="flex gap-1 mt-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 font-[Inter]" onClick={() => { onApplyContent(expandedContent); toast({ title: "Conteúdo expandido aplicado!" }); }}>
                <Check className="h-3 w-3" /> Aplicar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 font-[Inter]" onClick={() => copyToClipboard(expandedContent)}>
                <Copy className="h-3 w-3" /> Copiar
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AICopilotSidebar;
