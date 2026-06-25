import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarCheck, Flame, UserPlus, FileText } from "lucide-react";
import { usePipelineStages } from "@/hooks/usePipelineStages";

interface Task {
  id: string;
  icon: React.ReactNode;
  label: string;
  priority: number;
}

export function DailyPlanCard() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const { stages, getInitialStageKey } = usePipelineStages();
  const proposalKeys = stages.filter((s) => /proposta/i.test(s.label) || /proposta/i.test(s.key)).map((s) => s.key);
  const initialKey = getInitialStageKey();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["daily-plan", initialKey, proposalKeys.join(",")],
    queryFn: async () => {
      const items: Task[] = [];
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      // 1. Hot leads without recent contact
      const { data: hotLeads } = await supabase
        .from("leads")
        .select("id, name")
        .eq("score", "quente")
        .lt("last_contact_at", twoDaysAgo)
        .limit(2);
      hotLeads?.forEach((l) =>
        items.push({
          id: `hot-${l.id}`,
          icon: <Flame className="h-4 w-4 text-red-500" />,
          label: `Contatar lead quente: ${l.name}`,
          priority: 1,
        })
      );

      // 2. Visits today/tomorrow
      const { data: visits } = await supabase
        .from("visits_scheduling")
        .select("id, lead_name, visit_date, visit_time")
        .gte("visit_date", today)
        .lte("visit_date", tomorrow)
        .limit(2);
      visits?.forEach((v) =>
        items.push({
          id: `visit-${v.id}`,
          icon: <CalendarCheck className="h-4 w-4 text-amber-500" />,
          label: `Visita: ${v.lead_name} — ${v.visit_date} ${v.visit_time}`,
          priority: 2,
        })
      );

      // 3. Leads em estágio "proposta" (qualquer estágio cujo nome/chave contenha "proposta")
      if (proposalKeys.length > 0) {
        const { data: proposalLeads } = await supabase
          .from("leads")
          .select("id, name")
          .in("pipeline_stage", proposalKeys)
          .lt("last_contact_at", twoDaysAgo)
          .limit(2);
        proposalLeads?.forEach((l) =>
          items.push({
            id: `prop-${l.id}`,
            icon: <FileText className="h-4 w-4 text-blue-500" />,
            label: `Follow-up proposta: ${l.name}`,
            priority: 3,
          })
        );
      }

      // 4. Novos leads sem contato
      const { data: newLeads } = await supabase
        .from("leads")
        .select("id, name")
        .eq("pipeline_stage", initialKey)
        .order("created_at", { ascending: true })
        .limit(2);
      newLeads?.forEach((l) =>
        items.push({
          id: `new-${l.id}`,
          icon: <UserPlus className="h-4 w-4 text-green-500" />,
          label: `Primeiro contato: ${l.name}`,
          priority: 4,
        })
      );

      return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
    },
  });

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <Card className="bg-white border-border/50 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="font-[Raleway] text-base font-semibold">
          📋 Micro-plano Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-xs text-muted-foreground font-[Inter]">Carregando...</p>}
        {!isLoading && tasks.length === 0 && (
          <p className="text-xs text-muted-foreground font-[Inter]">
            Nenhuma tarefa prioritária para hoje. 🎉
          </p>
        )}
        {tasks.map((task) => (
          <label
            key={task.id}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${
              done.has(task.id) ? "opacity-50" : ""
            }`}
          >
            <Checkbox
              checked={done.has(task.id)}
              onCheckedChange={() => toggle(task.id)}
            />
            {task.icon}
            <span
              className={`font-[Inter] text-sm text-foreground ${
                done.has(task.id) ? "line-through" : ""
              }`}
            >
              {task.label}
            </span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
