import { useEffect, useState, useMemo } from "react";
import { subDays, startOfMonth, startOfYear, differenceInDays, startOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  Sparkles,
  CalendarIcon,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import type { DateRange } from "react-day-picker";

const COLORS = ["#2A070C", "#6B2D3E", "#A85D6F", "#D4919E", "#E8BDC5"];

const STAGE_LABELS: Record<string, string> = {
  novos: "Novos",
  contato: "Contato",
  visita_agendada: "Visita Agendada",
  visita: "Visita",
  proposta: "Proposta",
  fechado: "Fechado",
};

const Reports = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [team, setTeam] = useState<Array<{ user_id: string; full_name: string | null }>>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [quickFilter, setQuickFilter] = useState<string>("mes");

  useEffect(() => {
    fetchLeads();
    fetchTransactions();
    fetchTeam();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*");
    if (data) setLeads(data);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*");
    if (data) setTransactions(data);
  };

  const fetchTeam = async () => {
    const { data } = await supabase
      .from("team_profiles")
      .select("user_id, full_name")
      .eq("is_active", true)
      .order("full_name");
    if (data) setTeam(data as any);
  };

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    const now = new Date();
    switch (filter) {
      case "7dias":
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case "mes":
        setDateRange({ from: startOfMonth(now), to: now });
        break;
      case "ano":
        setDateRange({ from: startOfYear(now), to: now });
        break;
    }
  };

  const filteredLeads = useMemo(() => {
    let list = leads;
    if (responsibleFilter !== "all") {
      list = list.filter((l) => l.assigned_user_id === responsibleFilter);
    }
    if (!dateRange?.from) return list;
    return list.filter((l) => {
      const created = new Date(l.created_at);
      return created >= dateRange.from! && (!dateRange.to || created <= dateRange.to);
    });
  }, [leads, dateRange, responsibleFilter]);

  // Per-broker performance (always over the full date range, ignoring responsibleFilter)
  const brokerPerformance = useMemo(() => {
    const byUser: Record<string, { received: number; closed: number; cycleSum: number; cycleCount: number; pipelineValue: number }> = {};
    leads
      .filter((l) => {
        if (!dateRange?.from) return true;
        const created = new Date(l.created_at);
        return created >= dateRange.from && (!dateRange.to || created <= dateRange.to);
      })
      .forEach((l) => {
        const uid = l.assigned_user_id || "_unassigned";
        if (!byUser[uid]) byUser[uid] = { received: 0, closed: 0, cycleSum: 0, cycleCount: 0, pipelineValue: 0 };
        byUser[uid].received += 1;
        byUser[uid].pipelineValue += l.deal_value || 0;
        if (l.pipeline_stage === "fechado") {
          byUser[uid].closed += 1;
          byUser[uid].cycleSum += differenceInDays(new Date(l.updated_at), new Date(l.created_at));
          byUser[uid].cycleCount += 1;
        }
      });
    return Object.entries(byUser)
      .map(([uid, stats]) => ({
        userId: uid,
        name: uid === "_unassigned" ? "Sem responsável" : (team.find((t) => t.user_id === uid)?.full_name || "Usuário"),
        ...stats,
        conversion: stats.received > 0 ? (stats.closed / stats.received) * 100 : 0,
        avgCycle: stats.cycleCount > 0 ? Math.round(stats.cycleSum / stats.cycleCount) : null,
      }))
      .sort((a, b) => b.closed - a.closed || b.received - a.received);
  }, [leads, dateRange, team]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) return transactions;
    return transactions.filter((t) => {
      const created = new Date(t.created_at);
      return created >= dateRange.from! && (!dateRange.to || created <= dateRange.to);
    });
  }, [transactions, dateRange]);

  const totalLeads = filteredLeads.length;
  const closedLeads = filteredLeads.filter((l) => l.pipeline_stage === "fechado");
  const conversionRate = totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : "0";
  const pipelineValue = filteredLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0);

  // Average sales cycle
  const avgSalesCycle = useMemo(() => {
    if (closedLeads.length === 0) return null;
    const totalDays = closedLeads.reduce((acc: number, lead: any) => {
      return acc + differenceInDays(new Date(lead.updated_at), new Date(lead.created_at));
    }, 0);
    return Math.round(totalDays / closedLeads.length);
  }, [closedLeads]);

  // Net revenue from paid transactions
  const netRevenue = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.status === "pago")
      .reduce((sum, t) => {
        const commission = (t.sale_value * t.commission_pct) / 100;
        return sum + (commission - t.broker_payout);
      }, 0);
  }, [filteredTransactions]);

  // Dynamic Alpha Insight
  const alphaInsight = useMemo(() => {
    if (filteredLeads.length === 0) return "Sem dados suficientes no período selecionado para gerar insights.";

    const originCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      originCounts[l.origin] = (originCounts[l.origin] || 0) + 1;
      stageCounts[l.pipeline_stage] = (stageCounts[l.pipeline_stage] || 0) + 1;
    });

    const topOrigin = Object.entries(originCounts).sort((a, b) => b[1] - a[1])[0];
    const topStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];

    const parts: string[] = [];
    if (topOrigin) {
      parts.push(`A principal origem de leads é "${topOrigin[0]}" com ${topOrigin[1]} lead(s) no período.`);
    }
    if (topStage) {
      const label = STAGE_LABELS[topStage[0]] || topStage[0];
      parts.push(`O estágio com maior concentração é "${label}" (${topStage[1]}).`);
    }
    if (pipelineValue > 0) {
      parts.push(`O valor total em pipeline é R$ ${(pipelineValue / 1000000).toFixed(1)}M.`);
    }
    if (avgSalesCycle !== null) {
      parts.push(`O ciclo médio de vendas está em ${avgSalesCycle} dias.`);
    }
    return parts.join(" ");
  }, [filteredLeads, pipelineValue, avgSalesCycle]);

  const originData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      groups[l.origin] = (groups[l.origin] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const funnelData = useMemo(() => {
    const stages = ["novos", "contato", "visita_agendada", "visita", "proposta", "fechado"];
    return stages.map((stage) => ({
      stage: STAGE_LABELS[stage] || stage,
      count: filteredLeads.filter((l) => l.pipeline_stage === stage).length,
    }));
  }, [filteredLeads]);

  // Leads by week
  const leadsPerWeek = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const week = format(startOfWeek(new Date(l.created_at), { locale: ptBR }), "dd/MM", { locale: ptBR });
      groups[week] = (groups[week] || 0) + 1;
    });
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, count]) => ({ week, count }));
  }, [filteredLeads]);

  // Revenue by month
  const revenuePerMonth = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.status === "pago")
      .forEach((t) => {
        const month = format(new Date(t.created_at), "MMM/yy", { locale: ptBR });
        const commission = (t.sale_value * t.commission_pct) / 100;
        groups[month] = (groups[month] || 0) + (commission - t.broker_payout);
      });
    return Object.entries(groups).map(([month, value]) => ({ month, value: Math.round(value) }));
  }, [filteredTransactions]);

  const kpis = [
    { title: "Total de Leads", value: totalLeads, icon: Users },
    {
      title: "Ciclo Médio de Vendas",
      value: avgSalesCycle !== null ? `${avgSalesCycle} dias` : "—",
      icon: Clock,
      subtitle: avgSalesCycle === null ? "Sem leads fechados" : undefined,
    },
    { title: "Taxa de Conversão", value: `${conversionRate}%`, icon: TrendingUp },
    {
      title: "Receita Líquida",
      value: netRevenue > 0
        ? `R$ ${(netRevenue / 1000).toFixed(0)}K`
        : pipelineValue > 0
          ? `R$ ${(pipelineValue / 1000000).toFixed(1)}M (pipeline)`
          : "R$ 0",
      icon: DollarSign,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">
            Relatórios & Inteligência
          </h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Dados estratégicos do seu negócio
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { key: "7dias", label: "7 dias" },
            { key: "mes", label: "Este Mês" },
            { key: "ano", label: "Ano" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={quickFilter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter(f.key)}
              className={cn(
                "font-[Inter] text-xs",
                quickFilter === f.key && "bg-[#2A070C] hover:bg-[#2A070C]/90"
              )}
            >
              {f.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="font-[Inter] text-xs gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                Período
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setQuickFilter("");
                }}
                locale={ptBR}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Alpha Insight */}
      <Card className="mb-6 bg-[#2A070C]/[0.04] border-[#2A070C]/10 shadow-none">
        <CardContent className="p-5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#2A070C]/10">
            <Sparkles className="h-4 w-4 text-[#2A070C]" />
          </div>
          <div>
            <p className="font-[Raleway] text-sm font-semibold text-[#2A070C] mb-1">
              Alpha Insight (IA)
            </p>
            <p className="font-[Inter] text-sm text-[#2A070C]/70 leading-relaxed">
              {alphaInsight}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="bg-white border-border/50 shadow-none hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-[#2A070C]/40" />
            </CardHeader>
            <CardContent>
              <p className="font-[Raleway] text-3xl font-semibold text-foreground">
                {kpi.value}
              </p>
              {kpi.subtitle && (
                <p className="font-[Inter] text-[10px] text-muted-foreground mt-1">
                  {kpi.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Lead Origin Donut */}
        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Origem dos Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {originData.length === 0 ? (
              <p className="font-[Inter] text-sm text-muted-foreground/60 text-center py-8">
                Sem dados no período selecionado.
              </p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={originData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {originData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontFamily: "Inter",
                          fontSize: "12px",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {originData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="font-[Inter] text-xs text-muted-foreground capitalize">
                        {item.name}
                      </span>
                      <span className="font-[Inter] text-xs font-medium text-foreground ml-auto">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel Conversion */}
        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Conversão do Funil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.every((d) => d.count === 0) ? (
              <p className="font-[Inter] text-sm text-muted-foreground/60 text-center py-8">
                Sem dados no período selecionado.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontFamily: "Inter", fontSize: 11 }} />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      width={100}
                      tick={{ fontFamily: "Inter", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontFamily: "Inter",
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#2A070C"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads per Week */}
        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Leads por Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPerWeek.length === 0 ? (
              <p className="font-[Inter] text-sm text-muted-foreground/60 text-center py-8">
                Sem dados no período selecionado.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leadsPerWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontFamily: "Inter", fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontFamily: "Inter", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        fontFamily: "Inter",
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#2A070C"
                      strokeWidth={2}
                      dot={{ fill: "#2A070C", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue per Month */}
        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Receita por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenuePerMonth.length === 0 ? (
              <p className="font-[Inter] text-sm text-muted-foreground/60 text-center py-8">
                Sem transações pagas no período.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenuePerMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontFamily: "Inter", fontSize: 11 }} />
                    <YAxis tick={{ fontFamily: "Inter", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        fontFamily: "Inter",
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString("pt-BR")}`
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="#6B2D3E"
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
