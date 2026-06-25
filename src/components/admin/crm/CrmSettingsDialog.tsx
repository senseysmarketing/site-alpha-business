import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  assignment_strategy: "fallback_only" | "rodizio";
  fallback_user_id: string | null;
  round_robin_pool: string[];
  assistant_sees_all: boolean;
}

export function CrmSettingsDialog({ open, onOpenChange }: CrmSettingsDialogProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [strategy, setStrategy] = useState<"fallback_only" | "rodizio">("fallback_only");
  const [fallback, setFallback] = useState<string | null>(null);
  const [pool, setPool] = useState<string[]>([]);
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
      setStrategy(settings.assignment_strategy);
      setFallback(settings.fallback_user_id);
      setPool(settings.round_robin_pool || []);
      setAssistantSeesAll(settings.assistant_sees_all);
    }
  }, [settings]);

  const togglePool = (uid: string) => {
    setPool((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const handleSave = async () => {
    if (!settings) return;
    if (!fallback) {
      toast({ title: "Selecione um responsável fallback", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("crm_settings")
      .update({
        assignment_strategy: strategy,
        fallback_user_id: fallback,
        round_robin_pool: pool,
        assistant_sees_all: assistantSeesAll,
      })
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">Configurações do CRM</DialogTitle>
          <DialogDescription className="font-[Inter] text-xs">
            Regras de atribuição automática de leads que entram pelos formulários do site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="font-[Inter] text-sm">Estratégia de atribuição</Label>
            <Select value={strategy} onValueChange={(v) => setStrategy(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fallback_only">Sempre para o responsável fallback</SelectItem>
                <SelectItem value="rodizio">Rodízio entre corretores ativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-[Inter] text-sm">Responsável fallback (obrigatório)</Label>
            <p className="text-[11px] text-muted-foreground">Recebe os leads quando nenhuma regra atribuir um responsável.</p>
            <Select value={fallback || ""} onValueChange={(v) => setFallback(v)}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {team.map((t) => (
                  <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {strategy === "rodizio" && (
            <div className="space-y-2">
              <Label className="font-[Inter] text-sm">Pool do rodízio</Label>
              <p className="text-[11px] text-muted-foreground">
                Quem participa do rodízio. Se vazio, todos os corretores ativos participam.
              </p>
              <div className="max-h-44 overflow-y-auto rounded-md border border-border/60 p-2 space-y-1.5">
                {team.map((t) => (
                  <label key={t.user_id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={pool.includes(t.user_id)}
                      onCheckedChange={() => togglePool(t.user_id)}
                    />
                    <span>{t.full_name || t.user_id}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5">
            <div>
              <Label className="font-[Inter] text-sm">Assistente vê todos os leads</Label>
              <p className="text-[11px] text-muted-foreground">Se desligado, assistentes só veem leads atribuídos a eles.</p>
            </div>
            <Switch checked={assistantSeesAll} onCheckedChange={setAssistantSeesAll} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
