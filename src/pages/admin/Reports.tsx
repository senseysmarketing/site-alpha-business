import { useEffect, useState, useMemo } from "react";
import { subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  Sparkles,
  CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
} from "recharts";
import type { DateRange } from "react-day-picker";

const COLORS = ["#2A070C", "#6B2D3E", "#A85D6F", "#D4919E", "#E8BDC5"];

const STAGE_LABELS: Record<string, string> = {
  novos: "Novos",
  contato: "Contato",
  visita: "Visita",
  proposta: "Proposta",
  fechados: "Fechados",
};

const Reports = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [quickFilter, setQuickFilter] = useState<string>("mes");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*");
    if (data) setLeads(data);
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
    if (!dateRange?.from) return leads;
    return leads.filter((l) => {
      const created = new Date(l.created_at);
      return created >= dateRange.from! && (!dateRange.to || created <= dateRange.to);
    });
  }, [leads, dateRange]);

  const totalLeads = filteredLeads.length;
  const closedLeads = filteredLeads.filter((l) => l.pipeline_stage === "fechados").length;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0";
  const pipelineValue = filteredLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0);

  const originData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      groups[l.origin] = (groups[l.origin] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const funnelData = useMemo(() => {
    const stages = ["novos", "contato", "visita", "proposta", "fechados"];
    return stages.map((stage) => ({
      stage: STAGE_LABELS[stage] || stage,
      count: filteredLeads.filter((l) => l.pipeline_stage === stage).length,
    }));
  }, [filteredLeads]);

  const kpis = [
    { title: "Total de Leads", value: totalLeads, icon: Users },
    { title: "Ciclo Médio de Vendas", value: "— dias", icon: Clock, subtitle: "Em breve" },
    { title: "Taxa de Conversão", value: `${conversionRate}%`, icon: TrendingUp },
    {
      title: "Valor em Pipeline",
      value: pipelineValue > 0
        ? `R$ ${(pipelineValue / 1000000).toFixed(1)}M`
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
              A procura por mansões no Tamboré 3 subiu 15% esta semana. Recomendamos focar
              anúncios nesta região. O ciclo médio de vendas para imóveis acima de R$ 5M reduziu
              de 45 para 38 dias no último trimestre.
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontFamily: "Inter", fontSize: 11 }} />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      width={80}
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
                      barSize={24}
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
