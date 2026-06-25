import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Settings2, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LeadCard, type Lead, type AssignedUser } from "@/components/admin/crm/LeadCard";
import { LeadDetailModal } from "@/components/admin/crm/LeadDetailModal";
import { NewLeadDialog } from "@/components/admin/crm/NewLeadDialog";
import { LeadNotificationSettingsDialog } from "@/components/admin/crm/LeadNotificationSettingsDialog";
import { CrmSettingsDialog } from "@/components/admin/crm/CrmSettingsDialog";
import { PipelineStagesDialog } from "@/components/admin/crm/PipelineStagesDialog";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { cn } from "@/lib/utils";
import { fetchAllPages } from "@/lib/supabasePagination";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export default function CRM() {
  const queryClient = useQueryClient();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { activeStages, getStage } = usePipelineStages();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const { data: team = [] } = useQuery({
    queryKey: ["team_profiles_crm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_profiles")
        .select("user_id, full_name, avatar_url, is_active")
        .order("full_name");
      if (error) throw error;
      return (data || []) as (AssignedUser & { is_active: boolean })[];
    },
  });

  const teamMap = useMemo(() => {
    const m = new Map<string, AssignedUser>();
    team.forEach((t) => m.set(t.user_id, { user_id: t.user_id, full_name: t.full_name, avatar_url: t.avatar_url }));
    return m;
  }, [team]);

  const { data: rawLeads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, properties(title, photos, code)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });

  const leads = useMemo(
    () => rawLeads.map((l) => ({ ...l, assigned_user: l.assigned_user_id ? teamMap.get(l.assigned_user_id) ?? null : null })),
    [rawLeads, teamMap]
  );

  const visibleLeads = useMemo(() => {
    if (responsibleFilter === "all") return leads;
    if (responsibleFilter === "me") return leads.filter((l) => l.assigned_user_id === currentUserId);
    return leads.filter((l) => l.assigned_user_id === responsibleFilter);
  }, [leads, responsibleFilter, currentUserId]);

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-list"],
    queryFn: async () => {
      return fetchAllPages<{ id: string; title: string; code: string }>(() =>
        supabase.from("properties").select("id, title, code").order("code")
      );
    },
  });


  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStage: string) => {
      e.preventDefault();
      setDragOverStage(null);
      const leadId = e.dataTransfer.getData("text/plain");
      if (!leadId) return;

      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.pipeline_stage === newStage) return;

      queryClient.setQueryData<Lead[]>(["leads"], (old) =>
        old?.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage } : l)) || []
      );

      const { error } = await supabase
        .from("leads")
        .update({ pipeline_stage: newStage })
        .eq("id", leadId);

      if (error) {
        toast({ title: "Erro ao mover lead", description: error.message, variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["leads"] });
      }
    },
    [leads, queryClient]
  );

  const handleCardClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  }, []);

  // Inclui qualquer estágio legado presente em leads que não exista mais
  const columns = useMemo(() => {
    const known = new Set(activeStages.map((s) => s.key));
    const legacy = Array.from(new Set(leads.map((l) => l.pipeline_stage))).filter((k) => k && !known.has(k));
    const legacyCols = legacy.map((k) => ({
      key: k,
      label: getStage(k)?.label || k,
      color: getStage(k)?.color || "#9CA3AF",
    }));
    return [...activeStages.map((s) => ({ key: s.key, label: s.label, color: s.color })), ...legacyCols];
  }, [activeStages, leads, getStage]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground font-[Inter] mt-1">
            {visibleLeads.length} {visibleLeads.length === 1 ? "lead" : "leads"}
            {responsibleFilter !== "all" ? " (filtrado)" : " no pipeline"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="w-[200px] h-9 font-[Inter] text-sm">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda a equipe</SelectItem>
              {currentUserId && <SelectItem value="me">Meus leads</SelectItem>}
              {team.filter((t) => t.is_active).map((t) => (
                <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setStagesOpen(true)} className="font-[Inter]">
            <Columns3 className="h-4 w-4 mr-2" /> Estágios
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="font-[Inter]">
            <Settings2 className="h-4 w-4 mr-2" /> Atribuição
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNotifyOpen(true)} className="font-[Inter]">
            <Bell className="h-4 w-4 mr-2" /> Notificações
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((stage) => {
          const stageLeads = visibleLeads.filter((l) => l.pipeline_stage === stage.key);
          const totalValue = stageLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0);

          return (
            <div
              key={stage.key}
              className={cn(
                "flex-shrink-0 w-[280px] rounded-sm flex flex-col border border-border/40",
                "transition-colors duration-200",
                dragOverStage === stage.key ? "bg-white border-primary/20" : "bg-white"
              )}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div
                className="sticky top-0 z-10 rounded-t-sm px-4 py-3 backdrop-blur-md bg-white/90 border-b"
                style={{ borderTopColor: stage.color, borderTopWidth: 3, borderBottomColor: "hsl(var(--border) / 0.3)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="font-[Raleway] text-sm font-semibold text-foreground">{stage.label}</h3>
                    <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-[Inter] font-medium">
                      {stageLeads.length}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setNewLeadStage(stage.key)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {totalValue > 0 && (
                  <p className="text-[11px] text-muted-foreground font-[Inter] mt-1">
                    {formatCurrency(totalValue)}
                  </p>
                )}
              </div>

              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={handleDragStart}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailModal
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        team={team.filter((t) => t.is_active)}
      />

      <NewLeadDialog
        open={!!newLeadStage}
        onOpenChange={(open) => !open && setNewLeadStage(null)}
        defaultStage={newLeadStage || "novos"}
        properties={properties}
      />

      <LeadNotificationSettingsDialog open={notifyOpen} onOpenChange={setNotifyOpen} />
      <CrmSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PipelineStagesDialog open={stagesOpen} onOpenChange={setStagesOpen} />
    </div>
  );
}
