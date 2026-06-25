import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  CalendarDays,
  Eye,
  Phone,
  FileText,
  StickyNote,
  Send,
  Sparkles,
  Flame,
  UserCog,
  Copy,
  Mail,
  ExternalLink,
  Building2,
  Activity,
  ClipboardCheck,
  PhoneCall,
  Repeat,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Lead, AssignedUser } from "./LeadCard";

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: AssignedUser[];
}

const activityIcons: Record<string, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  visit_scheduled: <CalendarDays className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  proposal: <FileText className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
};

const ACTIVITY_TYPES: { value: string; label: string }[] = [
  { value: "call", label: "Ligação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "note", label: "Anotação" },
  { value: "visit_scheduled", label: "Visita agendada" },
  { value: "proposal", label: "Proposta" },
  { value: "document", label: "Documento" },
];

// Estágios são carregados dinamicamente via usePipelineStages


const SCORES: { value: string; label: string; className: string }[] = [
  { value: "quente", label: "Quente", className: "bg-primary/10 text-primary border-primary/30" },
  { value: "morno", label: "Morno", className: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "frio", label: "Frio", className: "bg-blue-100 text-blue-700 border-blue-300" },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatCurrency = (value: number | null | undefined) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(value);

const parseCurrencyInput = (raw: string): number | null => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits);
};

