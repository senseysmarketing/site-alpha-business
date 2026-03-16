import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LeadCard, type Lead } from "@/components/admin/crm/LeadCard";
import { LeadDetailSheet } from "@/components/admin/crm/LeadDetailSheet";
import { NewLeadDialog } from "@/components/admin/crm/NewLeadDialog";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "novos", label: "Novos" },
  { key: "visita_agendada", label: "Visita Agendada" },
  { key: "proposta", label: "Proposta" },
  { key: "contrato", label: "Contrato" },
  { key: "fechado", label: "Fechado" },
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export default function CRM() {
  const queryClient = useQueryClient();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<string | null>(null);

  const { data: leads = [] } = useQuery({
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

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-list"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, title, code").order("code");
      return data || [];
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

      // Optimistic update
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground font-[Inter] mt-1">
            {leads.length} leads no pipeline
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.pipeline_stage === stage.key);
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
              {/* Column header — glassmorphism */}
              <div className="sticky top-0 z-10 rounded-t-sm px-4 py-3 backdrop-blur-md bg-background/90 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

              {/* Cards */}
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

      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />

      <NewLeadDialog
        open={!!newLeadStage}
        onOpenChange={(open) => !open && setNewLeadStage(null)}
        defaultStage={newLeadStage || "novos"}
        properties={properties}
      />
    </div>
  );
}
