import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useInvalidateBlogCategories, type BlogCategory } from "@/hooks/useBlogCategories";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: BlogCategory | null;
};

const CategoryDialog = ({ open, onOpenChange, category }: Props) => {
  const isEditing = !!category;
  const { toast } = useToast();
  const invalidate = useInvalidateBlogCategories();

  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel(category?.label ?? "");
      setSlug(category?.slug ?? "");
      setSlugTouched(isEditing);
    }
  }, [open, category, isEditing]);

  useEffect(() => {
    if (!slugTouched && label) setSlug(slugify(label));
  }, [label, slugTouched]);

  const handleSave = async () => {
    if (!label.trim() || !slug.trim()) {
      toast({ title: "Preencha label e slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (isEditing && category) {
        const { error } = await supabase
          .from("blog_categories")
          .update({ label: label.trim(), slug: slug.trim() })
          .eq("id", category.id);
        if (error) throw error;

        // If slug changed, update all blog_posts using the old slug
        if (category.slug !== slug.trim()) {
          await supabase
            .from("blog_posts")
            .update({ category: slug.trim() })
            .eq("category", category.slug);
        }
        toast({ title: "Categoria atualizada" });
      } else {
        const { error } = await supabase
          .from("blog_categories")
          .insert({ label: label.trim(), slug: slug.trim() });
        if (error) throw error;
        toast({ title: "Categoria criada" });
      }
      invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription className="font-[Inter] text-xs">
            O slug é usado na URL e como identificador interno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="font-[Inter] text-xs text-muted-foreground">Nome</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Tendências de Mercado"
              className="mt-1 font-[Inter] text-sm"
            />
          </div>
          <div>
            <Label className="font-[Inter] text-xs text-muted-foreground">Slug</Label>
            <Input
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
              placeholder="tendencias-de-mercado"
              className="mt-1 font-[Inter] text-sm font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-[Inter] text-xs">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="font-[Inter] text-xs">
            {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