export function LeadDetailModal({ lead, open, onOpenChange, team = [] }: LeadDetailModalProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [canReassign, setCanReassign] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [dealValueDraft, setDealValueDraft] = useState<string>("");
  const [savingDeal, setSavingDeal] = useState(false);
  const [activityType, setActivityType] = useState<string>("call");
  const [activityDescription, setActivityDescription] = useState("");
  const [registeringActivity, setRegisteringActivity] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        setCanReassign(false);
        return;
      }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const list = (roles || []).map((r: any) => r.role);
      setCanReassign(list.includes("admin") || list.includes("gerente"));
    })();
  }, []);

  useEffect(() => {
    setDealValueDraft(lead?.deal_value != null ? formatCurrency(lead.deal_value) : "");
    setActivityType("call");
    setActivityDescription("");
    setNewNote("");
  }, [lead?.id]);

  const { data: activities = [] } = useQuery({
    queryKey: ["lead_activities", lead?.id],
    queryFn: async () => {
      if (!lead) return [];
      const { data } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!lead,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["lead_notes", lead?.id],
    queryFn: async () => {
      if (!lead) return [];
      const { data } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!lead,
  });

  const { data: assignmentHistory = [] } = useQuery({
    queryKey: ["lead_assignment_history", lead?.id],
    queryFn: async () => {
      if (!lead) return [];
      const { data } = await supabase
        .from("lead_assignment_history")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!lead,
  });

  const normalizedPhone = useMemo(() => {
    if (!lead?.phone) return null;
    const digits = lead.phone.replace(/\D/g, "");
    if (!digits) return null;
    return digits.length > 11 ? digits.slice(-11) : digits;
  }, [lead?.phone]);
  const normalizedEmail = useMemo(
    () => (lead?.email ? lead.email.trim().toLowerCase() : null),
    [lead?.email],
  );

  const { data: relatedLeads = [] } = useQuery({
    queryKey: ["lead_recurrence", lead?.id, normalizedPhone, normalizedEmail],
    queryFn: async () => {
      if (!lead || (!normalizedPhone && !normalizedEmail)) return [];
      const ors: string[] = [];
      if (normalizedPhone) ors.push(`phone_normalized.eq.${normalizedPhone}`);
      if (normalizedEmail) ors.push(`email_normalized.eq.${normalizedEmail}`);
      const { data } = await supabase
        .from("leads")
        .select("id, name, pipeline_stage, origin, created_at, assigned_user_id, phone_normalized, email_normalized")
        .or(ors.join(","))
        .neq("id", lead.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!lead && (!!normalizedPhone || !!normalizedEmail),
  });

  const userIdToName = useMemo(() => {
    const m = new Map<string, string>();
    team.forEach((t) => m.set(t.user_id, t.full_name || "—"));
    return m;
  }, [team]);
  const nameOf = (uid: string | null) => (uid ? userIdToName.get(uid) || "Usuário" : "—");

  const score = SCORES.find((s) => s.value === lead?.score) || SCORES[1];
  const stage = STAGES.find((s) => s.value === lead?.pipeline_stage);
  const whatsappLink = lead?.phone ? `https://wa.me/55${lead.phone.replace(/\D/g, "")}` : null;
  const telLink = lead?.phone ? `tel:+55${lead.phone.replace(/\D/g, "")}` : null;
  const mailLink = lead?.email ? `mailto:${lead.email}` : null;
  const propertyHref = lead?.property_id ? `/imovel/${lead.property_id}` : null;

  const daysSinceContact = lead
    ? differenceInDays(new Date(), new Date(lead.last_contact_at))
    : 0;
  const daysSinceCreated = lead ? differenceInDays(new Date(), new Date(lead.created_at)) : 0;
  const daysInStage = lead ? differenceInDays(new Date(), new Date(lead.updated_at)) : 0;

  const invalidateLead = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  const handleReassign = async (newUserId: string) => {
    if (!lead || newUserId === lead.assigned_user_id) return;
    setReassigning(true);
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_user_id: newUserId,
        assigned_at: new Date().toISOString(),
        assignment_source: "manual",
      })
      .eq("id", lead.id);
    setReassigning(false);
    if (error) {
      toast({ title: "Erro ao reatribuir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lead reatribuído" });
    invalidateLead();
    queryClient.invalidateQueries({ queryKey: ["lead_assignment_history", lead.id] });
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead || newStage === lead.pipeline_stage) return;
    const { error } = await supabase
      .from("leads")
      .update({ pipeline_stage: newStage })
      .eq("id", lead.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estágio atualizado" });
    invalidateLead();
  };

  const handleScoreChange = async (newScore: string) => {
    if (!lead || newScore === lead.score) return;
    const { error } = await supabase.from("leads").update({ score: newScore }).eq("id", lead.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Score atualizado" });
    invalidateLead();
  };

  const handleSaveDealValue = async () => {
    if (!lead) return;
    const parsed = parseCurrencyInput(dealValueDraft);
    if (parsed === lead.deal_value) return;
    setSavingDeal(true);
    const { error } = await supabase
      .from("leads")
      .update({ deal_value: parsed })
      .eq("id", lead.id);
    setSavingDeal(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setDealValueDraft(parsed != null ? formatCurrency(parsed) : "");
    toast({ title: "Valor do negócio atualizado" });
    invalidateLead();
  };

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;
    setSendingNote(true);
    const { error } = await supabase
      .from("lead_notes")
      .insert({ lead_id: lead.id, content: newNote });
    setSendingNote(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setNewNote("");
    queryClient.invalidateQueries({ queryKey: ["lead_notes", lead.id] });
  };

  const registerActivity = async (type: string, description: string, touchContact = true) => {
    if (!lead || !description.trim()) {
      toast({ title: "Descreva a atividade", variant: "destructive" });
      return false;
    }
    setRegisteringActivity(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("lead_activities")
      .insert({ lead_id: lead.id, type, description });
    if (!error && touchContact) {
      await supabase.from("leads").update({ last_contact_at: now }).eq("id", lead.id);
    }
    setRegisteringActivity(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Atividade registrada" });
    queryClient.invalidateQueries({ queryKey: ["lead_activities", lead.id] });
    if (touchContact) invalidateLead();
    return true;
  };

  const handleQuickContact = async () => {
    if (!lead) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("leads")
      .update({ last_contact_at: now })
      .eq("id", lead.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      type: "note",
      description: "Contato registrado manualmente",
    });
    toast({ title: "Contato registrado" });
    queryClient.invalidateQueries({ queryKey: ["lead_activities", lead.id] });
    invalidateLead();
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copiado` });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden bg-background",
          "w-screen h-[100dvh] max-w-none rounded-none border-0",
          "sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:h-[min(92vh,820px)] sm:rounded-xl sm:border",
          "flex flex-col",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Detalhes do Lead</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="px-5 sm:px-7 pt-6 pb-4 border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
              <AvatarImage src={lead.avatar_url || undefined} />
              <AvatarFallback className="bg-muted font-[Raleway] text-lg font-semibold">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-[Raleway] text-xl font-semibold text-foreground truncate">
                  {lead.name}
                </h2>
                {lead.score === "quente" && (
                  <Flame className="h-4 w-4 text-primary animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground font-[Inter]">
                {lead.email && <span className="truncate">{lead.email}</span>}
                {lead.email && lead.phone && <span>·</span>}
                {lead.phone && <span>{lead.phone}</span>}
                {(lead.email || lead.phone) && <span>·</span>}
                <span className="capitalize">{lead.origin}</span>
                <span>·</span>
                <span>
                  Criado {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Select value={lead.pipeline_stage} onValueChange={handleStageChange}>
                  <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs font-[Inter]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[80] bg-popover">
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={lead.score} onValueChange={handleScoreChange}>
                  <SelectTrigger
                    className={cn(
                      "h-8 w-auto min-w-[110px] text-xs font-[Inter] border",
                      score.className,
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[80] bg-popover">
                    {SCORES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {stage && (
                  <Badge variant="outline" className="text-[10px] font-[Inter]">
                    {daysInStage}d no estágio
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4">
            {whatsappLink && (
              <Button size="sm" variant="outline" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                </a>
              </Button>
            )}
            {telLink && (
              <Button size="sm" variant="outline" asChild>
                <a href={telLink}>
                  <PhoneCall className="h-4 w-4 mr-1.5" /> Ligar
                </a>
              </Button>
            )}
            {mailLink && (
              <Button size="sm" variant="outline" asChild>
                <a href={mailLink}>
                  <Mail className="h-4 w-4 mr-1.5" /> E-mail
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleQuickContact}>
              <ClipboardCheck className="h-4 w-4 mr-1.5" /> Registrar contato
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="px-5 sm:px-7 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-border/40 bg-muted/20">
          <Kpi label="Valor do negócio" value={formatCurrency(lead.deal_value)} />
          <Kpi
            label="Último contato"
            value={
              daysSinceContact === 0
                ? "hoje"
                : `${daysSinceContact}d atrás`
            }
            tone={daysSinceContact >= 7 ? "warn" : undefined}
          />
          <Kpi label="No CRM" value={`${daysSinceCreated}d`} />
          <Kpi
            label="Responsável"
            value={lead.assigned_user?.full_name || "Não atribuído"}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col">
          <div className="px-5 sm:px-7 pt-3 border-b border-border/40">
            <TabsList className="bg-transparent p-0 h-auto gap-1 overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-muted data-[state=active]:shadow-none text-xs px-3 py-1.5"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="data-[state=active]:bg-muted data-[state=active]:shadow-none text-xs px-3 py-1.5"
              >
                Atividades {activities.length > 0 && <span className="ml-1 text-muted-foreground">({activities.length})</span>}
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-muted data-[state=active]:shadow-none text-xs px-3 py-1.5"
              >
                Notas {notes.length > 0 && <span className="ml-1 text-muted-foreground">({notes.length})</span>}
              </TabsTrigger>
              <TabsTrigger
                value="assignment"
                className="data-[state=active]:bg-muted data-[state=active]:shadow-none text-xs px-3 py-1.5"
              >
                Atribuição
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ====== Visão Geral ====== */}
          <TabsContent
            value="overview"
            className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 mt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Negócio */}
              <SectionCard title="Negócio" icon={<Activity className="h-4 w-4" />}>
                <div className="space-y-3">
                  <Field label="Valor do negócio">
                    <div className="flex gap-2">
                      <Input
                        value={dealValueDraft}
                        onChange={(e) => {
                          const parsed = parseCurrencyInput(e.target.value);
                          setDealValueDraft(parsed != null ? formatCurrency(parsed) : "");
                        }}
                        onBlur={handleSaveDealValue}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveDealValue()}
                        placeholder="R$ 0"
                        disabled={savingDeal}
                        className="h-9 text-sm"
                      />
                    </div>
                  </Field>
                  <Field label="Origem">
                    <Badge variant="outline" className="text-[11px] capitalize font-[Inter]">
                      {lead.origin}
                    </Badge>
                  </Field>
                  <Field label="Criado em">
                    <span className="text-sm font-[Inter]">
                      {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </Field>
                  <Field label="Último contato">
                    <span className="text-sm font-[Inter]">
                      {format(new Date(lead.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </Field>
                </div>
              </SectionCard>

              {/* Imóvel */}
              <SectionCard title="Imóvel de interesse" icon={<Building2 className="h-4 w-4" />}>
                {lead.properties ? (
                  <div className="space-y-3">
                    {lead.properties.photos?.[0] && (
                      <img
                        src={lead.properties.photos[0]}
                        alt={lead.properties.title}
                        className="w-full aspect-video object-cover rounded-md border border-border/50"
                      />
                    )}
                    <div>
                      <p className="text-sm font-[Raleway] font-semibold text-foreground">
                        {lead.properties.title}
                      </p>
                      {lead.properties.code && (
                        <p className="text-[11px] text-muted-foreground font-[Inter] mt-0.5">
                          Cód. {lead.properties.code}
                        </p>
                      )}
                    </div>
                    {propertyHref && (
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <a href={propertyHref} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir imóvel
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic font-[Inter]">
                    Nenhum imóvel vinculado a este lead.
                  </p>
                )}
              </SectionCard>

              {/* Contato rápido */}
              <SectionCard title="Contato" icon={<Phone className="h-4 w-4" />}>
                <div className="space-y-2.5">
                  <CopyableRow
                    label="E-mail"
                    value={lead.email}
                    href={mailLink}
                    onCopy={(v) => handleCopy(v, "E-mail")}
                  />
                  <CopyableRow
                    label="Telefone"
                    value={lead.phone}
                    href={telLink}
                    onCopy={(v) => handleCopy(v, "Telefone")}
                  />
                </div>
              </SectionCard>

              {/* AI Insights */}
              {lead.ai_insights && (
                <SectionCard
                  title="Insights da IA"
                  icon={<Sparkles className="h-4 w-4 text-primary" />}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed font-[Inter]">
                    {lead.ai_insights}
                  </p>
                </SectionCard>
              )}
            </div>

            {/* Histórico do Cliente */}
            {relatedLeads.length > 0 && (
              <SectionCard
                title={`Histórico do cliente (${relatedLeads.length})`}
                icon={<Repeat className="h-4 w-4 text-secondary" />}
              >
                <p className="text-[11px] text-muted-foreground font-[Inter] mb-3">
                  Outros cadastros encontrados com o mesmo {normalizedPhone ? "telefone" : "e-mail"}.
                  {lead.assignment_source === "recurring" && (
                    <span className="ml-1 text-secondary font-medium">
                      Este lead foi atribuído por recorrência.
                    </span>
                  )}
                </p>
                <ul className="space-y-2">
                  {relatedLeads.map((rl: any) => {
                    const matchType =
                      normalizedPhone && rl.phone_normalized === normalizedPhone
                        ? "telefone"
                        : "e-mail";
                    return (
                      <li
                        key={rl.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-[Inter] text-foreground truncate">
                            {rl.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 font-[Inter]">
                            {format(new Date(rl.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            {" · "}
                            <span className="capitalize">{rl.pipeline_stage.replace("_", " ")}</span>
                            {" · "}match por {matchType}
                            {rl.assigned_user_id && (
                              <>
                                {" · "}corretor: {nameOf(rl.assigned_user_id)}
                              </>
                            )}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            )}
          </TabsContent>

          {/* ====== Atividades ====== */}
          <TabsContent
            value="activities"
            className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 mt-0"
          >
            <SectionCard title="Registrar atividade" icon={<Activity className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[80] bg-popover">
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    placeholder="Descreva o que aconteceu…"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ok = await registerActivity(activityType, activityDescription);
                      if (ok) setActivityDescription("");
                    }}
                    disabled={registeringActivity || !activityDescription.trim()}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Registrar
                  </Button>
                </div>
              </div>
            </SectionCard>

            <div>
              <h4 className="font-[Raleway] text-sm font-semibold mb-3">Timeline</h4>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 italic font-[Inter]">
                  Nenhuma atividade registrada ainda.
                </p>
              ) : (
                <div className="space-y-0">
                  {activities.map((act: any, i: number) => (
                    <div key={act.id} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          {activityIcons[act.type] || <StickyNote className="h-4 w-4" />}
                        </div>
                        {i < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="pb-4 min-w-0 flex-1">
                        <p className="text-sm text-foreground font-[Inter]">{act.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {format(new Date(act.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          {" · "}
                          {formatDistanceToNow(new Date(act.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ====== Notas ====== */}
          <TabsContent
            value="notes"
            className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5 space-y-4 mt-0"
          >
            <SectionCard title="Nova nota" icon={<StickyNote className="h-4 w-4" />}>
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escreva uma anotação interna…"
                  className="min-h-[80px] text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleAddNote}
                  disabled={sendingNote || !newNote.trim()}
                  className="shrink-0 self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </SectionCard>

            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 italic font-[Inter]">
                  Nenhuma nota ainda.
                </p>
              ) : (
                notes.map((note: any) => (
                  <div
                    key={note.id}
                    className="bg-muted/50 rounded-lg p-3 border border-border/30"
                  >
                    <p className="text-sm text-foreground font-[Inter] whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-[Inter]">
                      {note.author || "Equipe"} ·{" "}
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ====== Atribuição ====== */}
          <TabsContent
            value="assignment"
            className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 mt-0"
          >
            <SectionCard title="Responsável atual" icon={<UserCog className="h-4 w-4" />}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={lead.assigned_user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(lead.assigned_user?.full_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-[Raleway] font-semibold truncate">
                    {lead.assigned_user?.full_name || "Não atribuído"}
                  </p>
                  {lead.assignment_source && (
                    <p className="text-[11px] text-muted-foreground font-[Inter]">
                      Origem: {lead.assignment_source}
                      {(lead as any).last_assignment_rule_name
                        ? ` · regra «${(lead as any).last_assignment_rule_name}»`
                        : ""}
                    </p>
                  )}
                </div>
              </div>

              {canReassign && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-[Inter]">Reatribuir para</p>
                  <Select
                    value={lead.assigned_user_id || ""}
                    onValueChange={handleReassign}
                    disabled={reassigning}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent className="z-[80] bg-popover">
                      {team.map((t) => (
                        <SelectItem key={t.user_id} value={t.user_id}>
                          {t.full_name || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Histórico de atribuição">
              {assignmentHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 italic font-[Inter]">
                  Nenhuma reatribuição registrada.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignmentHistory.map((h: any) => (
                    <li
                      key={h.id}
                      className="text-xs font-[Inter] text-muted-foreground leading-relaxed border-l-2 border-border pl-3"
                    >
                      <div>
                        <span className="text-foreground">{nameOf(h.from_user_id)}</span>
                        {" → "}
                        <span className="text-foreground font-medium">{nameOf(h.to_user_id)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground/80">
                        {h.source}
                        {h.rule_name ? ` · regra «${h.rule_name}»` : ""}
                        {h.distribution_type ? ` (${h.distribution_type})` : ""}
                        {" · "}
                        {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Small UI primitives ---------- */

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80 font-[Inter]">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-[Raleway] font-semibold truncate",
          tone === "warn" ? "text-amber-700" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h4 className="font-[Raleway] text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80 font-[Inter]">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function CopyableRow({
  label,
  value,
  href,
  onCopy,
}: {
  label: string;
  value: string | null;
  href: string | null;
  onCopy: (v: string) => void;
}) {
  if (!value) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-[Inter]">{label}</span>
        <span className="text-sm text-muted-foreground/70 italic font-[Inter]">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-[Inter]">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground font-[Inter] truncate hover:underline block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground font-[Inter] truncate">{value}</p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={() => onCopy(value)}
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
