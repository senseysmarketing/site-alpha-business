import { useEffect, useState } from "react";
import { Building2, Users, CalendarCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const sparkData = [
  { v: 3 }, { v: 5 }, { v: 4 }, { v: 7 }, { v: 6 }, { v: 8 }, { v: 9 }, { v: 7 }, { v: 10 },
];

const Dashboard = () => {
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeProperties, setActiveProperties] = useState(0);
  const [visitsToday, setVisitsToday] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [leadsRes, propsRes, visitsRes] = await Promise.all([
        supabase.from("visits_scheduling").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("visits_scheduling").select("id", { count: "exact", head: true }).eq("visit_date", new Date().toISOString().split("T")[0]),
      ]);
      setTotalLeads(leadsRes.count ?? 0);
      setActiveProperties(propsRes.count ?? 0);
      setVisitsToday(visitsRes.count ?? 0);
    };
    fetchData();
  }, []);

  const cards = [
    {
      title: "Total de Leads",
      value: totalLeads,
      icon: Users,
      hasChart: true,
    },
    {
      title: "Imóveis Ativos",
      value: activeProperties,
      icon: Building2,
      hasChart: false,
    },
    {
      title: "Visitas Hoje",
      value: visitsToday,
      icon: CalendarCheck,
      hasChart: false,
    },
    {
      title: "Receita Estimada",
      value: "—",
      icon: TrendingUp,
      hasChart: false,
      subtitle: "Em breve",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="font-[Inter] text-sm text-muted-foreground mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-white border-border/50 shadow-none hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-[#2A070C]/40" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-[Raleway] text-3xl font-semibold text-foreground">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="font-[Inter] text-[10px] text-muted-foreground mt-1">{card.subtitle}</p>
                  )}
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
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="hsl(var(--primary))"
                          strokeWidth={1.5}
                          fill="url(#sparkGrad)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder sections for future content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Últimos Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-[Inter] text-sm text-muted-foreground/60">
              Dados serão exibidos aqui em breve.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-[Inter] text-sm text-muted-foreground/60">
              Sem atividades recentes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
