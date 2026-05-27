import { useEffect, useState } from "react";
import { Building2, Users, CalendarCheck, TrendingUp, Mail, Calendar, Globe, Phone, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const sparkData = [
  { v: 3 }, { v: 5 }, { v: 4 }, { v: 7 }, { v: 6 }, { v: 8 }, { v: 9 }, { v: 7 }, { v: 10 },
];

const ORIGIN_MAP: Record<string, { icon: React.ElementType; label: string }> = {
  fale_conosco: { icon: Mail, label: "Fale Conosco" },
  agendamento_visita: { icon: Calendar, label: "Agendamento" },
  web: { icon: Globe, label: "Website" },
  indicacao: { icon: UserPlus, label: "Indicação" },
  telefone: { icon: Phone, label: "Telefone" },
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const Dashboard = () => {
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeProperties, setActiveProperties] = useState(0);
  const [visitsToday, setVisitsToday] = useState(0);
  const [netRevenue, setNetRevenue] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [leadsRes, propsRes, visitsRes, txRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("visits_scheduling").select("id", { count: "exact", head: true }).eq("visit_date", new Date().toISOString().split("T")[0]),
        supabase.from("transactions").select("sale_value, commission_pct, broker_payout"),
      ]);
      setTotalLeads(leadsRes.count ?? 0);
      setActiveProperties(propsRes.count ?? 0);
      setVisitsToday(visitsRes.count ?? 0);
      if (txRes.data) {
        const rev = txRes.data.reduce(
          (s, t) => s + Number(t.sale_value || 0) * (Number(t.commission_pct || 0) / 100) - Number(t.broker_payout || 0),
          0
        );
        setNetRevenue(rev);
      }
    };
    fetchData();
  }, []);

  const { data: recentLeads = [] } = useQuery({
    queryKey: ["dashboard-recent-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, origin, pipeline_stage, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_audit_logs")
        .select("id, user_name, action, object_label, object_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cards = [
    { title: "Total de Leads", value: totalLeads, icon: Users, hasChart: true },
    { title: "Imóveis Ativos", value: activeProperties, icon: Building2, hasChart: false },
    { title: "Visitas Hoje", value: visitsToday, icon: CalendarCheck, hasChart: false },
    { title: "Receita Líquida", value: netRevenue !== null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(netRevenue) : "—", icon: TrendingUp, hasChart: false },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="font-[Inter] text-sm text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-white border-border/50 shadow-none hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-[#2A070C]/40" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-[Raleway] text-3xl font-semibold text-foreground">{card.value}</p>
                  {"subtitle" in card && card.subtitle && <p className="font-[Inter] text-[10px] text-muted-foreground mt-1">{String(card.subtitle)}</p>}
                </div>
                {card.hasChart && (
                  <div className="w-20 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2A070C" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#2A070C" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#2A070C" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Últimos Leads */}
        <Card className="lg:col-span-2 bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">Últimos Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="font-[Inter] text-sm text-muted-foreground/60">Nenhum lead encontrado.</p>
            ) : (
              recentLeads.map((lead) => {
                const originInfo = ORIGIN_MAP[lead.origin] ?? { icon: Globe, label: lead.origin };
                const OriginIcon = originInfo.icon;
                return (
                  <div key={lead.id} className="flex items-center gap-3 py-1.5">
                    <Avatar className="h-8 w-8 rounded-sm shrink-0">
                      <AvatarFallback className="rounded-sm bg-[#2A070C]/5 text-[#2A070C] font-[Inter] text-[10px] font-medium">
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-[Inter] text-sm font-medium text-foreground truncate">{lead.name}</p>
                      <p className="font-[Inter] text-[11px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] font-[Inter] font-medium rounded-sm px-2 py-0.5 gap-1">
                      <OriginIcon className="h-3 w-3" />
                      {originInfo.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="font-[Inter] text-sm text-muted-foreground/60">Sem atividades recentes.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-1">
                  <Avatar className="h-7 w-7 rounded-sm shrink-0 mt-0.5">
                    <AvatarFallback className="rounded-sm bg-[#2A070C]/5 text-[#2A070C] font-[Inter] text-[9px] font-medium">
                      {getInitials(log.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-[Inter] text-xs text-foreground leading-relaxed">
                      <span className="font-medium">{log.user_name}</span>{" "}
                      <span className="text-muted-foreground">{log.action}</span>{" "}
                      {log.object_label && (
                        <span className="font-mono text-[10px] bg-muted/50 px-1 py-0.5 rounded">{log.object_label}</span>
                      )}
                    </p>
                    <p className="font-[Inter] text-[10px] text-muted-foreground/50 mt-0.5">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
