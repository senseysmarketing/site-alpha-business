import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw, Settings, Copy, Power, Trash2, Eye, EyeOff } from "lucide-react";
import { KenloSettingsDialog } from "@/components/admin/KenloSettingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ITEMS_PER_PAGE = 20;

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
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
      const ip = data?.outbound_ip ? ` · IP: ${data.outbound_ip}` : "";
      if (!data?.success) {
        toast({
          title: "Falha na sincronização",
          description: `${data?.error ?? "Erro desconhecido"}${ip}`,
          variant: "destructive",
          action: data?.outbound_ip ? (
            <button
              onClick={() => navigator.clipboard.writeText(data.outbound_ip)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] hover:bg-foreground hover:text-background transition-colors"
            >
              <Copy className="h-3 w-3" /> Copiar IP
            </button>
          ) : undefined,
        });
        return;
      }
      toast({
        title: "Sincronização concluída",
        description: `✓ ${data.created} criados, ${data.updated} atualizados, ${data.deactivated} desativados em ${(data.duration_ms / 1000).toFixed(1)}s${ip}`,
      });
      setRefreshTick((t) => t + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Falha na sincronização", description: msg, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase())
      ),
    [properties, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCondo, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const pageNumbers = useMemo<(number | "ellipsis")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [1];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);
    if (left > 2) pages.push("ellipsis");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div>
      <KenloSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">Imóveis</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">Gerencie seu portfólio</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                onClick={() => setSettingsOpen(true)}
                variant="outline"
                size="icon"
                title="Configurar feed Kenlo"
                className="h-9 w-9"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                className="font-[Inter] text-xs uppercase tracking-widest"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Sincronizando..." : "Sincronizar Agora"}
              </Button>
            </>
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
              paginated.map((property) => (
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

      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="font-[Inter] text-xs text-muted-foreground">
            Exibindo {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} de {filtered.length} imóveis
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (safePage > 1) setCurrentPage(safePage - 1);
                  }}
                  className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === safePage}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (safePage < totalPages) setCurrentPage(safePage + 1);
                  }}
                  className={safePage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Properties;
