import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useAssignmentRules, type AssignmentRule } from "@/hooks/useAssignmentRules";
import { AssignmentRuleEditor } from "./AssignmentRuleEditor";

const DISTRIBUTION_LABEL: Record<string, string> = {
  fixed: "Fixo",
  sequence: "Sequência",
  random: "Aleatório",
};

export function AssignmentRulesList() {
  const { rules, members, isLoading, upsertRule, deleteRule, toggleActive, reorder } =
    useAssignmentRules();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentRule | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: team = [] } = useQuery({
    queryKey: ["team_profiles_active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_profiles")
        .select("user_id, full_name, is_active")
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      return (data || []) as { user_id: string; full_name: string | null; is_active: boolean }[];
    },
  });

  const userIdToName = useMemo(() => {
    const m = new Map<string, string>();
    team.forEach((t) => m.set(t.user_id, t.full_name || "—"));
    return m;
  }, [team]);

  const membersByRule = useMemo(() => {
    const m = new Map<string, typeof members>();
    members.forEach((mb) => {
      if (!m.has(mb.rule_id)) m.set(mb.rule_id, []);
      m.get(mb.rule_id)!.push(mb);
    });
    m.forEach((arr) => arr.sort((a, b) => a.sort_order - b.sort_order));
    return m;
  }, [members]);

  const nextPriority = (rules[rules.length - 1]?.priority ?? 0) + 10;

  const move = (id: string, dir: -1 | 1) => {
    const idx = rules.findIndex((r) => r.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= rules.length) return;
    const ordered = rules.map((r) => r.id);
    [ordered[idx], ordered[target]] = [ordered[target], ordered[idx]];
    reorder.mutate(ordered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-[Raleway] text-sm font-semibold">Regras de atribuição</h4>
          <p className="text-xs text-muted-foreground font-[Inter]">
            Avaliadas por prioridade (menor primeiro). Se nenhuma casar, usa-se o fallback.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Nova regra
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground font-[Inter]">Carregando…</p>
      ) : rules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/50 p-6 text-center">
          <p className="text-sm text-muted-foreground font-[Inter]">
            Nenhuma regra criada. Os leads serão atribuídos ao fallback.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule, idx) => {
            const ruleMembers = membersByRule.get(rule.id) || [];
            const targetLabel =
              rule.distribution_type === "fixed"
                ? rule.fixed_user_id
                  ? userIdToName.get(rule.fixed_user_id) || "—"
                  : "—"
                : ruleMembers.length === 0
                  ? "Sem participantes"
                  : ruleMembers
                      .map((m) => userIdToName.get(m.user_id) || "—")
                      .join(" → ");

            const condChips: string[] = [];
            const c = rule.conditions || {};
            if (c.origin) condChips.push(`origem=${c.origin}`);
            if (c.pipeline_stage) condChips.push(`estágio=${c.pipeline_stage}`);
            if (c.score) condChips.push(`score=${c.score}`);
            if (c.property_id) condChips.push("imóvel específico");
            if (c.deal_value_min) condChips.push(`≥ R$ ${c.deal_value_min}`);
            if (c.deal_value_max) condChips.push(`≤ R$ ${c.deal_value_max}`);

            return (
              <li
                key={rule.id}
                className="rounded-md border border-border/40 p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-[Inter]">#{rule.priority}</Badge>
                    <span className="font-[Raleway] text-sm font-semibold truncate">{rule.name}</span>
                    <Badge variant="secondary" className="text-[10px] font-[Inter]">
                      {DISTRIBUTION_LABEL[rule.distribution_type] || rule.distribution_type}
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="outline" className="text-[10px] font-[Inter] text-muted-foreground">
                        inativa
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-[Inter] mt-1 truncate">
                    → {targetLabel}
                  </p>
                  {condChips.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {condChips.map((cc) => (
                        <span
                          key={cc}
                          className="text-[10px] font-[Inter] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {cc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(rule.id, -1)}
                    disabled={idx === 0}
                    aria-label="Subir"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(rule.id, 1)}
                    disabled={idx === rules.length - 1}
                    aria-label="Descer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(v) => toggleActive.mutate({ id: rule.id, is_active: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(rule);
                      setEditorOpen(true);
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDeleteId(rule.id)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AssignmentRuleEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        rule={editing}
        members={members}
        team={team}
        nextPriority={nextPriority}
        onSave={async (payload) => {
          await upsertRule.mutateAsync(payload);
        }}
      />

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os leads existentes não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) deleteRule.mutate(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
