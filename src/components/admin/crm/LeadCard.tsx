import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame, Instagram, Globe, MessageCircle, Users, Mail, CalendarCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  pipeline_stage: string;
  score: string;
  origin: string;
  property_id: string | null;
  deal_value: number | null;
  ai_insights: string | null;
  last_contact_at: string;
  created_at: string;
  updated_at: string;
  properties?: {
    title: string;
    photos: string[] | null;
    code: string;
  } | null;
}

interface LeadCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onClick: (lead: Lead) => void;
}

const originIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3.5 w-3.5 text-muted-foreground" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />,
  web: <Globe className="h-3.5 w-3.5 text-muted-foreground" />,
  indicacao: <Users className="h-3.5 w-3.5 text-muted-foreground" />,
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function LeadCard({ lead, onDragStart, onClick }: LeadCardProps) {
  const isQuente = lead.score === "quente";
  const isMorno = lead.score === "morno";
  const thumbnail = lead.properties?.photos?.[0];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onClick(lead)}
      className={cn(
        "group cursor-grab active:cursor-grabbing rounded-lg border bg-card p-3.5 transition-all duration-200",
        "hover:shadow-sm active:scale-[1.03] active:shadow-lg active:rotate-1",
        isQuente && "border-primary shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]",
        isMorno && "border-secondary/60",
        !isQuente && !isMorno && "border-border"
      )}
    >
      {/* Header: Avatar + Name + Origin */}
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={lead.avatar_url || undefined} />
          <AvatarFallback className="bg-muted font-[Raleway] text-xs font-semibold text-foreground">
            {getInitials(lead.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-[Raleway] text-sm font-semibold text-foreground truncate">{lead.name}</p>
            {isQuente && (
              <Flame className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {originIcons[lead.origin] || originIcons.web}
            <span className="text-[11px] text-muted-foreground capitalize">{lead.origin}</span>
          </div>
        </div>
      </div>

      {/* Property thumbnail + deal value */}
      {(thumbnail || lead.deal_value) && (
        <div className="flex items-center gap-2.5 mt-3">
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              className="h-10 w-14 rounded object-cover border border-border/50"
            />
          )}
          <div className="min-w-0">
            {lead.properties?.title && (
              <p className="text-[11px] text-muted-foreground truncate">{lead.properties.title}</p>
            )}
            {lead.deal_value && (
              <p className="font-[Inter] text-xs font-semibold text-foreground">
                {formatCurrency(lead.deal_value)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/70 mt-3 font-[Inter]">
        Último contato {formatDistanceToNow(new Date(lead.last_contact_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  );
}
