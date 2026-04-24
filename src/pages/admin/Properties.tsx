import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Property = {
  id: string;
  code: string;
  title: string;
  condominium: string | null;
  property_type: string;
  transaction_type: string;
  price: number | null;
  status: string | null;
};

const condominiums = ["Todos", "Residencial 1", "Residencial 2", "Tamboré"];
const statuses = ["Todos", "Venda", "Locação"];

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [filterCondo, setFilterCondo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [syncing, setSyncing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchProperties = async () => {
      let query = supabase.from("properties").select("id, code, title, condominium, property_type, transaction_type, price, status");

      if (filterCondo !== "Todos") query = query.eq("condominium", filterCondo);
      if (filterStatus === "Venda") query = query.eq("transaction_type", "venda");
      if (filterStatus === "Locação") query = query.eq("transaction_type", "locacao");

      const { data } = await query.order("created_at", { ascending: false });
      setProperties(data ?? []);
    };
    fetchProperties();
  }, [filterCondo, filterStatus, refreshTick]);

  const handleSync = async () => {
    setSyncing(true);
    toast({ title: "Sincronizando com Kenlo...", description: "Buscando feed XML, isso pode levar alguns segundos." });
    try {
      const { data, error } = await supabase.functions.invoke("sync-kenlo-properties");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Sincronização concluída",
        description: `✓ ${data.created} criados, ${data.updated} atualizados, ${data.deactivated} desativados em ${(data.duration_ms / 1000).toFixed(1)}s`,
      });
      setRefreshTick((t) => t + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Falha na sincronização", description: msg, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const filtered = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">Imóveis</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">Gerencie seu portfólio</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="font-[Inter] text-xs uppercase tracking-widest"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          )}
          <Button onClick={() => navigate("/admin/imoveis/novo")} className="font-[Inter] text-xs uppercase tracking-widest">
            <Plus className="h-4 w-4 mr-1" /> Novo Imóvel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-border/50 font-[Inter] text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-[Inter] text-[10px] uppercase tracking-widest text-muted-foreground">Condomínio</span>
          <div className="flex gap-1.5">
            {condominiums.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCondo(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-[Inter] transition-colors border ${
                  filterCondo === c
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-border/50" />

        <div className="flex items-center gap-2">
          <span className="font-[Inter] text-[10px] uppercase tracking-widest text-muted-foreground">Transação</span>
          <div className="flex gap-1.5">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-[Inter] transition-colors border ${
                  filterStatus === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Código</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Título</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Condomínio</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Tipo</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Preço</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="font-[Inter] text-sm text-muted-foreground">Nenhum imóvel encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((property) => (
                <TableRow key={property.id} className="cursor-pointer" onClick={() => navigate(`/admin/imoveis/${property.id}`)}>
                  <TableCell className="font-[Inter] text-xs font-medium">{property.code}</TableCell>
                  <TableCell className="font-[Inter] text-sm">{property.title}</TableCell>
                  <TableCell className="font-[Inter] text-sm text-muted-foreground">{property.condominium ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-[Inter] text-[10px] uppercase">
                      {property.property_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-[Inter] text-sm">{formatPrice(property.price)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={property.status === "ativo" ? "default" : "secondary"}
                      className="font-[Inter] text-[10px] uppercase"
                    >
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="font-[Inter] text-xs">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Properties;
