import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Plus,
  
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#2A070C", "#6B2D3E", "#A85D6F", "#D4919E", "#E8BDC5"];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const CATEGORY_LABELS: Record<string, string> = {
  foto_video: "Foto/Vídeo",
  trafego_pago: "Tráfego Pago",
  manutencao: "Manutenção",
  outros: "Outros",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const Financial = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    property_id: "",
    category: "outros",
    description: "",
    amount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [txRes, expRes, propRes] = await Promise.all([
      supabase.from("transactions").select("*, properties(title, photos, transaction_type, condominium)"),
      supabase.from("expenses").select("*"),
      supabase.from("properties").select("id, title, code, photos"),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (expRes.data) setExpenses(expRes.data);
    if (propRes.data) setProperties(propRes.data);
  };

  // KPIs
  const vgv = useMemo(() => transactions.reduce((s, t) => s + Number(t.sale_value || 0), 0), [transactions]);

  const netRevenue = useMemo(
    () =>
      transactions.reduce(
        (s, t) => s + Number(t.sale_value || 0) * (Number(t.commission_pct || 0) / 100) - Number(t.broker_payout || 0),
        0
      ),
    [transactions]
  );

  const pendingCommissions = useMemo(
    () => transactions.filter((t) => t.status === "pendente").reduce((s, t) => s + Number(t.broker_payout || 0), 0),
    [transactions]
  );

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  const roi = useMemo(() => (totalExpenses > 0 ? ((netRevenue - totalExpenses) / totalExpenses) * 100 : 0), [netRevenue, totalExpenses]);

  // Sparkline data (last 6 months placeholder from transactions)
  const sparklineData = useMemo(() => {
    const months: Record<string, number> = {};
    transactions.forEach((t) => {
      const m = new Date(t.created_at).toISOString().slice(0, 7);
      const rev = Number(t.sale_value || 0) * (Number(t.commission_pct || 0) / 100) - Number(t.broker_payout || 0);
      months[m] = (months[m] || 0) + rev;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([m, v]) => ({ month: m, value: v }));
  }, [transactions]);

  // Charts
  const revenueOriginData = useMemo(() => {
    const groups: Record<string, number> = { Venda: 0, Locação: 0 };
    transactions.forEach((t) => {
      const type = t.properties?.transaction_type === "locacao" ? "Locação" : "Venda";
      groups[type] += Number(t.sale_value || 0);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const salesCycleData = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions.forEach((t) => {
      const condo = t.properties?.condominium || "Outros";
      groups[condo] = (groups[condo] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [transactions]);

  const handleAddExpense = async () => {
    if (!expenseForm.property_id || !expenseForm.amount) {
      toast.error("Preencha imóvel e valor.");
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      property_id: expenseForm.property_id,
      category: expenseForm.category as any,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
    });
    if (error) {
      toast.error("Erro ao salvar despesa.");
      return;
    }
    toast.success("Despesa adicionada!");
    setExpenseOpen(false);
    setExpenseForm({ property_id: "", category: "outros", description: "", amount: "" });
    fetchData();
  };

  const getThumb = (photos: string[] | null) =>
    photos?.[0] || "/placeholder.svg";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">
            Gestão Financeira
          </h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Comissões, despesas e performance financeira
          </p>
        </div>
        <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#2A070C] hover:bg-[#2A070C]/90 text-white font-[Inter]">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-[Raleway]">Nova Despesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="font-[Inter] text-xs">Imóvel</Label>
                <Select value={expenseForm.property_id} onValueChange={(v) => setExpenseForm((p) => ({ ...p, property_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o imóvel" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.code} — {p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-[Inter] text-xs">Categoria</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-[Inter] text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label className="font-[Inter] text-xs">Descrição</Label>
                <Textarea
                  placeholder="Detalhes da despesa..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleAddExpense} className="w-full bg-[#2A070C] hover:bg-[#2A070C]/90 text-white font-[Inter]">
                Salvar Despesa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* VGV */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-[Inter] text-xs font-normal text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Volume de Vendas (VGV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(vgv)}
            </p>
          </CardContent>
        </Card>

        {/* Receita Líquida */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-[Inter] text-xs font-normal text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Receita Líquida Alpha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(netRevenue)}
            </p>
            {sparklineData.length > 1 && (
              <div className="h-10 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2A070C" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2A070C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#2A070C" fill="url(#sparkGrad)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comissões a Pagar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-[Inter] text-xs font-normal text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Comissões a Pagar
              {pendingCommissions > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Pendente
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(pendingCommissions)}
            </p>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-[Inter] text-xs font-normal text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> ROI Médio/Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              {roi.toFixed(1)}%
            </p>
            <p className="font-[Inter] text-xs text-muted-foreground mt-1">
              {roi >= 0 ? "Positivo" : "Negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-[Raleway] text-lg font-semibold">Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="font-[Inter] text-xs uppercase tracking-wider">
                <TableHead>Imóvel</TableHead>
                <TableHead>Valor da Venda</TableHead>
                <TableHead>Comissão (%)</TableHead>
                <TableHead>Repasse Corretor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 font-[Inter] text-sm">
                    Nenhuma transação registrada
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="font-[Inter] text-sm">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={getThumb(tx.properties?.photos)}
                        alt=""
                        className="h-10 w-14 rounded object-cover bg-muted"
                      />
                      <span className="font-medium text-foreground truncate max-w-[180px]">
                        {tx.properties?.title || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(Number(tx.sale_value))}</TableCell>
                  <TableCell>{Number(tx.commission_pct).toFixed(1)}%</TableCell>
                  <TableCell className="font-mono">{formatCurrency(Number(tx.broker_payout))}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_MAP[tx.status]?.variant || "secondary"}>
                      {STATUS_MAP[tx.status]?.label || tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Origin Donut */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-[Raleway] text-lg font-semibold">Origem da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueOriginData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueOriginData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Cycle by Condominium */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-[Raleway] text-lg font-semibold">Ciclo de Vendas por Condomínio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesCycleData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: "Inter" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontFamily: "Inter" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2A070C" radius={[0, 4, 4, 0]} barSize={20} name="Transações" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financial;
