import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAllAdminPropertyRows,
  isRentalTransaction,
} from "@/lib/propertyQueries";
import { matchCondo } from "@/lib/condoMatching";

const ITEMS_PER_PAGE = 20;

type Property = {
  id: string;
  code: string;
  title: string;
  condominium: string | null;
  property_type: string;
  transaction_type: string;
  price: number | null;
  rental_price: number | null;
  status: string | null;
  source: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  kenlo: "Kenlo",
  manual: "Manual",
  import: "Importação",
  importacao: "Importação",
  csv: "Importação",
};

const formatSource = (source: string | null) =>
  source ? SOURCE_LABELS[source.toLowerCase()] ?? source : "—";

const transactionFilters = [
  { label: "Todos", value: "Todos" },
  { label: "Venda", value: "venda" },
  { label: "Locação", value: "locacao" },
] as const;

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [filterCondo, setFilterCondo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastSync, setLastSync] = useState<{ at: string; summary: string } | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin, role } = useAuth();
  const canManageProperties = isAdmin || role === "gerente";

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearch(q);
      searchParams.delete("q");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await fetchAllAdminPropertyRows();
        setProperties(data);
      } catch {
        toast({
          title: "Erro ao carregar imóveis",
          description: "Não foi possível listar todos os imóveis do Supabase.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [refreshTick]);

  useEffect(() => {
    const fetchLastSync = async () => {
      const { data } = await supabase
        .from("system_audit_logs")
        .select("created_at, object_label, metadata")
        .eq("object_type", "kenlo_sync")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const meta = (data.metadata ?? {}) as Record<string, number>;
        setLastSync({
          at: data.created_at,
          summary:
            data.object_label === "Falha"
              ? "falhou"
              : `${meta.created ?? 0} criados · ${meta.updated ?? 0} atualizados · ${meta.deactivated ?? 0} inativados`,
        });
      }
    };
    fetchLastSync();
  }, [refreshTick]);


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

  const condominiumOptions = useMemo(() => {
    const names = new Set(
      properties
        .map((p) => p.condominium?.trim())
        .filter((value): value is string => Boolean(value))
    );
    return ["Todos", ...Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [properties]);

  useEffect(() => {
    if (filterCondo !== "Todos" && !condominiumOptions.includes(filterCondo)) {
      setFilterCondo("Todos");
    }
  }, [condominiumOptions, filterCondo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);
      const matchesCondo =
        filterCondo === "Todos" ||
        p.condominium === filterCondo ||
        matchCondo(p.condominium, filterCondo);
      const matchesTransaction =
        filterStatus === "Todos" ||
        (filterStatus === "venda" && (p.transaction_type === "venda" || p.transaction_type === "ambos")) ||
        (filterStatus === "locacao" && (isRentalTransaction(p.transaction_type) || p.transaction_type === "ambos"));


      return matchesSearch && matchesCondo && matchesTransaction;
    });
  }, [filterCondo, filterStatus, properties, search]);

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

  const toggleStatus = async (e: React.MouseEvent, id: string, currentStatus: string | null) => {
    e.stopPropagation();
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: `Imóvel ${newStatus === "ativo" ? "ativado" : "inativado"}`,
        description: `O status do imóvel foi alterado para ${newStatus}.`,
      });
      setRefreshTick((t) => t + 1);
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível atualizar o status do imóvel.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyToDelete);

      if (error) throw error;

      toast({
        title: "Imóvel excluído",
        description: "O imóvel foi removido permanentemente.",
      });
      setRefreshTick((t) => t + 1);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o imóvel.",
        variant: "destructive",
      });
    } finally {
      setPropertyToDelete(null);
    }
  };

  return (
    <div>
      <KenloSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">Imóveis</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">Gerencie seu portfólio</p>
          {lastSync && (
            <p className="font-[Inter] text-xs text-muted-foreground/80 mt-1">
              Última sincronização Kenlo:{" "}
              {new Date(lastSync.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              {" · "}
              {lastSync.summary}
              {" · automática às 07h, 13h e 19h"}
            </p>
          )}

        </div>
        <div className="flex items-center gap-2">
          {canManageProperties && (
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
          {canManageProperties && (
            <Button onClick={() => navigate("/admin/imoveis/novo")} className="font-[Inter] text-xs uppercase tracking-widest">
              <Plus className="h-4 w-4 mr-1" /> Novo Imóvel
            </Button>
          )}
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
          <Select value={filterCondo} onValueChange={setFilterCondo}>
            <SelectTrigger className="h-9 w-[220px] bg-white border-border/50 font-[Inter] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {condominiumOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-6 w-px bg-border/50" />

        <div className="flex items-center gap-2">
          <span className="font-[Inter] text-[10px] uppercase tracking-widest text-muted-foreground">Transação</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[150px] bg-white border-border/50 font-[Inter] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {transactionFilters.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Fonte</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="font-[Inter] text-[10px] uppercase tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <p className="font-[Inter] text-sm text-muted-foreground">Carregando imóveis...</p>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <p className="font-[Inter] text-sm text-muted-foreground">Nenhum imóvel encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((property) => (
                <TableRow 
                  key={property.id} 
                  className={`cursor-pointer transition-opacity ${property.status !== "ativo" ? "opacity-60 bg-muted/30" : ""}`}
                  onClick={() => navigate(`/admin/imoveis/${property.id}`)}
                >
                  <TableCell className="font-[Inter] text-xs font-medium">{property.code}</TableCell>
                  <TableCell className="font-[Inter] text-sm">{property.title}</TableCell>
                  <TableCell className="font-[Inter] text-sm text-muted-foreground">{property.condominium ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-[Inter] text-[10px] uppercase">
                      {property.property_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-[Inter] text-sm">
                    {property.transaction_type === "ambos" ? (
                      <div className="flex flex-col leading-tight">
                        <span>{formatPrice(property.price)}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatPrice(property.rental_price)}/mês
                        </span>
                      </div>
                    ) : (
                      formatPrice(isRentalTransaction(property.transaction_type) ? property.rental_price ?? property.price : property.price)
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={property.status === "ativo" ? "default" : "secondary"}
                      className="font-[Inter] text-[10px] uppercase"
                    >
                      {property.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => toggleStatus(e, property.id, property.status)}
                            >
                              {property.status === "ativo" ? (
                                <Eye className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{property.status === "ativo" ? "Inativar" : "Ativar"}</p>
                          </TooltipContent>
                        </Tooltip>

                        {property.status !== "ativo" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPropertyToDelete(property.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir permanentemente</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-50 cursor-not-allowed"
                                  disabled
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Inative o imóvel para poder excluí-lo</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>

                      {canManageProperties && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="font-[Inter] text-xs ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/imoveis/${property.id}`);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
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

      <AlertDialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente este imóvel? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Properties;
