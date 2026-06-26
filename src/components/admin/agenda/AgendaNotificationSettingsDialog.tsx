import { useEffect, useState } from "react";
import { Bell, Send, Info } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AgendaNotifyConfig {
  enabled: boolean;
  subjectTemplate?: string;
  notifyTypes?: string[];
  notifyEvents?: string[];
  includeLead?: boolean;
  includeProperty?: boolean;
  includeNotes?: boolean;
}

const TYPES = [
  { value: "visita", label: "Visitas" },
  { value: "evento", label: "Eventos" },
  { value: "tarefa", label: "Tarefas" },
];

const EVENTS = [
  { value: "created", label: "Criação de novo item" },
  { value: "reassigned", label: "Reatribuição a outro responsável" },
];

const DEFAULTS: AgendaNotifyConfig = {
  enabled: true,
  subjectTemplate: "Agenda — {{title}}",
  notifyTypes: [],
  notifyEvents: ["created", "reassigned"],
  includeLead: true,
  includeProperty: true,
  includeNotes: true,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AgendaNotificationSettingsDialog({ open, onOpenChange }: Props) {
  const { data, isLoading, save, isSaving } =
    useSiteSettings<AgendaNotifyConfig>("agenda_email_notifications");
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState<AgendaNotifyConfig>(DEFAULTS);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (data) setDraft({ ...DEFAULTS, ...data });
  }, [data]);

  const toggleArr = (key: "notifyTypes" | "notifyEvents", value: string) => {
    const cur = draft[key] ?? [];
    setDraft({
      ...draft,
      [key]: cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value],
    });
  };

  const handleSave = () => {
    save(draft, { onSuccess: () => onOpenChange(false) } as never);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke(
        "send-agenda-notification",
        { body: { mode: "test" } },
      );
      if (error) throw error;
      const status = (resp as any)?.status;
      if (status === "sent") {
        toast({
          title: "E-mail de teste enviado",
          description: (resp as any)?.recipient ?? user?.email ?? "",
        });
      } else {
        toast({
          title: "Não foi possível enviar",
          description: (resp as any)?.error ?? status ?? "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Falha no envio", description: e.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Raleway] flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notificações da agenda
          </DialogTitle>
          <DialogDescription className="font-[Inter]">
            Envia e-mails ao responsável quando um item é criado ou reatribuído.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between rounded-md border border-border/40 p-4">
              <div>
                <Label className="font-[Raleway] text-sm">Ativar notificações</Label>
                <p className="text-xs text-muted-foreground font-[Inter] mt-1">
                  Quando desativado, nenhum e-mail é enviado.
                </p>
              </div>
              <Switch
                checked={draft.enabled}
                onCheckedChange={(v) => setDraft({ ...draft, enabled: v })}
              />
            </div>

            <div className="flex gap-3 rounded-md border border-border/40 bg-muted/30 p-4">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-[Raleway]">Destinatário automático</p>
                <p className="text-xs text-muted-foreground font-[Inter] leading-relaxed">
                  O e-mail é enviado para o responsável definido no compromisso.
                  O teste abaixo é enviado para o seu e-mail logado
                  {user?.email ? ` (${user.email})` : ""}.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Assunto do e-mail</Label>
              <Input
                value={draft.subjectTemplate ?? ""}
                onChange={(e) => setDraft({ ...draft, subjectTemplate: e.target.value })}
                placeholder="Agenda — {{title}}"
              />
              <p className="text-[11px] text-muted-foreground font-[Inter]">
                Você pode usar {"{{title}}"} e {"{{type}}"}. Reatribuições recebem o prefixo
                <span className="font-mono"> [Reatribuído]</span>.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Tipos notificados</Label>
              <p className="text-xs text-muted-foreground font-[Inter]">
                Deixe tudo desmarcado para notificar todos os tipos.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {TYPES.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                    <Checkbox
                      checked={draft.notifyTypes?.includes(t.value) ?? false}
                      onCheckedChange={() => toggleArr("notifyTypes", t.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Quando enviar</Label>
              <div className="space-y-2 pt-1">
                {EVENTS.map((e) => (
                  <label key={e.value} className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                    <Checkbox
                      checked={draft.notifyEvents?.includes(e.value) ?? false}
                      onCheckedChange={() => toggleArr("notifyEvents", e.value)}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Conteúdo do e-mail</Label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                  <Checkbox
                    checked={draft.includeLead ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, includeLead: !!v })}
                  />
                  Incluir dados do cliente/lead
                </label>
                <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                  <Checkbox
                    checked={draft.includeProperty ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, includeProperty: !!v })}
                  />
                  Incluir dados do imóvel
                </label>
                <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                  <Checkbox
                    checked={draft.includeNotes ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, includeNotes: !!v })}
                  />
                  Incluir notas do compromisso
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing || !user?.email}>
            <Send className="h-4 w-4 mr-2" />
            {testing ? "Enviando…" : "Enviar teste"}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AgendaNotificationSettingsDialog;
