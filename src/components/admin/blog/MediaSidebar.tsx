import { useState, useCallback } from "react";
import { Upload, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useBlogCategories } from "@/hooks/useBlogCategories";

type Props = {
  coverImage: string | null;
  onCoverImageChange: (url: string | null) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  isFeatured: boolean;
  onFeaturedChange: (v: boolean) => void;
  isExclusive: boolean;
  onExclusiveChange: (v: boolean) => void;
  readingTime: number;
};

const MediaSidebar = ({
  coverImage, onCoverImageChange,
  slug, onSlugChange,
  excerpt, onExcerptChange,
  category, onCategoryChange,
  isFeatured, onFeaturedChange,
  isExclusive, onExclusiveChange,
  readingTime,
}: Props) => {
  const [uploading, setUploading] = useState(false);
  const { categories } = useBlogCategories();

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("blog-media").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("blog-media").getPublicUrl(path);
      onCoverImageChange(publicUrl);
    }
    setUploading(false);
  }, [onCoverImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleUpload(file);
  }, [handleUpload]);

  return (
    <div>
      <div className="p-5 space-y-6">
        {/* Cover Image */}
        <section>
          <h3 className="font-[Inter] text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Imagem de Capa
          </h3>
          {coverImage ? (
            <div className="relative rounded-lg overflow-hidden group">
              <img src={coverImage} alt="Capa" className="w-full h-40 object-cover" />
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-600 text-white text-[9px] font-[Inter]">
                  <CheckCircle className="h-3 w-3" /> WebP otimizado
                </span>
                <button
                  onClick={() => onCoverImageChange(null)}
                  className="p-1 rounded-full bg-foreground/70 text-white hover:bg-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleUpload(file);
                };
                input.click();
              }}
            >
              <Upload className="h-5 w-5 text-muted-foreground mb-2" />
              <span className="font-[Inter] text-xs text-muted-foreground">
                {uploading ? "Enviando..." : "Arraste ou clique"}
              </span>
            </div>
          )}
        </section>

        {/* SEO */}
        <section>
          <h3 className="font-[Inter] text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">SEO</h3>
          <div className="space-y-3">
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Meta Descrição</Label>
              <Textarea
                value={excerpt}
                onChange={(e) => onExcerptChange(e.target.value.slice(0, 160))}
                placeholder="Descrição para mecanismos de busca..."
                className="mt-1 min-h-[60px] text-sm font-[Inter] bg-background border-border/50"
                rows={3}
              />
              <span className="font-[Inter] text-[10px] text-muted-foreground mt-1 block text-right">
                {excerpt.length}/160
              </span>
            </div>
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Slug (URL)</Label>
              <Input
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                className="mt-1 text-sm font-[Inter] bg-background border-border/50"
                placeholder="titulo-do-artigo"
              />
            </div>
          </div>
        </section>

        {/* Category */}
        <section>
          <h3 className="font-[Inter] text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">Categoria</h3>
          {categories.length === 0 ? (
            <p className="font-[Inter] text-xs text-muted-foreground italic">
              Nenhuma categoria cadastrada. Crie em Blog → Categorias.
            </p>
          ) : (
            <RadioGroup value={category} onValueChange={(v) => onCategoryChange(v)}>
              {categories.map((opt) => (
                <div key={opt.slug} className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value={opt.slug} id={opt.slug} />
                  <Label htmlFor={opt.slug} className="font-[Inter] text-sm cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </section>

        {/* Settings */}
        <section>
          <h3 className="font-[Inter] text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">Configurações</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-[Inter] text-sm">Destaque</Label>
              <Switch checked={isFeatured} onCheckedChange={onFeaturedChange} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-[Inter] text-sm">Exclusivo</Label>
              <Switch checked={isExclusive} onCheckedChange={onExclusiveChange} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-[Inter] text-sm text-muted-foreground">Tempo de leitura</Label>
              <span className="font-[Inter] text-sm">{readingTime} min</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MediaSidebar;
