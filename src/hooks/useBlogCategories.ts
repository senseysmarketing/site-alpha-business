import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BlogCategory = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
};

export function useBlogCategories() {
  const query = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async (): Promise<BlogCategory[]> => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, slug, label, sort_order")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const labelOf = (slug: string | null | undefined) => {
    if (!slug) return "";
    return query.data?.find((c) => c.slug === slug)?.label ?? slug;
  };

  return { ...query, categories: query.data ?? [], labelOf };
}

export function useInvalidateBlogCategories() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["blog-categories"] });
}
