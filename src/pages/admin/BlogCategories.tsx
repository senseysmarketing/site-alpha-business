import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useBlogCategories, useInvalidateBlogCategories, type BlogCategory } from "@/hooks/useBlogCategories";
import CategoryDialog from "@/components/admin/blog/CategoryDialog";

const BlogCategories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, isLoading } = useBlogCategories();
  const invalidate = useInvalidateBlogCategories();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [deleting, setDeleting] = useState<BlogCategory | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      const { data } = await supabase.from("blog_posts").select("category");
      if (!data) return;
      const map: Record<string, number> = {};
      for (const row of data) {
        const slug = row.category as string;
        map[slug] = (map[slug] ?? 0) + 1;
      }
      setCounts(map);
    };
    loadCounts();
  }, [categories]);

  const handleDelete = async () => {
    if (!deleting) return;
    const usage = counts[deleting.slug] ?? 0;
    if (usage > 0) {
      toast({
        title: "Categoria em uso",
        description: `${usage} artigo(s) usam esta categoria. Reatribua antes de excluir.`,
        variant: "destructive",
      });
      setDeleting(null);
      return;
    }
    const { error } = await supabase.from("blog_categories").delete().eq("id", deleting.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Categoria excluída" });
      invalidate();
    }
    setDeleting(null);
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: BlogCategory) => { setEditing(c); setDialogOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate("/admin/blog")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-[Inter] text-xs mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Blog
          </button>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">Categorias</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Crie, edite e organize as categorias dos artigos.
          </p>
        </div>
        <Button onClick={openNew} className="font-[Inter] text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4 mr-1" /> Nova Categoria
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Nome</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Slug</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Artigos</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 font-[Inter] text-sm text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 font-[Inter] text-sm text-muted-foreground">Nenhuma categoria cadastrada</TableCell></TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-[Inter] text-sm font-medium">{c.label}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="font-[Inter] text-sm text-muted-foreground">
                    {counts[c.slug] ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="font-[Inter] text-xs">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(c)}
                      className="font-[Inter] text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-[Raleway]">Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription className="font-[Inter] text-sm">
              Esta ação não pode ser desfeita. {deleting && (counts[deleting.slug] ?? 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  Atenção: {counts[deleting.slug]} artigo(s) usam esta categoria.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-[Inter] text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="font-[Inter] text-xs bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogCategories;
