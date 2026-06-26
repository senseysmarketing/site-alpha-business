import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRPhone, onlyDigits } from "@/lib/phone";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialDate?: Date;
  onSaved?: () => void;
}

type EventType = "visita" | "evento" | "tarefa";

interface Draft {
  event_type: EventType;
  title: string;
  visit_date: string;
  visit_time: string;
  status: string;
  assigned_user_id: string | null;
  lead_id: string | null;
  property_id: string | null;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  property_code: string;
  notes: string;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "visita", label: "Visita" },
  { value: "evento", label: "Evento" },
  { value: "tarefa", label: "Tarefa" },
];

const STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "realizado", label: "Realizado" },
  { value: "cancelado", label: "Cancelado" },
];

const emptyDraft = (date: Date): Draft => ({
  event_type: "visita",
  title: "",
  visit_date: format(date, "yyyy-MM-dd"),
  visit_time: "10:00",
  status: "pendente",
  assigned_user_id: null,
  lead_id: null,
  property_id: null,
  lead_name: "",
  lead_email: "",
  lead_phone: "",
  property_code: "",
  notes: "",
});

export function AgendaEventDialog({ open, onOpenChange, initialDate, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(emptyDraft(initialDate ?? new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({
        ...emptyDraft(initialDate ?? new Date()),
        assigned_user_id: user?.id ?? null,
      });
    }
  }, [open, initialDate, user?.id]);

  const { data: team = [] } = useQuery({
    queryKey: ["team_profiles_agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_profiles")
        .select("user_id, full_name, is_active")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return (data || []) as { user_id: string; full_name: string }[];
    },
    enabled: open,
  });

  const { data: leadOptions = [] } = useQuery({
    queryKey: ["agenda_leads_quick"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, email, phone")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as { id: string; name: string; email: string | null; phone: string | null }[];
    },
    enabled: open,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["agenda_properties_quick"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, code, title")
        .order("code")
        .limit(200);
      return (data || []) as { id: string; code: string | null; title: string | null }[];
    },
    enabled: open,
  });

  const handleSubmit = async () => {
    if (!draft.title.trim() && draft.event_type !== "visita") {
      toast({ title: "Informe um título", variant: "destructive" });
      return;
    }
    if (draft.event_type === "visita" && !draft.lead_name.trim()) {
      toast({ title: "Informe o nome do cliente", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        event_type: draft.event_type,
        title: draft.title || draft.lead_name || "Compromisso",
        visit_date: draft.visit_date,
        visit_time: draft.visit_time,
        status: draft.status,
        assigned_user_id: draft.assigned_user_id,
        created_by: user?.id ?? null,
        lead_id: draft.lead_id,
        property_id: draft.property_id,
        lead_name: draft.lead_name || "—",
        lead_email: draft.lead_email || "",
        lead_phone: onlyDigits(draft.lead_phone),
        property_code: draft.property_code || "",
        broker_name: team.find((t) => t.user_id === draft.assigned_user_id)?.full_name || "Admin",
        notes: draft.notes || null,
      };
      const { error } = await supabase.from("visits_scheduling").insert(payload);
      if (error) throw error;
      toast({ title: "Compromisso criado" });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isVisita = draft.event_type === "visita";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Raleway] flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Novo compromisso
          </DialogTitle>
          <DialogDescription className="font-[Inter]">
            Crie visitas, eventos ou tarefas e atribua a um membro da equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-[Inter]">Tipo</Label>
              <Select
                value={draft.event_type}
                onValueChange={(v) => setDraft({ ...draft, event_type: v as EventType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-[Inter]">Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-[Inter]">Título</Label>
            <Input
              value={draft.title}
              placeholder={isVisita ? "Ex: Visita ao Alphaville 1" : "Ex: Reunião de alinhamento"}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-[Inter]">Data</Label>
              <Input
                type="date"
                value={draft.visit_date}
                onChange={(e) => setDraft({ ...draft, visit_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-[Inter]">Horário</Label>
              <Input
                type="time"
                value={draft.visit_time}
                onChange={(e) => setDraft({ ...draft, visit_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-[Inter]">Responsável</Label>
            <Select
              value={draft.assigned_user_id ?? ""}
              onValueChange={(v) => setDraft({ ...draft, assigned_user_id: v || null })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {team.map((t) => (
                  <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isVisita && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-[Inter]">Lead vinculado (opcional)</Label>
                <Select
                  value={draft.lead_id ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      setDraft({ ...draft, lead_id: null });
                      return;
                    }
                    const lead = leadOptions.find((l) => l.id === v);
                    setDraft({
                      ...draft,
                      lead_id: v,
                      lead_name: lead?.name ?? draft.lead_name,
                      lead_email: lead?.email ?? draft.lead_email,
                      lead_phone: formatBRPhone(lead?.phone ?? draft.lead_phone),
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {leadOptions.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-[Inter]">Nome do cliente</Label>
                  <Input value={draft.lead_name} onChange={(e) => setDraft({ ...draft, lead_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-[Inter]">Telefone</Label>
                  <Input
                    value={draft.lead_phone}
                    onChange={(e) => setDraft({ ...draft, lead_phone: formatBRPhone(e.target.value) })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-[Inter]">E-mail</Label>
                <Input
                  type="email"
                  value={draft.lead_email}
                  onChange={(e) => setDraft({ ...draft, lead_email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-[Inter]">Imóvel</Label>
                <Select
                  value={draft.property_id ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      setDraft({ ...draft, property_id: null, property_code: "" });
                      return;
                    }
                    const p = properties.find((x) => x.id === v);
                    setDraft({ ...draft, property_id: v, property_code: p?.code ?? "" });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} {p.title ? `· ${p.title.slice(0, 40)}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-[Inter]">Notas</Label>
            <Textarea
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#2A070C] hover:bg-[#2A070C]/90">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AgendaEventDialog;
