import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Plus,
  Trash2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { fetchAllPages } from "@/lib/supabasePagination";

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

const applyCurrencyMask = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrencyToFloat = (masked: string): number => {
  if (!masked) return 0;
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
};

const Financial = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    property_id: "",
    category: "outros",
    description: "",
    amount: "",
  });
  const [txForm, setTxForm] = useState({
    property_id: "",
    sale_value: "",
    commission_pct: "",
    broker_payout: "",
    status: "pendente",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [txRes, expRes, propRes] = await Promise.all([
      supabase.from("transactions").select("*, properties(title, photos, transaction_type, condominium)"),
      supabase.from("expenses").select("*, properties(title, code)").order("created_at", { ascending: false }),
      fetchAllPages<{ id: string; title: string; code: string; photos: string[] | null }>(() =>
        supabase.from("properties").select("id, title, code, photos").order("code")
      ),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setProperties(propRes);
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

  // Sparkline data
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

  const expenseByCategoryData = useMemo(() => {
    const groups: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = CATEGORY_LABELS[e.category] || e.category;
      groups[cat] = (groups[cat] || 0) + Number(e.amount || 0);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [expenses]);

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
      amount: parseCurrencyToFloat(expenseForm.amount),
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

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir despesa.");
      return;
    }
    toast.success("Despesa excluída!");
    fetchData();
  };

  const handleAddTransaction = async () => {
    if (!txForm.property_id || !txForm.sale_value) {
      toast.error("Preencha imóvel e valor da venda.");
      return;
    }
    const { error } = await supabase.from("transactions").insert({
      property_id: txForm.property_id,
      sale_value: parseCurrencyToFloat(txForm.sale_value),
      commission_pct: parseFloat(txForm.commission_pct || "0"),
      broker_payout: parseCurrencyToFloat(txForm.broker_payout),
      status: txForm.status as any,
    });
    if (error) {
      toast.error("Erro ao registrar transação.");
      return;
    }
    toast.success("Transação registrada!");
    setTxOpen(false);
    setTxForm({ property_id: "", sale_value: "", commission_pct: "", broker_payout: "", status: "pendente" });
    fetchData();
  };

  const handleUpdateTxStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("transactions").update({ status: status as any }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status.");
      return;
    }
    toast.success("Status atualizado!");
    fetchData();
  };

  const getThumb = (photos: string[] | null) =>
    photos?.[0] || "/placeholder.svg";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">
            Gestão Financeira
          </h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Comissões, despesas e performance financeira
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={txOpen} onOpenChange={setTxOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="font-[Inter]">
                <Plus className="mr-2 h-4 w-4" /> Registrar Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-[Raleway]">Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="font-[Inter] text-xs">Imóvel</Label>
                  <Select value={txForm.property_id} onValueChange={(v) => setTxForm((p) => ({ ...p, property_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o imóvel" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.code} — {p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-[Inter] text-xs">Valor da Venda (R$)</Label>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={txForm.sale_value}
                    onChange={(e) => setTxForm((p) => ({ ...p, sale_value: applyCurrencyMask(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-[Inter] text-xs">Comissão (%)</Label>
                    <Input
                      type="number"
                      placeholder="6"
                      value={txForm.commission_pct}
                      onChange={(e) => setTxForm((p) => ({ ...p, commission_pct: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-[Inter] text-xs">Repasse Corretor (R$)</Label>
                    <Input
                      type="text"
                      placeholder="0,00"
                      value={txForm.broker_payout}
                      onChange={(e) => setTxForm((p) => ({ ...p, broker_payout: applyCurrencyMask(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-[Inter] text-xs">Status</Label>
                  <Select value={txForm.status} onValueChange={(v) => setTxForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddTransaction} className="w-full bg-[#2A070C] hover:bg-[#2A070C]/90 text-white font-[Inter]">
                  Salvar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                    type="text"
                    placeholder="0,00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((p) => ({ ...p, amount: applyCurrencyMask(e.target.value) }))}
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
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-border/50 shadow-none">
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

        <Card className="bg-white border-border/50 shadow-none">
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
                      <linearGradient id="sparkGradFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2A070C" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2A070C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#2A070C" fill="url(#sparkGradFin)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-none">
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

        <Card className="bg-white border-border/50 shadow-none">
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
      <Card className="bg-white border-border/50 shadow-none">
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
                    <Select
                      value={tx.status}
                      onValueChange={(v) => handleUpdateTxStatus(tx.id, v)}
                    >
                      <SelectTrigger className="h-7 w-[120px] text-xs">
                        <Badge variant={STATUS_MAP[tx.status]?.variant || "secondary"} className="pointer-events-none">
                          {STATUS_MAP[tx.status]?.label || tx.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="bg-white border-border/50 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-[Raleway] text-lg font-semibold">Despesas</CardTitle>
          <p className="font-[Inter] text-sm text-muted-foreground">
            Total: <span className="font-mono font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="font-[Inter] text-xs uppercase tracking-wider">
                <TableHead>Imóvel</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 font-[Inter] text-sm">
                    Nenhuma despesa registrada
                  </TableCell>
                </TableRow>
              )}
              {expenses.map((exp) => (
                <TableRow key={exp.id} className="font-[Inter] text-sm">
                  <TableCell>
                    <span className="font-medium text-foreground truncate max-w-[180px] block">
                      {exp.properties?.code ? `${exp.properties.code} — ${exp.properties.title}` : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {CATEGORY_LABELS[exp.category] || exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(Number(exp.amount))}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {exp.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(exp.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. A despesa será removida permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteExpense(exp.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
        <Card className="bg-white border-border/50 shadow-none">
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

        {/* Expenses by Category Donut */}
        <Card className="bg-white border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="font-[Raleway] text-lg font-semibold">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {expenseByCategoryData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="font-[Inter] text-sm text-muted-foreground">Sem despesas registradas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseByCategoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Cycle */}
      {salesCycleData.length > 0 && (
        <Card className="bg-white border-border/50 shadow-none">
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
      )}
    </div>
  );
};

export default Financial;
