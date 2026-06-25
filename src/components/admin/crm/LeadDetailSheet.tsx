import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, CalendarDays, Eye, Phone, FileText, StickyNote, Send, Sparkles, Flame, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead, AssignedUser } from "./LeadCard";

interface LeadDetailSheetProps {
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

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const scoreConfig: Record<string, { label: string; className: string }> = {
  quente: { label: "Quente", className: "bg-primary/10 text-primary border-primary/30" },
  morno: { label: "Morno", className: "bg-amber-100 text-amber-700 border-amber-300" },
  frio: { label: "Frio", className: "bg-blue-100 text-blue-700 border-blue-300" },
};

export function LeadDetailSheet({ lead, open, onOpenChange, team = [] }: LeadDetailSheetProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [canReassign, setCanReassign] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) { setCanReassign(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const list = (roles || []).map((r: any) => r.role);
      setCanReassign(list.includes("admin") || list.includes("gerente"));
    })();
  }, []);

  const handleReassign = async (newUserId: string) => {
    if (!lead || newUserId === lead.assigned_user_id) return;
    setReassigning(true);
    const { error } = await supabase
      .from("leads")
      .update({ assigned_user_id: newUserId, assigned_at: new Date().toISOString(), assignment_source: "manual" })
      .eq("id", lead.id);
    setReassigning(false);
    if (error) {
      toast({ title: "Erro ao reatribuir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lead reatribuído" });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

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

  const userIdToName = new Map<string, string>();
  team.forEach((t) => userIdToName.set(t.user_id, t.full_name || "—"));
  const nameOf = (uid: string | null) => (uid ? userIdToName.get(uid) || "Usuário" : "—");

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;
    setSendingNote(true);
    const { error } = await supabase.from("lead_notes").insert({ lead_id: lead.id, content: newNote });
    setSendingNote(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["lead_notes", lead.id] });
    }
  };

  if (!lead) return null;
  const score = scoreConfig[lead.score] || scoreConfig.morno;
  const whatsappLink = lead.phone ? `https://wa.me/55${lead.phone.replace(/\D/g, "")}` : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>

        {/* Top: Profile + CTAs */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={lead.avatar_url || undefined} />
              <AvatarFallback className="bg-muted font-[Raleway] text-lg font-semibold">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-[Raleway] text-lg font-semibold text-foreground truncate">{lead.name}</h2>
                {lead.score === "quente" && <Flame className="h-4 w-4 text-primary animate-pulse" />}
              </div>
              {lead.email && <p className="text-sm text-muted-foreground">{lead.email}</p>}
              {lead.phone && <p className="text-sm text-muted-foreground">{lead.phone}</p>}
              <Badge variant="outline" className={`mt-2 text-[10px] ${score.className}`}>
                {score.label}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {whatsappLink && (
              <Button size="sm" variant="outline" asChild className="flex-1">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" className="flex-1">
              <CalendarDays className="h-4 w-4 mr-1" /> Agendar Visita
            </Button>
          </div>
        </div>

        <Separator />

        {/* AI Insights */}
        {lead.ai_insights && (
          <>
            <div className="p-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-[Raleway] text-sm font-semibold">Insights da IA</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                {lead.ai_insights}
              </p>
            </div>
            <Separator />
          </>
        )}

        {/* Responsável */}
        <div className="p-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-[Raleway] text-sm font-semibold">Responsável</h3>
          </div>
          {canReassign ? (
            <Select value={lead.assigned_user_id || ""} onValueChange={handleReassign} disabled={reassigning}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent className="z-[70] bg-popover">
                {team.map((t) => (
                  <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={lead.assigned_user?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{getInitials(lead.assigned_user?.full_name || "?")}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{lead.assigned_user?.full_name || "Não atribuído"}</span>
            </div>
          )}
          {lead.assignment_source && (
            <p className="text-[10px] text-muted-foreground/70 mt-2 font-[Inter]">Origem da atribuição: {lead.assignment_source}</p>
          )}

          {assignmentHistory.length > 0 && (
            <div className="mt-3 border-t border-border/40 pt-3">
              <p className="text-[11px] font-[Raleway] font-semibold text-muted-foreground mb-2">Histórico</p>
              <ul className="space-y-1.5">
                {assignmentHistory.map((h: any) => (
                  <li key={h.id} className="text-[11px] text-muted-foreground font-[Inter] leading-snug">
                    <span className="text-foreground">{nameOf(h.from_user_id)}</span>
                    {" → "}
                    <span className="text-foreground font-medium">{nameOf(h.to_user_id)}</span>
                    {h.source && <span className="text-muted-foreground/70"> · {h.source}</span>}
                    <span className="text-muted-foreground/60">
                      {" · "}
                      {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Separator />


        {/* Timeline */}
        <div className="p-6 py-4">
          <h3 className="font-[Raleway] text-sm font-semibold mb-3">Timeline</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 italic">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-0">
              {activities.map((act, i) => (
                <div key={act.id} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      {activityIcons[act.type] || <StickyNote className="h-4 w-4" />}
                    </div>
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm text-foreground">{act.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Notes */}
        <div className="p-6 py-4">
          <h3 className="font-[Raleway] text-sm font-semibold mb-3">Notas</h3>
          <div className="flex gap-2 mb-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Adicionar nota..."
              className="min-h-[60px] text-sm"
            />
            <Button size="icon" variant="outline" onClick={handleAddNote} disabled={sendingNote || !newNote.trim()} className="shrink-0 self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {note.author} · {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
