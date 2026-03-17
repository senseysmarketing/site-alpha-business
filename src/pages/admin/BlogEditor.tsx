import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, Save, CalendarIcon, Send, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditorToolbar from "@/components/admin/blog/EditorToolbar";
import MediaSidebar from "@/components/admin/blog/MediaSidebar";
import AICopilotSidebar from "@/components/admin/blog/AICopilotSidebar";
import PostPreview from "@/components/admin/blog/PostPreview";
import AIGenerateModal from "@/components/admin/blog/AIGenerateModal";
import type { Database } from "@/integrations/supabase/types";

type BlogCategory = Database["public"]["Enums"]["blog_category"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<BlogCategory>("inside-alphaville");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("media");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const { data: existingPost } = useQuery({
    queryKey: ["blog-post-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSubtitle(existingPost.subtitle ?? "");
      setContent(existingPost.content);
      setSlug(existingPost.slug);
      setExcerpt(existingPost.excerpt ?? "");
      setCategory(existingPost.category);
      setCoverImage(existingPost.cover_image);
      setIsFeatured(existingPost.is_featured);
      setIsExclusive(existingPost.is_exclusive);
      setSlugManual(true);
    }
  }, [existingPost]);

  useEffect(() => {
    if (!slugManual && title) setSlug(slugify(title));
  }, [title, slugManual]);

  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));

  const handleInsertMarkdown = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = content.substring(selectionStart, selectionEnd);
    const newContent = content.substring(0, selectionStart) + before + selected + after + content.substring(selectionEnd);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + before.length, selectionEnd + before.length);
    }, 0);
  }, [content]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.max(400, textarea.scrollHeight) + "px";
    }
  }, [content]);

  const saveMutation = useMutation({
    mutationFn: async (publishedAt: string | null) => {
      const postData = {
        title, subtitle: subtitle || null, content, slug,
        excerpt: excerpt || null, category, cover_image: coverImage,
        is_featured: isFeatured, is_exclusive: isExclusive,
        reading_time_min: readingTime,
        published_at: publishedAt ?? new Date(2099, 0, 1).toISOString(),
        author_name: "Alpha Business",
      };
      if (isEditing) {
        const { error } = await supabase.from("blog_posts").update(postData).eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(postData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Artigo salvo com sucesso!" });
      navigate("/admin/blog");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveDraft = () => saveMutation.mutate(null);
  const handlePublish = () => saveMutation.mutate(new Date().toISOString());
  const handleSchedule = () => { if (scheduleDate) saveMutation.mutate(scheduleDate.toISOString()); };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-white">
          <button onClick={() => navigate("/admin/blog")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-[Inter] text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSidebarTab("ai")} className="font-[Inter] text-xs gap-1.5 text-primary">
              <Sparkles className="h-4 w-4" /> AI Assist
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} className="font-[Inter] text-xs gap-1.5">
              <Eye className="h-4 w-4" /> Pré-visualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saveMutation.isPending} className="font-[Inter] text-xs gap-1.5">
              <Save className="h-4 w-4" /> Rascunho
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="font-[Inter] text-xs gap-1.5">
                  <CalendarIcon className="h-4 w-4" /> Agendar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} disabled={(date) => date < new Date()} className={cn("p-3 pointer-events-auto")} />
                {scheduleDate && (
                  <div className="px-3 pb-3">
                    <Button size="sm" className="w-full font-[Inter] text-xs" onClick={handleSchedule} disabled={saveMutation.isPending}>
                      Agendar para {format(scheduleDate, "dd/MM/yyyy")}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button size="sm" onClick={handlePublish} disabled={saveMutation.isPending} className="font-[Inter] text-xs gap-1.5">
              <Send className="h-4 w-4" /> Publicar
            </Button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto px-6 py-12">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do artigo..."
              className="w-full text-display text-4xl font-light text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 mb-4" />
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtítulo (opcional)"
              className="w-full font-[Inter] text-lg text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/20 mb-8" />
            <div className="w-12 h-px bg-border mb-8" />
            <EditorToolbar textareaRef={textareaRef} onInsertMarkdown={handleInsertMarkdown} />
            <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Comece a escrever seu artigo...

Use ## para subtítulos e separe parágrafos com uma linha em branco."
              className="w-full font-[Inter] text-lg leading-relaxed text-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/20 min-h-[400px]" />
          </div>
        </div>
      </div>

      {/* Sidebar with tabs */}
      <aside className="w-80 border-l border-border/50 bg-white flex-shrink-0 overflow-y-auto">
        <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
          <TabsList className="w-full rounded-none border-b border-border/50 bg-white h-10">
            <TabsTrigger value="media" className="flex-1 font-[Inter] text-xs data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Mídia & SEO
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 font-[Inter] text-xs data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary gap-1">
              <Sparkles className="h-3 w-3" /> AI Copilot
            </TabsTrigger>
          </TabsList>
          <TabsContent value="media" className="mt-0">
            <MediaSidebar
              coverImage={coverImage} onCoverImageChange={setCoverImage}
              slug={slug} onSlugChange={(v) => { setSlugManual(true); setSlug(v); }}
              excerpt={excerpt} onExcerptChange={setExcerpt}
              category={category} onCategoryChange={setCategory}
              isFeatured={isFeatured} onFeaturedChange={setIsFeatured}
              isExclusive={isExclusive} onExclusiveChange={setIsExclusive}
              readingTime={readingTime}
            />
          </TabsContent>
          <TabsContent value="ai" className="mt-0">
            <AICopilotSidebar
              content={content}
              title={title}
              onApplyTitle={setTitle}
              onApplyExcerpt={setExcerpt}
              onApplyContent={setContent}
            />
          </TabsContent>
        </Tabs>
      </aside>

      {/* Preview */}
      <PostPreview open={previewOpen} onOpenChange={setPreviewOpen} title={title} subtitle={subtitle} content={content} category={category} authorName="Alpha Business" readingTime={readingTime} />
    </div>
  );
};

export default BlogEditor;
