import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ChevronLeft, ChevronRight, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useAuth } from "@/hooks/useAuth";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  published_at: string;
  is_featured: boolean;
  is_exclusive: boolean;
  author_name: string;
  reading_time_min: number;
};

const statusFilters = ["Todos", "Publicado", "Agendado", "Rascunho"];

function getPostStatus(published_at: string | null): { label: string; variant: "default" | "secondary" | "outline" } {
  if (!published_at) return { label: "Rascunho", variant: "outline" };
  const date = new Date(published_at);
  if (date > new Date()) return { label: "Agendado", variant: "secondary" };
  return { label: "Publicado", variant: "default" };
}

const BlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { categories, labelOf } = useBlogCategories();

  // Carousel scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [categories.length]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchPosts = async () => {
      let query = supabase
        .from("blog_posts")
        .select("id, title, slug, category, published_at, is_featured, is_exclusive, author_name, reading_time_min");

      if (filterCategory !== "Todos") {
        query = query.eq("category", filterCategory);
      }

      const { data } = await query.order("created_at", { ascending: false });
      setPosts((data ?? []) as BlogPost[]);
    };
    fetchPosts();
  }, [filterCategory]);

  const filtered = posts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === "Todos") return matchesSearch;
    const status = getPostStatus(p.published_at);
    return matchesSearch && status.label === filterStatus;
  });

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const allCategoryChips = [{ slug: "Todos", label: "Todos" }, ...categories.map((c) => ({ slug: c.slug, label: c.label }))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">Blog</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">Gerencie seus artigos</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate("/admin/blog/categorias")}
              className="font-[Inter] text-xs uppercase tracking-widest"
            >
              <Tags className="h-4 w-4 mr-1" /> Categorias
            </Button>
          )}
          <Button onClick={() => navigate("/admin/blog/novo")} className="font-[Inter] text-xs uppercase tracking-widest">
            <Plus className="h-4 w-4 mr-1" /> Novo Artigo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-border/50 font-[Inter] text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-[Inter] text-[10px] uppercase tracking-widest text-muted-foreground flex-shrink-0">Categoria</span>

          {/* Sliding category carousel */}
          <div className="relative flex-1 min-w-0">
            {canScrollLeft && (
              <>
                <button
                  onClick={() => scrollBy(-200)}
                  aria-label="Anterior"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white border border-border/60 shadow-sm flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-7 top-0 bottom-0 w-6 bg-gradient-to-r from-[#F8F8F8] to-transparent z-[5] pointer-events-none" />
              </>
            )}
            {canScrollRight && (
              <>
                <div className="absolute right-7 top-0 bottom-0 w-6 bg-gradient-to-l from-[#F8F8F8] to-transparent z-[5] pointer-events-none" />
                <button
                  onClick={() => scrollBy(200)}
                  aria-label="Próximo"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white border border-border/60 shadow-sm flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            <div
              ref={scrollRef}
              className="overflow-x-auto scrollbar-hide flex items-center gap-1.5 whitespace-nowrap py-0.5"
              style={{ scrollbarWidth: "none" }}
            >
              {allCategoryChips.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setFilterCategory(c.slug)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-[Inter] transition-colors border ${
                    filterCategory === c.slug
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-border/50 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-[Inter] text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
          <div className="flex gap-1.5">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-[Inter] transition-colors border ${
                  filterStatus === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Título</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Categoria</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Data</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Leitura</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <p className="font-[Inter] text-sm text-muted-foreground">Nenhum artigo encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((post) => {
                const status = getPostStatus(post.published_at);
                return (
                  <TableRow key={post.id} className="cursor-pointer" onClick={() => navigate(`/admin/blog/${post.id}`)}>
                    <TableCell>
                      <div>
                        <span className="font-[Inter] text-sm font-medium">{post.title}</span>
                        {post.is_featured && (
                          <Badge variant="secondary" className="ml-2 font-[Inter] text-[9px] uppercase">Destaque</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-[Inter] text-[10px]">
                        {labelOf(post.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="font-[Inter] text-[10px] uppercase">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-[Inter] text-sm text-muted-foreground">
                      {formatDate(post.published_at)}
                    </TableCell>
                    <TableCell className="font-[Inter] text-sm text-muted-foreground">
                      {post.reading_time_min} min
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="font-[Inter] text-xs">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BlogPosts;
