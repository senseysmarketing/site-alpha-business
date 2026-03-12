import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MarketSidebar = () => {
  const { data: marketData } = useQuery({
    queryKey: ["market-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_data")
        .select("*")
        .eq("region", "Alphaville")
        .order("year", { ascending: true })
        .order("month", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const chartData = marketData?.map((d) => ({
    name: `${d.month}/${d.year.toString().slice(-2)}`,
    value: Number(d.avg_price_sqm),
  })) ?? [];

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const previousValue = chartData.length > 1 ? chartData[chartData.length - 2].value : latestValue;
  const change = previousValue > 0 ? (((latestValue - previousValue) / previousValue) * 100).toFixed(1) : "0";

  return (
    <motion.div
      className="border border-border p-6 sticky top-24"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={14} className="text-bordeaux" />
        <span className="text-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Alpha Market Report
        </span>
      </div>

      <h4 className="text-display text-lg font-light mb-1">Valor do m² em Alphaville</h4>
      
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-display text-2xl font-light">
          R$ {latestValue.toLocaleString("pt-BR")}
        </span>
        <span className={`text-body text-xs ${Number(change) >= 0 ? "text-green-600" : "text-red-500"}`}>
          {Number(change) >= 0 ? "+" : ""}{change}%
        </span>
      </div>

      {chartData.length > 0 && (
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "hsl(25 10% 45%)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["dataMin - 500", "dataMax + 500"]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(30 33% 96%)",
                  border: "1px solid hsl(25 20% 85%)",
                  borderRadius: 0,
                  fontSize: 11,
                  fontFamily: "Inter",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "m²"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(350 60% 10%)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: "hsl(350 60% 10%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-body text-[10px] text-muted-foreground mt-4">
        Dados atualizados mensalmente. Valores médios por região.
      </p>
    </motion.div>
  );
};

export default MarketSidebar;