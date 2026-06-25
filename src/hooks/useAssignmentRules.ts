import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type DistributionType = "fixed" | "sequence" | "random";

export interface RuleConditions {
  origin?: string;
  pipeline_stage?: string;
  score?: string;
  property_id?: string;
  deal_value_min?: number | string;
  deal_value_max?: number | string;
}

export interface AssignmentRule {
  id: string;
  name: string;
  priority: number;
  is_active: boolean;
  conditions: RuleConditions;
  distribution_type: DistributionType;
  fixed_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRuleMember {
  id: string;
  rule_id: string;
  user_id: string;
  sort_order: number;
  is_active: boolean;
  last_assigned_at: string | null;
}

export interface RuleInput {
  name: string;
  priority: number;
  is_active: boolean;
  conditions: RuleConditions;
  distribution_type: DistributionType;
  fixed_user_id: string | null;
  members: { user_id: string; sort_order: number }[];
}

const RULES_KEY = ["crm_assignment_rules"];
const MEMBERS_KEY = ["crm_assignment_rule_members"];

export function useAssignmentRules() {
  const qc = useQueryClient();

  const rulesQuery = useQuery<AssignmentRule[]>({
    queryKey: RULES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_assignment_rules")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data || []) as AssignmentRule[];
    },
  });

  const membersQuery = useQuery<AssignmentRuleMember[]>({
    queryKey: MEMBERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_assignment_rule_members")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as AssignmentRuleMember[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: RULES_KEY });
    qc.invalidateQueries({ queryKey: MEMBERS_KEY });
  };

  const upsertRule = useMutation({
    mutationFn: async (payload: RuleInput & { id?: string }) => {
      const { members, id, ...rest } = payload;
      const dbPayload = { ...rest, conditions: rest.conditions as unknown as Record<string, unknown> };
      let ruleId = id;

      if (ruleId) {
        const { error } = await supabase
          .from("crm_assignment_rules")
          .update(dbPayload)
          .eq("id", ruleId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("crm_assignment_rules")
          .insert(dbPayload)
          .select("id")
          .single();
        if (error) throw error;
        ruleId = data.id;
      }

      // Substitui membros (estratégia simples: apaga e reinsere)
      await supabase.from("crm_assignment_rule_members").delete().eq("rule_id", ruleId!);
      if (members.length > 0) {
        const { error: mErr } = await supabase.from("crm_assignment_rule_members").insert(
          members.map((m) => ({ rule_id: ruleId!, user_id: m.user_id, sort_order: m.sort_order })),
        );
        if (mErr) throw mErr;
      }
      return ruleId!;
    },
    onSuccess: () => {
      toast({ title: "Regra salva" });
      invalidate();
    },
    onError: (e: any) =>
      toast({ title: "Erro ao salvar regra", description: e.message, variant: "destructive" }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_assignment_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Regra removida" });
      invalidate();
    },
    onError: (e: any) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("crm_assignment_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Atualiza prioridade conforme posição (10, 20, 30, ...)
      const updates = orderedIds.map((id, idx) =>
        supabase.from("crm_assignment_rules").update({ priority: (idx + 1) * 10 }).eq("id", id),
      );
      const results = await Promise.all(updates);
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) =>
      toast({ title: "Erro ao reordenar", description: e.message, variant: "destructive" }),
  });

  return {
    rules: rulesQuery.data || [],
    members: membersQuery.data || [],
    isLoading: rulesQuery.isLoading || membersQuery.isLoading,
    upsertRule,
    deleteRule,
    toggleActive,
    reorder,
  };
}
