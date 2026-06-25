import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AssignmentRulesList } from "./AssignmentRulesList";
import { ShieldCheck } from "lucide-react";

interface CrmSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamProfile {
  user_id: string;
  full_name: string | null;
  is_active: boolean;
}

interface CrmSettings {
  id: string;
  fallback_user_id: string | null;
  assistant_sees_all: boolean;
}

export function CrmSettingsDialog({ open, onOpenChange }: CrmSettingsDialogProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [assistantSeesAll, setAssistantSeesAll] = useState(true);

  const { data: settings } = useQuery({
    queryKey: ["crm_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as CrmSettings | null;
    },
    enabled: open,
  });

  const { data: team = [] } = useQuery({
    queryKey: ["team_profiles_assignable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_profiles")
        .select("user_id, full_name, is_active")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return (data || []) as TeamProfile[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (settings) {
      setAssistantSeesAll(settings.assistant_sees_all);
    }
  }, [settings]);

  const fallbackName =
    settings?.fallback_user_id
      ? team.find((t) => t.user_id === settings.fallback_user_id)?.full_name || "—"
      : "—";

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("crm_settings")
      .update({ assistant_sees_all: assistantSeesAll })
      .eq("id", settings.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Configurações salvas" });
    qc.invalidateQueries({ queryKey: ["crm_settings"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">Configurações do CRM</DialogTitle>
          <DialogDescription className="font-[Inter] text-xs">
            Gerencie as regras automáticas de atribuição de leads e preferências de visibilidade.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rules" className="mt-2">
          <TabsList>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4 pt-3">
            <div className="rounded-md border border-border/40 bg-muted/30 p-3 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-[Raleway] font-semibold">Fallback obrigatório</p>
                <p className="text-xs text-muted-foreground font-[Inter]">
                  Garante que todo lead receba um responsável. Atualmente: <strong>{fallbackName}</strong>.
                </p>
                <p className="text-[11px] text-muted-foreground/80 font-[Inter] mt-1">
                  Por segurança, só pode ser alterado diretamente no banco de dados.
                </p>
              </div>
            </div>

            <AssignmentRulesList />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 pt-3">
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
              <div>
                <Label className="font-[Inter] text-sm">Assistente vê todos os leads</Label>
                <p className="text-[11px] text-muted-foreground">
                  Se desligado, assistentes só veem leads atribuídos a eles.
                </p>
              </div>
              <Switch checked={assistantSeesAll} onCheckedChange={setAssistantSeesAll} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar preferências"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
