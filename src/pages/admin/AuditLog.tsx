import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  CalendarIcon,
  Download,
  DollarSign,
} from "lucide-react";
import { format, formatDistanceToNow, subHours, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type AuditLog = {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  object_type: string;
  object_id: string | null;
  object_label: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ACTION_BADGES: Record<string, { emoji: string; label: string; className: string }> = {
  imovel: { emoji: "🏠", label: "Imóvel", className: "bg-blue-50 text-blue-700 border-blue-200" },
  lead: { emoji: "👤", label: "Lead", className: "bg-stone-100 text-stone-600 border-stone-200" },
  visita: { emoji: "📅", label: "Visita", className: "bg-amber-50 text-amber-700 border-amber-200" },
  blog_post: { emoji: "📝", label: "Blog", className: "bg-purple-50 text-purple-700 border-purple-200" },
  preco: { emoji: "💰", label: "Preço", className: "bg-[#2A070C]/10 text-[#2A070C] border-[#2A070C]/20" },
};

function getBadge(log: AuditLog) {
  const meta = log.metadata as Record<string, string> | null;
  if (meta?.field === "price") return ACTION_BADGES.preco;
  return ACTION_BADGES[log.object_type] ?? { emoji: "📋", label: log.object_type, className: "bg-muted text-muted-foreground border-border" };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const PAGE_SIZE = 15;

const AuditLog = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all logs (up to 1000)
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  // Distinct users for filter
  const distinctUsers = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => {
      if (l.user_id) map.set(l.user_id, l.user_name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [logs]);

  // Filtered logs
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (selectedUser !== "all" && l.user_id !== selectedUser) return false;
      if (dateRange?.from) {
        const d = new Date(l.created_at);
        if (dateRange.to) {
          if (!isWithinInterval(d, { start: dateRange.from, end: dateRange.to })) return false;
        } else {
          if (d < dateRange.from) return false;
        }
      }
      return true;
    });
  }, [logs, selectedUser, dateRange]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUser, dateRange]);

  // Metrics
  const now = new Date();
  const last24h = subHours(now, 24);
  const actionsLast24h = logs.filter((l) => new Date(l.created_at) >= last24h).length;
  const priceChanges24h = logs.filter(
    (l) =>
      new Date(l.created_at) >= last24h &&
      l.object_type === "imovel" &&
      l.action === "editou" &&
      (l.metadata as Record<string, string>)?.field === "price"
  ).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleLogs = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // CSV export
  const exportCSV = () => {
    const rows = [["Data", "Usuário", "Ação", "Objeto", "Valor Antigo", "Valor Novo"]];
    filtered.forEach((l) => {
      rows.push([
        format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
        l.user_name,
        l.action,
        l.object_label ?? "",
        l.old_value ?? "",
        l.new_value ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(now, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[Raleway] text-xl font-semibold text-foreground tracking-tight">
            Atividade Global
          </h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-0.5">
            Log completo de ações do sistema
          </p>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-border/50 shadow-none rounded-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-sm bg-[#2A070C]/5 flex items-center justify-center">
              <Activity className="h-5 w-5 text-[#2A070C]" />
            </div>
            <div>
              <p className="font-[Inter] text-xs text-muted-foreground uppercase tracking-wider">
                Ações nas últimas 24h
              </p>
              <p className="font-[Raleway] text-2xl font-semibold text-foreground">
                {actionsLast24h}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-none rounded-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-sm bg-[#2A070C]/5 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#2A070C]" />
            </div>
            <div>
              <p className="font-[Inter] text-xs text-muted-foreground uppercase tracking-wider">
                Alterações de Preço (24h)
              </p>
              <p className="font-[Raleway] text-2xl font-semibold text-foreground">
                {priceChanges24h}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px] rounded-sm bg-white font-[Inter] text-sm">
            <SelectValue placeholder="Todos os corretores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os corretores</SelectItem>
            {distinctUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[260px] justify-start text-left font-[Inter] text-sm rounded-sm bg-white",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yy")} – {format(dateRange.to, "dd/MM/yy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                "Selecionar período"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {dateRange?.from && (
          <Button
            variant="ghost"
            size="sm"
            className="font-[Inter] text-xs"
            onClick={() => setDateRange(undefined)}
          >
            Limpar datas
          </Button>
        )}

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm font-[Inter] text-sm gap-2"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="py-20 text-center">
            <p className="font-[Inter] text-sm text-muted-foreground animate-pulse">
              Carregando atividades...
            </p>
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="py-20 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-[Inter] text-sm text-muted-foreground">
              Nenhuma atividade encontrada
            </p>
          </div>
        ) : (
          <>
            {visibleLogs.map((log) => {
              const badge = getBadge(log);
              return (
                <Card
                  key={log.id}
                  className="bg-white border-border/50 shadow-none rounded-sm hover:bg-muted/30 transition-colors"
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <Avatar className="h-8 w-8 rounded-sm shrink-0">
                      <AvatarFallback className="rounded-sm bg-[#2A070C]/5 text-[#2A070C] font-[Inter] text-[10px] font-medium">
                        {getInitials(log.user_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-[Inter] text-sm text-foreground leading-relaxed">
                        <span className="font-medium">{log.user_name}</span>{" "}
                        <span className="text-muted-foreground">{log.action}</span>{" "}
                        {log.object_label && (
                          <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                            {log.object_label}
                          </span>
                        )}
                        {log.old_value && log.new_value && (
                          <>
                            {" "}
                            <span className="text-muted-foreground">de</span>{" "}
                            <span className="font-mono text-xs line-through text-muted-foreground">
                              {log.old_value}
                            </span>{" "}
                            <span className="text-muted-foreground">para</span>{" "}
                            <span className="font-mono text-xs font-medium text-foreground">
                              {log.new_value}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="font-[Inter] text-[11px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] font-[Inter] font-medium rounded-sm px-2 py-0.5",
                        badge.className
                      )}
                    >
                      {badge.emoji} {badge.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-[Inter] text-sm rounded-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="font-[Inter] text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-[Inter] text-sm rounded-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Próximo
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
