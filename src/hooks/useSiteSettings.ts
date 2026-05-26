import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSiteSettings<T = Record<string, unknown>>(key: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["site_settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings" as never)
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data as { value: T } | null)?.value ?? null;
    },
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationFn: async (value: T) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("site_settings" as never)
        .upsert(
          { key, value, updated_at: new Date().toISOString(), updated_by: user?.id } as never,
          { onConflict: "key" } as never,
        );
      if (error) throw error;

      // Audit log
      await supabase.from("system_audit_logs").insert({
        action: "editou",
        object_type: "configuracao",
        object_label: key,
        user_name: user?.email ?? "Admin",
        user_id: user?.id,
        metadata: { key },
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings", key] });
      toast({ title: "Salvo com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    },
  });

  return { data: query.data as T | undefined, isLoading: query.isLoading, save: mutation.mutate, isSaving: mutation.isPending };
}
