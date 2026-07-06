import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PresenceStatus = "online" | "recent" | "idle" | "offline";

export interface PresenceInfo {
  status: PresenceStatus;
  dotClass: string;
  label: string;
  lastSeenLabel: string;
}

export function derivePresence(lastSeenAt: string | null | undefined): PresenceInfo {
  if (!lastSeenAt) {
    return {
      status: "offline",
      dotClass: "bg-slate-300",
      label: "Sem acesso registrado",
      lastSeenLabel: "Nunca acessou",
    };
  }

  const last = new Date(lastSeenAt);
  const diffMs = Date.now() - last.getTime();
  const minutes = diffMs / 60000;
  const hours = minutes / 60;
  const days = hours / 24;

  const distance = formatDistanceToNowStrict(last, { locale: ptBR, addSuffix: false });
  const lastSeenLabel = minutes < 1 ? "Agora mesmo" : `Há ${distance}`;

  if (minutes < 10) {
    return { status: "online", dotClass: "bg-emerald-500", label: "Online agora", lastSeenLabel };
  }
  if (hours < 24) {
    return { status: "recent", dotClass: "bg-amber-500", label: "Ativo hoje", lastSeenLabel };
  }
  if (days < 7) {
    return { status: "idle", dotClass: "bg-slate-400", label: "Ausente há dias", lastSeenLabel };
  }
  return { status: "offline", dotClass: "bg-slate-300", label: "Offline", lastSeenLabel };
}
