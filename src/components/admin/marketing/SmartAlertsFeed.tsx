import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  type: "hot" | "pending" | "success";
  title: string;
  description: string;
  time: string;
}

const alertStyles = {
  hot: {
    border: "border-l-4 border-l-red-500 bg-red-50",
    icon: <Flame className="h-4 w-4 text-red-500" />,
  },
  pending: {
    border: "border-l-4 border-l-amber-500 bg-amber-50",
    icon: <Clock className="h-4 w-4 text-amber-500" />,
  },
  success: {
    border: "border-l-4 border-l-green-500 bg-green-50",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
};

export function SmartAlertsFeed() {
  const { data: hotLeads } = useQuery({
    queryKey: ["marketing-hot-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, score, last_contact_at, pipeline_stage")
        .eq("score", "quente")
        .order("last_contact_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: pendingVisits } = useQuery({
    queryKey: ["marketing-pending-visits"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("visits_scheduling")
        .select("*")
        .gte("visit_date", today)
        .order("visit_date", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: advancedLeads } = useQuery({
    queryKey: ["marketing-advanced-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, pipeline_stage, updated_at")
        .in("pipeline_stage", ["contrato", "fechado"])
        .order("updated_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const alerts: Alert[] = [
    ...(hotLeads?.map((l) => ({
      id: `hot-${l.id}`,
      type: "hot" as const,
      title: `Lead Quente: ${l.name}`,
      description: `Score quente — pipeline: ${l.pipeline_stage}`,
      time: l.last_contact_at,
    })) ?? []),
    ...(pendingVisits?.map((v) => ({
      id: `visit-${v.id}`,
      type: "pending" as const,
      title: `Visita pendente: ${v.lead_name}`,
      description: `${v.property_code} — ${v.visit_date} às ${v.visit_time}`,
      time: v.created_at,
    })) ?? []),
    ...(advancedLeads?.map((l) => ({
      id: `adv-${l.id}`,
      type: "success" as const,
      title: `${l.name} avançou`,
      description: `Pipeline: ${l.pipeline_stage}`,
      time: l.updated_at,
    })) ?? []),
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-[Raleway] font-semibold text-sm text-foreground tracking-wide uppercase">
        Alertas Inteligentes
      </h3>
      {alerts.length === 0 && (
        <p className="text-xs text-muted-foreground font-[Inter]">Nenhum alerta no momento.</p>
      )}
      {alerts.map((alert) => {
        const style = alertStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={`${style.border} rounded-r-md p-3 space-y-1`}
          >
            <div className="flex items-center gap-2">
              {style.icon}
              <span className="font-[Inter] text-xs font-semibold text-foreground leading-tight">
                {alert.title}
              </span>
            </div>
            <p className="font-[Inter] text-[11px] text-muted-foreground">{alert.description}</p>
            <p className="font-[Inter] text-[10px] text-muted-foreground/60">
              {formatDistanceToNow(new Date(alert.time), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
