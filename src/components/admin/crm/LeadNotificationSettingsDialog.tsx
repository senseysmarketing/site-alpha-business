import { useEffect, useState } from "react";
import { Bell, Mail, Plus, Send, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LeadEmailNotificationsConfig {
  enabled: boolean;
  recipients: string[];
  subjectTemplate?: string;
  notifyOrigins?: string[];
  notifyStages?: string[];
  includeLeadContact?: boolean;
  includeProperty?: boolean;
  includeInsights?: boolean;
}

const ORIGINS: { value: string; label: string }[] = [
  { value: "formulario_contato", label: "Formulário de contato" },
  { value: "agendamento_visita", label: "Agendamento de visita" },
  { value: "anunciar_imovel", label: "Anunciar imóvel" },
  { value: "rafa_ia", label: "Rafa IA" },
  { value: "manual", label: "Cadastro manual" },
];

const STAGES: { value: string; label: string }[] = [
  { value: "novos", label: "Novos" },
  { value: "visita_agendada", label: "Visita agendada" },
  { value: "proposta", label: "Proposta" },
  { value: "contrato", label: "Contrato" },
  { value: "fechado", label: "Fechado" },
];

const DEFAULT_CONFIG: LeadEmailNotificationsConfig = {
  enabled: false,
  recipients: [],
  subjectTemplate: "Novo lead recebido — {{name}}",
  notifyOrigins: [],
  notifyStages: [],
  includeLeadContact: true,
  includeProperty: true,
  includeInsights: true,
};

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadNotificationSettingsDialog({ open, onOpenChange }: Props) {
  const { data, isLoading, save, isSaving } =
    useSiteSettings<LeadEmailNotificationsConfig>("lead_email_notifications");

  const [draft, setDraft] = useState<LeadEmailNotificationsConfig>(DEFAULT_CONFIG);
  const [emailInput, setEmailInput] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({ ...DEFAULT_CONFIG, ...(data ?? {}) });
      setEmailInput("");
    }
  }, [open, data]);

  const addEmail = () => {
    const value = emailInput.trim().toLowerCase();
    if (!isValidEmail(value)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    if (draft.recipients.includes(value)) {
      setEmailInput("");
      return;
    }
    setDraft({ ...draft, recipients: [...draft.recipients, value] });
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setDraft({ ...draft, recipients: draft.recipients.filter((e) => e !== email) });
  };

  const toggleArrayValue = (
    key: "notifyOrigins" | "notifyStages",
    value: string,
  ) => {
    const current = draft[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setDraft({ ...draft, [key]: next });
  };

  const handleSave = () => {
    if (draft.enabled && draft.recipients.length === 0) {
      toast({
        title: "Adicione pelo menos um destinatário",
        variant: "destructive",
      });
      return;
    }
    save(draft);
    onOpenChange(false);
  };

  const handleSendTest = async () => {
    const recipients = draft.recipients.filter(isValidEmail);
    if (recipients.length === 0) {
      toast({ title: "Adicione um destinatário antes de testar", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke(
        "send-lead-notification",
        { body: { mode: "test", recipients } },
      );
      if (error) throw error;
      const status = (resp as any)?.status;
      if (status === "sent") {
        toast({ title: "E-mail de teste enviado", description: recipients.join(", ") });
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
            <Bell className="h-4 w-4" /> Notificações de novos leads
          </DialogTitle>
          <DialogDescription className="font-[Inter]">
            Configure quem recebe um e-mail sempre que um novo lead entrar no CRM.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-6 py-2">
            {/* Enable */}
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

            {/* Recipients */}
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Destinatários</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {draft.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {draft.recipients.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="font-[Inter] gap-1 pl-3 pr-1 py-1"
                    >
                      <Mail className="h-3 w-3" />
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        aria-label={`Remover ${email}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Assunto do e-mail</Label>
              <Input
                value={draft.subjectTemplate ?? ""}
                onChange={(e) => setDraft({ ...draft, subjectTemplate: e.target.value })}
                placeholder="Novo lead recebido — {{name}}"
              />
              <p className="text-[11px] text-muted-foreground font-[Inter]">
                Você pode usar {"{{name}}"} e {"{{origin}}"}.
              </p>
            </div>

            {/* Origin filter */}
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Origens notificadas</Label>
              <p className="text-xs text-muted-foreground font-[Inter]">
                Deixe tudo desmarcado para notificar todas as origens.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {ORIGINS.map((o) => (
                  <label
                    key={o.value}
                    className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer"
                  >
                    <Checkbox
                      checked={draft.notifyOrigins?.includes(o.value) ?? false}
                      onCheckedChange={() => toggleArrayValue("notifyOrigins", o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Stage filter */}
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Estágios notificados</Label>
              <p className="text-xs text-muted-foreground font-[Inter]">
                Deixe tudo desmarcado para notificar todos os estágios.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {STAGES.map((s) => (
                  <label
                    key={s.value}
                    className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer"
                  >
                    <Checkbox
                      checked={draft.notifyStages?.includes(s.value) ?? false}
                      onCheckedChange={() => toggleArrayValue("notifyStages", s.value)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Content options */}
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Conteúdo do e-mail</Label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                  <Checkbox
                    checked={draft.includeLeadContact ?? true}
                    onCheckedChange={(v) =>
                      setDraft({ ...draft, includeLeadContact: !!v })
                    }
                  />
                  Incluir e-mail e telefone do lead
                </label>
                <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                  <Checkbox
                    checked={draft.includeProperty ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, includeProperty: !!v })}
                  />
                  Incluir imóvel de interesse
                </label>
                <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer">
                  <Checkbox
                    checked={draft.includeInsights ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, includeInsights: !!v })}
                  />
                  Incluir insights do CRM
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSendTest}
            disabled={testing || draft.recipients.length === 0}
          >
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
