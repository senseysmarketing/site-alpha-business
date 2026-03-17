import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, MessageCircle, Phone, FileText, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AIResponseDialog } from "./AIResponseDialog";

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  view: { icon: <Eye className="h-3.5 w-3.5" />, color: "bg-blue-100 text-blue-600" },
  whatsapp: { icon: <MessageCircle className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-600" },
  call: { icon: <Phone className="h-3.5 w-3.5" />, color: "bg-amber-100 text-amber-600" },
  proposal: { icon: <FileText className="h-3.5 w-3.5" />, color: "bg-purple-100 text-purple-600" },
};

const fallbackIcon = { icon: <Eye className="h-3.5 w-3.5" />, color: "bg-muted text-muted-foreground" };

interface ActivityWithLead {
  id: string;
  type: string;
  description: string;
  created_at: string;
  lead_id: string;
  leads: { name: string; phone: string | null; property_id: string | null } | null;
}

export function LeadActivityTimeline() {
  const [aiDialog, setAiDialog] = useState<{
    open: boolean;
    name: string;
    phone?: string | null;
    activity?: string | null;
  }>({ open: false, name: "" });

  const { data: activities = [] } = useQuery({
    queryKey: ["lead-activity-timeline"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_activities")
        .select("id, type, description, created_at, lead_id, leads(name, phone, property_id)")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as unknown as ActivityWithLead[]) ?? [];
    },
  });

  return (
    <>
      <Card className="bg-white border-border/50 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="font-[Raleway] text-base font-semibold">
            📊 Log de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />

            {activities.length === 0 && (
              <p className="text-xs text-muted-foreground font-[Inter] pl-10">
                Nenhuma atividade registrada.
              </p>
            )}

            {activities.map((act) => {
              const style = typeIcons[act.type] ?? fallbackIcon;
              const initials = act.leads?.name
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "?";

              return (
                <div key={act.id} className="flex items-start gap-3 relative">
                  <Avatar className="h-9 w-9 z-10 shrink-0">
                    <AvatarFallback className={`${style.color} text-[10px] font-semibold`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-[Inter] text-sm text-foreground leading-tight">
                      <span className="font-medium">{act.leads?.name ?? "Lead"}</span>{" "}
                      <span className="text-muted-foreground">{act.description}</span>
                    </p>
                    <p className="font-[Inter] text-[10px] text-muted-foreground/60 mt-0.5">
                      {formatDistanceToNow(new Date(act.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1 text-xs h-7"
                    onClick={() =>
                      setAiDialog({
                        open: true,
                        name: act.leads?.name ?? "Lead",
                        phone: act.leads?.phone,
                        activity: act.description,
                      })
                    }
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar Resposta IA
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AIResponseDialog
        open={aiDialog.open}
        onOpenChange={(o) => setAiDialog((p) => ({ ...p, open: o }))}
        leadName={aiDialog.name}
        leadPhone={aiDialog.phone}
        lastActivity={aiDialog.activity}
      />
    </>
  );
}
